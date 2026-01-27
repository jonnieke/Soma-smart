import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExplanationResult, QuizData, TeacherNote, RevisionMode, TutoringStep, ExamQuestion, ExamAnalysis, TutorResponse, LessonResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || 'DUMMY_KEY_FOR_DEV'
});

if (!apiKey) {
  console.warn("Using DUMMY_KEY_FOR_DEV. Results will fail. Please check .env and Vite config.");
}

const MODEL_NAME = "gemini-2.5-flash"; // Validated from models list for 2026 env

// --- Helper: File to Base64 ---
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- LEARNER FEATURES ---

export const explainImage = async (base64Image: string, mimeType: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = MODEL_NAME;

  const prompt = `
    Analyze this image. It is likely a textbook page, homework, or notes.
    1. Extract the main topic.
    2. Explain the content in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    3. Provide 3-5 short bullet points summarizing the key takeaways.
    4. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Markdown formatted explanation" },
            summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining image:", error);
    throw error;
  }
};

export const explainAudio = async (base64Audio: string, mimeType: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = MODEL_NAME;

  const prompt = `
    Listen to this audio. It is likely a student asking a question or reading study material.
    1. Transcribe the audio to text.
    2. Extract the main topic.
    3. Explain the content or answer the question in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    4. Provide 3-5 short bullet points summarizing the key takeaways.
    5. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Markdown formatted explanation" },
            summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["transcript", "topic", "explanation", "summaryPoints", "relatedTopics"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining audio:", error);
    throw error;
  }
};

import { getContext } from './contextService';

export const explainTopic = async (topic: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = MODEL_NAME;
  const context = getContext();

  let contextInstruction = "";
  if (context) {
    contextInstruction = `
    IMPORTANT: You have been provided with specific source material called "${context.name}".
    You MUST answer the question using ONLY this source material. Do not use outside knowledge unless necessary to clarify terms.
    
    Source Material:
    "${context.content.substring(0, 30000)}" 
    `;
    // Note: 30k chars is a safe limit for Flash model context window, though it handles much more.
  }

  const prompt = `
    ${contextInstruction}

    Explain the topic "${topic}" in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    1. Provide a clear explanation.
    2. Provide 3-5 short bullet points summarizing key takeaways.
    3. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Markdown formatted explanation" },
            summaryPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["topic", "explanation", "summaryPoints", "relatedTopics"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return { ...json, level } as ExplanationResult;
  } catch (error) {
    console.error("Error explaining topic:", error);
    throw error;
  }
};

export const generateQuiz = async (content: string, topic: string): Promise<QuizData> => {
  const model = MODEL_NAME;

  const prompt = `
    Based on the following content about "${topic}":
    "${content.substring(0, 5000)}" 
    
    Generate a quiz with:
    - Exactly 3 Multiple Choice Questions (MCQ)
    
    For each question, provide the correct answer and a brief explanation of why.
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ", "SHORT"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Only for MCQ" },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const generateQuickQuiz = async (content: string, topic: string): Promise<QuizData> => {
  const model = MODEL_NAME;

  const prompt = `
    Based on the explanation of "${topic}", generate a quick "Sticky Quiz" to test immediate retention.
    
    Generate exactly 3 simple Multiple Choice Questions (MCQ).
    
    Content: "${content.substring(0, 3000)}"
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating quick quiz:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<void> => {
  // Use Browser Native TTS for robustness and zero cost/latency
  return new Promise((resolve, reject) => {
    try {
      if (!window.speechSynthesis) {
        reject(new Error("Browser does not support TTS"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Default to English, could be dynamic
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      window.speechSynthesis.cancel(); // Cancel any current speech
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      reject(e);
    }
  });
};

// --- TEACHER FEATURES ---

export const convertNotes = async (base64Data: string, mimeType: string): Promise<TeacherNote> => {
  const model = MODEL_NAME;

  const prompt = `
    Analyze this document. 
    1. Create structured lesson notes (headings, key concepts, examples).
    2. Create a simplified version suitable for students to study from directly.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            structuredNotes: { type: Type.STRING, description: "Markdown" },
            simplifiedNotes: { type: Type.STRING, description: "Markdown" }
          },
          required: ["topic", "structuredNotes", "simplifiedNotes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      ...result
    };
  } catch (error) {
    console.error("Error converting notes:", error);
    throw error;
  }
};

