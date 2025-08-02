import openai from "./openaiClient";

/**
 * Summarises a patent specification into a concise abstract.
 */
export async function summarisePatent(text: string): Promise<string> {
  if (!text) throw new Error("No patent text supplied");

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are a senior patent attorney and NLP specialist. You expertly summarise complex patent language into plain English abstracts." }
      ,{
        role: "user",
        content: `Please produce a 150-word maximum summary of the following patent specification. Focus on the inventive concepts, purpose, and advantages.\n\n---\n${text}\n---\nSummary:`
      }
    ]
  });

  return completion.choices[0].message?.content?.trim() ?? "";
}

/**
 * Extracts numbered independent and dependent claims from the raw patent text.
 */
export async function extractClaims(text: string): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a patent analysis assistant. You read patent specifications and extract each claim verbatim, returning the list as JSON array of strings."
      },
      {
        role: "user",
        content: `Extract ALL claims from the following patent text and return ONLY a valid JSON array of strings.\n\n${text}`
      }
    ]
  });

  // The model should return pure JSON, but guard against bad format
  try {
    return JSON.parse(completion.choices[0].message?.content ?? "[]");
  } catch {
    return [completion.choices[0].message?.content?.trim() ?? ""];
  }
}

/**
 * Classifies the patent into Cooperative Patent Classification (CPC) codes.
 */
export async function classifyPatent(text: string, topN = 3): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an IP analyst with expertise in CPC classification. Given a patent specification, you decide the most relevant CPC codes (section + class + subclass + main group)."
      },
      {
        role: "user",
        content: `Provide the ${topN} most relevant CPC codes for this patent in an array ordered by relevance. Respond with ONLY a JSON array of strings.\n\n${text}`
      }
    ]
  });

  try {
    return JSON.parse(completion.choices[0].message?.content ?? "[]");
  } catch {
    return [completion.choices[0].message?.content?.trim() ?? ""];
  }
}

/**
 * Generates a novelty / prior-art analysis highlighting differentiating features.
 */
export async function noveltyAnalysis(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0125",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are a patent examiner AI. You identify novel aspects of an invention compared with typical prior art in the field, mentioning possible prior-art references generically (e.g., 'US20180012345'). Keep result under 300 words."
      },
      {
        role: "user",
        content: `Analyse the following patent text for novelty and highlight distinguishing features over prior art.\n\n${text}`
      }
    ]
  });

  return completion.choices[0].message?.content?.trim() ?? "";
}