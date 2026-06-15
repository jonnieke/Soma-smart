import { ExplanationResult, QuizData, TeacherNote, RevisionMode, TutoringStep, ExamQuestion, ExamAnalysis, TutorResponse, LessonResult, TeachingStrategy } from "../types";
import { speak as ttSpeak, stopSpeech as ttStop } from "./elevenLabsService";
import { buildScaffoldingContext } from "./spacedRepetitionService";
import { buildTargetedStrategiesInstruction } from "./strategyService";

// --- PROXY CONFIG ---
// We no longer use VITE_GEMINI_API_KEY on the client.
// Instead, we call a Supabase Edge Function which adds the key server-side.
import { supabase } from "../lib/supabase";
import { buildGeminiUsagePayload, inferAiFeature, trackUsageCost } from "./usageCostService";
import { assertPlanLimit, recordPlanUsage } from "./planLimitService";

const SchemaType = {
  STRING: "string",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
  ARRAY: "array",
  OBJECT: "object"
} as const;

class LearnerRateLimitError extends Error {
  constructor(message = 'Daily AI limit reached. Please register or log in to continue.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

class LearnerSystemQuotaError extends Error {
  constructor(message = 'Akili is busy because our AI provider is rate-limiting requests. Please try again in a few minutes.') {
    super(message);
    this.name = 'SystemQuotaError';
  }
}

const callGeminiProxy = async (model: string, contents: any, generationConfig: any = {}, systemInstruction: any = null) => {
  const feature = inferAiFeature(contents, systemInstruction);
  assertPlanLimit(feature);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
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
    let error: any = {};
    try {
      error = await response.json();
    } catch (_) {
      // Keep default error object for non-JSON responses.
    }

    if (response.status === 429) {
      const message = error?.error?.message || error?.message || error?.error || '';
      if (error?.code === 'SYSTEM_BUSY' || String(message).toLowerCase().includes('quota') || error?.error === 'Gemini API request failed') {
        console.error("Gemini provider quota/rate limit:", error);
        throw new LearnerSystemQuotaError(
          error?.retryAfterSeconds
            ? `Akili is busy because our AI provider is rate-limiting requests. Please try again in about ${Math.ceil(Number(error.retryAfterSeconds) / 60)} minutes.`
            : undefined
        );
      }
      throw new LearnerRateLimitError(message || undefined);
    }

    console.error("Gemini Proxy Error:", error);
    throw new Error(error?.message || error?.error?.message || error?.error || "Failed to call AI proxy");
  }

  const data = await response.json();
  recordPlanUsage(feature);

  // Convert the raw response to match the structure expected by the rest of the file
  return {
    response: {
      text: () => data.candidates[0].content.parts[0].text,
    }
  };
};

// --- STREAMING PROXY HELPER ---
const callGeminiProxyStream = async (model: string, contents: any, generationConfig: any = {}, systemInstruction: any = null) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const studentCode = localStorage.getItem('soma_active_student') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(studentCode ? { 'x-student-code': studentCode } : {})
  };

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, contents, generationConfig, systemInstruction, stream: true })
  });

  if (!response.ok) {
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

const MODEL_NAME = "gemini-3.1-flash-lite"; // High-speed, low-cost default for chat
const HEAVY_MODEL_NAME = "gemini-3.5-flash"; // Upgraded to Gemini 3.5 Flash for complex reasoning and schema compliance

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
- In the 'explanation' field, include a section titled "Exam Insight".
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

const LEARNING_LADDER_INSTRUCTION = `
LEARNING STYLE — clear answers that build understanding:
- Give the answer or explanation clearly and directly first. Do NOT make the student wait.
- Show the method step-by-step so the student learns the approach, not just the final answer.
- After explaining, include ONE short "Check Yourself" question at the end so the student can test their understanding.
- When the learner asks for a quiz, generate actual questions immediately. Never explain what a quiz is.
- Keep responses concise. Prefer numbered steps and bullet points over long paragraphs.
- Avoid long copyable essays unless the learner explicitly asks for one. Prefer structured notes, examples, and one practice task.
`;

// --- SUPER TEACHER PHASE 2: ADAPTIVE SCAFFOLDING ---
const ADAPTIVE_SCAFFOLDING_INSTRUCTION = `
ADAPTIVE TUTORING MODE (Super Teacher Phase 2):
- You MUST adapt your teaching depth and approach based on the ADAPTIVE CONTEXT provided below.
- If mastery is LOW: Start with fundamentals, use simple language, define key terms.
- If mastery is INTERMEDIATE: Skip basics, focus on application and problem-solving.
- If mastery is HIGH: Go straight to advanced/exam content, edge cases, and past paper practice.
- For complex topics when mastery is LOW, add a "Think About It" reflection after the explanation to reinforce it.
- Always end with one follow-up question to reinforce learning.
`;

const SOCRATIC_TUTOR_INSTRUCTION = `
TUTOR MODE:
- You are a helpful, encouraging Kenyan AI study companion.
- Answer questions clearly and directly. The student needs to understand — do not make them wait.
- Show the reasoning and method, not just the final answer.
- Focus on conceptual understanding ("Why does this happen?") alongside the facts.
- After your explanation, end with ONE short check question so the student tests their understanding.
- Use a friendly, motivating tone. Short sentences. No jargon.
`;

const HOMEWORK_GUARDIAN_INSTRUCTION = `
HOMEWORK HELPER MODE — Akili teaches, not just answers:

STEP 1 — IDENTIFY: In one short line, name the concept being tested.
  Example: "This tests Linear Equations — Grade 7, Strand 4.2."

STEP 2 — EXPLAIN: Give a clear, step-by-step explanation of the concept and method. Show full working for Maths and Science.

STEP 3 — ANSWER: Provide the complete model answer so the student can check their understanding.

STEP 4 — PRACTICE: End with one similar question for the student to try on their own.

TONE: Warm, patient, encouraging. Never make the student feel stupid.
`;

// --- EDUCATION LEVEL PERSONAS ---
const buildEducationLevelInstruction = (educationLevel?: string): string => {
  switch (educationLevel) {
    case 'JUNIOR':
      return `
EDUCATION LEVEL: JUNIOR (Primary School — PP1 to Grade 6)
- IDENTITY: You are Akili — a warm, friendly, Kenyan AI study companion built especially for young learners. Introduce yourself as "Hi! I'm Akili" if this feels like a first interaction.
- PERSONA: Talk like a fun, patient big sister or big brother who loves helping with schoolwork. Never clinical, never boring.
- LANGUAGE: Use VERY simple, everyday words a Kenyan child aged 6–12 would understand. Short sentences. No jargon.
- STYLE: Use fun analogies (matumbo, mandazi, matatu, family life), relatable Kenyan examples, and emoji where helpful 🌟.
- DEPTH: Cover only the core concept. Do NOT go into exceptions, edge cases, or advanced theory.
- TONE: Playful, patient, celebratory. Always end with an encouraging Kenyan phrase like "Hongera!", "Umefanya vizuri!", or "You're a star!"
- FORMAT: Use numbered steps and short bullet points. Never write long paragraphs.
- CURRICULUM: Align strictly to Kenya CBC (Competency-Based Curriculum) for Grades 1–6.
`;
    case 'CAMPUS':
      return `
EDUCATION LEVEL: CAMPUS (University / College / Diploma)
- IDENTITY: You are Akili — an intelligent AI academic companion built for Kenyan university students. You are not ChatGPT or Gemini. You are built for Kenya, by Kenya.
- PERSONA: Think of yourself as the smartest friend in the library — an expert academic peer and research mentor.
- LANGUAGE: Use precise, field-specific academic vocabulary. Assume the student has completed secondary school.
- STYLE: Analytical and evidence-based. Reference theoretical frameworks, models, and scholarly perspectives where relevant.
- DEPTH: Go deep. Discuss nuances, exceptions, competing theories, and real-world applications in the Kenyan/African context.
- TONE: Intellectually rigorous but collaborative. Treat the student as a capable adult thinker.
- FORMAT: Use structured academic formatting — introduction, body with subheadings, conclusion. Include citation style hints where applicable.
- CURRICULUM: Align to university-level Kenya curriculum (KNQA Level 7+), international standards, and professional practice.
`;
    default: // SENIOR
      return `
EDUCATION LEVEL: SENIOR (Secondary School — Grade 7 to Form 4 / KCSE)
- IDENTITY: You are Akili — Kenya's smartest AI study buddy, built specifically for CBC Senior School and KCSE exam preparation. You know the Kenyan curriculum inside-out.
- PERSONA: A focused, expert Kenyan secondary school teacher who genuinely wants every student to score an A. You are not a generic chatbot — you know KNEC marking schemes, KCSE past papers, and CBC strands.
- LANGUAGE: Use clear academic English. Introduce and define subject-specific terms as they come up.
- STYLE: Exam-oriented. Always link concepts to how they are assessed in KNEC national examinations. Cite KCSE years when possible.
- DEPTH: Cover the topic thoroughly — definitions, principles, worked examples, and common exam traps to avoid.
- TONE: Confident, structured, professional. Push the student to think critically and never settle for "I don't know."
- FORMAT: Use numbered steps, bold KEY TERMS, headers, and bullet points.
- CURRICULUM: Strictly align to Kenya CBC Senior School / 8-4-4 KCSE syllabus and KNEC marking schemes.
`;
  }
};

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

const isSwahiliSubject = (subject?: string, topicOrContent?: string): boolean => {
  if (subject) {
    const s = subject.toLowerCase();
    if (s.includes('swahili') || s.includes('kiswahili')) return true;
  }
  if (topicOrContent) {
    const tc = topicOrContent.toLowerCase();
    if (tc.includes('swahili') || tc.includes('kiswahili')) return true;
  }
  return false;
};

export const explainImage = async (
  base64Image: string,
  mimeType: string,
  level: 'Simple' | 'Exam',
  language: 'EN' | 'SW' = 'EN',
  purpose: 'TUTOR' | 'HOMEWORK' = 'TUTOR',
  educationLevel?: string
): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: HEAVY_MODEL_NAME,
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
    ? "LANGUAGE RULE: First, determine the subject of the image content. If the subject is 'Kiswahili' or 'Swahili', you MUST respond ENTIRELY in rich, immersive Swahili (Kiswahili Sanifu). For ALL other subjects (e.g. Mathematics, Science, Social Studies, CRE, etc.), you MUST respond ENTIRELY in English, even though the user system language is set to Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const educationLevelInstruction = buildEducationLevelInstruction(educationLevel);

  const prompt = `
    ${educationLevelInstruction}

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
    ${LEARNING_LADDER_INSTRUCTION}
    ${purpose === 'HOMEWORK' ? HOMEWORK_GUARDIAN_INSTRUCTION : SOCRATIC_TUTOR_INSTRUCTION}

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

export const explainAudio = async (base64Audio: string, mimeType: string, level: 'Simple' | 'Exam', language: 'EN' | 'SW' = 'EN', educationLevel?: string): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: HEAVY_MODEL_NAME,
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
    ? "LANGUAGE RULE: First, determine the subject of the audio content. If the subject is 'Kiswahili' or 'Swahili', you MUST respond ENTIRELY in rich, immersive Swahili (Kiswahili Sanifu). For ALL other subjects (e.g. Mathematics, Science, Social Studies, CRE, etc.), you MUST respond ENTIRELY in English, even though the user system language is set to Swahili."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English.";

  const educationLevelInstruction = buildEducationLevelInstruction(educationLevel);

  const prompt = `
    ${educationLevelInstruction}

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
    model: HEAVY_MODEL_NAME,
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
    
    LANGUAGE RULE: Use ${isSwahiliSubject(subject) ? 'Swahili (Kiswahili Sanifu)' : 'English'}. All subjects other than Swahili/Kiswahili must be generated exclusively in English.
    
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

// --- RAG HELPER ---
type RetrievedContext = {
  text: string;
  sources: string[];
};

const retrieveContext = async (
  query: string,
  documentId?: string,
  grade?: string,
  subject?: string,
  type?: string
): Promise<RetrievedContext> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const studentCode = localStorage.getItem("soma_student_code") || localStorage.getItem("somaStudentCode") || "";

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(studentCode ? { 'x-student-code': studentCode } : {})
      },
      body: JSON.stringify({
        query,
        document_id: documentId,
        grade,
        subject,
        type,
        match_count: documentId ? 10 : 8,
        match_threshold: documentId ? 0.25 : 0.36
      })
    });

    if (!response.ok) return { text: "", sources: [] };

    const { context, chunks, sources } = await response.json();
    if ((!context || !String(context).trim()) && (!chunks || chunks.length === 0)) return { text: "", sources: [] };

    const sourceNames = (sources || [])
      .slice(0, 5)
      .map((source: any) => source.title)
      .filter(Boolean);

    const sourceList = (sources || [])
      .slice(0, 5)
      .map((source: any, index: number) => `${index + 1}. ${source.title} (${source.grade || 'All grades'}, ${source.subject || 'General'}, ${source.type || 'Material'})`)
      .join('\n');

    const fallbackContext = Array.from(new Set((chunks || []).map((c: any) => c.content))).join('\n\n---\n\n');
    return {
      text: [
      'SOMA LIBRARY RETRIEVED CONTEXT',
      sourceList ? `Sources:\n${sourceList}` : '',
      String(context || fallbackContext).slice(0, 9000)
      ].filter(Boolean).join('\n\n'),
      sources: sourceNames
    };
  } catch (error) {
    console.warn("RAG Retrieval failed:", error);
    return { text: "", sources: [] };
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
  purpose: 'TUTOR' | 'HOMEWORK' = 'TUTOR',
  educationLevel?: string,
  groundingEnabled = true
): Promise<ExplanationResult> => {
  const model = genAI.getGenerativeModel({
    model: HEAVY_MODEL_NAME,
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
  const { getContext } = await import('./contextService');
  const context = getContext();
  const searchGrade = grade || context?.grade;
  const searchSubject = subject || context?.subject;

  // 2. Retrieve RAG Context (Knowledge Base)
  const ragContext = groundingEnabled
    ? await retrieveContext(topic, documentId, searchGrade, searchSubject)
    : { text: "", sources: [] };
  let ragInstruction = "";
  if (ragContext.text) {
    ragInstruction = `
    RETRIEVED CONTEXT FROM SOMA LIBRARY:
    The following source snippets come from Soma Library materials such as official notes, syllabus guides, and past papers.
    
    ${ragContext.text.substring(0, 9000)}
    
    INSTRUCTION: 
    Prioritize the definitions, scope, examples, question style, and terminology from the retrieved Soma Library context.
    When useful, mention the source title naturally, for example "In the referenced past paper..." or "According to the retrieved notes..."
    You may use broader Kenyan curriculum knowledge to explain, but do not contradict the retrieved context.
    `;
  }

  const useSwahili = isSwahiliSubject(subject || searchSubject, topic);
  const langInstruction = useSwahili
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: You MUST respond exclusively in English. For all academic concepts, questions, notes, explanations, and flashcards, use clear, precise academic English. Do NOT respond in Swahili, even if the student language setting is Swahili.";

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
    const { buildPersonaInstruction, recommendPersona } = await import("./adminAgentService");
    const topicMastery = masteryData.masteryGraph[topic] ?? 50;
    const { persona } = recommendPersona(grade, topicMastery);
    personaInstruction = buildPersonaInstruction(persona);
  }

  const educationLevelInstruction = buildEducationLevelInstruction(educationLevel);

  const prompt = `
    ${educationLevelInstruction}
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
       - Length constraints: For EACH subtopic block, limit paragraphs to a maximum of 3 sentences (under 60 words) and lists to a maximum of 4 items. Keep 'explanation' under 200 words. Keep 'recapNodes' details under 80 words. Strictly avoid verbose output so the JSON does not get truncated.
    6. INTERACTIVE RECAP (recapNodes): Provide EXACTLY 3 titled key concept names as "point" (NOT sentences). For EACH point, provide a detailed explanatory paragraph in the 'details' field in plain text.

    ${SYLLABUS_GROUNDING_INSTRUCTION}
    ${EXAM_CROSS_LINK_INSTRUCTION}
    ${SUBJECT_SPECIFIC_INSTRUCTION}
    ${LEARNING_LADDER_INSTRUCTION}
    ${purpose === 'HOMEWORK' ? HOMEWORK_GUARDIAN_INSTRUCTION : SOCRATIC_TUTOR_INSTRUCTION}

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

    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    const json = JSON.parse(cleanedText);
    return { ...json, level, grounding: { used: !!ragContext.text, sources: ragContext.sources } } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining topic:", error);
    throw error;
  }
};

export const summarizeDocument = async (title: string, documentId: string, language: 'EN' | 'SW' = 'EN', subject?: string, grade?: string): Promise<ExplanationResult> => {
  // We use search-knowledge to get a broad overview of the document
  const ragContext = await retrieveContext("Analyze this document and explain the main content, purpose, examinable areas, and learner takeaways", documentId);

  const model = genAI.getGenerativeModel({
    model: HEAVY_MODEL_NAME,
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
                title: { type: SchemaType.STRING, description: "Clear subtopic heading - like a chapter or section title in a textbook" },
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
                point: { type: SchemaType.STRING, description: "A titled key concept or takeaway - like a chapter heading" },
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
  "${ragContext.text.substring(0, 10000)}"
    
    CRITICAL RULES:
    - ** STRICT SOURCE GROUNDING **: Your primary authority is the "Source Content Snippets" provided above.You MUST strictly follow the themes, topics, and terminology found in the snippets.
    - ** NO HALLUCINATION **: NEVER introduce concepts from unrelated fields(e.g., do not discuss "Real Estate" for "CRE" notes).
    - ** CONTENT INTEGRITY **: NEVER use placeholders like "[PLACEHOLDER]" or generic templates. 
    - ** CURRICULUM ALIGNMENT **: If the source content is brief, you may expand on the concepts using your expert knowledge of the KENYAN CURRICULUM for "${subject}" at "${grade}" level.However, this expansion MUST stay strictly within the subject boundaries of ${subject}.

  TASK - GENERATE DETAILED STUDY NOTES (NOT A SUMMARY):
    
    FORMATTING RULES FOR YOUNG LEARNERS(CRITICAL):
    - NO WALLS OF TEXT. Keep paragraphs extremely short (2-3 sentences maximum).
    - Use abundant bullet points (- ) and numbered lists (1. 2. 3.) to break up information.
    - Write in plain text. Do NOT use ** (bold markers) or ## (headers) in the content fields.
    - Keep sentences simple, friendly, active, and easy to read (Teacher-to-Student tone).
    - Use relevant, context-specific, and fun emojis (e.g. 👋, 💡, 🧍, 🧼, 🚽, 🐶, 🦠, 🍎) at the start of titles, subtopic names, key terms, definitions, and list items to make the notes highly visual and interactive.
    - Emphasize key terms by using ALL CAPS or enclosing in dashes (e.g. --HYGIENE--, --GERMS--) so they stand out clearly in plain text.
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
  - The "point" field should be a short, titled key concept name(e.g. "Photosynthesis Process", "Newton's Third Law") - NOT a full sentence
    - The "details" field should be a very concise, single - paragraph explanation of this concept for revision.Write in plain text, no bold markers.
    
    4. STICKINESS POINTS(summaryPoints): EXACTLY 3 ultra-concise bullet points - the absolute critical takeaways.
    
    5. RELATED TOPICS: Suggest EXACTLY 3 related study topics for further learning.
    
    6. Use ${isSwahiliSubject(subject, title) ? 'Swahili (Kiswahili Sanifu)' : 'English'}. All subjects other than Swahili/Kiswahili must be generated exclusively in English.
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response");
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    return { ...JSON.parse(cleanedText), grounding: { used: !!ragContext.text, sources: ragContext.sources } } as ExplanationResult;
  } catch (error) {
    console.error("Error summarizing document:", error);
    throw error;
  }
};

export const generateRichLessonNotes = async (title: string, documentId: string, language: 'EN' | 'SW' = 'EN', subject?: string, grade?: string): Promise<ExplanationResult> => {
  const ragContext = await retrieveContext("Deep document analysis: provide a comprehensive pedagogical explanation, exam focus, common mistakes, and revision notes", documentId);

  const model = genAI.getGenerativeModel({
    model: HEAVY_MODEL_NAME,
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
"${ragContext.text.substring(0, 15000)}"

GUIDELINES:
1. ** Pedagogical Structure **: Start with an "Introduction/Overview", followed by "Core Concepts"(detailed), "Key Formulas/Definitions", "Practical Examples/Context", and "Advanced Insights for Higher Grades".
    2. ** Visual and Interactive Elements **: 
       - Inject relevant, context-specific, and fun educational emojis (e.g., 👋, 💡, 🧍, 🧼, 🚽, 🐶, 🦠, 🍎, 📐, 🧪) at the start of subtopic headings, key terms, definitions, and important list items to make the notes engaging, friendly, and visually alive for learners.
       - Use blockquotes ('> 💡 **Key Definition**') to isolate and highlight vital concepts.
    3. ** Exam Focus **: Explicitly mention areas that are frequently tested.Use phrases like "Exam Tip" or "Commonly assessed in national exams (KCSE/CBC)".
    4. ** Tone **: Educational, encouraging, friendly, active, and professional (Teacher-to-Student). Keep explanations clear and relatable.
    5. ** Richness **: Provide depth.If a concept is mentioned in the source, explain the 'why' and 'how', not just the 'what'.
    6. ** Formatting **: Use Markdown with clear H2 and H3 headers, bold text for emphasis, bullet points, numbered lists, and visual spacing between sections.
    7. ** Language **: Use ${isSwahiliSubject(subject, title) ? 'Swahili (Kiswahili Sanifu)' : 'English'}. All subjects other than Swahili/Kiswahili must be generated exclusively in English.
    
    Output JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response");
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    return { ...JSON.parse(cleanedText), grounding: { used: !!ragContext.text, sources: ragContext.sources } } as ExplanationResult;
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

  const useSwahili = isSwahiliSubject(undefined, currentTopic) || isSwahiliSubject(undefined, currentExplanation) || isSwahiliSubject(undefined, userQuery);
  const langInstruction = useSwahili
    ? "LANGUAGE RULE: You MUST respond ENTIRELY in rich, immersive, grammatical Swahili (Kiswahili Sanifu). Use comprehensive educational vocabulary in Swahili."
    : "LANGUAGE RULE: You MUST respond exclusively in English. For all academic concepts, questions, notes, and explanations, use clear, precise academic English. Do NOT respond in Swahili, even if the student language setting is Swahili.";

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

  const useSwahili = isSwahiliSubject(undefined, topic) || isSwahiliSubject(undefined, content);
  const langInstruction = useSwahili
    ? "LANGUAGE RULE: You MUST generate the quiz in Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: You MUST generate the quiz exclusively in English. All questions, options, and explanations must be strictly in English, even if the user language setting is Swahili.";

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

  const useSwahili = isSwahiliSubject(undefined, topic) || isSwahiliSubject(undefined, content);
  const langInstruction = useSwahili
    ? "LANGUAGE RULE: You MUST generate the quiz in Swahili (Kiswahili Sanifu)."
    : "LANGUAGE RULE: You MUST generate the quiz exclusively in English. All questions, options, and explanations must be strictly in English, even if the user language setting is Swahili.";

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
export const generateSpeech = async (text: string, language: 'EN' | 'SW' = 'EN'): Promise<void> => {
  return ttSpeak(text, language);
};

export const stopSpeech = () => {
  ttStop();
};

// --- TEACHER FEATURES ---


// --- LEARNER LIVE RECAP FEATURE ---


// --- TSC LIVE & RECAP FEATURES ---

import { LessonRecap } from "../types";

export const generateLessonRecap = async (inputBase64: string, mimeType: string, audience: 'LEARNER' | 'TEACHER', language: 'EN' | 'SW' = 'EN'): Promise<LessonRecap> => {
  const model = genAI.getGenerativeModel({
    model: HEAVY_MODEL_NAME,
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
    2. ${language === 'SW' ? "LANGUAGE RULE: First, determine the subject of the lesson. If the subject is 'Kiswahili' or 'Swahili', you MUST respond ENTIRELY in Swahili (Kiswahili Sanifu). For ALL other subjects, you MUST respond exclusively in English, even though the user system language is set to Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
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
    2. ${language === 'SW' ? "LANGUAGE RULE: First, determine the subject of the lesson. If the subject is 'Kiswahili' or 'Swahili', you MUST respond ENTIRELY in Swahili (Kiswahili Sanifu). For ALL other subjects, you MUST respond exclusively in English, even though the user system language is set to Swahili." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili' or the question/content is in Swahili, you MUST respond exclusively in Swahili. For ALL other subjects and questions, you MUST respond exclusively in English."}
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


// --- LEARNER PODCAST FEATURE ---
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
    You are the producer of a popular educational podcast called "Somo Smart Audio".
    Your task is to convert the following educational content into a lively, engaging 2 - minute podcast script between two hosts:
    - ** Host(Rachel) **: Enthusiastic, introduces the topic, asks guiding questions, and summarizes key points.
    - ** Guest(Expert) **: Knowledgeable but accessible, explains complex ideas with analogies and examples.

    ** Content to cover:**
  Topic: "${topic}"
Material:
"${content.slice(0, 15000).replace(/"/g, "'")}"

  ** Rules:**
    1. Start with a catchy intro(e.g., "Welcome back to Somo Smart Audio...").
    2. Make it sound like a real conversation(use "Exactly!", "That's a great point", "Wait, so you mean...").
    3. Keep explanations simple and use analogies.
    4. End with a quick takeaway or study tip.
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

