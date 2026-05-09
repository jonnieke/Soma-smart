import { ExplanationResult, QuizData, TeacherNote, RevisionMode, TutoringStep, ExamQuestion, ExamAnalysis, TutorResponse, LessonResult, TeachingStrategy } from "../types";
import { speak as ttSpeak, stopSpeech as ttStop } from "./elevenLabsService";
import { buildScaffoldingContext } from "./spacedRepetitionService";
import { buildTargetedStrategiesInstruction } from "./strategyService";
import { buildPersonaInstruction, recommendPersona } from "./adminAgentService";

// --- PROXY CONFIG ---
// We no longer use VITE_GEMINI_API_KEY on the client.
// Instead, we call a Supabase Edge Function which adds the key server-side.
import { supabase } from "../lib/supabase";

// Custom error thrown when the backend returns 429 (usage limit exceeded).
// Callers can instanceof-check this to show login/register UI instead of a generic error.
export class RateLimitError extends Error {
  constructor(message = 'Daily AI limit reached. Please register or log in to continue.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class SystemQuotaError extends Error {
  constructor(message = 'System is currently at capacity. Please try again later.') {
    super(message);
    this.name = 'SystemQuotaError';
  }
}

const SchemaType = {
  STRING: "string",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object"
} as const;

export const callGeminiProxy = async (model: string, contents: any, generationConfig: any = {}, systemInstruction: any = null) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const localApiKey = import.meta.env.VITE_GEMINI_API;

  if (isLocal && localApiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${localApiKey}`;
    const body: any = { contents };
    if (generationConfig) body.generationConfig = generationConfig;
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini Direct Error:", error);
      throw new Error(error.error?.message || "Failed to call AI directly");
    }

    const data = await response.json();
    return {
      response: {
        text: () => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
      }
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  // For learners using the SOMA-XXXX code system (no Supabase JWT),
  // pass the student code so the proxy can identify them as registered.
  const studentCode = localStorage.getItem('soma_active_student') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(studentCode ? { 'x-student-code': studentCode } : {})
  };

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, contents, generationConfig, systemInstruction, stream: false })
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore JSON parse errors for non-JSON responses
    }

    if (response.status === 429) {
      if (errorData?.error === 'Gemini API request failed' || errorData?.error?.message?.includes('Quota exceeded')) {
        console.error("System Google API Quota Exceeded:", errorData);
        throw new SystemQuotaError();
      }
      throw new RateLimitError();
    }

    console.error("Gemini Proxy Error:", errorData);
    throw new Error(errorData?.error?.message || errorData?.error || "Failed to call AI proxy");
  }

  const data = await response.json();

  // Convert the raw response to match the structure expected by the rest of the file
  return {
    response: {
      text: () => data.candidates[0].content.parts[0].text,
    }
  };
};

// --- PREDICTED TOPICS ---

export interface PredictedTopic {
  topic: string;
  probability: 'High' | 'Medium';
  reason: string;
  paperSection: string;
}

export const getPredictedTopics = async (
  subject: string,
  examType: 'KCSE' | 'KPSEA' | 'JSS' = 'KCSE'
): Promise<PredictedTopic[]> => {
  const systemInstruction = {
    parts: [{
      text: `You are a KNEC examiner analyst. Based on ${examType} past paper patterns from 2015–2024, predict the most likely topics for the upcoming ${examType} ${subject} exam.

Return a JSON array only — no markdown, no explanation outside JSON.
Format:
[
  {
    "topic": "Exact topic name",
    "probability": "High" or "Medium",
    "reason": "Short reason e.g. 'Appeared in 8 of last 10 papers'",
    "paperSection": "e.g. P1 Section A Q3 or P2 Essay"
  }
]
Return 6 topics max. Be specific to ${subject} content — not generic exam advice.`
    }]
  };

  const contents = [{
    role: 'user' as const,
    parts: [{ text: `Predict top ${examType} ${subject} topics for 2025 exam based on past paper analysis.` }]
  }];

  try {
    const result = await callGeminiProxy(
      'gemini-2.0-flash',
      contents,
      { maxOutputTokens: 600, temperature: 0.3 },
      systemInstruction
    );
    // Strip any markdown code fences if present
    const cleaned = (result || '[]').replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as PredictedTopic[];
  } catch (error: any) {
    console.error('Predicted topics error:', error);
    return [];
  }
};

// --- GENERATE PRACTICE QUESTIONS ---

export interface PracticeQuestion {
  number: number;
  text: string;
  topic: string;
  marks: number;
  modelAnswerOutline: string;
}

export const generatePracticeQuestions = async (
  subject: string,
  topic: string = '',
  examType: 'KCSE' | 'KPSEA' | 'JSS' = 'KCSE',
  count: number = 3
): Promise<PracticeQuestion[]> => {
  const topicClause = topic ? `focused on the topic: "${topic}"` : 'covering the most commonly tested topics';
  const systemInstruction = {
    parts: [{
      text: `You are a KNEC examiner setting ${examType} ${subject} exam questions.

Return a JSON array of ${count} exam-style questions — no markdown, no explanation outside JSON.
Format:
[
  {
    "number": 1,
    "text": "Full exam question text exactly as it would appear on the paper",
    "topic": "Topic name",
    "marks": 4,
    "modelAnswerOutline": "Brief bullet points of what KNEC would award marks for (not full model answer)"
  }
]
Rules:
- Questions must match ${examType} difficulty and style
- Mix question types (definition, explain, calculate, describe, draw & label)
- Vary the marks between 2 and 10
- modelAnswerOutline should list 2-5 marking points, one per bullet`
    }]
  };

  const contents = [{
    role: 'user' as const,
    parts: [{ text: `Generate ${count} ${examType} ${subject} practice questions ${topicClause}.` }]
  }];

  try {
    const result = await callGeminiProxy(
      'gemini-2.0-flash',
      contents,
      { maxOutputTokens: 800, temperature: 0.5 },
      systemInstruction
    );
    const cleaned = (result || '[]').replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as PracticeQuestion[];
  } catch (error: any) {
    console.error('Generate practice questions error:', error);
    return [];
  }
};

// --- STREAMING PROXY HELPER ---
const callGeminiProxyStream = async (model: string, contents: any, generationConfig: any = {}, systemInstruction: any = null) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const localApiKey = import.meta.env.VITE_GEMINI_API;

  if (isLocal && localApiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${localApiKey}`;
    const body: any = { contents };
    if (generationConfig) body.generationConfig = generationConfig;
    if (systemInstruction) body.systemInstruction = systemInstruction;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini Direct Stream Error:", response.status, errorText);
      let message = "Failed to call AI directly";
      try { message = JSON.parse(errorText)?.error?.message || message; } catch { /* raw text */ }
      throw new Error(message);
    }

    return response.body as ReadableStream<Uint8Array>;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ model, contents, generationConfig, systemInstruction, stream: true })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new RateLimitError();
    }
    const errorText = await response.text();
    console.error("Gemini Proxy Stream Error:", response.status, errorText);
    let message = "Failed to call AI proxy";
    try { message = JSON.parse(errorText)?.message || message; } catch { /* raw text */ }
    throw new Error(message);
  }

  return response.body as ReadableStream<Uint8Array>;
};

export const processStream = async (stream: ReadableStream<Uint8Array>, onChunk: (text: string) => void) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Gemini streaming via proxy often returns a sequence of JSON objects.
      // This regex handles escaped quotes and is robust to standard Gemini structures.
      const textMatches = Array.from(buffer.matchAll(/"text":\s*"((?:\\.|[^"\\])*)"/g));
      
      if (textMatches.length > 0) {
        const fullTextSoFar = textMatches.map(m => {
          try {
            // Safely unescape the JSON string using the capture group
            return JSON.parse(`"${m[1]}"`);
          } catch (e) {
            return ""; 
          }
        }).join("");
        
        if (fullTextSoFar) {
          onChunk(fullTextSoFar);
        }
      }
    }
  } catch (err) {
    console.error("Stream processing error:", err);
  } finally {
    reader.releaseLock();
  }
};

const genAI = {
  getGenerativeModel: (config: any) => ({
    generateContent: async (parts: any) => {
      // Support string, array of parts, or contents object
      let contents;
      if (typeof parts === 'string') {
        contents = [{ role: 'user', parts: [{ text: parts }] }];
      } else if (Array.isArray(parts)) {
        // The parts array might contain mixed primitive strings and objects (like inlineData).
        // Since Gemini API requires array elements within `parts` to be objects, map strings into `{ text: str }`.
        const normalizedParts = parts.map((p: any) => typeof p === 'string' ? { text: p } : p);
        contents = [{ role: 'user', parts: normalizedParts }];
      } else {
        contents = parts.contents;
      }
      return callGeminiProxy(config.model, contents, config.generationConfig, config.systemInstruction);
    }
  })
};

const MODEL_NAME = "gemini-2.5-flash"; // GA and widely supported

// --- SUPER TEACHER INSTRUCTIONS ---
const SYLLABUS_GROUNDING_INSTRUCTION = `
CRITICAL: MANDATORY SYLLABUS CITATION
- You MUST identify and state the exact Kenyan CBE/8-4-4 Strand and Sub-strand for this topic.
- Place this as the VERY FIRST line of your 'explanation' field.
- Format: "Curriculum Alignment: [Grade/Form] [Subject], Strand [Number]"
- Example: "Curriculum Alignment: Grade 4 Science, Strand 1.2"
- Use official Kenyan pedagogical terminology.
`;

const EXAM_CROSS_LINK_INSTRUCTION = `
CRITICAL: MANDATORY EXAM CROSS-LINK (Super Teacher Mode)
- In the 'explanation' field, include a section titled "🎓 Exam Insight".
- Proactively mention if this topic or question is a 'KCSE/KPSEA/KCPE Favorite'.
- Cite specific years if possible (e.g., 'This concept appeared in KCSE 2021 Paper 2').
- Provide one 'Killer Tip' for scoring full marks based on official KNEC marking patterns.
`;

const SUBJECT_SPECIFIC_INSTRUCTION = `
SUBJECT-SPECIFIC EXPLANATION MODES:
- If the subject is Math or Physics: You MUST provide step-by-step logical calculations. State the formula clearly before substituting any values.
- If the subject is Science/Biology/Chemistry: Focus on core principles, use relatable real-world analogies, and explain any scientific terminology.
- If the subject is Humanities (History/Geography/CRE): Provide clear cause-and-effect relationships, historical context, and bulleted timelines or locations.
- If the subject is Languages (English/Kiswahili): Focus on grammar rules, vocabulary definitions, and structural formatting.
`;

// --- SUPER TEACHER PHASE 2: ADAPTIVE SCAFFOLDING ---
const ADAPTIVE_SCAFFOLDING_INSTRUCTION = `
ADAPTIVE TUTORING MODE (Super Teacher Phase 2):
- You MUST adapt your teaching depth and approach based on the ADAPTIVE CONTEXT provided below.
- If mastery is LOW: Start with fundamentals, use simple language, define key terms.
- If mastery is INTERMEDIATE: Skip basics, focus on application and problem-solving.
- If mastery is HIGH: Go straight to advanced/exam content, edge cases, and past paper practice.
- Include a scaffolded "🤔 Think About It" checkpoint before revealing complex answers when mastery < 70%.
- Always end with one follow-up question to reinforce learning.
`;

const SOCRATIC_TUTOR_INSTRUCTION = `
SOCRATIC TUTORING MODE:
- You are a helpful, encouraging mentor. 
- DO NOT provide the full answer immediately. 
- Instead, break the problem down. Ask the student what they already know. 
- Provide small logical hints that nudge them toward the answer.
- Focus on conceptual understanding ("Why does this happen?") rather than just facts.
- Use a friendly, conversational tone.
`;

