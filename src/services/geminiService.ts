import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ExplanationResult, QuizData, TeacherNote, RevisionMode, TutoringStep, ExamQuestion, ExamAnalysis, TutorResponse, LessonResult } from "../types";
import { speak as ttSpeak, stopSpeech as ttStop } from "./elevenLabsService";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY_FOR_DEV');

if (!apiKey) {
  console.warn("Using DUMMY_KEY_FOR_DEV. Results will fail. Please check .env and Vite config.");
}

const MODEL_NAME = "gemini-2.0-flash"; // Upgraded to latest available version

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

export const explainImage = async (base64Image: string, mimeType: string, level: 'Simple' | 'Exam', language: 'EN' | 'FR' = 'EN'): Promise<ExplanationResult> => {
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST respond in French (Français). Translate specific educational terms if needed, but keep the explanation natural in French."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const prompt = `
    Analyze this image. It is likely a textbook page, homework, or notes.
    1. Extract the main topic and identify the subject.
    2. ${langInstruction}
    3. **DIRECT ANSWER**: If this is a question, answer it DIRECTLY and IMMEDIATELY. Do NOT ask follow-up questions. Do NOT answer with a question.
    4. **FORMAT**: Use neat bullet points for steps, lists, or distinct ideas. Keep paragraphs short.
    5. Explain the content in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    6. Suggest 3 short related topics for further learning.
    
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

export const explainAudio = async (base64Audio: string, mimeType: string, level: 'Simple' | 'Exam', language: 'EN' | 'FR' = 'EN'): Promise<ExplanationResult> => {
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST respond in French (Français). Translate specific educational terms if needed, but keep the explanation natural in French."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const prompt = `
    Listen to this audio. It is likely a student asking a homework question or reading study material.
    1. Transcribe the audio to text.
    2. Extract the main topic and identify the subject.
    3. ${langInstruction}
    4. **DIRECT ANSWER**: Answer the question DIRECTLY. Do NOT ask follow-up questions to the student.
    5. **FORMAT**: Use neat bullet points for the explanation/answer.
    6. Explain the content in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    7. Suggest 3 short related topics for further learning.
    
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

import { supabase } from '../lib/supabase';
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
  language: 'EN' | 'FR' = 'EN',
  documentId?: string,
  subject?: string,
  grade?: string,
  multimedia?: { data: string, mimeType: string }
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST respond in French (Français). Translate specific educational terms if needed, but keep the explanation natural in French."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const prompt = `
    ${ragInstruction}

    SYSTEM CONTEXT: Kenyan Education System (CBC, KCPE, KCSE).
    Target Audience: ${grade || 'Kenyan'} student.
    Subject: ${subject || 'General Studies'}.
    ACRONYM RULES: 
    - CRE = Christian Religious Education (CRITICAL: NEVER interpret as Commercial Real Estate).
    - IRE = Islamic Religious Education.
    - HRE = Hindu Religious Education.

    STRICT TASK:
    1. Identify the subject of the topic "${topic}".
    2. ${langInstruction}
    3. If an image or audio recording is provided, analyze it (transcribe audio if present) and answer the student's question in the context of the source document snippets provided.
    4. Explain the topic in ${level === 'Simple' ? 'very simple language for a young student' : 'academic language suitable for exams'}.
    5. **FORMAT**: Structure the explanation using Markdown. Use **bold text** frequently for key terms and concepts. Avoid long-form text.
    6. Provide 3-5 short bullet points summarizing the most critical takeaways for "stickiness".
    7. Suggest 3 short related topics for further learning.
    8. **ENGAGEMENT**: Briefly mention that a practice quiz is available to help the student test their knowledge.
    
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

export const summarizeDocument = async (title: string, documentId: string, language: 'EN' | 'FR' = 'EN', subject?: string, grade?: string): Promise<ExplanationResult> => {
  // We use search-knowledge to get a broad overview of the document
  const ragContext = await retrieveContext("Explain the main content and purpose of this document", documentId);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING, description: "Markdown formatted study guide" },
          summaryPoints: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          relatedTopics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
      }
    }
  });

  const prompt = `
    You are an Expert Kenyan Teacher and AI Study Companion.
    A student in ${grade || 'their grade'} is studying the document: "${title}" for the subject: "${subject || 'General Studies'}".
    
    SYSTEM CONTEXT: You are operating within the Kenyan Education System (CBC, KCPE, and KCSE). 
    ACRONYM RULES: 
    - CRE = Christian Religious Education (NOT Commercial Real Estate).
    - IRE = Islamic Religious Education.
    - HRE = Hindu Religious Education.
    - P.E. = Physical Education.
    
    Source Content Snippets:
    "${ragContext.substring(0, 10000)}"
    
    TASK:
    1. Create a "Study Guide" summary for this document.
    2. **STRICT SOURCE GROUNDING**: Your primary authority is the "Source Content Snippets" provided above. You MUST strictly follow the themes, topics, and terminology found in the snippets.
    3. **NO HALLUCINATION**: NEVER introduce concepts from unrelated fields (e.g., do not discuss "Real Estate" for "CRE" notes).
    4. **CONTENT INTEGRITY**: NEVER use placeholders like "[PLACEHOLDER]" or generic templates. 
    5. **CURRICULUM ALIGNMENT**: If the source content is brief, you may expand on the concepts using your expert knowledge of the KENYAN CURRICULUM for "${subject}" at "${grade}" level. However, this expansion MUST stay strictly within the subject boundaries of ${subject}.
    6. **FORMAT**: Use a summarized bullet style that is easy to read. Structure it with "Study Notes" and "Official Guide" using clear headers and bullet points.
    7. Include a "The Big Idea" section and "Key Learnings" (in bullets).
    8. Use ${language === 'FR' ? 'French' : 'English'}.
    9. Provide 3-5 summary points optimized for better retention (stickiness).
    10. Suggest 3 related study topics.
    11. **STIMULATE**: Mention that the student should take the practice quiz after reading to help the information stick.
    
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

export const generateRichLessonNotes = async (title: string, documentId: string, language: 'EN' | 'FR' = 'EN', subject?: string, grade?: string): Promise<ExplanationResult> => {
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

    SYSTEM CONTEXT: You are operating within the Kenyan Education System (CBC, KCPE, and KCSE). 
    ACRONYM RULES: 
    - CRE = Christian Religious Education (CRITICAL: NEVER interpret as Commercial Real Estate).
    - IRE = Islamic Religious Education.
    - HRE = Hindu Religious Education.
    
    CRITICAL INSTRUCTION: DO NOT OVERSUMMARIZE. The student needs rich, detailed, and reliable material to study from and prepare for national exams.
    
    **STRICT SOURCE GROUNDING RULE**: 
    - The "Source Content Snippets" are your absolute authority. 
    - You MUST adhere to the domain of "${subject}" as defined in the Kenyan Curriculum.
    - NEVER use "[PLACEHOLDER]" or template text. 
    - Every section must contain substantive, factual information grounded in the source. 
    - **CURRICULUM EXPANSION**: If a section (like Examples or Definitions) is requested but not explicitly in the source, use your expert knowledge of the KENYAN CURRICULUM for "${subject}" at "${grade}" level. This expansion MUST be 100% relevant to the subject and grade.
    
    Source Content Snippets:
    "${ragContext.substring(0, 15000)}"
    
    GUIDELINES:
    1. **Pedagogical Structure**: Start with an "Introduction/Overview", followed by "Core Concepts" (detailed), "Key Formulas/Definitions", "Practical Examples/Context", and "Advanced Insights for Higher Grades".
    2. **Exam Focus**: Explicitly mention areas that are frequently tested. Use phrases like "Exam Tip" or "Commonly assessed in national exams (KCSE/CBC)".
    3. **Tone**: Educational, encouraging, and professional (Teacher-to-Student).
    4. **Richness**: Provide depth. If a concept is mentioned in the source, explain the 'why' and 'how', not just the 'what'.
    5. **Formatting**: Use Markdown with clear H2 and H3 headers, bold text for emphasis, and organized lists.
    6. **Language**: Use ${language === 'FR' ? 'French' : 'English'}.
    
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
  language: 'EN' | 'FR' = 'EN'
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST respond in French (Français)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const prompt = `
    CONTEXT: The student is learning about "${currentTopic}".
    CURRENT EXPLANATION: "${currentExplanation.substring(0, 1000)}..."
    
    USER FOLLOW-UP: "${userQuery}"
    
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

