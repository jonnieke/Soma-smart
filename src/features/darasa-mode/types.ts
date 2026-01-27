export interface NoteSection {
    title: string;
    content: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // Index
    explanation: string;
}

export interface LessonResult {
    id: string;
    topic: string;
    date: string;
    simplifiedNotes: NoteSection[];
    quiz: QuizQuestion[];
    summary: string;
}
