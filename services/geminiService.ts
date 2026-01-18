import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ExplanationResult, QuizData, TeacherNote } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_DEV' });

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
  const model = "gemini-3-pro-preview"; // Updated to gemini-3-pro-preview
  
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
  const model = "gemini-3-flash-preview"; 
  
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

export const explainTopic = async (topic: string, level: 'Simple' | 'Exam'): Promise<ExplanationResult> => {
  const model = "gemini-3-flash-preview"; 
  
  const prompt = `
    Explain the topic "${topic}" in ${level === 'Simple' ? 'very simple language for a young student' : 'exam-ready academic language'}.
    1. Provide a clear explanation.
    2. Provide 3-5 short bullet points summarizing key takeaways.
    3. Suggest 3 short related topics for further learning.
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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
  const model = "gemini-3-flash-preview"; // Good for logic/text gen
  
  const prompt = `
    Based on the following content about "${topic}":
    "${content.substring(0, 5000)}" 
    
    Generate a quiz with:
    - 5 Multiple Choice Questions (MCQ)
    - 3 Short Answer Questions
    
    For each question, provide the correct answer and a brief explanation of why.
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Based on the explanation of "${topic}", generate a quick "Sticky Quiz" to test immediate retention.
    
    Generate exactly 3 simple Multiple Choice Questions (MCQ).
    
    Content: "${content.substring(0, 3000)}"
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const model = "gemini-2.5-flash-preview-tts";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Friendly voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    // Decode (Browser environment)
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);
    return audioBuffer;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

// --- TEACHER FEATURES ---

export const convertNotes = async (base64Data: string, mimeType: string): Promise<TeacherNote> => {
  const model = "gemini-2.5-flash-image"; 
  
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
    // Using flash-native-audio for audio input
    const model = "gemini-2.5-flash-native-audio-preview-12-2025";

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
                    { inlineData: { mimeType: "audio/mp3", data: audioBase64 } }, // Assuming MP3/WAV, API is flexible usually but mimeType matters
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
    // Same as learner quiz but maybe harder or structured differently? keeping same for Phase 1
    return generateQuiz("", topic);
}