const SOLUTION_ASSISTANT_INSTRUCTION = `
SOLUTION ASSISTANT MODE:
- You are a precise academic helper.
- Provide a DIRECT and COMPLETE answer immediately.
- For math/science, show the step-by-step calculation clearly.
- For humanities, provide structured model answers with clear formatting.
- Focus on accuracy and efficiency so the student can check their work.
`;

// --- Helper: File to Base64 ---
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- LEARNER FEATURES ---

export const explainImage = async (
  base64Image: string,
  mimeType: string,
  level: 'Simple' | 'Exam',
  language: 'EN' | 'SW' = 'EN',
  purpose: 'TUTOR' | 'HOMEWORK' = 'TUTOR'
): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Markdown formatted explanation" },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
    Analyze this image carefully. It is likely a textbook page, homework question, or student notes.
    1. Extract the main topic and identify the underlying subject.
    2. ${langInstruction}
    3. **IMAGE QUESTION SOLVING**: Read ALL text, diagrams, and numbers from the image accurately. Double-check your reading before formulating an answer.
    4. **DIRECT ANSWER**: If this is a question, answer it DIRECTLY and IMMEDIATELY. Break down complex math or science problems into extremely clear, numbered steps.
    5. **FORMAT**: Use neat bullet points for steps, lists, or distinct ideas. Keep paragraphs short and visually appealing.
    6. Explain the content in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    7. Suggest 3 short related topics for further learning.
    
    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}
    ${SUBJECT_SPECIFIC_INSTRUCTION}
    ${purpose === 'HOMEWORK' ? SOLUTION_ASSISTANT_INSTRUCTION : SOCRATIC_TUTOR_INSTRUCTION}

    Output JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining image:", error);
    throw error;
  }
};

export const explainAudio = async (base64Audio: string, mimeType: string, level: 'Simple' | 'Exam', language: 'EN' | 'SW' = 'EN'): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          transcript: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Markdown formatted explanation" },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["transcript", "topic", "explanation", "summaryPoints", "relatedTopics"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
    Listen to this audio. It is likely a student asking a homework question or reading study material.
    1. Transcribe the audio to text.
    2. Extract the main topic and identify the subject.
    3. ${langInstruction}
    4. **DIRECT ANSWER**: Answer the question DIRECTLY. For math or science queries, provide a step-by-step breakdown of how to reach the final answer.
    5. **FORMAT**: Use neat bullet points for the explanation/answer.
    6. Explain the content in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    7. Suggest 3 short related topics for further learning.
    
    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}
    ${SUBJECT_SPECIFIC_INSTRUCTION}

    Output JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Audio, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining audio:", error);
    throw error;
  }
};

export const processDarasaRecording = async (audioBlob: Blob, mimeType: string, subject: string, grade: string, language: 'EN' | 'SW' = 'EN'): Promise<{ note: TeacherNote, quiz: QuizData }> => {
  const base64Audio = await fileToGenerativePart(new File([audioBlob], 'darasa.webm', { type: mimeType }));

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          note: {
            type: SchemaType.OBJECT,
            properties: {
              topic: { type: SchemaType.STRING },
              explanation: { type: SchemaType.STRING, description: "Markdown formatted student notes" },
              summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
          },
          quiz: {
            type: SchemaType.OBJECT,
            properties: {
              topic: { type: SchemaType.STRING },
              questions: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    number: { type: SchemaType.STRING },
                    text: { type: SchemaType.STRING },
                    options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    correctAnswer: { type: SchemaType.STRING },
                    topic: { type: SchemaType.STRING },
                    marks: { type: SchemaType.NUMBER }
                  },
                  required: ["number", "text", "options", "correctAnswer", "topic", "marks"]
                }
              }
            },
            required: ["topic", "questions"]
          }
        },
        required: ["note", "quiz"]
      }
    }
  });

  const prompt = `
    Listen to this audio recording of a live class lesson.
    The subject is ${subject}, intended for ${grade} students in the Kenyan education system.
    
    TASK 1: Create Structured Student Notes
    - Extract the core topic of the lesson.
    - Write a detailed, beautifully formatted markdown note using H3 headers (###) and bullet points.
    - Ensure the tone is educational and aligned with CBC standards.
    - Provide 3 sticky summary points.
    - Provide 3 related study topics.
    
    TASK 2: Generate a Revision Quiz
    - Based EXACTLY on the material covered in the audio, generate a 10-question multiple-choice quiz.
    - Give 4 plausible options per question, with exactly 1 correct answer.
    - Assign realistic marks per question (usually 1 or 2).
    
    LANGUAGE RULE: Use ${language === 'SW' ? 'Swahili (Kiswahili Sanifu)' : 'English'}, except if the subject is Swahili.
    
    Output JSON containing both "note" and "quiz" objects.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Audio.split(',')[1] || base64Audio, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return json as { note: TeacherNote, quiz: QuizData };
  } catch (error) {
    console.error("Error processing darasa recording:", error);
    throw error;
  }
};

import { getContext } from './contextService';

// --- RAG HELPER ---
const retrieveContext = async (query: string, documentId?: string, grade?: string, subject?: string): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) return "";

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query, document_id: documentId, grade, subject })
    });

    if (!response.ok) return "";

    const { chunks } = await response.json();
    if (!chunks || chunks.length === 0) return "";

    // Deduplicate and join chunks
    const uniqueChunks = Array.from(new Set(chunks.map((c: any) => c.content)));
    return uniqueChunks.join('\n\n---\n\n');
  } catch (error) {
    console.warn("RAG Retrieval failed:", error);
    return "";
  }
};

export const explainTopic = async (
  topic: string,
  level: 'Simple' | 'Exam',
  language: 'EN' | 'SW' = 'EN',
  documentId?: string,
  subject?: string,
  grade?: string,
  multimedia?: { data: string, mimeType: string },
  masteryData?: { masteryGraph: Record<string, number>, recentHurdles?: string[] },
  teachingStrategies?: TeachingStrategy[],
  purpose: 'TUTOR' | 'HOMEWORK' = 'TUTOR'
): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Markdown formatted general overview explanation" },
          subtopics: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING, description: "Subtopic heading string" },
                blocks: {
                  type: SchemaType.ARRAY,
                  description: "Structured content blocks for this subtopic to ensure readability.",
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      type: { type: SchemaType.STRING, description: "Must be exactly 'paragraph' or 'list'" },
                      text: { type: SchemaType.STRING, description: "The conversational paragraph text. Required if type is 'paragraph'." },
                      items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of bullet points or numbered list items. Required if type is 'list'." }
                    },
                    required: ["type"]
                  }
                }
              },
              required: ["title", "blocks"]
            }
          },
          recapNodes: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                point: { type: SchemaType.STRING, description: "Short, punchy summary point for checklist" },
                details: { type: SchemaType.STRING, description: "Detailed paragraph explaining the point in depth" }
              }
            }
          },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          flashcard: {
            type: SchemaType.OBJECT,
            description: "A single, high-yield Q&A flashcard for Spaced Repetition",
            properties: {
              question: { type: SchemaType.STRING, description: "Clear, exam-style question" },
              answer: { type: SchemaType.STRING, description: "Concise, accurate answer" }
            },
            required: ["question", "answer"]
          }
        },
        required: ["topic", "explanation", "subtopics", "recapNodes", "summaryPoints", "relatedTopics", "flashcard"]
      }
    }
  });

  // 1. Get Curriculum Context (Grade & Subject Filters)
  const context = getContext();
  const searchGrade = grade || context?.grade;
  const searchSubject = subject || context?.subject;

  // 2. Retrieve RAG Context (Knowledge Base)
  const ragContext = await retrieveContext(topic, documentId, searchGrade, searchSubject);
  let ragInstruction = "";
  if (ragContext) {
    ragInstruction = `
    OFFICIAL CBE CONTEXT FOUND:
    The following text is from the official Kenya Competency-Based Curriculum (Syllabus/Past Papers).
    
    "${ragContext.substring(0, 5000)}"
    
    INSTRUCTION: 
    Prioritize the definitions, scope, and terminology from this Official Context. 
    You may use your broader knowledge to explain concepts, but ensure they ALIGN with this grade-level standard. 
    If the Official Context contradicts general knowledge, follow the Official Context (it is the exam standard).
    `;
  }

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  // Build adaptive scaffolding context if mastery data is available
  const adaptiveContext = masteryData
    ? buildScaffoldingContext(topic, masteryData.masteryGraph, masteryData.recentHurdles)
    : '';
  const adaptiveInstruction = adaptiveContext
    ? `${ADAPTIVE_SCAFFOLDING_INSTRUCTION}\n${adaptiveContext}`
    : '';

  // Build Phase 3: Dynamic strategy instruction
  const strategiesInstruction = teachingStrategies
    ? buildTargetedStrategiesInstruction(teachingStrategies, topic, grade)
    : '';

  // Build Phase 3: Persona instruction based on mastery level
  let personaInstruction = '';
  if (grade && masteryData) {
    const topicMastery = masteryData.masteryGraph[topic] ?? 50;
    const { persona } = recommendPersona(grade, topicMastery);
    personaInstruction = buildPersonaInstruction(persona);
  }

  const prompt = `
    ${ragInstruction}
    ${adaptiveInstruction}
    ${strategiesInstruction}
    ${personaInstruction}

    STRICT TASK:
    1. Identify the subject of the topic "${topic}".
    2. ${langInstruction}
    3. If an image or audio recording is provided, analyze it (transcribe audio if present) and answer the student's question in the context of the source document snippets provided.
    4. Provide a general overview in the 'explanation' field.
    5. DEEP LEARNING (subtopics): Break the topic down into EXACTLY 3 distinct, logical subtopics using the FORMATTING RULES above. For EACH subtopic, provide highly readable, bite-sized paragraph notes in plain text. Do NOT use ** (bold markers) or ## (headers) in the content. Use numbered lists and bullet points frequently to break down processes or features.
       - CRITICAL LIMIT: Do not generate excessively long notes. You MUST ensure the full JSON output is completed and valid without truncating. Keep it concise.
    6. INTERACTIVE RECAP (recapNodes): Provide EXACTLY 3 titled key concept names as "point" (NOT sentences). For EACH point, provide a detailed explanatory paragraph in the 'details' field in plain text.

    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}
    ${SUBJECT_SPECIFIC_INSTRUCTION}
    ${purpose === 'HOMEWORK' ? SOLUTION_ASSISTANT_INSTRUCTION : SOCRATIC_TUTOR_INSTRUCTION}

    7. Provide EXACTLY 3 short bullet points summarizing the most critical takeaways for "stickiness" in the 'summaryPoints' field.
    8. Suggest EXACTLY 3 short related topics for further learning.
    9. FLASHCARD GENERATION: Create EXACTLY ONE high-yield Spaced Repetition flashcard in the 'flashcard' field representing the most commonly tested or misunderstood concept in this topic.
    
    Output JSON.
  `;

  try {
    const parts: any[] = [prompt];
    if (multimedia) {
      parts.push({ inlineData: { data: multimedia.data, mimeType: multimedia.mimeType } });
    }

    const result = await model.generateContent(parts);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining topic:", error);
    throw error;
  }
};

export const summarizeDocument = async (title: string, documentId: string, language: 'EN' | 'SW' = 'EN', subject?: string, grade?: string): Promise<ExplanationResult> => {
  // We use search-knowledge to get a broad overview of the document
  const ragContext = await retrieveContext("Explain the main content and purpose of this document", documentId);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Markdown formatted general overview and introduction to the topic" },
          subtopics: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING, description: "Clear subtopic heading — like a chapter or section title in a textbook" },
                blocks: {
                  type: SchemaType.ARRAY,
                  description: "Structured content blocks for this subtopic to ensure readability.",
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      type: { type: SchemaType.STRING, description: "Must be exactly 'paragraph' or 'list'" },
                      text: { type: SchemaType.STRING, description: "The conversational paragraph text. Required if type is 'paragraph'." },
                      items: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Array of bullet points or numbered list items. Required if type is 'list'." }
                    },
                    required: ["type"]
                  }
                }
              },
              required: ["title", "blocks"]
            }
          },
          recapNodes: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                point: { type: SchemaType.STRING, description: "A titled key concept or takeaway — like a chapter heading" },
                details: { type: SchemaType.STRING, description: "Detailed paragraph explaining this key concept thoroughly for revision" }
              }
            }
          },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["topic", "explanation", "subtopics", "recapNodes", "summaryPoints", "relatedTopics"]
      }
    }
  });

  const prompt = `
    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}

    You are an Expert Kenyan Teacher and AI Study Companion building a COMPREHENSIVE LEARNING HUB.
    A student in ${grade || 'their grade'} is studying the document: "${title}" for the subject: "${subject || 'General Studies'}".
    
    SYSTEM CONTEXT: You are operating within the Kenyan Education System(CBC, KCPE, and KCSE). 
    ACRONYM RULES:
  - CRE = Christian Religious Education(NOT Commercial Real Estate).
    - IRE = Islamic Religious Education.
    - HRE = Hindu Religious Education.
    - P.E. = Physical Education.
    
    Source Content Snippets:
  "${ragContext.substring(0, 10000)}"
    
    CRITICAL RULES:
    - ** STRICT SOURCE GROUNDING **: Your primary authority is the "Source Content Snippets" provided above.You MUST strictly follow the themes, topics, and terminology found in the snippets.
    - ** NO HALLUCINATION **: NEVER introduce concepts from unrelated fields(e.g., do not discuss "Real Estate" for "CRE" notes).
    - ** CONTENT INTEGRITY **: NEVER use placeholders like "[PLACEHOLDER]" or generic templates. 
    - ** CURRICULUM ALIGNMENT **: If the source content is brief, you may expand on the concepts using your expert knowledge of the KENYAN CURRICULUM for "${subject}" at "${grade}" level.However, this expansion MUST stay strictly within the subject boundaries of ${subject}.

  TASK — GENERATE DETAILED STUDY NOTES(NOT A SUMMARY):
    
    FORMATTING RULES FOR YOUNG LEARNERS(CRITICAL):
  - NO WALLS OF TEXT.Keep paragraphs extremely short(2 - 3 sentences maximum).
    - Use abundant bullet points(- ) and numbered lists(1. 2. 3.) to break up information.
    - Write in plain text.Do NOT use ** (bold markers) or ##(headers) in the content fields.
    - Keep sentences simple, friendly, and easy to read.
    - Use 🎯 for exam tips and key takeaways, placing them on their own separate line.
    - Add blank lines between every paragraph and list item for visual breathing room.
    
    1. OVERVIEW(explanation field): Write a brief, friendly introduction to the topic.What is the big idea ? Why does it matter ?

    2. DEEP STRUCTURED NOTES(subtopics field): This is the MOST IMPORTANT part.Break the document content into EXACTLY 3 distinct subtopics structured like a textbook syllabus.For EACH subtopic:
  - Give it a clear, descriptive title(like a chapter heading, e.g. "1. Types of Soil and Their Properties", "2. Factors Affecting Soil Formation")
    - Write comprehensive but highly readable notes in the content field using the formatting rules above.Include:
         - Clear definitions of key terms
    - Fun, relatable examples for young learners
      - Step - by - step numbered lists for processes or steps
        - Bulleted lists for characteristics, types, or examples
          - 🎯 Exam Tips for frequently tested areas
            - The content must be detailed but presented in bite - sized, digestible pieces, NOT large blocks of text.
       - CRITICAL LIMIT: Do not generate excessively long notes.You MUST ensure the full JSON output is completed and valid without truncating.Keep it concise.
    
    3. INTERACTIVE RECAP(recapNodes field): Provide EXACTLY 3 titled recap points.For EACH:
  - The "point" field should be a short, titled key concept name(e.g. "Photosynthesis Process", "Newton's Third Law") — NOT a full sentence
    - The "details" field should be a very concise, single - paragraph explanation of this concept for revision.Write in plain text, no bold markers.
    
    4. STICKINESS POINTS(summaryPoints): EXACTLY 3 ultra - concise bullet points — the absolute critical takeaways.
    
    5. RELATED TOPICS: Suggest EXACTLY 3 related study topics for further learning.
    
    6. Use ${language === 'SW' ? 'Swahili (Kiswahili Sanifu)' : 'English'}.
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response");
    return JSON.parse(text) as ExplanationResult;
  } catch (error) {
    console.error("Error summarizing document:", error);
    throw error;
  }
};

