import React, { useState, useEffect } from 'react';
import { ViewState, UserRole, LearnerActivity } from './types';
import { LearnerDashboard } from './features/learner/Learner';
import { TeacherDashboard } from './features/teacher/Teacher';
import { ParentDashboard } from './features/parent/Parent';
import { 
  GraduationCap, Users, Baby, ChevronRight, MessageSquare, 
  ScanLine, CheckCircle, Smartphone, Headphones, Play, 
  ArrowRight, BookOpen, Check, Menu, X
} from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [learnerHistory, setLearnerHistory] = useState<LearnerActivity[]>([]);
  const [studentCode, setStudentCode] = useState<string>("");

  // Initialize a unique Student Code on app load
  useEffect(() => {
    // Generate a simple 6-char code like "STU-123"
    const code = "STU-" + Math.floor(1000 + Math.random() * 9000);
    setStudentCode(code);
  }, []);

  // Simple "Context" for history
  const saveActivity = (type: 'EXPLANATION' | 'QUIZ', topic: string, details: any) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newActivity: LearnerActivity = {
        id: Date.now().toString(),
        type,
        topic,
        date: dateStr,
        score: details.score,
        details: JSON.stringify(details)
    };
    setLearnerHistory(prev => [newActivity, ...prev]);
  };

  const deleteActivity = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
        setLearnerHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    // Route to appropriate initial dashboard
    if (selectedRole === UserRole.LEARNER) setCurrentView(ViewState.SCAN_EXPLAIN); // Actually learner dashboard
    else if (selectedRole === UserRole.TEACHER) setCurrentView(ViewState.UPLOAD_CONVERT); // Teacher dashboard
    else if (selectedRole === UserRole.PARENT) setCurrentView(ViewState.PARENT_OVERVIEW);
  };

  const handleNavigate = (view: ViewState) => {
    if (view === ViewState.DASHBOARD) {
        setRole(UserRole.NONE);
    }
    setCurrentView(view);
  };

  // --- LANDING PAGE COMPONENT ---
  const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        {/* --- HEADER --- */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo */}
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                <div className="relative">
                  <MessageSquare className="w-8 h-8 text-orange-500 fill-orange-500" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                   <span className="text-2xl font-extrabold text-blue-900 leading-none tracking-tight">Soma Smart</span>
                   <span className="text-[10px] text-gray-500 font-medium tracking-wide">Learning That Makes Sense</span>
                </div>
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-8">
                <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  <Baby className="w-5 h-5" /> Students
                </button>
                <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  <GraduationCap className="w-5 h-5" /> Teachers
                </button>
                <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  <Users className="w-5 h-5" /> Parents
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

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-lg">
              <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                <Baby className="w-5 h-5 text-blue-600" /> Students
              </button>
              <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                <GraduationCap className="w-5 h-5 text-blue-600" /> Teachers
              </button>
              <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                <Users className="w-5 h-5 text-blue-600" /> Parents
              </button>
            </div>
          )}
        </header>

        {/* --- HERO SECTION --- */}
        <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-blue-900 tracking-tight mb-6">
              From Textbooks to Understanding—<span className="text-blue-600">Instantly.</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
              AI-powered learning to help students understand lessons, teachers create smarter materials, and parents track <span className="font-bold text-gray-800">real progress.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={() => document.getElementById('roles-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:-translate-y-1"
              >
                Get Started Free &gt;
              </button>
              <button 
                 onClick={() => handleRoleSelect(UserRole.TEACHER)}
                 className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-all"
              >
                For Schools & Teachers &gt;
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-600">
               <div className="flex items-center gap-2">
                 <ScanLine className="w-5 h-5 text-blue-500" /> Scan Textbooks & Notes
               </div>
               <div className="flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-orange-500" /> Get Simple Explanations
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-green-500" /> Practice with Quizzes
               </div>
            </div>
          </div>
          
          {/* Background Decor */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
              <div className="absolute top-20 left-10 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
              <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
          </div>
        </section>

        {/* --- ROLES SECTION --- */}
        <section id="roles-section" className="py-20 bg-gray-50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="grid md:grid-cols-3 gap-8">
               
               {/* Learner Card */}
               <div 
                 onClick={() => handleRoleSelect(UserRole.LEARNER)}
                 className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden cursor-pointer group hover:-translate-y-2 transition-all duration-300 border border-gray-100"
               >
                 <div className="bg-orange-500 p-6 text-center text-white">
                    <h3 className="text-2xl font-bold mb-1">For Learners</h3>
                    <p className="opacity-90 font-medium">Understand. Practice. Excel.</p>
                 </div>
                 <div className="h-48 overflow-hidden bg-gray-200 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=800" 
                      alt="Student" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-orange-100 p-1 rounded"><Check className="w-4 h-4 text-orange-600" /></div>
                      <span className="font-medium">Scan & Learn</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-orange-100 p-1 rounded"><Check className="w-4 h-4 text-orange-600" /></div>
                      <span className="font-medium">Easy Explanations</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-orange-100 p-1 rounded"><Check className="w-4 h-4 text-orange-600" /></div>
                      <span className="font-medium">Smart Quizzes</span>
                    </div>
                 </div>
               </div>

               {/* Teacher Card */}
               <div 
                 onClick={() => handleRoleSelect(UserRole.TEACHER)}
                 className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden cursor-pointer group hover:-translate-y-2 transition-all duration-300 border border-gray-100"
               >
                 <div className="bg-sky-600 p-6 text-center text-white">
                    <h3 className="text-2xl font-bold mb-1">For Teachers</h3>
                    <p className="opacity-90 font-medium">Teach Better. Save Time.</p>
                 </div>
                 <div className="h-48 overflow-hidden bg-gray-200 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800" 
                      alt="Teacher" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-sky-100 p-1 rounded"><Check className="w-4 h-4 text-sky-600" /></div>
                      <span className="font-medium">Create Lessons</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-sky-100 p-1 rounded"><Check className="w-4 h-4 text-sky-600" /></div>
                      <span className="font-medium">Record & Simplify</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-sky-100 p-1 rounded"><Check className="w-4 h-4 text-sky-600" /></div>
                      <span className="font-medium">Generate Quizzes</span>
                    </div>
                 </div>
               </div>

               {/* Parent Card */}
               <div 
                 onClick={() => handleRoleSelect(UserRole.PARENT)}
                 className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden cursor-pointer group hover:-translate-y-2 transition-all duration-300 border border-gray-100"
               >
                 <div className="bg-yellow-500 p-6 text-center text-white">
                    <h3 className="text-2xl font-bold mb-1">For Parents</h3>
                    <p className="opacity-90 font-medium">Clear Learning. Real Progress.</p>
                 </div>
                 <div className="h-48 overflow-hidden bg-gray-200 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800" 
                      alt="Parent" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                 </div>
                 <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-yellow-100 p-1 rounded"><Check className="w-4 h-4 text-yellow-600" /></div>
                      <span className="font-medium">Track Progress</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-yellow-100 p-1 rounded"><Check className="w-4 h-4 text-yellow-600" /></div>
                      <span className="font-medium">Insights & Updates</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <div className="bg-yellow-100 p-1 rounded"><Check className="w-4 h-4 text-yellow-600" /></div>
                      <span className="font-medium">Peace of Mind</span>
                    </div>
                 </div>
               </div>

             </div>
           </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className="py-20 bg-white">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-blue-900">How Soma Smart Works</h2>
               <div className="h-1 w-20 bg-blue-600 mx-auto mt-4 rounded-full"></div>
             </div>

             <div className="grid md:grid-cols-4 gap-8 relative">
               {/* Connecting Line (Desktop) */}
               <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

               {/* Step 1 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-50 shadow-sm flex items-center justify-center mb-6 relative">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                   <Smartphone className="w-10 h-10 text-gray-600" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Scan or Upload</h3>
                 <p className="text-sm text-gray-500">Take a photo of your textbook, notes or homework.</p>
               </div>

               {/* Step 2 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-50 shadow-sm flex items-center justify-center mb-6 relative">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                   <MessageSquare className="w-10 h-10 text-orange-500" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Get Simple Explanations</h3>
                 <p className="text-sm text-gray-500">AI breaks it down into simple language you understand.</p>
               </div>

               {/* Step 3 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-50 shadow-sm flex items-center justify-center mb-6 relative">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                   <CheckCircle className="w-10 h-10 text-green-500" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Practice with Quizzes</h3>
                 <p className="text-sm text-gray-500">Test your knowledge immediately with auto-generated quizzes.</p>
               </div>

               {/* Step 4 */}
               <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-50 shadow-sm flex items-center justify-center mb-6 relative">
                   <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                   <Headphones className="w-10 h-10 text-indigo-500" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">Listen & Revise</h3>
                 <p className="text-sm text-gray-500">Listen to explanations on the go for better retention.</p>
               </div>

             </div>
           </div>
        </section>

        {/* --- FOOTER CTA --- */}
        <section className="bg-slate-900 py-20 text-center relative overflow-hidden">
             {/* Decor */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-orange-400 to-green-500"></div>
             
             <div className="max-w-4xl mx-auto px-4 relative z-10">
               <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Make Learning Make Sense?</h2>
               <p className="text-slate-300 mb-10 text-lg">Join students, teachers, and parents using Soma Smart today.</p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                    onClick={() => handleRoleSelect(UserRole.LEARNER)}
                    className="px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg shadow-lg hover:bg-green-700 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                 >
                   Start Learning Smarter <ChevronRight className="w-5 h-5"/>
                 </button>
                 <button 
                    onClick={() => handleRoleSelect(UserRole.TEACHER)}
                    className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                 >
                   Book a School Demo <ChevronRight className="w-5 h-5"/>
                 </button>
               </div>
             </div>
        </section>

        {/* --- BOTTOM FOOTER --- */}
        <footer className="bg-white border-t border-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                <p>&copy; 2024 Soma Smart</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-blue-600">Privacy</a>
                    <a href="#" className="hover:text-blue-600">Terms</a>
                    <a href="#" className="hover:text-blue-600">Contact</a>
                </div>
            </div>
        </footer>
      </div>
    );
  };

  // --- RENDER ---

  if (role === UserRole.NONE) {
    return <LandingPage />;
  }

  // Role Routing
  if (role === UserRole.LEARNER) {
      return (
        <LearnerDashboard 
            onNavigate={handleNavigate} 
            saveActivity={saveActivity}
            deleteActivity={deleteActivity}
            history={learnerHistory} 
            studentCode={studentCode}
        />
      );
  }

  if (role === UserRole.TEACHER) {
      return <TeacherDashboard onNavigate={handleNavigate} />;
  }

  if (role === UserRole.PARENT) {
      return (
        <ParentDashboard 
            onNavigate={handleNavigate} 
            activityLog={learnerHistory} 
            validStudentCode={studentCode}
        />
      );
  }

  return null;
};

export default App;