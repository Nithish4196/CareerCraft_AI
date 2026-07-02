"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function generateChatResponse(message: string, isCodeExplainer: boolean = false): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  if (isCodeExplainer) {
    const prompt = `You are a computer science teacher. The student sent this message: ${message}

Extract the code from the message and explain it step by step for a beginner.

Return ONLY this JSON object, nothing else, no markdown, no backticks around the JSON:

{
  "codeLanguage": "detected language name",
  "title": "one sentence describing what the code does",
  "code": "the exact code extracted from the message, preserve line breaks",
  "steps": [
    {
      "stepNumber": 1,
      "heading": "short heading max 6 words",
      "explanation": "plain english explanation 2 to 3 sentences",
      "highlightLines": [1, 2],
      "analogy": "one real world analogy or empty string",
      "commonMistake": "one common beginner mistake here or empty string"
    }
  ],
  "summary": "2 sentences summarizing the full code",
  "conceptsCovered": ["concept1", "concept2"]
}

Rules you must follow:
- Return minimum 4 steps and maximum 8 steps
- highlightLines must contain the actual line numbers of the code relevant to that step, starting from line 1
- Every line of code must appear in at least one step's highlightLines
- Write as if explaining to a first year student
- Return only the raw JSON, absolutely nothing else`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    return result.response.text();
  } else {
    const prompt = `You are CareerPilot AI, a helpful career assistant. Respond to the user's message concisely and helpfully.
User: ${message}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
