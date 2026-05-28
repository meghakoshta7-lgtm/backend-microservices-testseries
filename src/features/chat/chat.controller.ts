import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ChatMessage } from '@/models/ChatMessage';
import { getChatResponse } from './chatGPT.service';

const getBotResponse = async (message: string): Promise<string> => {
  const aiReply = await getChatResponse(message);
  if (aiReply) return aiReply;

  const lower = message.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! How can I help you today? You can ask me about tests, results, enrollment, study materials, or any other platform-related queries.';
  }

  if (lower.includes('test') || lower.includes('exam')) {
    if (lower.includes('start') || lower.includes('begin')) {
      return 'To start a test, go to "My Tests" or open a test series, find the test you want to attempt, and click "Start Test". Make sure you have an active enrollment if the test requires one.';
    }
    if (lower.includes('result') || lower.includes('score') || lower.includes('marks')) {
      return 'Your test results are available on the test result page after submission. You can view your score, section-wise performance, question reviews, and topic analysis there.';
    }
    if (lower.includes('time') || lower.includes('duration')) {
      return 'Each test has a specific duration shown on the test instructions page before you begin. The timer counts down during the exam, and your answers are automatically saved.';
    }
    return 'Tests help you practice and assess your knowledge. You can find tests under "My Tests" or within test series. Each test has a set duration and includes MCQ and integer-type questions.';
  }

  if (lower.includes('enroll') || lower.includes('enrollment') || lower.includes('series')) {
    return 'To enroll in a test series, go to the Test Series page, select a series, and click "Enroll Now". Once enrolled, you can access all tests within that series. Some series may require a subscription plan.';
  }

  if (lower.includes('result') || lower.includes('score') || lower.includes('performance')) {
    return 'After completing a test, you can view your results immediately. The result page shows your score, accuracy, section-wise performance, question-by-question review, and topic-wise analysis. You can also see your rank and percentile.';
  }

  if (lower.includes('payment') || lower.includes('plan') || lower.includes('subscription') || lower.includes('premium') || lower.includes('purchase')) {
    return 'You can view subscription plans on the Plans page. Premium plans unlock additional tests, test series, and study materials. For payment issues, please contact support through the Support page.';
  }

  if (lower.includes('study') || lower.includes('material') || lower.includes('learn')) {
    return 'Study materials are available under the "Study Material" section. You can browse subjects, chapters, and access PDFs, notes, and other learning resources.';
  }

  if (lower.includes('profile') || lower.includes('password') || lower.includes('setting')) {
    return 'You can update your profile, change your password, and manage account settings from the Settings page. Your profile information is used across the platform.';
  }

  if (lower.includes('doubt') || lower.includes('question') || lower.includes('help') || lower.includes('support')) {
    return 'If you have a specific doubt about a question or topic, you can create a support ticket from the Support page. Our team will get back to you. For common queries, check the FAQ section.';
  }

  if (lower.includes('leaderboard') || lower.includes('rank')) {
    return 'The Leaderboard shows top-performing users based on total scores. You can filter by daily, weekly, monthly, or all-time rankings. Your rank updates as you complete more tests.';
  }

  if (lower.includes('bookmark') || lower.includes('save')) {
    return 'You can bookmark questions during a test or from the question review page. Bookmarked questions are saved for later review and can be accessed from the Bookmarks page.';
  }

  if (lower.includes('thank')) {
    return "You're welcome! If you have any more questions, feel free to ask. Happy learning!";
  }

  return "I'm here to help! You can ask me about:\n• Tests & Exams (starting, duration, types)\n• Results & Performance (score, rank, analysis)\n• Enrollments & Test Series\n• Study Materials\n• Payments & Subscriptions\n• Account Settings\n• Bookmarks & Reviews\n• Leaderboard & Rankings\n\nWhat would you like to know?";
};

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AppError('Message is required', 400);
  }

  const userMessage = await ChatMessage.create({
    userId: req.user._id,
    role: 'user',
    message: message.trim(),
  });

  const botReply = await getBotResponse(message);
  const botMessage = await ChatMessage.create({
    userId: req.user._id,
    role: 'bot',
    message: botReply,
  });

  res.json({
    success: true,
    data: {
      userMessage,
      botMessage,
    },
  });
});

export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const messages = await ChatMessage.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({
    success: true,
    data: messages.reverse(),
  });
});
