import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Menu, X, CheckSquare, Play, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';

// Import Assets
import learnerImg from '../assets/images/learner.png';
import teacherImg from '../assets/images/teacher.png';
import parentImg from '../assets/images/parent.png';
import stepScanImg from '../assets/images/step_scan.png';
import stepExplainImg from '../assets/images/step_explain.png';
import stepQuizImg from '../assets/images/step_quiz.png';
import stepAudioImg from '../assets/images/step_audio.png';
import { RegistrationModal } from '../components/RegistrationModal';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { setRole } = useApp();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showContact, setShowContact] = useState(false);

    const handleRoleSelect = (selectedRole: UserRole) => {
        setRole(selectedRole);
        if (selectedRole === UserRole.LEARNER) navigate('/learner');
        else if (selectedRole === UserRole.TEACHER) navigate('/teacher');
        else if (selectedRole === UserRole.PARENT) navigate('/parent');
    };

    const handleGetStarted = () => {
        setRole(UserRole.LEARNER); // Default to learner
        setShowRegistration(true);
    };

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        navigate('/learner');
    };

    const handleModalClose = () => {
        setShowRegistration(false);
        // Do NOT navigate. Just close.
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* --- HEADER --- */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-2 rounded-lg text-white shadow-md">
                                <MessageSquare className="w-6 h-6 fill-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-blue-900 leading-none tracking-tight">Soma Smart</h1>
                                <p className="text-[10px] text-blue-600 font-medium tracking-wide uppercase">Learning That Makes Sense</p>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Baby className="w-5 h-5 text-blue-500" /> Students
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <GraduationCap className="w-5 h-5 text-gray-500" /> Teachers
                            </button>
                            <button onClick={() => navigate('/revision')} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 font-medium transition-colors">
                                <BookOpen className="w-5 h-5 text-orange-500" /> Revision
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Users className="w-5 h-5 text-gray-500" /> Parents
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-16 pb-12 lg:pt-20 lg:pb-24 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-900 tracking-tight mb-6">
                            From Textbooks to Understanding—<span className="text-blue-600">Instantly.</span>
                        </h1>
                        <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                            AI-powered learning to help students understand lessons, teachers create<br className="hidden md:block" />
                            smarter materials, and parents track <span className="font-bold text-slate-800">real progress.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <button
                                onClick={handleGetStarted}
                                className="px-8 py-3.5 bg-blue-600 text-white rounded-md font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1 w-full sm:w-auto"
                            >
                                Get Started Free &gt;
                            </button>
                            <button
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="px-8 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-md font-bold text-lg hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto"
                            >
                                For Schools & Teachers &gt;
                            </button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold text-slate-600 border-t border-dashed border-slate-200 pt-8 max-w-4xl mx-auto">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1 rounded"><ScanLine className="w-4 h-4 text-blue-600" /></div> Scan Textbooks & Notes
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-orange-100 p-1 rounded"><MessageSquare className="w-4 h-4 text-orange-600" /></div> Get Simple Explanations
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1 rounded"><CheckCircle className="w-4 h-4 text-green-600" /></div> Practice with Quizzes
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- PROMOTIONAL CTA --- */}
            <section className="bg-indigo-900 text-white py-4 px-4 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite_linear]"></div>
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-400 text-indigo-900 font-black px-4 py-2 rounded-lg -rotate-3 hover:rotate-0 transition-transform shadow-lg cursor-default">
                            LIMITED OFFER
                        </div>
                        <div>
                            <p className="font-bold text-lg md:text-xl">
                                Try Teacher Pro: <span className="text-yellow-300">30 Days Free</span> for just <span className="text-yellow-300">1 Bob!</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleRoleSelect(UserRole.TEACHER)}
                        className="bg-white text-indigo-900 font-bold px-6 py-2 rounded-full hover:bg-yellow-400 hover:text-indigo-900 transition-all shadow-lg flex items-center gap-2"
                    >
                        Claim Offer <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* --- ROLES SECTION --- */}
            <section id="roles-section" className="py-12 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    <div className="grid md:grid-cols-3 gap-8">

                        {/* Learner Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="bg-white rounded-xl shadow-xl shadow-slate-200 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-center text-white">
                                <h3 className="text-2xl font-bold">For Learners</h3>
                                <p className="text-white/90 font-medium italic text-sm">Understand. Practice. Excel.</p>
                            </div>
                            <div className="h-56 overflow-hidden bg-gray-100">
                                <img src={learnerImg} alt="Student" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6 space-y-3 bg-white flex-1">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500 text-white" />
                                    <span className="font-bold">Scan & Learn</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500 text-white" />
                                    <span className="font-bold">Easy Explanations</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500 text-white" />
                                    <span className="font-bold">Smart Quizzes</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Teacher Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            onClick={() => handleRoleSelect(UserRole.TEACHER)}
                            className="bg-white rounded-xl shadow-xl shadow-slate-200 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-center text-white">
                                <h3 className="text-2xl font-bold">For Teachers</h3>
                                <p className="text-white/90 font-medium italic text-sm">Teach Better. Save Time.</p>
                            </div>
                            <div className="h-56 overflow-hidden bg-gray-100">
                                <img src={teacherImg} alt="Teacher" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6 space-y-3 bg-white flex-1">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-blue-500 fill-blue-500 text-white" />
                                    <span className="font-bold">Create Lessons</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-blue-500 fill-blue-500 text-white" />
                                    <span className="font-bold">Record & Simplify</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-blue-500 fill-blue-500 text-white" />
                                    <span className="font-bold">Generate Quizzes</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Parent Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            onClick={() => handleRoleSelect(UserRole.PARENT)}
                            className="bg-white rounded-xl shadow-xl shadow-slate-200 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-4 text-center text-white">
                                <h3 className="text-2xl font-bold">For Parents</h3>
                                <p className="text-white/90 font-medium italic text-sm">Clear Learning. Real Progress.</p>
                            </div>
                            <div className="h-56 overflow-hidden bg-gray-100">
                                <img src={parentImg} alt="Parent" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6 space-y-3 bg-white flex-1">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-green-500 fill-green-500 text-white" />
                                    <span className="font-bold">Track Progress</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <CheckSquare className="w-5 h-5 text-green-500 fill-green-500 text-white" />
                                    <span className="font-bold">Insights & Updates</span>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 relative">
                        <h2 className="text-3xl font-bold text-blue-900 bg-slate-50 inline-block px-4 relative z-10">How Soma Smart Works</h2>
                        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 -z-0"></div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">

                        {[
                            { img: stepScanImg, title: "Scan or Upload", desc: "Take a photo of your textbook, notes or homework." },
                            { img: stepExplainImg, title: "Get Simple Explanations", desc: "AI breaks it down into simple language you understand." },
                            { img: stepQuizImg, title: "Practice with Quizzes", desc: "Test your knowledge immediately with auto-generated quizzes." },
                            { img: stepAudioImg, title: "Listen & Revise", desc: "Listen to explanations on the go for better retention." }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="relative mb-6">
                                    <div className="w-10 h-10 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-lg absolute -top-2 -left-2 z-20 shadow-lg border-2 border-white">
                                        {i + 1}
                                    </div>
                                    <div className="w-40 h-40 rounded-full bg-white flex items-center justify-center shadow-lg p-4 group-hover:scale-105 transition-transform duration-300">
                                        <img src={step.img} alt={step.title} className="w-full h-full object-contain" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg mb-2 text-slate-800">{step.title}</h3>
                                {i < 3 && <div className="hidden md:block absolute right-0 top-1/2 w-8 h-8 bg-slate-200"></div>}
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* --- FOOTER CTA --- */}
            <section className="bg-blue-900 py-20 text-center relative overflow-hidden">
                {/* Decor */}
                <div className="absolute bottom-0 left-0 w-full h-20 bg-white/5 skew-y-3 origin-bottom-left"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Ready to Make Learning Make Sense?</h2>
                    <p className="text-blue-200 mb-10 text-lg italic">Join students, teachers, and parents using Soma Smart today.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="px-8 py-4 bg-green-600 text-white rounded-md font-bold text-lg shadow-xl shadow-green-900/40 hover:bg-green-500 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            Start Learning Smarter <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleRoleSelect(UserRole.TEACHER)}
                            className="px-8 py-4 bg-white text-blue-900 rounded-md font-bold text-lg hover:bg-gray-100 transition-all w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg"
                        >
                            Book a School Demo <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* --- BOTTOM FOOTER --- */}
            <footer className="bg-white py-8 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-8 text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Soma Smart</p>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-600 transition-colors">Privacy</button>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => setShowTerms(true)} className="hover:text-blue-600 transition-colors">Terms</button>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => setShowContact(true)} className="hover:text-blue-600 transition-colors">Contact</button>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-slate-600 transition-colors text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Admin
                    </button>
                </div>
            </footer>
            {/* --- MODALS --- */}
            <RegistrationModal
                isOpen={showRegistration}
                onClose={handleModalClose}
                onSuccess={handleRegistrationSuccess}
            />

            <ContactModal
                isOpen={showContact}
                onClose={() => setShowContact(false)}
            />

            <LegalModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
                title="Privacy Policy"
                content={
                    <div className="space-y-6 text-sm text-slate-600">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                            <strong>Note:</strong> This is a simplified educational platform. We treat all user data with the highest standard of care.
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>User Account Data:</strong> Name, Grade, and Student ID (generated locally).</li>
                                <li><strong>Usage Data:</strong> Topics scanned, questions asked, and quizzes taken.</li>
                                <li><strong>Device Information:</strong> Basic browser type to ensure app compatibility.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2. How We Use Your Data</h3>
                            <p>All data is used strictly to provide the educational service:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>To generate AI explanations relevant to your grade level.</li>
                                <li>To track learning progress for Parents and Teachers.</li>
                                <li>To improve the accuracy of our educational content.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Data Safety & AI</h3>
                            <p>We use Google's Gemini AI to process text and images. </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>We do <strong>not</strong> use your personal data to train public AI models.</li>
                                <li>Your data is processed ephemerally for the purpose of the immediate query.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Children's Privacy</h3>
                            <p>Soma Smart is designed for students. We do not require email addresses or phone numbers from students under 13. Parent supervision is encouraged.</p>
                        </section>
                    </div>
                }
            />

            <LegalModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                title="Terms of Service"
                content={
                    <div className="space-y-6 text-sm text-slate-600">
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-orange-800">
                            <strong>Important:</strong> Soma Smart is an educational aid, not a substitute for professional schooling.
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                            <p>By accessing Soma Smart, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Educational Disclaimer</h3>
                            <p>The content provided by Soma Smart is generated by Artificial Intelligence. While we strive for accuracy:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Information should be verified with official textbooks.</li>
                                <li>We are not liable for any inaccuracies in exam preparation materials.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">3. User Conduct</h3>
                            <p>You agree to use this platform responsibly:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Do not upload inappropriate, harmful, or copyright-infringing content.</li>
                                <li>Do not attempt to reverse-engineer or "jailbreak" the AI assistant.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Subscription & Access</h3>
                            <p>Soma Smart offers a limited free tier. Continued access to advanced features (Voice Notes, Unlimited Scanning) may require a premium subscription in the future.</p>
                        </section>
                    </div>
                }
            />
        </div>
    );
};