export const generateRichLessonNotes = async (title: string, documentId: string, language: 'EN' | 'SW' = 'EN', subject?: string, grade?: string): Promise<ExplanationResult> => {
  const ragContext = await retrieveContext("Provide a deep, comprehensive and pedagogical explanation of the subject matter for exam revision", documentId);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Detailed Markdown lesson notes" },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
      }
    }
  });

  const prompt = `
    You are an Expert Kenyan Teacher and Subject Matter Specialist.
    Your task is to prepare Comprehensive Revision Notes for a ${grade || 'Kenyan'} student for the document: "${title}".
    Subject Context: "${subject || 'General studies'}".

    SYSTEM CONTEXT: You are operating within the Kenyan Education System(CBC, KCPE, and KCSE). 
    ACRONYM RULES:
- CRE = Christian Religious Education(CRITICAL: NEVER interpret as Commercial Real Estate).
    - IRE = Islamic Religious Education.
    - HRE = Hindu Religious Education.
    
    CRITICAL INSTRUCTION: DO NOT OVERSUMMARIZE.The student needs rich, detailed, and reliable material to study from and prepare for national exams.
    
    ** STRICT SOURCE GROUNDING RULE **:
- The "Source Content Snippets" are your absolute authority. 
    - You MUST adhere to the domain of "${subject}" as defined in the Kenyan Curriculum.
    - NEVER use "[PLACEHOLDER]" or template text. 
    - Every section must contain substantive, factual information grounded in the source. 
    - ** CURRICULUM EXPANSION **: If a section(like Examples or Definitions) is requested but not explicitly in the source, use your expert knowledge of the KENYAN CURRICULUM for "${subject}" at "${grade}" level.This expansion MUST be 100 % relevant to the subject and grade.
    
    Source Content Snippets:
"${ragContext.substring(0, 15000)}"

GUIDELINES:
1. ** Pedagogical Structure **: Start with an "Introduction/Overview", followed by "Core Concepts"(detailed), "Key Formulas/Definitions", "Practical Examples/Context", and "Advanced Insights for Higher Grades".
    2. ** Exam Focus **: Explicitly mention areas that are frequently tested.Use phrases like "Exam Tip" or "Commonly assessed in national exams (KCSE/CBC)".
    3. ** Tone **: Educational, encouraging, and professional(Teacher - to - Student).
    4. ** Richness **: Provide depth.If a concept is mentioned in the source, explain the 'why' and 'how', not just the 'what'.
    5. ** Formatting **: Use Markdown with clear H2 and H3 headers, bold text for emphasis, and organized lists.
    6. ** Language **: Use ${language === 'SW' ? 'Swahili (Kiswahili Sanifu)' : 'English'}.
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response");
    return JSON.parse(text) as ExplanationResult;
  } catch (error) {
    console.error("Error generating rich notes:", error);
    throw error;
  }
};

export const continueResearch = async (
  currentTopic: string,
  currentExplanation: string,
  userQuery: string,
  level: 'Simple' | 'Exam',
  language: 'EN' | 'SW' = 'EN'
): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Markdown formatted explanation" },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
CONTEXT: The student is learning about "${currentTopic}".
    CURRENT EXPLANATION: "${currentExplanation.substring(0, 1000)}..."
    
    USER FOLLOW - UP: "${userQuery}"

TASK:
1. Update the explanation to address the user's follow-up question. 
2. Keep the focus on "${currentTopic}" but pivot to answer the specific query.
    3. ${langInstruction}
4. Explain in ${level === 'Simple' ? 'very simple language' : 'academic language'}.
5. Provide updated summary points and related topics.
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error continuing research:", error);
    throw error;
  }
};

export const generateQuiz = async (content: string, topic: string, language: 'EN' | 'SW' = 'EN'): Promise<QuizData> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                type: { type: SchemaType.STRING, enum: ["MCQ", "SHORT"] },
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Only for MCQ" },
                correctAnswer: { type: SchemaType.STRING },
                explanation: { type: SchemaType.STRING }
              },
              required: ["id", "type", "question", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["topic", "questions"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST generate the quiz in Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the content is in Swahili, you MUST generate the quiz exclusively in Swahili. For ALL other subjects and content, you MUST generate the quiz exclusively in English.";

  const prompt = `
    Based on the following content about "${topic}":
"${content.substring(0, 5000)}"

1. Identify the subject. 
    2. ${langInstruction}
3. Generate a quiz with:
- Exactly 3 Multiple Choice Questions(MCQ)
    
    For each question, provide the correct answer and a brief explanation of why.
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateQuickQuiz = async (content: string, topic: string, language: 'EN' | 'SW' = 'EN'): Promise<QuizData> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                type: { type: SchemaType.STRING, enum: ["MCQ"] },
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                correctAnswer: { type: SchemaType.STRING },
                explanation: { type: SchemaType.STRING }
              },
              required: ["id", "type", "question", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["topic", "questions"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST generate the quiz in Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the content is in Swahili, you MUST generate the quiz exclusively in Swahili. For ALL other subjects and content, you MUST generate the quiz exclusively in English.";

  const prompt = `
    Based on the explanation of "${topic}", generate a quick "Sticky Quiz" to test immediate retention.

  ${langInstruction}
    Generate exactly 3 simple Multiple Choice Questions(MCQ).

  Content: "${content.substring(0, 3000)}"
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating quick quiz:", error);
    throw error;
  }
};

// Redefine generateSpeech to use ElevenLabs
export const generateSpeech = async (text: string): Promise<void> => {
  return ttSpeak(text);
};

export const stopSpeech = () => {
  ttStop();
};

// --- TEACHER FEATURES ---

export const convertNotes = async (base64Data: string, mimeType: string, subject?: string, className?: string, language: 'EN' | 'SW' = 'EN'): Promise<TeacherNote> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          structuredNotes: { type: SchemaType.STRING, description: "Markdown" },
          simplifiedNotes: { type: SchemaType.STRING, description: "Markdown" }
        },
        required: ["topic", "structuredNotes", "simplifiedNotes"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
    Analyze this document. 
    1. CONTEXT: The teacher has indicated this is for ${subject || 'a school subject'} and the students are in ${className || 'a Kenyan classroom'}.
2. ${langInstruction}
3. Create structured lesson notes(headings, key concepts, examples) targeted at the appropriate academic level for ${className || 'this grade'}.
4. Create a simplified version suitable for students to study from directly.
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      ...json
    };
  } catch (error) {
    console.error("Error converting notes:", error);
    throw error;
  }
};

export const processVoiceNote = async (audioBase64: string, mimeType: string = "audio/mp3", subject?: string, className?: string, language: 'EN' | 'SW' = 'EN'): Promise<TeacherNote> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          structuredNotes: { type: SchemaType.STRING },
          simplifiedNotes: { type: SchemaType.STRING }
        },
        required: ["topic", "structuredNotes", "simplifiedNotes"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
        You are an expert Study Companion(like NotebookLM) for a Kenyan classroom.

  TASK 1: LISTEN & VERIFY
    - Listen to the audio.
        - If the audio is silent, just background noise, or unintelligible:
- Set topic to "Unclear Audio".
          - Set simplifiedNotes to "I couldn't hear any clear speech. Please try recording again closer to the microphone."
  - Set structuredNotes to "Audio was unclear."
    - STOP there.

      TASK 2: TRANSCRIBE & SIMPLIFY(Only if speech is clear)
- Transcribe the teacher's lesson.
  - CONTEXT: This lesson is about ${subject || 'a specific subject'} for students in ${className || 'a Kenyan classroom'}.
- ${langInstruction}
- Create a "NotebookLM Style" Study Guide targeted at ${className || 'the students level'}:
1. ** Topic **: A fun, catchy title.
          2. ** The Big Idea **: One simple sentence explaining what this is about.
          3. ** Key Points **: 3 - 4 bullet points using simple words.
4. ** Fun Fact / Example **: A relatable example.

Format as JSON.
    `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: audioBase64, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    try {
      // Try to clean potential markdown fences ```json\n ?| ```/g
      const cleanedText = text.replace(/```json\n ?| ```/g, '').trim();
      const json = JSON.parse(cleanedText);
      return {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        ...json
      };
    } catch (parseError) {
      console.warn("AI returned non-JSON text:", text);
      // Fallback: If AI refused or gave plain text, wrap it safely
      return {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        topic: "Audio Processing Note",
        structuredNotes: "The AI could not strictly format the notes.",
        simplifiedNotes: text || "We heard you, but couldn't generate the specific format. Please try again."
      };
    }

  } catch (error) {
    console.error("Error processing voice note:", error);
    throw error;
  }
}

