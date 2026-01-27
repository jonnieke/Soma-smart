import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from './Shared';
import { Check, X, Loader2 } from 'lucide-react'; // Added icons

// Configure worker - crucial for pdfjs-dist
// Using Vite's ?url import to get the correct path to the worker in node_modules
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfPageSelectorProps {
    file: File;
    onSelectionComplete: (files: File[]) => void;
    onCancel: () => void;
}

export const PdfPageSelector: React.FC<PdfPageSelectorProps> = ({ file, onSelectionComplete, onCancel }) => {
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState<string[]>([]); // Base64 images
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [renderProgress, setRenderProgress] = useState(0);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setPdf(loadedPdf);

                const pageImages: string[] = [];
                // Render all pages (limit to reasonable number if needed, e.g., 20)
                const numPages = loadedPdf.numPages;

                for (let i = 1; i <= numPages; i++) {
                    const page = await loadedPdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 }); // Good quality for preview
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        } as any).promise;

                        pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
                    }
                    setRenderProgress(Math.round((i / numPages) * 100));
                }

                setPages(pageImages);
                setLoading(false);
            } catch (error) {
                console.error("Error loading PDF:", error);
                alert("Failed to load PDF. Please try another file.");
                onCancel();
            }
        };

        loadPdf();
    }, [file]);

    const toggleSelection = (index: number) => {
        setSelectedIndices(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleConfirm = async () => {
        if (selectedIndices.length === 0) return;

        // Convert selected base64 strings back to File objects
        const selectedFiles = await Promise.all(selectedIndices.sort((a, b) => a - b).map(async (index) => {
            const base64 = pages[index];
            const res = await fetch(base64);
            const blob = await res.blob();
            return new File([blob], `page-${index + 1}.jpg`, { type: 'image/jpeg' });
        }));

        onSelectionComplete(selectedFiles);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Select Pages</h2>
                        <p className="text-slate-500 text-sm">Pick the pages you want to generate the quiz from.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="text-right mr-4">
                            <p className="font-bold text-indigo-600">{selectedIndices.length} Selected</p>
                            <p className="text-xs text-slate-400">Min 1 page</p>
                        </div>
                        <Button variant="ghost" onClick={onCancel} icon={<X className="w-5 h-5" />}>Cancel</Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={selectedIndices.length === 0}
                            className={`${selectedIndices.length > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400'}`}
                            icon={<Check className="w-5 h-5" />}
                        >
                            Confirm Selection
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-medium">Rendering PDF... {renderProgress}%</p>
                            <div className="w-64 h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${renderProgress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {pages.map((imgSrc, index) => (
                                <div
                                    key={index}
                                    onClick={() => toggleSelection(index)}
                                    className={`relative group cursor-pointer transition-all duration-200 ${selectedIndices.includes(index) ? 'ring-4 ring-indigo-500/50 scale-[1.02]' : 'hover:ring-4 hover:ring-slate-200'}`}
                                >
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm aspect-[3/4]">
                                        <img src={imgSrc} alt={`Page ${index + 1}`} className="w-full h-full object-contain" />
                                    </div>

                                    {/* Overlay */}
                                    <div className={`absolute inset-0 transition-opacity ${selectedIndices.includes(index) ? 'bg-indigo-900/10' : 'opacity-0 group-hover:opacity-100 bg-slate-900/5'}`}></div>

                                    {/* Checkbox */}
                                    <div className={`absolute top-3 right-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedIndices.includes(index) ? 'bg-indigo-600 border-indigo-600 z-10' : 'bg-white/80 border-slate-300 opacity-50 group-hover:opacity-100'}`}>
                                        {selectedIndices.includes(index) && <Check className="w-5 h-5 text-white" />}
                                    </div>

                                    {/* Page Number */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded-full font-medium">
                                        Page {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
