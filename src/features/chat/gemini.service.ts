import axios from 'axios';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `You are a helpful doubt-solving assistant for the DreamBoost exam preparation platform. Answer user queries concisely and helpfully.

The platform offers:
- Tests & Mock Exams (MCQ and integer-type questions with timers)
- Test Series (enroll in curated collections of tests)
- Results & Performance Analysis (score, rank, percentile, section-wise, topic-wise, question review)
- Study Materials (PDFs, notes by subject/chapter)
- Leaderboards (daily, weekly, monthly, all-time rankings)
- Bookmarks (save questions for later review)
- Subscription Plans (premium unlocks more tests and materials)
- Account Settings (profile, password, preferences)
- Support Tickets (for specific doubts/issues)

Keep answers short, practical, and platform-specific. If you don't know something, say so honestly.`;

export const getChatResponse = async (message: string): Promise<string> => {
  if (!API_KEY) {
    return "I'm currently unavailable because no API key is configured. Please contact the administrator.";
  }

  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${message}` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      },
      { timeout: 15000 },
    );

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || "I couldn't generate a response. Please try rephrasing your question.";
  } catch (err: any) {
    console.error('Gemini API error:', err?.response?.data || err.message);
    if (err?.response?.status === 429) {
      return 'The AI service is currently rate-limited. Please wait a moment and try again.';
    }
    if (err?.response?.status === 403) {
      return 'API key is invalid or has insufficient permissions. Please contact the administrator.';
    }
    return 'Sorry, I encountered an error while processing your request. Please try again later.';
  }
};