export const generateTeacherQuiz = async (topic: string, language: 'EN' | 'SW' = 'EN'): Promise<QuizData> => {
  return generateQuiz("", topic, language);
}

export const generateAdvancedTeacherQuiz = async (
  images: string[],
  topic: string,
  grade: string,
  count: number,
  type: 'MCQ' | 'OPEN',
  language: 'EN' | 'SW' = 'EN'
): Promise<QuizData> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                type: { type: SchemaType.STRING, enum: ["MCQ", "SHORT"] },
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                correctAnswer: { type: SchemaType.STRING },
                explanation: { type: SchemaType.STRING },
                cognitiveLevel: { type: SchemaType.STRING },
                markingScheme: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["id", "type", "question", "correctAnswer", "explanation", "cognitiveLevel", "markingScheme"]
            }
          }
        },
        required: ["topic", "questions"]
      }
    }
  });

  const imageParts = images.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img }
  }));

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST generate the quiz in Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the content is in Swahili, you MUST generate the quiz exclusively in Swahili. For ALL other subjects and content, you MUST generate the quiz exclusively in English.";

  const prompt = `
    You are an expert Kenyan Competency - Based Curriculum(CBC) Developer.

  Task: Create a professional ${grade} Exam Quiz about "${topic}".
    
    Source Material: Use the attached images as context.

  Requirements:
  1. Subject identification: Identify the subject from the topic or content.
  2. ${langInstruction}
  3. Generate EXACTLY ${count} questions.
  4. Format: ${type === 'MCQ' ? 'Multiple Choice Questions (4 options)' : 'Short Answer / Structured Questions (No options)'}.
  5. Standard: Align with Kenyan CBC standards (Scenario-based, Critical Thinking, Application).
  6. Language: Academic and age-appropriate for ${grade}.
  7. CRITICAL: Provide a highly detailed, step-by-step 'markingScheme' array for EACH question (e.g., ["1 mark for X", "1 mark for Y"]).
  8. CRITICAL: Include the cognitiveLevel (e.g., Knowledge, Application, Analysis).
    
    Output JSON structure:
{
  "topic": "${topic}",
    "questions": [
      {
        "id": 1,
        "type": "${type === 'MCQ' ? 'MCQ' : 'SHORT'}",
        "question": "Question text here...",
        "options": ["A", "B", "C", "D"](Only if MCQ),
      "correctAnswer": "Correct Answer",
      "explanation": "Brief explanation for the teacher marking scheme"
        }
      ]
    }
`;

  try {
    const result = await model.generateContent([
      ...imageParts,
      prompt
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating advanced quiz:", error);
    throw error;
  }
};

export const repairQuizForClassroom = async (
  quiz: QuizData,
  subject: string,
  grade: string,
  language: 'EN' | 'SW' = 'EN'
): Promise<QuizData> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                type: { type: SchemaType.STRING, enum: ["MCQ", "SHORT"] },
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                correctAnswer: { type: SchemaType.STRING },
                explanation: { type: SchemaType.STRING },
                cognitiveLevel: { type: SchemaType.STRING },
                markingScheme: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              required: ["id", "type", "question", "correctAnswer", "explanation", "cognitiveLevel", "markingScheme"]
            }
          }
        },
        required: ["topic", "questions"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST output in Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If subject is Kiswahili/Swahili output in Swahili; otherwise output in English.";

  const prompt = `
You are a senior Kenyan teacher quality-checking an exam quiz before class assignment.
${langInstruction}

Fix and return a STRICTLY classroom-ready quiz for:
Subject: ${subject}
Grade/Class: ${grade}

Current quiz JSON:
${JSON.stringify(quiz)}

RULES:
1. Keep the same topic intent.
2. Ensure at least 5 questions.
3. Every question must include:
   - clear question text
   - correctAnswer
   - explanation
   - cognitiveLevel
   - detailed markingScheme with at least 2 marking points
4. Keep options only for MCQ; 4 options for MCQ.
5. Return only valid JSON matching schema.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as QuizData;
};

export const repairNoteForClassroom = async (
  note: TeacherNote,
  subject: string,
  grade: string,
  language: 'EN' | 'SW' = 'EN'
): Promise<TeacherNote> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          structuredNotes: { type: SchemaType.STRING },
          simplifiedNotes: { type: SchemaType.STRING }
        },
        required: ["topic", "structuredNotes", "simplifiedNotes"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: Output in Kiswahili Sanifu."
    : "LANGUAGE RULE: If subject is Kiswahili/Swahili output in Swahili; otherwise output in English.";

  const prompt = `
You are a senior Kenyan teacher improving a lesson note before classroom publishing.
${langInstruction}

Subject: ${subject}
Grade/Class: ${grade}

Current note JSON:
${JSON.stringify(note)}

TASK:
1. Keep the same topic intent.
2. Expand and polish content so it is classroom-ready and exam-aligned.
3. structuredNotes: professional teacher-quality markdown with headings, key points, examples, and short assessment checks.
4. simplifiedNotes: student-friendly study note with plain language, bullet points, and quick recap.
5. Return only valid JSON matching schema.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("No response from AI");
  const parsed = JSON.parse(text) as TeacherNote;
  return {
    id: note.id || Date.now().toString(),
    date: note.date || new Date().toLocaleDateString(),
    ...parsed
  };
};

// --- ASK SOMA CHATBOT ---
// --- ASK SOMO CHATBOT ---

export const askSomo = async (userQuery: string, chatHistory: { role: 'user' | 'model', text: string }[], language: 'EN' | 'SW' = 'EN'): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Construct prompt with history manually
  const systemInstruction = `You are Somo, a super friendly, caring, and easy - going AI Learning Buddy for children! 🌟 

YOUR PERSONALITY:
- Be extremely encouraging and kind.Use phrases like "Great question!", "I'm so happy to help you!", and "Let's learn together!"
  - Use very simple words that a young learner can understand easily.
- Use lots of fun emojis to keep things exciting! 🚀📚✨

NAVIGATION & HELP:
1. ** Logging In **: If someone wants to log in, tell them: "Look at the very top of the page and click the big 'Student Login' button! 👆"
2. ** Registering **: If they are new, tell them: "Click 'Student Login' first, then look for the blue link at the bottom that says 'New Student? Create Profile'. It's easy! 😊"
3. ** Homework & Math **: If a learner asks a factual or math question(like "what is 4x4"), ALWAYS give the correct answer clearly first.Then add: "To use my Magic Scanner and see a full explanation with fun helpers, make sure to login or create your profile! 📸"

USE THESE EXACT LINKS:
- Sign In / Dashboard: [Student Login](/learner)
  - See how Somo works: [How it Works](#how - it - works)
    - For Parents: [Parent Dashboard](/parent)
      - For Teachers: [Teacher Dashboard](/teacher)
        - For Exam Candidates: [Candidate Success Center](/revision)

${language === 'SW' ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili." : ""}
Keep answers short(1 - 3 sentences), warm, and very clear.Always be helpful! ❤️`;

  const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Somo'}: ${msg.text} `).join('\n');
  const fullPrompt = `${systemInstruction} \n\n${historyText} \nUser: ${userQuery} \nSomo: `;

  try {
    const result = await model.generateContent(fullPrompt);

    const text = result.response.text();
    if (!text) return "I'm thinking... but got stuck! 😅";
    return text;
  } catch (error) {
    console.error("Error asking Somo:", error);
    return "Oops! My brain is a bit foggy right now. ☁️ Try again later!";
  }
};

// --- REVISION ASSISTANT FEATURES ---