export const generateQuiz = async (content: string, topic: string, language: 'EN' | 'FR' = 'EN'): Promise<QuizData> => {
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST generate the quiz in French (Français)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST generate the quiz in Swahili. For ALL other subjects, generate the quiz ONLY in English.";

  const prompt = `
    Based on the following content about "${topic}":
    "${content.substring(0, 5000)}" 
    
    1. Identify the subject. 
    2. ${langInstruction}
    3. Generate a quiz with:
       - Exactly 3 Multiple Choice Questions (MCQ)
    
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

export const generateQuickQuiz = async (content: string, topic: string, language: 'EN' | 'FR' = 'EN'): Promise<QuizData> => {
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST generate the quiz in French (Français)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST generate the quiz in Swahili. For ALL other subjects, generate the quiz ONLY in English.";

  const prompt = `
    Based on the explanation of "${topic}", generate a quick "Sticky Quiz" to test immediate retention.
    
    ${langInstruction}
    Generate exactly 3 simple Multiple Choice Questions (MCQ).
    
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

export const convertNotes = async (base64Data: string, mimeType: string, subject?: string, className?: string, language: 'EN' | 'FR' = 'EN'): Promise<TeacherNote> => {
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST respond in French (Français)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const prompt = `
    Analyze this document. 
    1. CONTEXT: The teacher has indicated this is for ${subject || 'a school subject'} and the students are in ${className || 'a Kenyan classroom'}.
    2. ${langInstruction}
    3. Create structured lesson notes (headings, key concepts, examples) targeted at the appropriate academic level for ${className || 'this grade'}.
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

export const processVoiceNote = async (audioBase64: string, mimeType: string = "audio/mp3", subject?: string, className?: string, language: 'EN' | 'FR' = 'EN'): Promise<TeacherNote> => {
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST respond in French (Français)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const prompt = `
        You are an expert Study Companion (like NotebookLM) for a Kenyan classroom.
        
        TASK 1: LISTEN & VERIFY
        - Listen to the audio.
        - If the audio is silent, just background noise, or unintelligible:
          - Set topic to "Unclear Audio".
          - Set simplifiedNotes to "I couldn't hear any clear speech. Please try recording again closer to the microphone."
          - Set structuredNotes to "Audio was unclear."
          - STOP there.
        
        TASK 2: TRANSCRIBE & SIMPLIFY (Only if speech is clear)
        - Transcribe the teacher's lesson.
        - CONTEXT: This lesson is about ${subject || 'a specific subject'} for students in ${className || 'a Kenyan classroom'}.
        - ${langInstruction}
        - Create a "NotebookLM Style" Study Guide targeted at ${className || 'the students level'}:
          1. **Topic**: A fun, catchy title.
          2. **The Big Idea**: One simple sentence explaining what this is about.
          3. **Key Points**: 3-4 bullet points using simple words.
          4. **Fun Fact / Example**: A relatable example.
        
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
      // Try to clean potential markdown fences ```json\n?|```/g
      const cleanedText = text.replace(/```json\n?|```/g, '').trim();
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

export const generateTeacherQuiz = async (topic: string, language: 'EN' | 'FR' = 'EN'): Promise<QuizData> => {
  return generateQuiz("", topic, language);
}

export const generateAdvancedTeacherQuiz = async (
  images: string[],
  topic: string,
  grade: string,
  count: number,
  type: 'MCQ' | 'OPEN',
  language: 'EN' | 'FR' = 'EN'
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

  const imageParts = images.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img }
  }));

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: You MUST generate the quiz in French (Français)."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST generate the quiz in Swahili. For ALL other subjects, generate the quiz ONLY in English.";

  const prompt = `
    You are an expert Kenyan Competency-Based Curriculum (CBC) Developer.
    
    Task: Create a professional ${grade} Exam Quiz about "${topic}".
    
    Source Material: Use the attached images as context.
    
    Requirements:
    1. Subject identification: Identify the subject from the topic or content.
    2. ${langInstruction}
    3. Generate EXACTLY ${count} questions.
    4. Format: ${type === 'MCQ' ? 'Multiple Choice Questions (4 options)' : 'Short Answer / Structured Questions (No options)'}.
    5. Standard: Align with Kenyan CBC standards (Scenario-based, Critical Thinking, Application).
    6. Language: Academic and age-appropriate for ${grade}.
    
    Output JSON structure:
    {
      "topic": "${topic}",
      "questions": [
        {
          "id": 1,
          "type": "${type === 'MCQ' ? 'MCQ' : 'SHORT'}",
          "question": "Question text here...",
          "options": ["A", "B", "C", "D"] (Only if MCQ),
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

// --- ASK SOMA CHATBOT ---
// --- ASK SOMO CHATBOT ---

export const askSomo = async (userQuery: string, chatHistory: { role: 'user' | 'model', text: string }[], language: 'EN' | 'FR' = 'EN'): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Construct prompt with history manually
  const systemInstruction = `You are Somo, a super friendly, caring, and easy-going AI Learning Buddy for children! 🌟 

