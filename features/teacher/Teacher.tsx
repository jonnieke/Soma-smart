import React, { useState, useRef } from 'react';
import { Upload, Mic, FileText, Share2, StopCircle, Download } from 'lucide-react';
import { Button, Card, Header, MarkdownText } from '../../components/Shared';
import { convertNotes, processVoiceNote, generateTeacherQuiz, fileToGenerativePart } from '../../services/geminiService';
import { ViewState, TeacherNote, QuizData } from '../../types';

interface TeacherProps {
  onNavigate: (view: ViewState) => void;
}

export const TeacherDashboard: React.FC<TeacherProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'CONVERT' | 'VOICE' | 'QUIZ'>('CONVERT');
  const [loading, setLoading] = useState(false);
  
  // Results
  const [generatedNote, setGeneratedNote] = useState<TeacherNote | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
        const base64 = await fileToGenerativePart(file);
        const result = await convertNotes(base64, file.type);
        setGeneratedNote(result);
    } catch (e) {
        alert("Error converting file");
    } finally {
        setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/mp3' }); // usually webm but generic audio blob works for us to convert
            await handleAudioProcessing(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (e) {
        alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          // Stop all tracks
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
  };

  const handleAudioProcessing = async (blob: Blob) => {
      setLoading(true);
      try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            const result = await processVoiceNote(base64Data);
            setGeneratedNote(result);
            setLoading(false);
          };
      } catch (e) {
          alert("Error processing audio");
          setLoading(false);
      }
  };

  const handleQuizGen = async (topic: string) => {
      if(!topic) return;
      setLoading(true);
      try {
          const result = await generateTeacherQuiz(topic);
          setGeneratedQuiz(result);
      } catch (e) {
          alert("Error generating quiz");
      } finally {
          setLoading(false);
      }
  };

  // --- RENDERERS ---

  const renderContent = () => {
      if (loading) {
          return (
              <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-500">AI is working its magic...</p>
              </div>
          );
      }

      // Display Result: Note
      if (generatedNote && (activeTab === 'CONVERT' || activeTab === 'VOICE')) {
          return (
              <div className="space-y-6">
                  <div className="flex gap-2 justify-end print:hidden">
                    <Button variant="outline" onClick={() => window.print()} icon={<Download className="w-4 h-4"/>}>PDF</Button>
                    <a href={`mailto:?subject=${generatedNote.topic}&body=Here are the notes: ...`} className="block">
                        <Button variant="secondary" icon={<Share2 className="w-4 h-4"/>}>Share</Button>
                    </a>
                  </div>

                  <div className="print-only">
                    <h1 className="text-3xl font-bold mb-4">{generatedNote.topic}</h1>
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-primary mb-2 border-b">Student Summary</h2>
                        <MarkdownText content={generatedNote.simplifiedNotes} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2 border-b">Teacher Lesson Plan</h2>
                        <MarkdownText content={generatedNote.structuredNotes} />
                    </div>
                  </div>
                  
                  <Button variant="ghost" onClick={() => setGeneratedNote(null)} className="print:hidden">Start Over</Button>
              </div>
          );
      }

      // Display Result: Quiz
      if (generatedQuiz && activeTab === 'QUIZ') {
          return (
              <div className="space-y-6">
                   <div className="flex gap-2 justify-end print:hidden">
                    <Button variant="outline" onClick={() => window.print()} icon={<Download className="w-4 h-4"/>}>Export PDF</Button>
                  </div>

                  <div className="bg-white p-8 shadow-sm border print:shadow-none print:border-none">
                      <h1 className="text-2xl font-bold text-center mb-6">{generatedQuiz.topic} - Assessment</h1>
                      <div className="space-y-6">
                          {generatedQuiz.questions.map((q, i) => (
                              <div key={i} className="mb-4 break-inside-avoid">
                                  <p className="font-semibold text-lg">{i + 1}. {q.question}</p>
                                  {q.type === 'MCQ' && (
                                      <div className="ml-4 mt-2 space-y-1">
                                          {q.options?.map((opt, idx) => (
                                              <div key={idx} className="flex items-center gap-2">
                                                  <div className="w-4 h-4 border rounded-full"></div>
                                                  <span>{opt}</span>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                                  {q.type === 'SHORT' && (
                                      <div className="ml-4 mt-2 h-16 border-b border-gray-300 w-full"></div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
                  <Button variant="ghost" onClick={() => setGeneratedQuiz(null)} className="print:hidden">Create Another</Button>
              </div>
          );
      }

      // Default Inputs
      return (
          <div className="space-y-6">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto">
                  <button onClick={() => { setActiveTab('CONVERT'); setGeneratedNote(null); }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'CONVERT' ? 'bg-white shadow text-primary' : 'text-gray-600'}`}>Upload Notes</button>
                  <button onClick={() => { setActiveTab('VOICE'); setGeneratedNote(null); }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'VOICE' ? 'bg-white shadow text-primary' : 'text-gray-600'}`}>Voice to Notes</button>
                  <button onClick={() => { setActiveTab('QUIZ'); setGeneratedQuiz(null); }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === 'QUIZ' ? 'bg-white shadow text-primary' : 'text-gray-600'}`}>Quiz Gen</button>
              </div>

              {activeTab === 'CONVERT' && (
                  <Card className="text-center py-10">
                      <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2">Transform Textbook Pages</h3>
                      <p className="text-gray-500 mb-6 px-4">Upload a photo of a textbook or your handwritten notes to generate lesson plans.</p>
                      <input type="file" id="teacher-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                      <Button onClick={() => document.getElementById('teacher-upload')?.click()}>Select File</Button>
                  </Card>
              )}

              {activeTab === 'VOICE' && (
                  <Card className="text-center py-10">
                      <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-indigo-50'}`}>
                          <Mic className={`w-8 h-8 ${isRecording ? 'text-red-500' : 'text-primary'}`} />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{isRecording ? "Recording..." : "Dictate your Lesson"}</h3>
                      <p className="text-gray-500 mb-6 px-4">Record your voice to automatically create structured notes for students.</p>
                      
                      {isRecording ? (
                          <Button variant="secondary" onClick={stopRecording} icon={<StopCircle className="w-5 h-5"/>}>Stop & Process</Button>
                      ) : (
                          <Button onClick={startRecording}>Start Recording</Button>
                      )}
                  </Card>
              )}

              {activeTab === 'QUIZ' && (
                  <Card className="p-6">
                      <h3 className="font-bold text-lg mb-4">Generate Assessment</h3>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topic or Subject</label>
                      <input 
                        type="text" 
                        placeholder="e.g., The Water Cycle, WWII, Algebra Basics"
                        className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        id="topic-input"
                      />
                      <Button fullWidth onClick={() => {
                          const val = (document.getElementById('topic-input') as HTMLInputElement).value;
                          handleQuizGen(val);
                      }}>Generate PDF Quiz</Button>
                  </Card>
              )}
          </div>
      );
  };

  return (
    <div className="pb-20">
      <Header title="Teacher Studio" onHome={() => onNavigate(ViewState.DASHBOARD)} />
      <div className="p-4 max-w-2xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};