export const processVoiceNote = async (audioBase64: string): Promise<TeacherNote> => {
  const model = MODEL_NAME;

  const prompt = `
        Transcribe this audio recording from a teacher.
        Based on the transcription:
        1. Create structured lesson notes.
        2. Create a simplified version for students.
        Output JSON.
    `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/mp3", data: audioBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            structuredNotes: { type: Type.STRING },
            simplifiedNotes: { type: Type.STRING }
          },
          required: ["topic", "structuredNotes", "simplifiedNotes"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    const result = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      ...result
    };

  } catch (error) {
    console.error("Error processing voice note:", error);
    throw error;
  }
}

export const generateTeacherQuiz = async (topic: string): Promise<QuizData> => {
  return generateQuiz("", topic);
}

export const generateAdvancedTeacherQuiz = async (
  images: string[],
  topic: string,
  grade: string,
  count: number,
  type: 'MCQ' | 'OPEN'
): Promise<QuizData> => {
  const model = MODEL_NAME;

  const imageParts = images.map(img => ({
    inlineData: { mimeType: "image/jpeg", data: img }
  }));

  const prompt = `
    You are an expert Kenyan Competency-Based Curriculum (CBC) Developer.
    
    Task: Create a professional ${grade} Exam Quiz about "${topic}".
    
    Source Material: Use the attached images as context.
    
    Requirements:
    1. Generate EXACTLY ${count} questions.
    2. Format: ${type === 'MCQ' ? 'Multiple Choice Questions (4 options)' : 'Short Answer / Structured Questions (No options)'}.
    3. Standard: Align with Kenyan CBC standards (Scenario-based, Critical Thinking, Application).
    4. Language: Academic and age-appropriate for ${grade}.
    
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
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ", "SHORT"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as QuizData;
  } catch (error) {
    console.error("Error generating advanced quiz:", error);
    throw error;
  }
};

// --- ASK SOMA CHATBOT ---

export const askSoma = async (userQuery: string, chatHistory: { role: 'user' | 'model', text: string }[]): Promise<string> => {
  const model = MODEL_NAME;

  // Construct prompt with history manually
  const systemInstruction = "You are Soma, a helpful, friendly, and encouraging AI learning assistant for the Soma Smart app. Your goal is to guide students, parents, and teachers. Help them navigate features:\n\n1. **Scanning**: Tell them they can scan textbooks to get simple explanations.\n2. **Voice Notes**: Explain how teachers can record notes to simplify them.\n3. **Quizzes**: Mention that quizzes are auto-generated from their content.\n4. **Student ID**: Remind them their ID is for login and parent tracking.\n\nKeep answers short (under 3 sentences) and fun. Use emojis! 🌟";

  const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Soma'}: ${msg.text}`).join('\n');
  const fullPrompt = `${systemInstruction}\n\n${historyText}\nUser: ${userQuery}\nSoma:`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: fullPrompt }]
      }
    });

    const text = response.text;
    if (!text) return "I'm thinking... but got stuck! 😅";
    return text;
  } catch (error) {
    console.error("Error asking Soma:", error);
    return "Oops! My brain is a bit foggy right now. ☁️ Try again later!";
  }
};

// --- REVISION ASSISTANT FEATURES ---