YOUR PERSONALITY:
- Be extremely encouraging and kind. Use phrases like "Great question!", "I'm so happy to help you!", and "Let's learn together!"
- Use very simple words that a young learner can understand easily.
- Use lots of fun emojis to keep things exciting! 🚀📚✨

NAVIGATION & HELP:
1. **Logging In**: If someone wants to log in, tell them: "Look at the very top of the page and click the big 'Student Login' button! 👆"
2. **Registering**: If they are new, tell them: "Click 'Student Login' first, then look for the blue link at the bottom that says 'New Student? Create Profile'. It's easy! 😊"
3. **Homework & Math**: If a learner asks a factual or math question (like "what is 4x4"), ALWAYS give the correct answer clearly first. Then add: "To use my Magic Scanner and see a full explanation with fun helpers, make sure to login or create your profile! 📸"

USE THESE EXACT LINKS:
- Sign In/Dashboard: [Student Login](/learner)
- See how Somo works: [How it Works](#how-it-works)
- For Parents: [Parent Dashboard](/parent)
- For Teachers: [Teacher Dashboard](/teacher)
- For Exam Candidates: [Candidate Success Center](/revision)

${language === 'FR' ? "LANGUAGE RULE: You MUST respond ONLY in French (Français). If the user asks in English, still respond in French." : ""}
Keep answers short (1-3 sentences), warm, and very clear. Always be helpful! ❤️`;

  const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Somo'}: ${msg.text}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\n${historyText}\nUser: ${userQuery}\nSomo:`;

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
    Analyze this uploaded document, which is a past national examination paper (KCSE, KPSEA, or KEPSEA).
    
    1. Identify the Subject (e.g., Mathematics, English, Kiswahili).
    2. Identify the Grade Level (e.g., Form 4, Grade 9, Grade 6).
    3. Extract EVERY question from the paper.
    4. For each question:
       - Extract the question number (e.g., 1, 2a, 3).
       - Extract the full text of the question.
       - Identify the specific Topic and Sub-strand it belongs to (based on Kenyan CBC/844 curriculum).
       - Identify the Competency being tested (e.g., Critical Thinking, Problem Solving, Literacy, Numeracy).
       - Extract the Marks assigned to it (0 if not specified).
    
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
    3. For each question, identify the Topic, Sub-Strand (CBC), and Competency being tested.
    
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

export const getRevisionTutorResponse = async (
  question: ExamQuestion,
  currentStep: TutoringStep,
  history: { role: 'user' | 'model', text: string }[],
  mode: RevisionMode,
  language: 'EN' | 'FR' = 'EN'
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

  const langInstruction = language === 'FR'
    ? "LANGUAGE RULE: Respond in French (Français). Translate educational concepts where appropriate."
    : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English.";

  const systemInstruction = `
    You are Somo Smart Candidate Specialist, an expert international-level exam strategist for Kenyan Candidates (KCSE, KPSEA, KEPSEA).
    Tone: Highly Strategic, Professional, Evidence-Based, and Results-Oriented.
    
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
      - Provide a DIRECT, single-sentence summary of what this question is testing.
      - "This question tests your ability to..."
      - DO NOT explain the concept in detail yet.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'B_THINKING':
      - Provide a DIRECT strategy to solve this. 
      - "To solve this, first identify... then calculate/compare..."
      - Warn briefly about the #1 common pitfall.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'C_SOLUTION':
      - Provide the DIRECT step-by-step solution immediately.
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
  const chatContext = history.map(h => `${h.role}: ${h.text}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\nChat History:\n${chatContext}\n\nAssistant:`;

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

export const getPaperGuidance = async (analysis: ExamAnalysis, query?: string, language: 'EN' | 'FR' = 'EN'): Promise<string> => {
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
        1. **Paper Structure**: Briefly describe what this paper covers.
        2. **Difficulty Hotspots**: Which questions appear most challenging based on the competencies?
        3. **Strategic Tips**: How should a student allocate their time? (e.g. "Focus on Section B first...")
        4. **Key Competencies**: What should the student master most to excel in this specific paper?
        
        Keep it concise, professional, and highly strategic. Use Markdown formatting.
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
    
    ${language === 'FR' ? "LANGUAGE RULE: You MUST respond in French (Français)." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English."}
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

// --- TSC LIVE & RECAP FEATURES ---

import { LessonRecap } from "../types";

export const generateLessonRecap = async (inputBase64: string, mimeType: string, audience: 'LEARNER' | 'TEACHER', language: 'EN' | 'FR' = 'EN'): Promise<LessonRecap> => {
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
    1. Analyze the recording/notes and identify the subject.
    2. ${language === 'FR' ? "LANGUAGE RULE: You MUST respond in French (Français)." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English."}
    3. Extract the Main Topic.
    4. Write a fun, simple Summary (2-3 sentences).
    5. List 5 Key Points (Bullet points).
    6. Highlight 3 "Exam Tips" - things they must remember for tests.
    7. Define 3 key terms used.
    
    Output JSON.
  `;

  const teacherPrompt = `
    You are a curriculum expert summarizing a lesson for a fellow teacher.
    1. Analyze the recording/notes and identify the subject.
    2. ${language === 'FR' ? "LANGUAGE RULE: You MUST respond in French (Français)." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English."}
    3. Extract Topic and Competencies covered.
    4. Provide a professional Summary.
    5. List Key Teaching Points.
    6. Suggest 3 Follow-up assessment ideas.
    
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

export const generateDarasaLesson = async (audioBase64: string, mimeType: string = "audio/mp3", language: 'EN' | 'FR' = 'EN'): Promise<LessonResult> => {
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
    Create detailed, professional-grade teacher notes.
    - ${language === 'FR' ? "LANGUAGE RULE: You MUST respond in French (Français)." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English."}
    - **Introduction**: Briefly introduce the topic.
    - **Core Concepts**: Explain 3-5 main concepts covered in depth.
    - **Examples**: Provide 2-3 real-world examples mentioned or relevant to the context.
    - **Summary**: A concluding paragraph.
    
    Map this to the "simplifiedNotes" schema as sections:
    - Title: "Introduction", Content: ...
    - Title: "Core Concepts", Content: ... (Use markdown bullets)
    - etc.

    TASK 3: EXTENSIVE QUIZ
    Generate a robust quiz to strictly test understanding.
    - **Quantity**: Generate AT LEAST 8 questions (Target 10).
    - **Type**: Multiple Choice.
    - **Difficulty**: Mixed (Easy to Hard).
    
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

export const generateDarasaRevision = async (imageBase64: string, mimeType: string, language: 'EN' | 'FR' = 'EN'): Promise<LessonResult> => {
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
    1. Analyze this image of lesson notes or a textbook page. Identify the subject.
    2. ${language === 'FR' ? "LANGUAGE RULE: You MUST respond in French (Français)." : "LANGUAGE RULE: If the subject is 'Kiswahili' or 'Swahili', you MUST respond in Swahili. For ALL other subjects, you MUST respond ONLY in English."}
    3. Extract the Main Topic.
    4. Write a clear, simple Summary (2-3 sentences).
    5. Create "Simplified Notes" broken into logical sections (Title + Content).
    6. Generate a Quiz with 3-5 Multiple Choice Questions based DIRECTLY on the content.

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
    You are the producer of a popular educational podcast called "Somo Smart Audio".
    Your task is to convert the following educational content into a lively, engaging 2-minute podcast script between two hosts:
    - **Host (Rachel)**: Enthusiastic, introduces the topic, asks guiding questions, and summarizes key points.
    - **Guest (Expert)**: Knowledgeable but accessible, explains complex ideas with analogies and examples.

    **Content to cover:**
    Topic: "${topic}"
    Material:
    "${content.slice(0, 15000).replace(/"/g, "'")}"

    **Rules:**
    1. Start with a catchy intro (e.g., "Welcome back to Somo Smart Audio...").
    2. Make it sound like a real conversation (use "Exactly!", "That's a great point", "Wait, so you mean...").
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

// Backward compatibility for cached files
export const askSoma = askSomo;
