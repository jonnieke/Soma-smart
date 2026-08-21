import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { examRoomService } from '../../services/examRoomService';
import { ExamRoom, ExamRoomMessage, UserRole } from '../../types';
import { DashboardLayout } from '../../components/DashboardLayout';
import {
    ArrowLeft, Send, Sparkles, Image as ImageIcon,
    ThumbsUp, Users, Info, Loader2, Pin, LogOut,
    Swords, Trophy, Timer, CheckCircle2, XCircle, Flame, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ExamRoomChat: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { studentProfile, isPro } = useApp();

    const [room, setRoom] = useState<ExamRoom | null>(null);
    const [messages, setMessages] = useState<ExamRoomMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [askingAI, setAskingAI] = useState(false);

    // Speed Quiz Battle State
    const [isBattleOpen, setIsBattleOpen] = useState(false);
    const [battleQIndex, setBattleQIndex] = useState(0);
    const [battleSecondsLeft, setBattleSecondsLeft] = useState(15);
    const [battleScore, setBattleScore] = useState(0);
    const [battleSelected, setBattleSelected] = useState<string | null>(null);
    const [battleFinished, setBattleFinished] = useState(false);

    const battleQuestions = [
        {
            q: `In ${room?.subject || 'KCSE Revision'}, what is the fundamental principle applied when solving rate and ratio problems?`,
            options: ['Direct & Inverse Proportion', 'Pythagorean Theorem', 'Binomial Expansion', 'Matrices Multiplication'],
            answer: 'Direct & Inverse Proportion',
            pts: 100
        },
        {
            q: 'Which cognitive strategy yields the highest retention during active exam preparation?',
            options: ['Active Recall & Spaced Testing', 'Passive Highlighting', 'Re-reading Notes 5 Times', 'Cramming Before Sleep'],
            answer: 'Active Recall & Spaced Testing',
            pts: 100
        },
        {
            q: 'What is the standard step to verify a calculated result before submitting a paper?',
            options: ['Dimensional Analysis & Unit Consistency', 'Ignoring Working Steps', 'Relying on Guesswork', 'Leaving It Blank'],
            answer: 'Dimensional Analysis & Unit Consistency',
            pts: 100
        }
    ];

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) return;
        loadRoomAndMessages(id);

        // Subscribe to real-time messages
        const subscription = examRoomService.subscribeToMessages(id, (newMessage) => {
            setMessages(prev => [...prev, newMessage]);
        });

        return () => {
            // Cleanup subscription if implemented in service
        };
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Battle countdown
    useEffect(() => {
        if (!isBattleOpen || battleFinished) return;
        const timer = setInterval(() => {
            setBattleSecondsLeft(prev => {
                if (prev <= 1) {
                    handleBattleNextQuestion();
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isBattleOpen, battleQIndex, battleFinished]);

    const handleStartBattle = () => {
        setIsBattleOpen(true);
        setBattleQIndex(0);
        setBattleSecondsLeft(15);
        setBattleScore(0);
        setBattleSelected(null);
        setBattleFinished(false);
    };

    const handleSelectBattleAnswer = (option: string) => {
        if (battleSelected !== null) return;
        setBattleSelected(option);
        const currentQ = battleQuestions[battleQIndex];
        if (option === currentQ.answer) {
            setBattleScore(prev => prev + currentQ.pts);
        }
        setTimeout(() => {
            handleBattleNextQuestion();
        }, 1200);
    };

    const handleBattleNextQuestion = () => {
        setBattleSelected(null);
        if (battleQIndex + 1 < battleQuestions.length) {
            setBattleQIndex(prev => prev + 1);
            setBattleSecondsLeft(15);
        } else {
            setBattleFinished(true);
            const victoryMsg: ExamRoomMessage = {
                id: `battle-${Date.now()}`,
                room_id: room?.id || 'room',
                user_id: 'system',
                user_name: 'Soma Battle Arena',
                user_role: UserRole.SCHOOL,
                message_type: 'AI_EXPLANATION',
                content: `⚔️ **Live Battle Complete!**\nCandidate **${studentProfile?.name || 'Peer'}** completed the speed challenge with **${battleScore + (battleSelected === battleQuestions[battleQIndex]?.answer ? battleQuestions[battleQIndex]?.pts : 0)} XP**! 🏆`,
                created_at: new Date().toISOString(),
                upvotes: 3
            };
            setMessages(prev => [...prev, victoryMsg]);
        }
    };

    const handleLeaveRoom = async () => {
        if (!room || !studentProfile) return;
        if (window.confirm("Are you sure you want to leave this exam room?")) {
            setLoading(true);
            await examRoomService.leaveRoom(room.id, studentProfile.id);
            navigate('/exam-rooms');
        }
    };

    const handlePinMessage = async (messageId: string) => {
        if (!room) return;
        const newPinId = room.pinned_message_id === messageId ? null : messageId;
        setRoom({ ...room, pinned_message_id: newPinId });
        await examRoomService.pinMessage(room.id, newPinId);
    };

    const loadRoomAndMessages = async (roomId: string) => {
        setLoading(true);
        const roomData = await examRoomService.getRoomById(roomId);

        if (!roomData) {
            // Create mock data for UI testing if no DB is connected
            if (roomId === 'mock-1' || roomId.startsWith('mock-')) {
                setRoom({
                    id: roomId,
                    name: 'KCSE Mathematics Revision 2024',
                    description: 'Daily past paper review and Q&A sessions.',
                    room_type: 'EXAM_PREP',
                    subject: 'Mathematics',
                    created_by: 'system',
                    created_at: new Date().toISOString(),
                    is_active: true,
                    member_count: 142
                });
                setMessages([
                    {
                        id: 'msg-1',
                        room_id: roomId,
                        user_id: 'user-1',
                        user_name: 'John K.',
                        user_role: UserRole.LEARNER,
                        message_type: 'TEXT',
                        content: 'Has anyone solved question 4 from the 2022 Paper 2?',
                        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                        upvotes: 2
                    },
                    {
                        id: 'msg-2',
                        room_id: roomId,
                        user_id: 'system',
                        user_name: 'Somo AI',
                        user_role: UserRole.SCHOOL,
                        message_type: 'AI_EXPLANATION',
                        content: 'To solve Question 4 (Trigonometry), remember the sine rule... Would you like me to walk through the steps?',
                        parent_id: 'msg-1',
                        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                        upvotes: 5
                    }
                ]);
            } else {
                alert("Room not found");
                navigate('/exam-rooms');
                return;
            }
        } else {
            setRoom(roomData);
            const msgs = await examRoomService.fetchMessages(roomId);
            setMessages(msgs);

            // Auto-join if real user
            if (studentProfile?.id) {
                examRoomService.joinRoom(roomId, studentProfile.id);
            }
        }
        setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !id || !studentProfile) return;

        const messageContent = inputText;
        setInputText('');
        setSending(true);

        try {
            const newMsg = await examRoomService.sendMessage({
                room_id: id,
                user_id: studentProfile.id,
                user_name: studentProfile.name,
                user_role: UserRole.LEARNER,
                message_type: 'TEXT',
                content: messageContent
            });

            if (newMsg) {
                // Technically the subscription should catch this, but optimistically add if not
                setMessages(prev => prev.find(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
            }
        } catch (error) {
            console.error("Failed to send message", error);
            // Revert input on failure
            setInputText(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleAskAI = async (messageContent: string, parentId: string) => {
        if (!id || !isPro) {
            alert("smart explanations in study rooms are a premium feature.");
            return;
        }

        setAskingAI(true);

        // Optimistic UI for AI thinking
        const optimisticId = 'temp-ai-' + Date.now();
        setMessages(prev => [...prev, {
            id: optimisticId,
            room_id: id,
            user_id: 'system',
            user_name: 'Somo AI',
            user_role: UserRole.SCHOOL,
            message_type: 'SYSTEM',
            content: 'Thinking...',
            parent_id: parentId,
            created_at: new Date().toISOString(),
            upvotes: 0
        }]);

        try {
            // In a real app, this would call an Edge Function that triggers Gemini
            // For now, we simulate a response
            setTimeout(async () => {
                const aiMsg = await examRoomService.sendMessage({
                    room_id: id,
                    user_id: 'system',
                    user_name: 'Somo AI',
                    user_role: UserRole.SCHOOL,
                    message_type: 'AI_EXPLANATION',
                    content: `Here is a breakdown of the concept discussed:\n\n1. First principle...\n2. Then apply the formula...\n\nLet me know if you need more details on this topic!`,
                    parent_id: parentId
                });

                // Remove optimistic message and rely on subscription/fetch
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                if (aiMsg) {
                    setMessages(prev => [...prev, aiMsg]);
                }
            }, 2000);

        } catch (error) {
            console.error("AI failed", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        } finally {
            setAskingAI(false);
        }
    };

    const handleVote = async (messageId: string) => {
        if (!studentProfile) return;
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, upvotes: m.upvotes + 1 } : m));
        await examRoomService.voteMessage(messageId, studentProfile.id, 'UP');
    };

    if (loading) {
        return (
            <DashboardLayout activeTab="EXAM_ROOMS" onTabChange={(tab) => {
                if (tab !== 'EXAM_ROOMS') {
                    navigate('/learner', { state: { targetTab: tab } });
                }
            }}>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (!room) return null;

    return (
        <DashboardLayout activeTab="EXAM_ROOMS" onTabChange={(tab) => {
            if (tab !== 'EXAM_ROOMS') {
                navigate('/learner', { state: { targetTab: tab } });
            }
        }}>
            <div className="flex flex-col h-[calc(100vh-40px)] max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/exam-rooms')}
                            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {room.name}
                            </h1>
                            <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {room.member_count} active
                                </span>
                                {room.subject && (
                                    <>
                                        <span>•</span>
                                        <span>{room.subject}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleStartBattle}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                            title="Start Live Group Quiz Battle"
                        >
                            <Swords className="w-3.5 h-3.5" /> Battle ⚔️
                        </button>
                        <button
                            onClick={handleLeaveRoom}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 transition-colors"
                            title="Leave Room"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors" title="Room Info">
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-6">
                    <div className="text-center py-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 mb-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Welcome to {room.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            This is the start of the study room. Ask questions, share notes, and collaborate with peers.
                        </p>
                    </div>

                    {messages.map((msg, index) => {
                        const isMe = msg.user_id === studentProfile?.id;
                        const isAI = msg.user_id === 'system';
                        const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={msg.id}
                                className={`flex gap-3 max-w-3xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${isAI ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' :
                                    isMe ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    } ${!showAvatar && 'invisible'}`}>
                                    {isAI ? <Sparkles className="w-5 h-5" /> : <span className="text-sm font-bold uppercase">{msg.user_name.substring(0, 2)}</span>}
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showAvatar && (
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{msg.user_name}</span>
                                            {isAI && <span className="text-[9px] uppercase font-black tracking-widest bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md">AI Assitant</span>}
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}

                                    <div className={`relative group p-4 rounded-3xl shadow-sm text-sm ${msg.message_type === 'AI_EXPLANATION' ? 'bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/30 prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200' :
                                        isMe ? 'bg-blue-600 text-white rounded-tr-lg' : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-lg'
                                        }`}>

                                        {/* Pinned Indicator */}
                                        {room.pinned_message_id === msg.id && (
                                            <div className={`flex items-center gap-1 mb-2 text-xs font-bold ${isMe ? 'text-blue-100' : 'text-amber-500'}`}>
                                                <Pin className="w-3 h-3 fill-current" />
                                                Pinned Message
                                            </div>
                                        )}

                                        {msg.content === 'Thinking...' ? (
                                            <div className="flex items-center gap-2 text-indigo-500 font-medium">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Generating explanation...
                                            </div>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        )}

                                        {/* Actions Menu (Hover) */}
                                        {!isMe && !isAI && msg.content !== 'Thinking...' && (
                                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pl-2">
                                                <button
                                                    onClick={() => handleVote(msg.id)}
                                                    className="flex items-center gap-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-emerald-500 transition-colors"
                                                    title="Upvote solution"
                                                >
                                                    <ThumbsUp className="w-4 h-4" />
                                                    {msg.upvotes > 0 && <span className="text-xs font-bold">{msg.upvotes}</span>}
                                                </button>
                                                <button
                                                    onClick={() => handleAskAI(msg.content, msg.id)}
                                                    disabled={askingAI}
                                                    className="flex items-center gap-1 p-1.5 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors group/ai"
                                                    title="Ask AI to explain this"
                                                >
                                                    <Sparkles className="w-4 h-4 group-hover/ai:animate-pulse" />
                                                    <span className="text-[10px] uppercase font-black tracking-widest">Ask AI</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePinMessage(msg.id)}
                                                    className={`flex items-center gap-1 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow border border-slate-100 dark:border-slate-700 transition-colors active:scale-95 ${room.pinned_message_id === msg.id ? 'text-blue-600' : 'text-slate-500 hover:text-blue-500'}`}
                                                    title={room.pinned_message_id === msg.id ? "Unpin message" : "Pin message"}
                                                >
                                                    <Pin className={`w-4 h-4 ${room.pinned_message_id === msg.id ? 'fill-current' : ''}`} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                    <form onSubmit={handleSendMessage} className="relative flex items-end gap-3 max-w-4xl mx-auto">
                        <button
                            type="button"
                            className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-500 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-2xl transition-colors shrink-0"
                            title="Attach Image / Notes"
                        >
                            <ImageIcon className="w-6 h-6" />
                        </button>
                        <div className="relative flex-1">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Type your question or share notes..."
                                className="w-full pl-5 pr-14 py-4 max-h-32 min-h-[60px] bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none hide-scrollbar transition-all text-sm font-medium dark:text-white"
                                rows={1}
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || sending}
                                className="absolute right-2 bottom-2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500 text-white rounded-2xl transition-all shadow-md disabled:shadow-none"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Please be respectful and helpful. smart explanations are monitored.
                        </p>
                    </div>
                </div>

            </div>

            {/* Speed Quiz Battle Modal */}
            <AnimatePresence>
                {isBattleOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden"
                        >
                            {/* Battle Header */}
                            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-center relative">
                                <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest mb-2">
                                    <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> Live Battle</span>
                                    <span className="flex items-center gap-1"><Timer className="w-4 h-4" /> {battleSecondsLeft}s</span>
                                </div>
                                <h3 className="text-xl font-black">{room?.subject || 'KCSE'} Speed Challenge</h3>
                                <p className="text-xs text-white/80 mt-1">Question {battleQIndex + 1} of {battleQuestions.length}</p>
                            </div>

                            {/* Battle Content */}
                            {!battleFinished ? (
                                <div className="p-6 space-y-6">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                                        {battleQuestions[battleQIndex].q}
                                    </h4>

                                    <div className="grid grid-cols-1 gap-2.5">
                                        {battleQuestions[battleQIndex].options.map((opt) => {
                                            const isSelected = battleSelected === opt;
                                            const isCorrect = opt === battleQuestions[battleQIndex].answer;
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    disabled={battleSelected !== null}
                                                    onClick={() => handleSelectBattleAnswer(opt)}
                                                    className={`p-4 rounded-2xl border text-left font-bold text-sm transition-all flex items-center justify-between ${
                                                        isSelected
                                                            ? isCorrect
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                : 'bg-rose-50 border-rose-500 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                                            : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 text-slate-700 dark:text-slate-200'
                                                    }`}
                                                >
                                                    <span>{opt}</span>
                                                    {isSelected && (
                                                        isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center space-y-5">
                                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <Trophy className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">Battle Finished!</h4>
                                        <p className="text-xs text-slate-500 mt-1">You earned <strong>{battleScore} XP</strong> for active recall mastery!</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsBattleOpen(false)}
                                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20"
                                    >
                                        Return to Exam Room
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
};
