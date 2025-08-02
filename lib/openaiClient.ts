import OpenAI from "openai";

// Centralized OpenAI client used across the project. The key & optional organisation id are
// loaded from environment variables so credentials are never hard-coded.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID
});

export default openai;