export const ingestPastPaper = async (file: File): Promise<ExamAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                number: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
                topic: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                competency: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER }
              },
              required: ["id", "number", "text", "topic", "competency"]
            }
          }
        },
        required: ["subject", "grade", "questions"]
      }
    }
  });

  const base64Data = await fileToGenerativePart(file);
  const mimeType = file.type;

  const prompt = `
    You are an expert Educational Content Architect. 
    Analyze this uploaded document, which is a past national examination paper(KCSE, KPSEA, or KEPSEA).
    
    1. Identify the Subject(e.g., Mathematics, English, Kiswahili).
    2. Identify the Grade Level(e.g., Form 4, Grade 9, Grade 6).
    3. Extract EVERY question from the paper.
    4. For each question:
- Extract the question number(e.g., 1, 2a, 3).
       - Extract the full text of the question.
       - Identify the specific Topic and Sub - strand it belongs to(based on Kenyan CBC / 844 curriculum).
       - Identify the Competency being tested(e.g., Critical Thinking, Problem Solving, Literacy, Numeracy).
       - Extract the Marks assigned to it(0 if not specified).
    
    Output JSON compatible with the ExamAnalysis interface.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error ingesting exam:", error);
    throw error;
  }
};

export const analyzeExamPaper = async (base64Image: string, mimeType: string): Promise<ExamAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                number: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
                topic: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                competency: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER }
              },
              required: ["id", "number", "text", "topic", "competency"]
            }
          }
        },
        required: ["subject", "grade", "questions"]
      }
    }
  });

  const prompt = `
    Analyze this exam paper image.
    1. Identify the Subject and Grade Level.
    2. Extract all visible questions.
    3. For each question, identify the Topic, Sub - Strand(CBC), and Competency being tested.
    
    Output JSON structure:
{
  "subject": "string",
    "grade": "string",
      "questions": [
        {
          "id": number,
          "number": "string (e.g. 1a)",
          "text": "string content",
          "topic": "string",
          "subStrand": "string",
          "competency": "string",
          "marks": number(or 0 if not shown)
        }
      ]
}
`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error analyzing exam:", error);
    throw error;
  }
};

export const analyzeExamPaperUrl = async (fileUrl: string, mimeType: string): Promise<ExamAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                number: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
                topic: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                competency: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER }
              },
              required: ["id", "number", "text", "topic", "competency"]
            }
          }
        },
        required: ["subject", "grade", "questions"]
      }
    }
  });

  const prompt = `
    Analyze this exam paper document.
    1. Identify the Subject and Grade Level.
    2. Extract all visible questions.
    3. For each question, identify the Topic, Sub-Strand(CBC), and Competency being tested.
    
    Output JSON structure:
    {
      "subject": "string",
      "grade": "string",
      "questions": [
        {
          "id": number,
          "number": "string (e.g. 1a)",
          "text": "string content",
          "topic": "string",
          "subStrand": "string",
          "competency": "string",
          "marks": number (or 0 if not shown)
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      // @ts-ignore - fetchUrl is our custom property handled by gemini-proxy
      { fetchUrl: { url: fileUrl, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error analyzing exam from URL:", error);
    throw error;
  }
};

export const getRevisionTutorResponse = async (
  question: ExamQuestion,
  currentStep: TutoringStep,
  history: { role: 'user' | 'model', text: string }[],
  mode: RevisionMode,
  language: 'EN' | 'SW' = 'EN'
): Promise<TutorResponse> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          step: { type: SchemaType.STRING },
          nextStep: { type: SchemaType.STRING },
          hint: { type: SchemaType.STRING }
        },
        required: ["text", "step", "nextStep"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: Respond in Swahili (Kiswahili Sanifu). Translate educational concepts where appropriate."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const systemInstruction = `
    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}

    You are Somo Smart Candidate Specialist, an expert international - level exam strategist for Kenyan Candidates(KCSE, KPSEA, KEPSEA).
  Tone: Highly Strategic, Professional, Evidence - Based, and Results - Oriented.
    
    Your goal is to guide the candidate THROUGH one national exam question at a time using a strict pedagogical flow.

  Current Question: "${question.text}"
Topic: ${question.topic}
Competency: ${question.competency}
    
    Current Step: ${currentStep}
Mode: ${mode}
    
    INSTRUCTIONS FOR CURRENT STEP:
1. Identify the subject from the topic or question text.
    2. ${langInstruction}
    
    IF STEP = 'A_UNDERSTAND':
- Provide a DIRECT, single - sentence summary of what this question is testing.
      - "This question tests your ability to..."
  - DO NOT explain the concept in detail yet.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'B_THINKING':
- Provide a DIRECT strategy to solve this. 
      - "To solve this, first identify... then calculate/compare..."
  - Warn briefly about the #1 common pitfall.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'C_SOLUTION':
- Provide the DIRECT step - by - step solution immediately.
      - Use numbered points.
      - Show every calculation or logical step clearly.
      - Use simple, direct language.
      
    IF STEP = 'D_REFLECTION':
- State the FINAL ANSWER clearly at the top.
      - Provide a "Pro-Tip" for similar questions in the future.
      
    Output JSON:
{
  "text": "Your teaching response here (use Markdown for formatting)",
    "step": "${currentStep}",
      "nextStep": "The next logical step (e.g. B_THINKING after A is done, or COMPLETE after D)",
        "hint": "Optional short hint if in Exam Mode"
}
`;

  // We only send the last few messages to keep context relevant but focused
  const chatContext = history.map(h => `${h.role}: ${h.text} `).join('\n');
  const fullPrompt = `${systemInstruction} \n\nChat History: \n${chatContext} \n\nAssistant: `;

  try {
    const result = await model.generateContent(fullPrompt);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TutorResponse;
  } catch (error) {
    console.error("Error in revision tutor:", error);
    throw error;
  }
};

export const getPaperGuidance = async (analysis: ExamAnalysis, query?: string, language: 'EN' | 'SW' = 'EN'): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const paperContext = `
Subject: ${analysis.subject}
Grade: ${analysis.grade}
Questions:
        ${analysis.questions.map(q => `- Q${q.number}: ${q.topic} (Competency: ${q.competency})`).join('\n')}
`;

  const strategyPrompt = `
        You are the Somo Smart Candidate Specialist. 
        Analyze the structure of this past paper and provide a strategic guidance report for a student.
        
        Paper Overview:
        ${paperContext}
        
        Your report MUST include:
1. ** Paper Structure **: Briefly describe what this paper covers.
        2. ** Difficulty Hotspots **: Which questions appear most challenging based on the competencies ?
  3. ** Strategic Tips **: How should a student allocate their time ? (e.g. "Focus on Section B first...")
4. ** Key Competencies **: What should the student master most to excel in this specific paper ?

  Keep it concise, professional, and highly strategic.Use Markdown formatting.
    `;

  const queryPrompt = `
        You are the Somo Smart Candidate Specialist. 
        Answer the student's question specifically based on the analysis of this past paper.
        
        Paper Context:
        ${paperContext}
        
        Student Question: "${query}"
        
        Provide a helpful, expert response grounded strictly in the paper's structure and content.
  `;

  const prompt = query ? queryPrompt : strategyPrompt;

  const finalPrompt = `
    ${prompt}
    
    ${language === 'SW' ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
`;

  try {
    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();
    return text || "I couldn't analyze that for you right now.";
  } catch (error) {
    console.error("Error in paper guidance:", error);
    return "Oops! I hit a snag while analyzing the paper strategy.";
  }
};

// --- EXAM MARKING & PRACTICE FUNCTIONS ---

import { MarkingResult } from "../types";

export const markStudentAnswer = async (
  question: ExamQuestion,
  learnerAnswer: string,
  language: 'EN' | 'SW' = 'EN'
): Promise<MarkingResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          marksAwarded: { type: SchemaType.INTEGER },
          marksAvailable: { type: SchemaType.INTEGER },
          isCorrect: { type: SchemaType.BOOLEAN },
          modelAnswer: { type: SchemaType.STRING },
          feedback: { type: SchemaType.STRING },
          examTip: { type: SchemaType.STRING }
        },
        required: ["marksAwarded", "marksAvailable", "isCorrect", "modelAnswer", "feedback", "examTip"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
    You are a STRICT Kenyan National Exam Marker(KNEC standard).
    You are marking a candidate's answer for a KPSEA/KCSE examination.

QUESTION: "${question.text}"
Topic: ${question.topic}
    Marks Available: ${question.marks || 2}
Competency: ${question.competency || 'General'}
    
    CANDIDATE'S ANSWER: "${learnerAnswer}"
    
    ${langInstruction}
    
    MARKING INSTRUCTIONS:
1. Compare the candidate's answer against the KNEC marking scheme standard.
2. Award marks strictly — partial marks are allowed.
    3. In "modelAnswer", provide the COMPLETE correct answer as it would appear in the official marking scheme.
    4. In "feedback", explain specifically WHY marks were awarded or lost.Be direct: "You got X marks because... You lost Y marks because..."
5. In "examTip", give a practical tip for this type of question in future KPSEA / KCSE exams.Reference real exam patterns: "This topic frequently appears in KCSE Paper 1 Section B..."
    
    Output JSON:
{
  "marksAwarded": number,
    "marksAvailable": ${question.marks || 2},
  "isCorrect": boolean,
    "modelAnswer": "The complete correct answer...",
      "feedback": "You scored X/${question.marks || 2}. Here's why...",
        "examTip": "In KCSE/KPSEA exams, this type of question..."
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as MarkingResult;
  } catch (error) {
    console.error("Error marking answer:", error);
    throw error;
  }
};

export const generateExamQuestions = async (
  base64Data: string,
  mimeType: string,
  subject: string,
  grade: string,
  count: number = 10,
  language: 'EN' | 'SW' = 'EN'
): Promise<ExamAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                number: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
                topic: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                competency: { type: SchemaType.STRING },
                cognitiveLevel: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER },
                markingScheme: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["id", "number", "text", "topic", "competency", "cognitiveLevel", "marks", "markingScheme"]
            }
          }
        },
        required: ["subject", "grade", "questions"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: Generate questions ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the content is in Swahili, you MUST generate exclusively in Swahili. For ALL other subjects and content, you MUST generate exclusively in English.";

  const prompt = `
    You are a Master KNEC Exam Setter for Kenyan national examinations (KPSEA, KCSE).
    
    Using the attached revision notes / document as source material, generate ${count} strictly formatted exam-quality questions.

    Subject: ${subject}
    Grade: ${grade}
    ${langInstruction}

    STRICT RULES:
    1. Questions MUST precisely emulate KNEC papers. Use official action verbs: "State", "Identify", "Explain", "Calculate", "Describe with the aid of a diagram".
    2. Mix cognitive levels (Bloom's Taxonomy): Knowledge (2 marks), Application (3-4 marks), and Analysis/Synthesis (5+ marks).
    3. Each question must target a specific CBC / 8-4-4 competency.
    4. Provide the exact marks allocated.
    5. CRITICAL: You MUST provide a highly detailed, step-by-step 'markingScheme' array for each question. Show exactly where each mark is awarded (e.g., ["1 mark for stating X", "1 mark for linking X to Y"]).
    
    Output as JSON matching the requested schema.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error generating exam questions:", error);
    throw error;
  }
};

export const predictLikelyQuestions = async (
  analysis: ExamAnalysis,
  language: 'EN' | 'SW' = 'EN'
): Promise<ExamAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                number: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
                topic: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                competency: { type: SchemaType.STRING },
                cognitiveLevel: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER },
                markingScheme: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["id", "number", "text", "topic", "competency", "cognitiveLevel", "marks", "markingScheme"]
            }
          }
        },
        required: ["subject", "grade", "questions"]
      }
    }
  });

  const paperContext = analysis.questions.map(q =>
    `Q${q.number}: "${q.text}"(Topic: ${q.topic}, Marks: ${q.marks || 2})`
  ).join('\n');

  const prompt = `
    You are a senior KNEC exam analyst who has studied Kenyan national examination patterns for 20 years.
    
    Based on this past paper's pattern:
Subject: ${analysis.subject}
Grade: ${analysis.grade}
    Questions from past paper:
    ${paperContext}
    
    ${language === 'SW' ? "Respond in Swahili (Kiswahili Sanifu)." : "If Kiswahili subject, respond in Swahili. Otherwise English."}

    TASK: Generate 8 PREDICTED questions that are MOST LIKELY to appear in the NEXT exam sitting.
    
    STRICT KNEC CRITERIA:
    1. Topics that appear frequently across KPSEA / KCSE papers get repeated.
    2. Topics NOT covered in this paper are likely to appear next time.
    3. KNEC tends to rotate between application and knowledge questions. Ensure a mix of cognitive levels (Bloom's Taxonomy).
    4. Include some "killer" questions that separate A students from B students (Analysis/Synthesis).
    5. CRITICAL: You MUST provide a highly detailed, step-by-step 'markingScheme' array for each question. Show exactly where each mark is awarded (e.g., ["1 mark for stating X", "1 mark for linking X to Y"]).
    
    Each question must have marks allocated, cognitiveLevel defined, and be in proper KNEC exam format.
    Output as JSON matching the requested schema.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error predicting questions:", error);
    throw error;
  }
};

// --- AI STRUCTURED NOTES & EXPLANATION FUNCTIONS ---

import { StructuredStudyNotes, StudyTopic, QuestionExplanation } from "../types";

export const extractStructuredNotes = async (
  base64Data: string,
  mimeType: string,
  subject: string,
  grade: string,
  language: 'EN' | 'SW' = 'EN'
): Promise<StructuredStudyNotes> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          overview: { type: SchemaType.STRING },
          totalTopics: { type: SchemaType.INTEGER },
          topics: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                title: { type: SchemaType.STRING },
                difficulty: { type: SchemaType.STRING },
                examRelevance: { type: SchemaType.STRING },
                keyConcepts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                content: { type: SchemaType.STRING },
                examTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                commonMistakes: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              required: ["id", "title", "difficulty", "examRelevance", "keyConcepts", "content", "examTips", "commonMistakes"]
            }
          }
        },
        required: ["subject", "grade", "title", "overview", "totalTopics", "topics"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const prompt = `
    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}

    You are a world - class Kenyan CBC / 8 - 4 - 4 curriculum expert and exam strategist.

  TASK: Read this document thoroughly and convert it into DETAILED, well - structured, exam - focused study notes.

    Subject: ${subject || 'Identify from document'}
