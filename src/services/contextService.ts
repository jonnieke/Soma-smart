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

};

export const getContext = () => activeContext;

export const clearContext = () => {
    activeContext = null;
};

const loadPdfJs = async () => {
    const [pdfjsLib, workerModule] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url')
    ]);
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = (workerModule as any).default;
    return pdfjsLib;
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
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
    const pdfjsLib = await loadPdfJs();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return fullText;
};
