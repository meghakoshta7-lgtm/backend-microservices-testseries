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

export const getChatResponse = async (message: string): Promise<string | null> => {
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('OpenAI chat error:', err);
    return null;
  }
};
