import fs from 'fs';
const path = 'src/pages/LandingPage.tsx';
let data = fs.readFileSync(path, 'utf8');

data = data.replace('</section>on>', '</section>');

const ctaRegex = /\{\/\* --- EXAM ASSISTANT CTA ---\s*\*\/\}[\s\S]*?(?=\{\/\* --- HOW IT WORKS: 4 EASY STEPS --- \*\/\}|\{\/\* --- CBE\/KCSE CURRICULUM ALIGNMENT --- \*\/\}|\{\/\* --- HOW IT WORKS: 4 EASY STEPS)/;
data = data.replace(ctaRegex, '');

const howItWorksRegex = /\{\/\* --- HOW IT WORKS: 4 EASY STEPS ---\s*\*\/\}[\s\S]*?(?=\{\/\* --- CORE FEATURES BENTO BOX --- \*\/\}|\{\/\* --- FEATURES SECTION)/;
data = data.replace(howItWorksRegex, `{/* --- ADDICTION LOOP SECTION: Learning Made Simple --- */}
            <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-black relative overflow-hidden transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                            Learning Made <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Simple</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                        {/* Connecting Line */}
                        <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-blue-200 via-emerald-200 to-blue-200 dark:from-blue-900 dark:via-emerald-900 dark:to-blue-900 -translate-y-1/2 z-0"></div>

                        {/* Step 1 */}
                        <div className="relative text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 z-10 transform transition-all hover:-translate-y-2">
                            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <MessageCircle className="w-8 h-8" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white dark:border-slate-950">1</div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-3">Ask a question</h3>
                        </div>

                        {/* Step 2 */}
                        <div className="relative text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 z-10 lg:translate-y-8 transform transition-all hover:-translate-y-2">
                            <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Brain className="w-8 h-8" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white dark:border-slate-950">2</div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-3">Understand the answer</h3>
                        </div>

                        {/* Step 3 */}
                        <div className="relative text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 z-10 transform transition-all hover:-translate-y-2">
                            <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Target className="w-8 h-8" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white dark:border-slate-950">3</div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-3">Practice similar questions</h3>
                        </div>

                        {/* Step 4 */}
                        <div className="relative text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 z-10 lg:translate-y-8 transform transition-all hover:-translate-y-2">
                            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-900 dark:bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg border-4 border-white dark:border-slate-950">4</div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-xl mb-3">Improve your grades</h3>
                        </div>
                    </div>
                </div>
            </section>
`);

const featuresRegex = /\{\/\* --- CORE FEATURES BENTO BOX ---\s*\*\/\}[\s\S]*?(?=\{\/\* --- SUPER SCHOOL OS BENTO BOX --- \*\/\}|\{\/\* --- SCHOOL CALENDAR --- \*\/\}|\{\/\* --- SUPER SCHOOL OS BENTO BOX)/;
data = data.replace(featuresRegex, `{/* --- FEATURES SECTION --- */}
            <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors border-t border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                            Chat with <span className="text-blue-600 dark:text-blue-400">Soma AI</span> for Instant Answers
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow text-center transform hover:-translate-y-1">
                            <div className="w-14 h-14 mx-auto bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <MessageCircle className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI Chat</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Ask questions and get answers instantly.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow text-center transform hover:-translate-y-1">
                            <div className="w-14 h-14 mx-auto bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Flame className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Streak System</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Build your daily learning habits.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow text-center transform hover:-translate-y-1">
                            <div className="w-14 h-14 mx-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Target className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Practice Quizzes</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Test yourself with daily questions.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow text-center transform hover:-translate-y-1">
                            <div className="w-14 h-14 mx-auto bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <Brain className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Weak Areas Tracker</h3>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">See where you need improvement.</p>
                        </div>
                    </div>
                </div>
            </section>
`);

const schoolOSRegex = /\{\/\* --- SUPER SCHOOL OS BENTO BOX --- \*\/\}[\s\S]*?(?=\{\/\* --- SCHOOL CALENDAR --- \*\/\}|\{\/\* --- SCHOOL CALENDAR)/;
data = data.replace(schoolOSRegex, '');

const testimonialsRegex = /\{\/\* --- TESTIMONIALS --- \*\/\}[\s\S]*?(?=\{\/\* --- FOOTER CTA --- \*\/\}|\{\/\* --- FOOTER CTA)/;
data = data.replace(testimonialsRegex, `{/* --- SOCIAL PROOF SECTION --- */}
            <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors border-t border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                                    EK
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Emmanuel K.</h4>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Student, Nairobi</span>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                                "I moved from C to B+ in Maths in 1 month. Soma AI explains concepts better than any textbook I've used."
                            </p>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                                    MW
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Mary W.</h4>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Parent, Kiambu</span>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                                "My child now studies without being pushed. The streak system keeps them wanting to learn every single day."
                            </p>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group hover:-translate-y-1 transition-transform">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xl">
                                    DN
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">David N.</h4>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Teacher, Thika</span>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                                "This saves me hours of marking. I recommend all my Form 4s to use Soma AI for their revision."
                            </p>
                        </div>
                    </div>
                </div>
            </section>
`);

const footerCTARegex = /\{\/\* --- FOOTER CTA --- \*\/\}[\s\S]*?(?=\{\/\* --- BOTTOM FOOTER --- \*\/\}|\{\/\* --- BOTTOM FOOTER)/;
data = data.replace(footerCTARegex, `{/* --- FINAL CTA SECTION --- */}
            <section className="bg-slate-900 dark:bg-black py-24 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800/30 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-800/20 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-3xl mx-auto px-4 relative z-10">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 tracking-tight">
                        Don’t fail KCSE. Start improving today.
                    </h2>
                    
                    <button
                        onClick={() => handleRoleSelect(UserRole.LEARNER)}
                        className="px-12 py-5 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto"
                    >
                        Start Free Now <ArrowRight className="w-6 h-6" />
                    </button>
                    <p className="mt-6 text-slate-400 text-sm font-medium">Takes less than 30 seconds to join.</p>
                </div>
            </section>
`);

// Add required imports at the top
if (!data.includes('ArrowRight')) {
    data = data.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
        return `import {${p1}, ArrowRight} from 'lucide-react';`;
    });
}

fs.writeFileSync(path, data);
