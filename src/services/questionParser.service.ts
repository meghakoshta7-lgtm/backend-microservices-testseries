export interface ParsedQuestion {
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  type: 'mcq' | 'single' | 'multiple' | 'subjective' | 'descriptive';
  explanation: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const OPTION_LABEL_RE = /^[\(（]?([A-Da-d])[\)）]?\s*/;
const OPTION_NUM_RE = /^[\(（]?([1-4])[\)）]?\s*/;
const ANSWER_RE = /\*\*(?:Answer|Ans|Correct|Solution)[\s:：]*\*\*\s*([A-Da-d1-4, ]+)/i;
const EXPLANATION_RE = /\*\*(?:Explanation|Solution|Sol|Hint)[\s:：]*\*\*([\s\S]*?)(?=\n\n\s*(?:\d+[\).]|\*\*|$))/i;
const QUESTION_NUM_RE = /^(?:\*\*)?(?:Question|Q)[.\s]*(\d+)[.\s]*\*\*/i;
const STRIP_HTML_RE = /<[^>]*>/g;

function cleanLatex(text: string): string {
  return text.replace(/\\([()[\]]|\|)/g, '$1').trim();
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();
}

function isLikelyQuestionStart(line: string): boolean {
  return /^(\d+[\)。.]|\*\*Question|\*\*Q)/.test(line.trim());
}

function isLikelyOption(line: string): boolean {
  const trimmed = line.trim();
  return !!(OPTION_LABEL_RE.test(trimmed) || OPTION_NUM_RE.test(trimmed));
}

function parseOptionsBlock(lines: string[]): { options: { label: string; text: string }[]; consumed: number } {
  const options: { label: string; text: string }[] = [];
  let consumed = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) break;

    let match = trimmed.match(OPTION_LABEL_RE);
    let isOption = !!match;

    if (!match) {
      match = trimmed.match(OPTION_NUM_RE);
      isOption = !!match;
    }

    if (isOption) {
      const label = match![1].toUpperCase();
      const text = cleanLatex(trimmed.slice(match![0].length).trim());
      if (label && text) {
        options.push({ label, text });
        consumed++;
        continue;
      }
    }

    const last = options[options.length - 1];
    if (last && /^[a-z0-9+\-=(]/.test(trimmed)) {
      last.text += ' ' + trimmed;
      consumed++;
      continue;
    }

    break;
  }

  return { options, consumed };
}

function extractAnswer(text: string): { answer: string; explanation: string; cleaned: string } {
  let cleaned = text;
  let answer = '';
  let explanation = '';

  const explMatch = text.match(EXPLANATION_RE);
  if (explMatch) {
    explanation = cleanLatex(explMatch[1].trim());
    cleaned = cleaned.replace(explMatch[0], '');
  }

  const ansMatch = cleaned.match(ANSWER_RE);
  if (ansMatch) {
    answer = ansMatch[1].trim().toUpperCase();
    cleaned = cleaned.replace(ansMatch[0], '');
  }

  return { answer, explanation, cleaned };
}

export function parseQuestionsFromMarkdown(markdown: string): ParsedQuestion[] {
  const text = normalizeText(markdown);
  const blocks = text.split(/\n{2,}/).filter(Boolean);

  const questions: ParsedQuestion[] = [];
  const buffer: string[] = [];

  for (const block of blocks) {
    const firstLine = block.split('\n')[0].trim();

    if (isLikelyQuestionStart(firstLine) || buffer.length > 0) {
      buffer.push(block);
    } else if (buffer.length === 0) {
      buffer.push(block);
    }

    const joined = buffer.join('\n\n');
    if (joined.length > 40) {
      const q = tryParseBlock(joined);
      if (q && q.text.length > 10 && q.options.length >= 2) {
        questions.push(q);
        buffer.length = 0;
      }
    }
  }

  if (buffer.length > 0) {
    const joined = buffer.join('\n\n');
    const q = tryParseBlock(joined);
    if (q && q.text.length > 10) {
      questions.push(q);
    }
  }

  return questions;
}

function tryParseBlock(block: string): ParsedQuestion | null {
  const { answer, explanation, cleaned } = extractAnswer(block);
  let qText = cleaned;
  let lines = qText.split('\n').map(l => l.trim()).filter(Boolean);

  const numMatch = qText.match(QUESTION_NUM_RE);
  if (numMatch) {
    qText = qText.replace(numMatch[0], '').trim();
    lines = qText.split('\n').map(l => l.trim()).filter(Boolean);
  }

  const firstNum = lines[0]?.match(/^(\d+)[\)。.]\s*(.*)/);
  if (firstNum) {
    lines[0] = firstNum[2];
  }

  const optStart = lines.findIndex(l => isLikelyOption(l));
  const questionLines = optStart === -1 ? lines : lines.slice(0, optStart);
  const optLines = optStart === -1 ? [] : lines.slice(optStart);

  const text = questionLines
    .filter(l => !isLikelyQuestionStart(l))
    .map(l => cleanLatex(l))
    .join(' ')
    .replace(STRIP_HTML_RE, '')
    .replace(/\s+/g, ' ')
    .trim();

  let options: { label: string; text: string }[] = [];
  if (optLines.length > 0) {
    const result = parseOptionsBlock(optLines);
    options = result.options;
  }

  if (!text) return null;

  const type: ParsedQuestion['type'] = answer && answer.includes(',') ? 'multiple' : 'mcq';

  return {
    text,
    options,
    correctAnswer: answer || '',
    type,
    explanation,
    marks: 4,
    difficulty: 'medium',
  };
}

export function questionsToBulkPayload(
  questions: ParsedQuestion[],
  overrides: { category?: string; subject?: string; testId?: string; difficulty?: string } = {}
) {
  return questions.map((q, idx) => ({
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer || String.fromCharCode(65 + idx),
    type: q.type,
    explanation: q.explanation,
    category: overrides.category || 'JEE Main',
    subject: overrides.subject || 'Mathematics',
    difficulty: (overrides.difficulty || q.difficulty || 'medium') as 'easy' | 'medium' | 'hard',
    marks: q.marks,
    negativeMarks: 0,
    ...(overrides.testId ? { testId: overrides.testId } : {}),
    isActive: true,
  }));
}
