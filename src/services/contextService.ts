// Simple in-memory context store for the "NotebookLM" feature.
// In a real app, this would use vector database (Supabase pgvector) for large scale RAG.

interface ContextSource {
    id: string;
    name: string;
    grade?: string;
    subject?: string;
}

let activeContext: ContextSource | null = null;

export const setContext = (name: string, grade?: string, subject?: string) => {
    activeContext = {
        id: Date.now().toString(),
        name,
        grade,
        subject
    };
    console.log(`Context set for RAG routing: ${name} (Grade: ${grade}, Subject: ${subject})`);
};

export const getContext = () => activeContext;

export const clearContext = () => {
    activeContext = null;
};

// If using pdfjs-dist in browser
import * as pdfjsLib from 'pdfjs-dist';

// Use Vite's URL import for the worker to ensure it bundles correctly
// This avoids CDN version mismatches and 404s
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return fullText;
};

export const extractTextFromURL = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return fullText;
};
