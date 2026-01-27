import { LessonResult } from '../types';

export const processLessonAudio = async (audioBlob: Blob): Promise<LessonResult> => {
    // Mock delay to simulate AI processing
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: 'mock-123',
                topic: 'Introduction to Photosynthesis',
                date: new Date().toISOString(),
                summary: 'A simple breakdown of how plants make their own food using sunlight.',
                simplifiedNotes: [
                    {
                        title: "What is Photosynthesis?",
                        content: "Photosynthesis is the process where plants use sunlight, water, and air to make their own food. Think of it like a plant cooking its own lunch!"
                    },
                    {
                        title: "What do Plants Need?",
                        content: "Plants need three main ingredients:\n1. Sunlight (from the sun)\n2. Water (from the soil)\n3. Carbon Dioxide (from the air)"
                    },
                    {
                        title: "What do Plants Make?",
                        content: "After 'cooking', plants produce Sugar (food for themselves) and Oxygen (fresh air for us to breathe)."
                    }
                ],
                quiz: [
                    {
                        id: 'q1',
                        question: 'What do plants use to make food?',
                        options: ['Pizza', 'Sunlight, Water, Air', 'Rocks', 'Milk'],
                        correctAnswer: 1,
                        explanation: 'Plants use sunlight energy, water, and carbon dioxide (air) to create glucose.'
                    },
                    {
                        id: 'q2',
                        question: 'What gas do plants release?',
                        options: ['Oxygen', 'Carbon Dioxide', 'Helium', 'Smoke'],
                        correctAnswer: 0,
                        explanation: 'Plants release Oxygen as a byproduct, which we need to breathe.'
                    }
                ]
            });
        }, 2500); // 2.5s simulated delay
    });
};
