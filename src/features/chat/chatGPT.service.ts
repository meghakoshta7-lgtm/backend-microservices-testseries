import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
let client: OpenAI | null = null;

if (apiKey) {
  client = new OpenAI({ apiKey });
}

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
  if (!apiKey) {
    return "I'm currently unavailable because no API key is configured. Please contact the administrator to set up the OpenAI integration.";
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim()
      || "I couldn't generate a response. Please try rephrasing your question.";
  } catch (err: any) {
    console.error('OpenAI chat error:', err);
    if (err?.status === 401) {
      return 'Authentication failed with the AI service. The API key may be invalid or expired. Please contact the administrator.';
    }
    if (err?.status === 429) {
      return 'The AI service is currently rate-limited due to high demand. Please wait a moment and try again.';
    }
    return 'Sorry, I encountered an error while processing your request. Please try again later.';
  }
};