Grade: ${grade || 'Identify from document'}
    ${langInstruction}

INSTRUCTIONS:
1. Segment the content into MAIN EXAMINABLE TOPICS(each topic should be a core area that KNEC examines).
    2. For each topic provide:
       - ** title **: Clear, specific topic name
  - ** difficulty **: "Easy", "Medium", or "Hard" based on how students typically perform
    - ** examRelevance **: "Low", "Medium", "High", or "Very High" based on how frequently this appears in KPSEA / KCSE papers
      - ** keyConcepts **: List 3 - 6 key concepts / terms / formulas the student must know
        - ** content **: Detailed, well - structured notes in Markdown format.Include:
         * Clear explanations with examples
* Definitions of key terms
  * Step - by - step procedures / methods where applicable
    * Diagrams described in text form
      * Tables or comparisons where relevant
        * At least 500 words per topic for depth
          - ** examTips **: 2 - 3 specific tips about how this topic appears in KPSEA / KCSE exams
            - ** commonMistakes **: 2 - 3 mistakes candidates commonly make in this topic

3. Make notes COMPREHENSIVE.A candidate should be able to study ONLY from these notes and answer exam questions.
    4. Use clear, student - friendly language.Define technical terms.
    5. Include relevant examples from Kenyan context where applicable.

Output as StructuredStudyNotes JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as StructuredStudyNotes;
  } catch (error) {
    console.error("Error extracting structured notes:", error);
    throw error;
  }
};

export const generateTopicQuiz = async (
  topic: StudyTopic,
  subject: string,
  grade: string,
  language: 'EN' | 'SW' = 'EN'
): Promise<ExamAnalysis> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          subject: { type: SchemaType.STRING },
          grade: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                number: { type: SchemaType.STRING },
                text: { type: SchemaType.STRING },
                topic: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                competency: { type: SchemaType.STRING },
                cognitiveLevel: { type: SchemaType.STRING },
                marks: { type: SchemaType.INTEGER },
                markingScheme: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING }
                }
              },
              required: ["id", "number", "text", "topic", "competency", "cognitiveLevel", "marks", "markingScheme"]
            }
          }
        },
        required: ["subject", "grade", "questions"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "Generate questions in Swahili (Kiswahili Sanifu)."
    : "If Kiswahili subject, generate in Swahili. Otherwise English.";

  const prompt = `
    You are a Master KNEC Exam Setter. Generate 5 strictly formatted exam-quality questions specifically on this topic.

    Subject: ${subject}
    Grade: ${grade}
    Topic: ${topic.title}
    ${langInstruction}
    
    Topic Content for Context:
    ${topic.content.slice(0, 4000)}
    
    Key Concepts to Test:
    ${topic.keyConcepts.join(', ')}

    STRICT RULES:
    1. Questions MUST test understanding of THIS specific topic only.
    2. Mix cognitive levels: Knowledge (2 easy, 2 marks), Application (2 medium, 3-4 marks), Analysis (1 hard, 5 marks).
    3. Use official KPSEA / KCSE exam format: "State...", "Explain...", "Describe...", "Calculate..."
    4. CRITICAL: You MUST provide a highly detailed, step-by-step 'markingScheme' array for each question. Show exactly where each mark is awarded (e.g., ["1 mark for stating X", "1 mark for linking X to Y"]).
    
    Output as JSON matching the requested schema.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ExamAnalysis;
  } catch (error) {
    console.error("Error generating topic quiz:", error);
    throw error;
  }
};

export const explainQuestion = async (
  question: ExamQuestion,
  language: 'EN' | 'SW' = 'EN'
): Promise<QuestionExplanation> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          whatItTests: { type: SchemaType.STRING },
          keyConcepts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          approachStrategy: { type: SchemaType.STRING },
          commonPitfalls: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          examContext: { type: SchemaType.STRING }
        },
        required: ["whatItTests", "keyConcepts", "approachStrategy", "commonPitfalls", "examContext"]
      }
    }
  });

  const langInstruction = language === 'SW'
    ? "Respond in Swahili (Kiswahili Sanifu)."
    : "If Kiswahili subject, respond in Swahili. Otherwise English.";

  const prompt = `
    You are the Somo Smart Candidate Specialist — a KNEC exam strategist.

  QUESTION: "${question.text}"
Topic: ${question.topic}
Marks: ${question.marks || 2}
Competency: ${question.competency || 'General'}
    ${langInstruction}

TASK: Provide a strategic breakdown of this question to help the candidate PREPARE before answering.DO NOT reveal the actual answer.
    
    1. ** whatItTests **: "This question tests your understanding of..."(one clear sentence)
2. ** keyConcepts **: List 3 - 5 concepts / terms the candidate needs to know to answer this
3. ** approachStrategy **: Step - by - step strategy for tackling this question. "First, identify... Then consider... Finally, present your answer by..."
4. ** commonPitfalls **: 2 - 3 mistakes candidates commonly make on this type of question. "Many candidates lose marks by..."
5. ** examContext **: Where does this type of question typically appear in KPSEA / KCSE ? How frequently ? What marks does it typically carry ?

  Be strategic and specific.Help the candidate THINK before they write.
Output as QuestionExplanation JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuestionExplanation;
  } catch (error) {
    console.error("Error explaining question:", error);
    throw error;
  }
};


// --- TSC LIVE & RECAP FEATURES ---

import { LessonRecap } from "../types";

export const generateLessonRecap = async (inputBase64: string, mimeType: string, audience: 'LEARNER' | 'TEACHER', language: 'EN' | 'SW' = 'EN'): Promise<LessonRecap> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          keyPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          examTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          definitions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: { term: { type: SchemaType.STRING }, definition: { type: SchemaType.STRING } }
            }
          },
          teacherNotes: { type: SchemaType.STRING, description: "Only if audience is TEACHER" }
        },
        required: ["topic", "summary", "keyPoints", "examTips", "definitions"]
      }
    }
  });

  const learnerPrompt = `
    You are an expert tutor helping a student understand a live lesson they just attended.
    1. Analyze the recording / notes and identify the subject.
    2. ${language === 'SW' ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
3. Extract the Main Topic.
    4. Write a fun, simple Summary(2 - 3 sentences).
    5. List 5 Key Points(Bullet points).
    6. Highlight 3 "Exam Tips" - things they must remember for tests.
    7. Define 3 key terms used.
    
    Output JSON.
  `;

  const teacherPrompt = `
    You are a curriculum expert summarizing a lesson for a fellow teacher.
    1. Analyze the recording / notes and identify the subject.
    2. ${language === 'SW' ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
3. Extract Topic and Competencies covered.
    4. Provide a professional Summary.
    5. List Key Teaching Points.
    6. Suggest 3 Follow - up assessment ideas.
    
    Output JSON compatible with the schema, mapping 'teacherNotes' to specific pedagogy comments.
  `;

  const prompt = audience === 'LEARNER' ? learnerPrompt : teacherPrompt;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: inputBase64, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as LessonRecap;
  } catch (error) {
    console.error("Error generating lesson recap:", error);
    throw error;
  }
};

// --- DARASA AI FEATURES ---

// --- DARASA AI FEATURES ---

export const generateDarasaLesson = async (audioBase64: string, mimeType: string = "audio/mp3", language: 'EN' | 'SW' = 'EN'): Promise<LessonResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          simplifiedNotes: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING }
              },
              required: ["title", "content"]
            }
          },
          quiz: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                type: { type: SchemaType.STRING, enum: ["MCQ"] },
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                correctAnswer: { type: SchemaType.INTEGER },
                explanation: { type: SchemaType.STRING }
              },
              required: ["id", "type", "question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["topic", "summary", "simplifiedNotes", "quiz"]
      }
    }
  });

  const prompt = `
    You are an expert Teaching Assistant for a Kenyan Classroom.

  TASK 1: ANALYZE RECORDING
    Listen to this teacher's lesson recording carefully. Identify the subject.
    
    TASK 2: COMPREHENSIVE NOTES
    Create detailed, professional - grade teacher notes.
    - ${language === 'SW' ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
    - ** Introduction **: Briefly introduce the topic.
    - ** Core Concepts **: Explain 3 - 5 main concepts covered in depth.
    - ** Examples **: Provide 2 - 3 real - world examples mentioned or relevant to the context.
    - ** Summary **: A concluding paragraph.
    
    Map this to the "simplifiedNotes" schema as sections:
- Title: "Introduction", Content: ...
- Title: "Core Concepts", Content: ... (Use markdown bullets)
- etc.

  TASK 3: EXTENSIVE QUIZ
    Generate a robust quiz to strictly test understanding.
    - ** Quantity **: Generate AT LEAST 8 questions(Target 10).
    - ** Type **: Multiple Choice.
    - ** Difficulty **: Mixed(Easy to Hard).
    
    Output structured JSON matching the schema.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: audioBase64, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const parsedResult = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...parsedResult
    };
  } catch (error) {
    console.error("Error generating Darasa lesson:", error);
    throw error;
  }
};

export const generateDarasaRevision = async (imageBase64: string, mimeType: string, language: 'EN' | 'SW' = 'EN'): Promise<LessonResult> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          summary: { type: SchemaType.STRING },
          simplifiedNotes: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                content: { type: SchemaType.STRING }
              },
              required: ["title", "content"]
            }
          },
          quiz: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.INTEGER },
                type: { type: SchemaType.STRING, enum: ["MCQ"] },
                question: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                correctAnswer: { type: SchemaType.INTEGER },
                explanation: { type: SchemaType.STRING }
              },
              required: ["id", "type", "question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["topic", "summary", "simplifiedNotes", "quiz"]
      }
    }
  });

  const prompt = `
TASK: REVISION FROM IMAGE
1. Analyze this image of lesson notes or a textbook page.Identify the subject.
    2. ${language === 'SW' ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
3. Extract the Main Topic.
    4. Write a clear, simple Summary(2 - 3 sentences).
    5. Create "Simplified Notes" broken into logical sections(Title + Content).
    6. Generate a Quiz with 3 - 5 Multiple Choice Questions based DIRECTLY on the content.

    Output structured JSON matching this schema:
{
  "topic": "String",
    "summary": "String",
      "simplifiedNotes": [
        { "title": "Section Title", "content": "Simplified explanation..." }
      ],
        "quiz": [
          {
            "id": 1,
            "type": "MCQ",
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Why this is correct"
          }
        ]
}
`;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI");

    const parsedResult = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...parsedResult
    };
  } catch (error) {
    console.error("Error generating Darasa revision:", error);
    throw error;
  }
};

// --- PODCAST FEATURE ---

export const generatePodcastScript = async (content: string, topic: string): Promise<{ title: string, script: Array<{ speaker: 'Host' | 'Guest', text: string }> }> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          script: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                speaker: { type: SchemaType.STRING, enum: ["Host", "Guest"] },
                text: { type: SchemaType.STRING }
              },
              required: ["speaker", "text"]
            }
          }
        },
        required: ["title", "script"]
      }
    }
  });

  const prompt = `
    You are the producer of a popular Kenyan educational podcast called "Akili Audio" — Built for Kenya, by Kenya.
    Your task is to convert the following educational content into a lively, engaging 2-minute podcast script between two hosts:
    - Host (Amina): Enthusiastic Kenyan host, introduces the topic, asks guiding questions, and summarizes key points. Uses Kenyan references naturally.
    - Guest (Akili): The AI knowledge buddy — knowledgeable but accessible, explains complex ideas with Kenyan analogies and real-world examples.

    Content to cover:
    Topic: "${topic}"
    Material:
    "${content.slice(0, 15000).replace(/"/g, "'")}"

    Rules:
    1. Start with a catchy Kenyan-flavored intro (e.g., "Karibu Akili Audio, the podcast that makes learning fun!").
    2. Make it sound like a real conversation (use "Exactly!", "That's a great point", "Wait, so you mean...").
    3. Keep explanations simple and use analogies from Kenyan daily life (shamba, soko, matatu, etc.).
    4. End with a quick takeaway or study tip relevant to the Kenyan curriculum.
    5. The script should be roughly 2 minutes long when spoken.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating podcast script:", error);
    throw error;
  }
};

