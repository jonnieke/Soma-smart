import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, ChartBar, FileText, GraduationCap, MessageCircle, Mic, Sparkles, Clock } from "lucide-react";
import logoImg from "../assets/images/main_logo.png";

interface TeacherLandingProps {
  onLogin: () => void;
  onRegister: () => void;
  onExploreTool?: (tab: string) => void;
}

export const TeacherLanding: React.FC<TeacherLandingProps> = ({ onLogin, onRegister, onExploreTool }) => {
  const navigate = useNavigate();

  const pillars = [
    { title: "Teach faster", desc: "Create lesson notes, schemes, and quizzes without a long setup.", icon: FileText, tone: "text-emerald-600 bg-emerald-50" },
    { title: "Share easily", desc: "Send notes, recaps, and homework to learners in one clean step.", icon: MessageCircle, tone: "text-sky-600 bg-sky-50" },
    { title: "Track progress", desc: "See syllabus coverage, marking, and learner follow-up at a glance.", icon: ChartBar, tone: "text-amber-600 bg-amber-50" },
    { title: "Earn from content", desc: "Publish and manage paid materials without a heavy creator dashboard.", icon: Sparkles, tone: "text-violet-600 bg-violet-50" },
  ];

  const tools = [
    { id: "LESSON_PLAN_GENERATOR", title: "Lesson Plans", desc: "Generate a clear lesson plan quickly.", icon: FileText, button: "Open lesson planner" },
    { id: "HOMEWORK_CREATOR", title: "Homework", desc: "Make a short class task or quiz.", icon: BookOpen, button: "Create homework" },
    { id: "MARKING", title: "Marking", desc: "Review learner work with faster feedback.", icon: ChartBar, button: "Open marking" },
    { id: "DARASA_MODE", title: "Darasa Recap", desc: "Turn a quick voice recap into a class summary.", icon: Mic, button: "Try Darasa mode" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <button onClick={() => navigate('/teacher')} className="flex items-center gap-2 transition hover:opacity-90">
            <img src={logoImg} alt="Somo Smart Logo" className="h-9 w-9 object-contain" />
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 sm:text-xl">Somo Smart</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                <GraduationCap className="h-3 w-3" /> Teacher
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/contact')} className="hidden text-xs font-bold text-slate-500 hover:text-slate-900 sm:inline-flex">
              Support 0722763760
            </button>
            <button onClick={onLogin} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">
              Sign in
            </button>
            <button onClick={onRegister} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700">
              Start free
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" /> Built for Kenyan teachers
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">A simpler teacher space.</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Start with the class you teach, create useful materials fast, share them with learners, and keep track of what needs attention.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={onRegister} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
                  Create teacher account <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={onLogin} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                  Sign in to workspace
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Less setup", "Choose a class once and keep moving."],
                  ["More teaching", "Spend less time on paperwork."],
                  ["Simple marking", "Review work without extra clutter."],
                  ["Better sharing", "Keep learners on one clear path."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-black text-slate-900">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map(({ title, desc, icon: Icon, tone }) => (
            <div key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Teacher tools</p>
              <h2 className="text-2xl font-black text-slate-900">Open a tool and continue</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">Fast and light</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onExploreTool ? onExploreTool(tool.id) : onRegister()}
                  className="group flex min-h-[180px] flex-col justify-between rounded-[1.75rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{tool.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{tool.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition group-hover:bg-slate-100">
                    <span>{tool.button}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Need help setting up a school or teacher team?</h3>
              <p className="mt-1 text-sm text-slate-600">Talk to our support team on WhatsApp: <span className="font-black text-emerald-700">0722763760</span></p>
            </div>
            <a href="https://wa.me/254722763760?text=Hi%20Somo%20Smart%20Support%2C%20I%20am%20a%20teacher%20and%20need%20help%20setting%20up." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
              <MessageCircle className="h-4 w-4" /> Chat support
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeacherLanding;
