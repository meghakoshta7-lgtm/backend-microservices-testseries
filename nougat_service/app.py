import os
import io
import time
import logging
import tempfile
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nougat-service")

app = FastAPI(
    title="Nougat OCR Service",
    description="Meta Nougat-based PDF math OCR service",
    version="1.0.0",
)

_model = None
_processor = None


def load_model():
    global _model, _processor
    if _model is not None:
        return _model, _processor

    from transformers import NougatProcessor, VisionEncoderDecoderModel
    import torch

    model_name = os.getenv("NOUGAT_MODEL", "facebook/nougat-base")
    device = "cuda" if torch.cuda.is_available() else "cpu"

    logger.info(f"Loading Nougat model: {model_name} on {device}...")
    _processor = NougatProcessor.from_pretrained(model_name)
    _model = VisionEncoderDecoderModel.from_pretrained(model_name).to(device)

    if device == "cuda":
        _model.half()

    _model.eval()
    logger.info("Nougat model loaded successfully")
    return _model, _processor


@app.on_event("startup")
async def startup():
    load_model()


@app.get("/health")
async def health():
    device = "cuda" if _model is not None and next(_model.parameters()).is_cuda else "cpu"
    return {
        "status": "ok",
        "model": os.getenv("NOUGAT_MODEL", "facebook/nougat-base"),
        "device": device,
        "model_loaded": _model is not None,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    model, processor = load_model()
    import torch

    pdf_bytes = await file.read()
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty PDF file")

    start_time = time.time()
    device = next(model.parameters()).device

    try:
        from pypdfium2 import PdfDocument
        from PIL import Image

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        pdf = PdfDocument(tmp_path)
        n_pages = len(pdf)
        logger.info(f"Processing {n_pages} page(s) from {file.filename}")

        all_text = []
        token_confidences = []

        for page_num in range(n_pages):
            page = pdf[page_num]
            bitmap = page.render(scale=2)
            pil_image = bitmap.to_pil()
            page.close()

            pixel_values = processor(
                images=pil_image.convert("RGB"),
                return_tensors="pt",
            ).pixel_values.to(device)

            with torch.no_grad():
                outputs = model.generate(
                    pixel_values,
                    max_length=4096,
                    early_stopping=True,
                    num_beams=4,
                    output_scores=True,
                    return_dict_in_generate=True,
                )

            decoded = processor.batch_decode(
                outputs.sequences,
                skip_special_tokens=True,
            )[0]

            all_text.append(decoded)

            scores = outputs.scores
            if scores:
                probs = [torch.softmax(s, dim=-1).max().item() for s in scores]
                avg_conf = sum(probs) / len(probs) if probs else 0.0
                token_confidences.append(avg_conf)

        os.unlink(tmp_path)

        full_text = "\n\n".join(all_text)
        avg_confidence = (
            sum(token_confidences) / len(token_confidences)
            if token_confidences
            else 0.85
        )

        processing_time = time.time() - start_time
        logger.info(
            f"Nougat done: {n_pages} pages in {processing_time:.1f}s, "
            f"confidence {avg_confidence:.2f}"
        )

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 4),
            "processing_time": round(processing_time, 2),
            "pages": n_pages,
        }

    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Nougat prediction failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "text": "",
                "confidence": 0.0,
                "processing_time": round(processing_time, 2),
                "error": str(e),
            },
        )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8503"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, log_level="info")
