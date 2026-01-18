import React, { useState } from 'react';
import { Header, Card, Button } from '../../components/Shared';
import { ViewState, LearnerActivity } from '../../types';
import { Book, CheckCircle, Clock, Lock, User } from 'lucide-react';

interface ParentProps {
    onNavigate: (view: ViewState) => void;
    activityLog: LearnerActivity[];
    validStudentCode: string;
}

export const ParentDashboard: React.FC<ParentProps> = ({ onNavigate, activityLog, validStudentCode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState('');

    // Use real data
    const displayLog = activityLog;

    const handleLogin = () => {
        if (inputCode.trim().toUpperCase() === validStudentCode.trim().toUpperCase()) {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Invalid Code. Please check the code on the Student dashboard.');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header title="Parent Login" onHome={() => onNavigate(ViewState.DASHBOARD)} />
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="bg-indigo-50 p-6 rounded-full mb-6">
                        <Lock className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Access</h2>
                    <p className="text-gray-500 text-center mb-8 max-w-xs">
                        Enter the Student ID Code displayed on your child's learning dashboard.
                    </p>

                    <div className="w-full max-w-sm space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Enter Code (e.g. STU-1234)"
                                className="w-full p-4 border border-gray-300 rounded-xl text-center text-lg font-bold tracking-widest uppercase focus:ring-2 focus:ring-primary outline-none"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                            />
                            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
                        </div>
                        <Button fullWidth onClick={handleLogin}>View Activity</Button>
                    </div>

                    <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800 text-center">
                        <span className="font-bold">Demo Mode Hint:</span> <br />
                        The code is: <span className="font-mono bg-white px-1 rounded border border-yellow-200">{validStudentCode}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 bg-gray-50 min-h-screen">
            <Header title="Parent Overview" onHome={() => onNavigate(ViewState.DASHBOARD)} />

            <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="bg-indigo-100 p-3 rounded-full mb-2">
                            <Book className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-gray-800">{displayLog.filter(l => l.type === 'EXPLANATION').length}</span>
                        <span className="text-xs text-gray-500 uppercase font-semibold">Topics Learned</span>
                    </Card>
                    <Card className="p-4 flex flex-col items-center justify-center text-center">
                        <div className="bg-green-100 p-3 rounded-full mb-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-2xl font-bold text-gray-800">
                            {displayLog.filter(l => l.type === 'QUIZ').length}
                        </span>
                        <span className="text-xs text-gray-500 uppercase font-semibold">Quizzes Taken</span>
                    </Card>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 ml-1">Learning Activity</h3>
                    <div className="space-y-3">
                        {displayLog.map((item) => (
                            <Card key={item.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${item.type === 'QUIZ' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {item.type === 'QUIZ' ? <CheckCircle className="w-5 h-5" /> : <Book className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.topic}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {item.date}
                                        </p>
                                    </div>
                                </div>
                                {item.score !== undefined && (
                                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${item.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {item.score}%
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};