// --- AUTOMATED EVALUATION FEATURE ---

export const gradeStudentSubmission = async (
  imageBase64: string,
  mimeType: string,
  assignmentTitle: string,
  assignmentContext: string,
  totalMarks: number,
  rubric: string
): Promise<{ 
  extractedText: string; 
  totalScore: number; 
  marksBreakdown: Array<{ criterion: string; awarded: number; possible: number; rationale: string; }>;
  cbcCompetencies: string[];
  remedialAdvice: string;
  identifiedTopic: string;
}> => {
  // We use gemini-1.5-pro or gemini-2.0-flash here for complex handwriting + reasoning
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME, // Assuming this maps to a capable vision model like gemini-2.0-flash
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          extractedText: { type: SchemaType.STRING, description: "The raw text extracted from the student's handwritten or typed submission" },
          totalScore: { type: SchemaType.NUMBER, description: "The final computed score out of the total available marks" },
          marksBreakdown: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                criterion: { type: SchemaType.STRING, description: "What is being marked (e.g. Q1, Methodology, Grammar)" },
                awarded: { type: SchemaType.NUMBER, description: "Marks awarded" },
                possible: { type: SchemaType.NUMBER, description: "Maximum possible marks for this criterion" },
                rationale: { type: SchemaType.STRING, description: "Why the mark was awarded or deducted" }
              },
              required: ["criterion", "awarded", "possible", "rationale"]
            }
          },
          cbcCompetencies: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of CBC Core Competencies demonstrated (e.g., Critical Thinking, Communication)"
          },
          remedialAdvice: { type: SchemaType.STRING, description: "Constructive feedback and specific remedial advice explaining how the student can improve." },
          identifiedTopic: { type: SchemaType.STRING, description: "The core academic topic being tested in this assignment, e.g. 'Fractions', 'Algebra', 'Photosynthesis'." }
        },
        required: ["extractedText", "totalScore", "marksBreakdown", "cbcCompetencies", "remedialAdvice", "identifiedTopic"]
      }
    }
  });

  const prompt = `
    You are a rigorous Kenyan KNEC Examiner and CBC Master Teacher.
    Your task is to grade a student's submission line-by-line, strictly adhering to the provided rubric.
    
    ASSIGNMENT CONTEXT:
    Title: ${assignmentTitle}
    Context: ${assignmentContext}
    Total Available Marks: ${totalMarks}
    
    GRADING RUBRIC / ANSWER KEY:
    ${rubric}
    
    INSTRUCTIONS:
    1. EXTRACT: Read the handwritten/typed text in the provided image with high accuracy.
    2. EVALUATE: Compare the extracted text strictly against the GRADING RUBRIC. Check for correct methodology, logic, and final answers.
    3. BREAKDOWN: Provide a highly detailed, step-by-step 'marksBreakdown' array. Do not just give a single score. Break down exactly where every mark was earned or lost based on the rubric.
    4. GRADE: Calculate the 'totalScore' by summing the awarded marks. Ensure it does not exceed ${totalMarks}.
    5. COMPETENCIES: Identify which Kenyan CBC Core Competencies the student demonstrated.
    6. REMEDIATION: Provide specific, encouraging 'remedialAdvice' for the student on how to improve.
    7. TOPIC EXTRACTION: Identify the core academic topic being tested and return it as 'identifiedTopic'.
    
    Output structured JSON only.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType: mimeType } }
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response from AI auto-grader");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error grading student submission:", error);
    throw error;
  }
};

// --- TEACHER & CANDIDATE PERFECTION FEATURES ---

export const generateSchemeOfWork = async (subject: string, grade: string, term: string, year: string, language: 'EN' | 'SW' = 'EN'): Promise<any> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          term: { type: SchemaType.STRING },
          weeks: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                week: { type: SchemaType.INTEGER },
                lesson: { type: SchemaType.INTEGER },
                strand: { type: SchemaType.STRING },
                subStrand: { type: SchemaType.STRING },
                specificLearningOutcomes: { type: SchemaType.STRING },
                keyInquiryQuestions: { type: SchemaType.STRING },
                coreCompetences: { type: SchemaType.STRING },
                learningExperiences: { type: SchemaType.STRING },
                learningResources: { type: SchemaType.STRING },
                assessmentMethods: { type: SchemaType.STRING }
              },
              required: ["week", "lesson", "strand", "subStrand", "specificLearningOutcomes", "keyInquiryQuestions", "coreCompetences", "learningExperiences", "learningResources", "assessmentMethods"]
            }
          }
        },
        required: ["title", "term", "weeks"]
      }
    }
  });

  const prompt = `
    You are a Kenyan KICD curriculum specialist and a Master Teacher. 
    Generate a full, highly detailed, professional Scheme of Work for:
    Subject: ${subject}
    Grade: ${grade}
    Term: ${term}
    Year: ${year}

    Follow the STRICT official Kenyan Competency-Based Curriculum (CBC) formatting.
    Provide a week-by-week breakdown for a standard 13-week term. Generate multiple lessons per week (e.g. Lesson 1, Lesson 2) depending on the subject.
    
    You MUST include the exact 10 columns required by KICD:
    1. Week Number
    2. Lesson Number
    3. Strand / Topic
    4. Sub-strand / Sub-topic
    5. Specific Learning Outcomes (SLOs)
    6. Key Inquiry Questions (KIQ)
    7. Core Competences & Values (e.g., Communication, Critical Thinking, Patriotism)
    8. Learning Experiences (Specific activities the learners and teacher will do)
    9. Learning Resources (Textbooks, digital tools, realia)
    10. Assessment Methods (Observation, Oral Questions, Rubrics, Portfolios)

    Language: ${language === 'SW' ? 'Swahili (Kiswahili Sanifu)' : 'English (with Kiswahili specific terms if needed)'}.

    Output as structured JSON. DO NOT cut corners. Provide comprehensive educational value.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating scheme of work:", error);
    throw error;
  }
};

export const polishLessonPlan = async (
  rawPlan: string,
  subject: string,
  grade: string,
  studentWeakPoints: string[] = [],
  language: 'EN' | 'SW' = 'EN'
): Promise<any> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          score: { type: SchemaType.INTEGER },
          weaknessMatch: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                topic: { type: SchemaType.STRING },
                impact: { type: SchemaType.STRING },
                recommendation: { type: SchemaType.STRING }
              }
            }
          },
          strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          suggestedResources: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          polishedContent: { type: SchemaType.STRING, description: "The full, refined lesson plan in markdown" }
        },
        required: ["score", "weaknessMatch", "strengths", "suggestedResources", "polishedContent"]
      }
    }
  });

  const context = studentWeakPoints.length > 0
    ? `IMPORTANT: Recent quiz data shows students are struggling with: ${studentWeakPoints.join(', ')}.`
    : '';

  const prompt = `
    You are a Master Pedagogical Coach for Kenyan teachers, specializing in KICD and CBC standards.
    Analyze this raw lesson plan and provide actionable, data-driven refinements.
    
    Subject: ${subject}
    Grade: ${grade}
    Raw Plan: "${rawPlan}"
    ${context}

    INSTRUCTIONS:
    1. Score the raw plan out of 100 based on Kenyan CBC compliance and general pedagogical quality.
    2. Identify "Remedial Matches" - specifically how the teacher can address the stated student weak points within this lesson.
    3. List general strengths of the raw plan.
    4. Suggest resources heavily localized to the Kenyan context (e.g., KICD textbooks, local realia, digital tools).
    5. Generate a 'polishedContent' string. This MUST be the fully rewritten, professional lesson plan formatted in Markdown. 
       - It MUST strictly follow the 5-E Pedagogical Model (Engage, Explore, Explain, Elaborate, Evaluate).
       - It MUST explicitly list the CBC Core Competencies being developed (e.g., Critical Thinking, Citizenship).

    Output as structured JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error polishing lesson plan:", error);
    throw error;
  }
};

export const getExamGuruResponse = async (
  userQuery: string,
  chatHistory: { role: 'user' | 'guru', content: string }[],
  language: 'EN' | 'SW' = 'EN'
): Promise<string> => {
  const history = chatHistory
    .slice(-10)
    .map(m => `${m.role === 'guru' ? 'Guru' : 'Candidate'}: ${m.content}`)
    .join('\n');

  const systemInstruction = {
    parts: [{
      text: `You are the Somo Smart Exam Guru — a seasoned Kenyan examiner who has marked KCSE, KPSEA, and KCPE papers for over 15 years.

YOUR MANDATE: Give candidates answers that SCORE MARKS. Be concrete, specific, exam-aware.

RULES:
1. Answer the actual question asked — subject content, strategy, or timing.
2. For subject answers: use bullet points, each worth [n mk] — e.g. "• Movement of water [1 mk] through semi-permeable membrane [1 mk]".
3. For essay subjects (English, Kiswahili, History, CRE, IRE): give the exact examiner-expected structure with mark distribution.
4. For Maths/Science: show working step by step, state units, label diagrams.
5. Flag mistakes candidates lose marks on as "❌ Paper Trap:".
6. Reference KCSE paper sections (P1 Section A, P2 Section B, etc.) when relevant.
7. NO padding, NO "Great question!", NO vague motivation. Just marks.
8. End with one practical tip as "🎯 Guru Tip:".
9. Respond in ${language === 'SW' ? 'Kiswahili' : 'English'}.`
    }]
  };

  const contents = [
    ...(history ? [{
      role: 'user' as const,
      parts: [{ text: `Previous conversation:\n${history}` }]
    }, {
      role: 'model' as const,
      parts: [{ text: 'Understood. I have the conversation context.' }]
    }] : []),
    {
      role: 'user' as const,
      parts: [{ text: userQuery }]
    }
  ];

  try {
    const result = await callGeminiProxy(
      'gemini-2.0-flash',
      contents,
      { maxOutputTokens: 700, temperature: 0.35 },
      systemInstruction
    );
    return result || "Check your connection and try again.";
  } catch (error: any) {
    console.error("Exam Guru error:", error);
    if (error instanceof RateLimitError) throw error;
    return "The Guru is busy right now. Ask again in a moment.";
  }
};

// --- MARK MY ANSWER ---

export const markCandidateAnswer = async (
  question: string,
  candidateAnswer: string,
  subject: string = '',
  totalMarks: number = 0
): Promise<string> => {
  const marksHint = totalMarks > 0 ? `This question is worth ${totalMarks} marks.` : 'Infer the likely mark allocation from the question.';

  const systemInstruction = {
    parts: [{
      text: `You are a KNEC chief examiner with 20 years of experience marking ${subject || 'Kenyan national exam'} papers.

YOUR JOB: Mark the candidate's answer EXACTLY as KNEC would. Be strict but fair.

FORMAT YOUR RESPONSE AS FOLLOWS:

**SCORE: X / Y marks**

**What You Got Right ✅**
• [point] — [1 mk] (or however many marks it earns)
(list each correct point with marks awarded)

