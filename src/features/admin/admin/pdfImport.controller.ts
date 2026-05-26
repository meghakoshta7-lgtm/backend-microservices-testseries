import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ocrService } from '@/services/ocr.service';
import { parseQuestionsFromMarkdown, questionsToBulkPayload } from '@/services/questionParser.service';
import { Question } from '@/models/Question';
import { Test } from '@/models/Test';
import { ActivityLog } from '@/models/ActivityLog';

/**
 * POST /api/admin/pdf/import
 * Full pipeline: upload PDF → Nougat OCR → parse Markdown → preview/save questions
 *
 * Body (multipart/form-data):
 *   - pdf: File (required)
 *   - category: string
 *   - subject: string
 *   - testId: string (optional — link to existing test)
 *   - mode: "preview" | "save" (default: "preview")
 *   - difficulty: "easy" | "medium" | "hard"
 *   - createTest: "true" — auto-create a test if testId not provided
 *   - testTitle: string — title for auto-created test
 */
export const importPdfQuestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) throw new AppError('PDF file required', 400);
  if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
    throw new AppError('Only PDF files accepted', 400);
  }

  const category = (req.body.category as string) || 'JEE Main';
  const subject = (req.body.subject as string) || 'Mathematics';
  const mode = (req.body.mode as string) || 'preview';
  const difficulty = (req.body.difficulty as 'easy' | 'medium' | 'hard') || 'medium';
  const createTest = req.body.createTest === 'true';
  const testTitle = (req.body.testTitle as string) || file.originalname.replace(/\.pdf$/i, '');
  let testId = req.body.testId as string | undefined;

  if (mode === 'save' && !testId && !createTest) {
    throw new AppError('Provide testId or set createTest=true to save questions', 400);
  }

  const result = await ocrService.extractWithFallback(file.buffer, true);
  if (!result.success) {
    throw new AppError(`OCR failed: ${result.error}`, 500);
  }

  const questions = parseQuestionsFromMarkdown(result.text);
  if (questions.length === 0) {
    throw new AppError('No questions could be parsed from the PDF. The OCR output may need manual review.', 422);
  }

  if (mode === 'preview') {
    res.json({
      success: true,
      data: {
        pages: result.text.length > 0 ? Math.ceil(result.text.length / 3000) : 0,
        confidence: result.confidence,
        processingTime: result.processingTime,
        rawTextLength: result.text.length,
        rawTextPreview: result.text.slice(0, 2000),
        questions: questions.map((q, i) => ({
          index: i + 1,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          type: q.type,
          explanation: q.explanation,
          marks: q.marks,
        })),
        questionCount: questions.length,
      },
    });
    return;
  }

  if (createTest && !testId) {
    const test = await Test.create({
      name: testTitle,
      description: `Auto-created from PDF: ${file.originalname}`,
      category,
      subject,
      testType: 'subject',
      difficulty,
      duration: 180,
      totalQuestions: questions.length,
      totalMarks: questions.length * 4,
      passingMarks: Math.ceil(questions.length * 4 * 0.3),
      negativeMarks: 0,
      isActive: false,
      isPremium: false,
      questionCount: questions.length,
    });
    testId = test._id.toString();
  }

  const payload = questionsToBulkPayload(questions, {
    category,
    subject,
    testId,
    difficulty,
  });

  const created = await Question.insertMany(payload);

  if (testId) {
    await Test.findByIdAndUpdate(testId, {
      totalQuestions: questions.length,
      questionCount: questions.length,
    });
  }

  await ActivityLog.create({
    userId: req.user!._id,
    action: 'pdf_import_questions',
    resource: 'questions',
    details: {
      count: created.length,
      file: file.originalname,
      category,
      subject,
      testId,
      provider: result.provider,
      confidence: result.confidence,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      questionsImported: created.length,
      testId,
      confidence: result.confidence,
      provider: result.provider,
      processingTime: result.processingTime,
      pages: 0,
    },
  });
});