export const analyzeExamPaper = async (base64Image: string, mimeType: string): Promise<ExamAnalysis> => {
  const model = MODEL_NAME;

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
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            grade: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  number: { type: Type.STRING },
                  text: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  subStrand: { type: Type.STRING },
                  competency: { type: Type.STRING },
                  marks: { type: Type.INTEGER }
                },
                required: ["id", "number", "text", "topic", "competency"]
              }
            }
          },
          required: ["subject", "grade", "questions"]
        }
      }
    });

    const text = response.text;
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
  mode: RevisionMode
): Promise<TutorResponse> => {
  const model = MODEL_NAME;

  const systemInstruction = `
    You are Soma Smart Revision Assist, an expert CBC/CBE-aligned learning coach for Kenyan learners.
    Tone: Patient, Encouraging, Clear, Non-judgmental.
    
    Your goal is to guide the learner through ONE question at a time using a strict 4-step pedagogical flow.
    
    Current Question: "${question.text}"
    Topic: ${question.topic}
    Competency: ${question.competency}
    
    Current Step: ${currentStep}
    Mode: ${mode}
    
    INSTRUCTIONS FOR CURRENT STEP:
    
    IF STEP = 'A_UNDERSTAND':
      - Ask: "What is this question testing?"
      - Explain the competency and real-life importance.
      - Rewrite visual quesiton in simple words if needed.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'B_THINKING':
      - Explain HOW to think about this question.
      - "First, think about..."
      - Warn about common mistakes.
      - DO NOT GIVE THE ANSWER.
      
    IF STEP = 'C_SOLUTION':
      - provide step-by-step solution in simple language.
      - Number your steps.
      - Show formulas/reasoning clearly.
      
    IF STEP = 'D_REFLECTION':
      - Provide final answer clearly.
      - Add a short reflection: "This answer shows the competency of..."
      
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
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            step: { type: Type.STRING },
            nextStep: { type: Type.STRING },
            hint: { type: Type.STRING }
          },
          required: ["text", "step", "nextStep"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as TutorResponse;
  } catch (error) {
    console.error("Error in revision tutor:", error);
    throw error;
  }
};
// --- TSC LIVE & RECAP FEATURES ---

import { LessonRecap } from "../types";

export const generateLessonRecap = async (inputBase64: string, mimeType: string, audience: 'LEARNER' | 'TEACHER'): Promise<LessonRecap> => {
  const model = MODEL_NAME;

  const learnerPrompt = `
    You are an expert tutor helping a student understand a live lesson they just attended.
    1. Analyze the recording/notes.
    2. Extract the Main Topic.
    3. Write a fun, simple Summary (2-3 sentences).
    4. List 5 Key Points (Bullet points).
    5. Highlight 3 "Exam Tips" - things they must remember for tests.
    6. define 3 key terms used.
    
    Output JSON.
  `;

  const teacherPrompt = `
    You are a curriculum expert summarizing a lesson for a fellow teacher.
    1. Analyze the recording/notes.
    2. Extract Topic and Competencies covered.
    3. Provide a professional Summary.
    4. List Key Teaching Points.
    5. Suggest 3 Follow-up assessment ideas.
    
    Output JSON compatible with the schema, mapping 'teacherNotes' to specific pedagogy comments.
  `;

  const prompt = audience === 'LEARNER' ? learnerPrompt : teacherPrompt;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: inputBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            examTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            definitions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { term: { type: Type.STRING }, definition: { type: Type.STRING } }
              }
            },
            teacherNotes: { type: Type.STRING, description: "Only if audience is TEACHER" }
          },
          required: ["topic", "summary", "keyPoints", "examTips", "definitions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as LessonRecap;
  } catch (error) {
    console.error("Error generating lesson recap:", error);
    throw error;
  }
};

// --- DARASA AI FEATURES ---

export const generateDarasaLesson = async (audioBase64: string): Promise<LessonResult> => {
  const model = MODEL_NAME;

  const prompt = `
    You are an expert Teaching Assistant for a Kenyan Classroom.
    1. Listen to this teacher's lesson recording.
    2. Extract the Main Topic.
    3. Write a clear, simple Summary (2-3 sentences).
    4. Create "Simplified Notes" broken into logical sections (Title + Content).
    5. Generate a Quiz with 3-5 Multiple Choice Questions based DIRECTLY on what was said.

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
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/mp3", data: audioBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            simplifiedNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "summary", "simplifiedNotes", "quiz"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...result
    };
  } catch (error) {
    console.error("Error generating Darasa lesson:", error);
    throw error;
  }
};

export const generateDarasaRevision = async (imageBase64: string, mimeType: string): Promise<LessonResult> => {
  const model = MODEL_NAME;

  const prompt = `
    You are an expert Teaching Assistant for a Kenyan Classroom.
    1. Analyze this image of lesson notes or a textbook page.
    2. Extract the Main Topic.
    3. Write a clear, simple Summary (2-3 sentences).
    4. Create "Simplified Notes" broken into logical sections (Title + Content).
    5. Generate a Quiz with 3-5 Multiple Choice Questions based DIRECTLY on the content.

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
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            summary: { type: Type.STRING },
            simplifiedNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["MCQ"] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "type", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["topic", "summary", "simplifiedNotes", "quiz"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...result
    };
  } catch (error) {
    console.error("Error generating Darasa revision:", error);
    throw error;
  }
};