**What You Missed ❌**
• [missing point] — [1 mk lost]
(list each missing point that costs marks)

**Paper Trap ⚠️** (if they made a classic KNEC mistake, call it out)
• [explain the mistake]

**Model Answer (KNEC Standard)**
[Write a clean, full-marks answer showing exactly what earns each mark]

**Guru Verdict 🎯**
[One sentence: what they should focus on to improve]

Be strict. Do not award marks for vague or incomplete points. ${marksHint}`
    }]
  };

  const contents = [{
    role: 'user' as const,
    parts: [{
      text: `Subject: ${subject || 'General'}

QUESTION:
${question}

CANDIDATE'S ANSWER:
${candidateAnswer}`
    }]
  }];

  try {
    const result = await callGeminiProxy(
      'gemini-2.0-flash',
      contents,
      { maxOutputTokens: 900, temperature: 0.2 },
      systemInstruction
    );
    return result || 'Could not mark answer. Please try again.';
  } catch (error: any) {
    console.error('Mark My Answer error:', error);
    if (error instanceof RateLimitError) throw error;
    return 'Marking service is busy. Try again in a moment.';
  }
};


// --- TALKBACK & LANGUAGE TUTOR ---

export interface TalkbackMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface LanguageTutorResponse {
  reply: string;
  correction: string;
  pronunciationTip: string;
  encouragement: string;
  exampleSentence: string;
  storySegment?: string;
  stream?: boolean;
}

export const chatTalkback = async (
  userMessage: string,
  chatHistory: TalkbackMessage[],
  language: 'en' | 'sw' = 'en',
  educationLevel?: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      maxOutputTokens: 1500,
    }
  });

  const history = chatHistory.slice(-10).map(m =>
    `${m.role === 'ai' ? 'Akili' : 'Learner'}: ${m.text}`
  ).join('\n');

  const langLabel = language === 'sw' ? 'Kiswahili' : 'English';

  const levelPersona = !educationLevel || educationLevel === 'SENIOR'
    ? `- You are a confident, focused Form 1-4 tutor. Use clear academic language.
    - Reference KCSE topics and exam technique where relevant.
    - Encourage exam readiness and critical thinking.
    - Ask a follow-up question to test understanding.
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting.`
    : educationLevel === 'JUNIOR'
    ? `- You are a warm, playful, patient tutor for a Grade 1-6 CBC learner.
    - Use VERY simple words, short sentences, and fun local analogies (e.g. matunda, ng'ombe, shamba).
    - Celebrate every question with excitement — "Good question! 🌟"
    - Break things into tiny, bite-sized steps.
    - Use real-life examples from Kenya (market, farm, school).
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting.`
    : `- You are a sophisticated university/college academic advisor.
    - Use formal academic language, cite frameworks, and reference research methodology.
    - Encourage critical analysis, synthesis, and higher-order thinking.
    - Ask a probing analytical follow-up question.
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting.`;

  const prompt = `
    You are "Akili", a Kenyan AI academic buddy built specifically for Kenyan learners. Built for Kenya, by Kenya.
    You speak ${langLabel}. ALWAYS respond in ${langLabel}.
    
    YOUR TEACHING PERSONA:
    ${levelPersona}
    - NEVER use inappropriate, violent, or scary content.
    - When asked an academic question, solve it completely from start to finish.
    
    CONVERSATION HISTORY:
    ${history}
    
    LEARNER SAYS: "${userMessage}"
    
    Respond as Akili. Provide a complete, level-appropriate answer.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || (language === 'sw' ? "Samahani, sijaisikia vizuri. Sema tena? 😊" : "Oops, I didn't catch that! Can you say it again? 😊");
  } catch (error) {
    console.error("Talkback error:", error);
    return language === 'sw' ? "Samahani, kuna tatizo dogo. Hebu jaribu tena baada ya muda kidogo! 🌟" : "Hmm, I had a little hiccup. Let's try again in a moment! 🌟";
  }
};

export const chatTalkbackStream = async (
  userMessage: string,
  chatHistory: TalkbackMessage[],
  language: 'en' | 'sw' = 'en',
  educationLevel?: string
): Promise<ReadableStream<Uint8Array>> => {
  const history = chatHistory.slice(-10).map(m =>
    `${m.role === 'ai' ? 'Akili' : 'Learner'}: ${m.text}`
  ).join('\n');

  const langInstruction = language === 'sw'
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: If the user asks a Kiswahili question or about Swahili grammar, respond in Swahili. Otherwise, respond in English.";

  const levelPersona = !educationLevel || educationLevel === 'SENIOR'
    ? `- You are a confident, focused Form 1-4 tutor. Use clear academic language.
    - Reference KCSE topics and exam technique where relevant.
    - Encourage critical thinking. Ask a follow-up question to test understanding.
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting.`
    : educationLevel === 'JUNIOR'
    ? `- You are a warm, playful, patient tutor for a Grade 1-6 CBC learner.
    - Use VERY simple words, short sentences, and fun local analogies (e.g. matunda, ng'ombe, shamba, soko).
    - Celebrate every question with excitement — "Swali zuri! 🌟" or "Great question! 🌟"
    - Break things into tiny, bite-sized steps a young child can follow.
    - Use real-life Kenyan examples (market, farm, school, home).
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting.`
    : `- You are a sophisticated university/college academic advisor.
    - Use formal academic language, cite frameworks, encourage research methodology.
    - Encourage critical analysis, synthesis, and higher-order thinking.
    - Ask a probing analytical follow-up question.
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting.`;

  const prompt = `
    You are "Akili", a Kenyan AI learning buddy. Built for Kenya, by Kenya.
    ${langInstruction}

    YOUR TEACHING PERSONA:
    ${levelPersona}
    - NEVER use inappropriate, violent, or scary content.
    - When asked an academic question, solve it completely from start to finish.

    CONVERSATION HISTORY:
    ${history}

    LEARNER SAYS: "${userMessage}"

    Respond as Akili. Provide a complete, level-appropriate answer.
  `;

  return callGeminiProxyStream(MODEL_NAME, [{ role: 'user', parts: [{ text: prompt }] }], { maxOutputTokens: 1500 });
};

export const transcribeAudioForChat = async (
  base64Audio: string,
  mimeType: string,
  language: 'en' | 'sw' = 'en'
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      maxOutputTokens: 300,
    }
  });

  const prompt = `
    Listen to this audio recording carefully.
    The speaker is a young learner speaking in ${language === 'sw' ? 'Kiswahili' : 'English'}.
    Transcribe EXACTLY what they said. Keep it as-is including any grammar mistakes.
    Return ONLY the transcription text, nothing else.
  `;

  try {
    console.log("Transcribing audio...", { mimeType, size: base64Audio.length });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Audio, mimeType } }
    ]);
    const text = result.response.text();
    console.log("Transcription result:", text);
    return text || '';
  } catch (error) {
    console.error("Transcription error:", error);
    return '';
  }
};

export const chatLanguageTutor = async (
  userMessage: string,
  chatHistory: TalkbackMessage[],
  language: 'en' | 'sw' = 'en',
  mode: 'conversation' | 'pronunciation' | 'sentences' | 'story' = 'conversation'
): Promise<LanguageTutorResponse> => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 800,
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          reply: { type: SchemaType.STRING, description: "The tutor's direct conversational reply" },
          correction: { type: SchemaType.STRING, description: "Gentle grammar/vocabulary correction of the learner's message. Empty if no correction needed." },
          pronunciationTip: { type: SchemaType.STRING, description: "A pronunciation tip related to a word they used or should learn. Use phonetic spelling." },
          encouragement: { type: SchemaType.STRING, description: "A short encouraging phrase to motivate the learner" },
          exampleSentence: { type: SchemaType.STRING, description: "An example sentence using a word from the conversation for practice" },
          storySegment: { type: SchemaType.STRING, description: "If in story mode, the next segment of an interactive story. Otherwise empty." }
        },
        required: ["reply", "correction", "pronunciationTip", "encouragement", "exampleSentence"]
      }
    }
  });

  const history = chatHistory.slice(-8).map(m =>
    `${m.role === 'ai' ? 'Language Coach' : 'Learner'}: ${m.text}`
  ).join('\n');

  const langName = language === 'sw' ? 'Kiswahili' : 'English';
  const otherLang = language === 'sw' ? 'English' : 'Kiswahili';

  const modeInstructions: Record<string, string> = {
    conversation: `
      MODE: FREE CONVERSATION
      - Have a natural, fun conversation in ${langName}
      - Gently correct grammar and vocabulary mistakes
      - Introduce new vocabulary naturally
      - Ask questions to keep the conversation flowing
    `,
    pronunciation: `
      MODE: PRONUNCIATION PRACTICE
      - Focus on how words are pronounced in ${langName}
      - Break down difficult words into syllables
      - Use phonetic guides (e.g., "Habari" → "ha-BA-ri")
      - Practice tongue twisters and rhymes
      - Compare pronunciation with ${otherLang} equivalents
    `,
    sentences: `
      MODE: SENTENCE CONSTRUCTION
      - Help the learner build proper sentences in ${langName}
      - Show sentence structure patterns (Subject-Verb-Object)
      - For Kiswahili: explain verb conjugation, noun classes, and tenses
      - For English: explain tenses, articles, and prepositions
      - Give fill-in-the-blank style challenges
    `,
    story: `
      MODE: INTERACTIVE STORYTELLING
      - Build an exciting story together in ${langName}!
      - You start or continue a story segment (2-3 sentences)
      - Ask the learner "What happens next?" to keep them engaged
      - Introduce new vocabulary through the story
      - Use vivid, age-appropriate descriptions
      - Include a moral or lesson at the end
      - Put the story continuation in the storySegment field
    `
  };

  const prompt = `
    You are "Mwalimu Somo" (Teacher Somo), an expert, fun, and patient language tutor.
    You are teaching a young learner ${langName}.
    ALWAYS respond primarily in ${langName}, with occasional ${otherLang} translations in parentheses to help understanding.
    
    YOUR TEACHING STYLE:
    - Patient, warm, and encouraging like a favorite teacher
    - Use age-appropriate language (ages 6-16)
    - Make learning feel like a game, not a chore
    - Celebrate every attempt, even incorrect ones
    - Use cultural context (East African culture and daily life)
    - NO MARKDOWN: NEVER use bold (**text**) or italics (*text*) formatting in the reply. Keep text strictly plain.
    
    ${modeInstructions[mode]}
    
    CONVERSATION HISTORY:
    ${history}
    
    LEARNER SAYS: "${userMessage}"
    
    Provide your response as JSON. Be encouraging and make learning fun!
    If the learner's ${langName} is perfect, still provide a pronunciation tip for a NEW word to expand their vocabulary.
    Keep the reply SHORT (2-4 sentences). Keep corrections GENTLE.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as LanguageTutorResponse;
  } catch (error) {
    console.error("Language tutor error:", error);
    return {
      reply: language === 'sw'
        ? "Samahani! Hebu jaribu tena. Unafanya vizuri sana! 🌟"
        : "Oops! Let's try that again. You're doing amazing! 🌟",
      correction: '',
      pronunciationTip: language === 'sw'
        ? '"Jaribu" inasemwa "ja-RI-bu" (try)'
        : '"Amazing" is said "uh-MAY-zing"',
      encouragement: language === 'sw' ? "Endelea hivyo! 💪" : "Keep going! 💪",
      exampleSentence: language === 'sw'
        ? "Mimi ninajaribu kujifunza Kiswahili. (I am trying to learn Kiswahili.)"
        : "I am learning something new every day!"
    };
  }
};

// Backward compatibility for cached files
export const askSoma = askSomo;
