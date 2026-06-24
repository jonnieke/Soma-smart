import React from 'react';
import { ChevronRight, CheckCircle2, Clock3, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TeacherDashboardTab } from './teacherNavigation';

type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
type SyncStatus = 'LOCAL' | 'SYNCING' | 'SYNCED' | 'ERROR';

interface SyllabusTopic {
    id: string;
    title: string;
    strand: string;
    estimatedWeeks: number;
    status: TopicStatus;
}

interface SyllabusDocument {
    id: number;
    title: string;
    grade: string;
    subject: string;
    file_url: string;
    file_path: string;
    created_at: string;
}

interface SyllabusTrackerProps {
    teacherId?: string;
    selectedClass: string;
    selectedSubject: string;
    onNavigate: (tab: TeacherDashboardTab) => void;
}

const STATUS_LABELS: Record<TopicStatus, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
};

const STATUS_STYLES: Record<TopicStatus, string> = {
    NOT_STARTED: 'border-slate-200 bg-slate-50 text-slate-600',
    IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-700',
    DONE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

const makeTopic = (id: string, title: string, strand: string, estimatedWeeks: number, status: TopicStatus = 'NOT_STARTED'): SyllabusTopic => ({
    id,
    title,
    strand,
    estimatedWeeks,
    status,
});

const catalogBySubject = (selectedSubject: string, selectedClass: string): SyllabusTopic[] => {
    const subject = selectedSubject.trim().toLowerCase();
    const gradeLabel = selectedClass.trim() || 'Class';

    if (subject.includes('math')) {
        return [
            makeTopic('number-sense', 'Number Sense & Operations', 'Number and Numeration', 4),
            makeTopic('algebra', 'Algebraic Expressions', 'Patterns and Relationships', 4),
            makeTopic('geometry', 'Geometry and Measurement', 'Shape, Space and Measurement', 5),
            makeTopic('statistics', 'Statistics and Data Handling', 'Data, Chance and Analysis', 3),
            makeTopic('word-problems', 'Word Problems and Application', `${gradeLabel} revision and application`, 3),
        ];
    }

    if (subject.includes('english')) {
        return [
            makeTopic('listening-speaking', 'Listening and Speaking', 'Oral Language', 3),
            makeTopic('reading', 'Reading Comprehension', 'Texts and Meaning', 4),
            makeTopic('grammar', 'Grammar and Vocabulary', 'Language Use', 4),
            makeTopic('writing', 'Guided Writing', 'Writing and Composition', 4),
            makeTopic('literature', 'Literature and Response', 'Literary Appreciation', 3),
        ];
    }

    if (subject.includes('kiswahili') || subject.includes('swahili')) {
        return [
            makeTopic('kusikiliza', 'Kusikiliza na Kuzungumza', 'Mawasiliano ya Mdomo', 3),
            makeTopic('kusoma', 'Kusoma na Kufahamu', 'Uelewa wa Maandishi', 4),
            makeTopic('sarufi', 'Sarufi na Msamiati', 'Matumizi ya Lugha', 4),
            makeTopic('insha', 'Insha na Uandishi', 'Uandishi wa Kiswahili', 4),
            makeTopic('fasihi', 'Fasihi Simulizi na Andishi', 'Uhakiki na Ufafanuzi', 3),
        ];
    }

    if (subject.includes('biology')) {
        return [
            makeTopic('cell', 'Cell Structure and Functions', 'Basic Life Processes', 4),
            makeTopic('nutrition', 'Nutrition in Plants and Animals', 'Life Processes', 4),
            makeTopic('transport', 'Transport in Living Things', 'Movement of Materials', 4),
            makeTopic('respiration', 'Respiration and Gaseous Exchange', 'Energy Release', 4),
            makeTopic('reproduction', 'Reproduction and Growth', 'Continuity of Life', 4),
        ];
    }

    if (subject.includes('chemistry')) {
        return [
            makeTopic('matter', 'Matter and Its Properties', 'Nature of Matter', 3),
            makeTopic('atomic', 'Atomic Structure and Bonding', 'Particles and Structure', 4),
            makeTopic('separation', 'Separation of Mixtures', 'Practical Chemistry', 3),
            makeTopic('acids-bases', 'Acids, Bases and Salts', 'Reaction and Change', 5),
            makeTopic('metals', 'Metals and Their Reactivity', 'Chemistry in Industry', 4),
        ];
    }

    if (subject.includes('physics')) {
        return [
            makeTopic('measurement', 'Measurement and Error', 'Scientific Skills', 3),
            makeTopic('forces', 'Force and Motion', 'Mechanics', 5),
            makeTopic('energy', 'Energy, Work and Power', 'Energy Transformations', 4),
            makeTopic('heat', 'Heat and Temperature', 'Thermal Physics', 4),
            makeTopic('electricity', 'Electricity and Magnetism', 'Electrical Applications', 5),
        ];
    }

    if (subject.includes('geography')) {
        return [
            makeTopic('map-work', 'Map Work and Practical Skills', 'Geographical Skills', 4),
            makeTopic('weather', 'Weather and Climate', 'Physical Geography', 4),
            makeTopic('population', 'Population and Settlement', 'Human Geography', 4),
            makeTopic('resources', 'Resources and Economic Activities', 'Development Studies', 5),
            makeTopic('transport', 'Transport, Trade and Communication', 'Economic Geography', 4),
        ];
    }

    if (subject.includes('history')) {
        return [
            makeTopic('early-history', 'Early History and Migration', 'Origins and Settlement', 4),
            makeTopic('contact', 'Contact with the Outside World', 'Change and Continuity', 4),
            makeTopic('governance', 'Governance and Leadership', 'Civic Understanding', 4),
            makeTopic('citizenship', 'Citizenship and Responsibility', 'Rights and Duties', 3),
            makeTopic('democracy', 'Democracy and National Development', 'Nation Building', 4),
        ];
    }

    if (subject.includes('agric')) {
        return [
            makeTopic('soil', 'Soil and Soil Fertility', 'Crop Production', 4),
            makeTopic('crops', 'Crop Production Practices', 'Farm Planning', 4),
            makeTopic('livestock', 'Livestock Production', 'Animal Husbandry', 4),
            makeTopic('pests', 'Pests, Diseases and Control', 'Farm Management', 4),
            makeTopic('farm-tools', 'Farm Tools and Equipment', 'Practical Farm Work', 3),
        ];
    }

    if (subject.includes('business')) {
        return [
            makeTopic('business-env', 'Business Environment', 'Foundations of Business', 3),
            makeTopic('commerce', 'Commerce and Trade', 'Business Operations', 4),
            makeTopic('bookkeeping', 'Bookkeeping and Accounts', 'Financial Records', 5),
            makeTopic('marketing', 'Marketing and Customer Care', 'Selling and Growth', 4),
            makeTopic('entrepreneurship', 'Entrepreneurship and Enterprise', 'Business Start-up', 4),
        ];
    }

    return [
        makeTopic('foundation', `${selectedSubject || 'Subject'} Foundation`, 'Core concepts', 4),
        makeTopic('core-ideas', 'Key Ideas and Practice', 'Syllabus coverage', 4),
        makeTopic('application', 'Application and Revision', 'Classroom and exam practice', 3),
        makeTopic('assessment', 'Assessment and Review', 'Check understanding', 3),
    ];
};

const storageKeyFor = (selectedClass: string, selectedSubject: string) =>
    `soma_teacher_syllabus_${normalize(selectedClass)}_${normalize(selectedSubject)}`;

const riskTone = (progress: number) => {
    if (progress >= 75) return { label: 'On track', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    if (progress >= 40) return { label: 'Watch', className: 'border-amber-200 bg-amber-50 text-amber-700' };
    return { label: 'Behind', className: 'border-rose-200 bg-rose-50 text-rose-700' };
};

const mergeTopicStatuses = (templateTopics: SyllabusTopic[], savedTopics: Partial<SyllabusTopic>[]) =>
    templateTopics.map(topic => {
        const saved = savedTopics.find(entry => entry?.id === topic.id || entry?.title === topic.title);
        const status = saved?.status === 'IN_PROGRESS' || saved?.status === 'DONE' ? saved.status : topic.status;
        return { ...topic, status };
    });

const readSavedTopics = (raw: string | null): Partial<SyllabusTopic>[] => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const buildPersistPayload = (
    teacherId: string,
    selectedClass: string,
    selectedSubject: string,
    topics: SyllabusTopic[],
    progress: number,
    activeTopic: SyllabusTopic | undefined,
    riskLabel: string,
) => ({
    teacher_id: teacherId,
    class_name: selectedClass.trim(),
    subject: selectedSubject.trim(),
    topics,
    progress_percent: progress,
    active_topic: activeTopic?.title || null,
    risk_status: riskLabel,
    updated_at: new Date().toISOString(),
});

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({ teacherId, selectedClass, selectedSubject, onNavigate }) => {
    const templateTopics = React.useMemo(() => catalogBySubject(selectedSubject, selectedClass), [selectedClass, selectedSubject]);
    const storageKey = React.useMemo(() => storageKeyFor(selectedClass, selectedSubject), [selectedClass, selectedSubject]);
    const [topics, setTopics] = React.useState<SyllabusTopic[]>(templateTopics);
    const [syllabusDocs, setSyllabusDocs] = React.useState<SyllabusDocument[]>([]);
    const [docsLoading, setDocsLoading] = React.useState(false);
    const [syncStatus, setSyncStatus] = React.useState<SyncStatus>(teacherId ? 'SYNCING' : 'LOCAL');
    const skipNextPersistRef = React.useRef(false);

    const canTrack = Boolean(selectedClass.trim()) && Boolean(selectedSubject.trim());
    const completedCount = topics.filter(topic => topic.status === 'DONE').length;
    const progress = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
    const activeTopic = topics.find(topic => topic.status !== 'DONE') ?? topics[topics.length - 1];
    const risk = riskTone(progress);

    React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setTopics(templateTopics);
            setSyncStatus(teacherId ? 'SYNCING' : 'LOCAL');

            if (!canTrack) {
                setSyllabusDocs([]);
                return;
            }

            let nextTopics = templateTopics;
            let loadedFrom: SyncStatus = 'LOCAL';
            const localSaved = readSavedTopics(window.localStorage.getItem(storageKey));

            if (teacherId && navigator.onLine) {
                try {
                    const { data, error } = await supabase
                        .from('teacher_syllabus_progress')
                        .select('topics')
                        .eq('teacher_id', teacherId)
                        .eq('class_name', selectedClass.trim())
                        .eq('subject', selectedSubject.trim())
                        .maybeSingle();

                    if (!error && data?.topics) {
                        const cloudTopics = Array.isArray(data.topics) ? data.topics : readSavedTopics(JSON.stringify(data.topics));
                        if (cloudTopics.length > 0) {
                            nextTopics = mergeTopicStatuses(templateTopics, cloudTopics);
                            loadedFrom = 'SYNCED';
                        }
                    }
                } catch {
                    // Fall back to local copy below.
                }
            }

            if (loadedFrom !== 'SYNCED' && localSaved.length > 0) {
                nextTopics = mergeTopicStatuses(templateTopics, localSaved);
                loadedFrom = 'LOCAL';
            }

            skipNextPersistRef.current = true;
            if (!cancelled) {
                setTopics(nextTopics);
                setSyncStatus(loadedFrom);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [canTrack, selectedClass, selectedSubject, storageKey, teacherId, templateTopics]);

    React.useEffect(() => {
        if (!canTrack) return;

        try {
            window.localStorage.setItem(storageKey, JSON.stringify(topics));
        } catch {
            // Best-effort only.
        }

        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }

        if (!teacherId || !navigator.onLine) {
            setSyncStatus('LOCAL');
            return;
        }

        const persist = async () => {
            setSyncStatus('SYNCING');
            const payload = buildPersistPayload(teacherId, selectedClass, selectedSubject, topics, progress, activeTopic, risk.label);
            const { error } = await supabase
                .from('teacher_syllabus_progress')
                .upsert(payload, { onConflict: 'teacher_id,class_name,subject' });

            if (error) {
                console.warn('Could not sync syllabus progress:', error);
                setSyncStatus('ERROR');
                return;
            }

            setSyncStatus('SYNCED');
        };

        void persist();
    }, [activeTopic, canTrack, progress, risk.label, selectedClass, selectedSubject, storageKey, teacherId, topics]);

    React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!selectedClass.trim() || !selectedSubject.trim()) {
                setSyllabusDocs([]);
                return;
            }
            setDocsLoading(true);
            try {
                const baseQuery = () => supabase
                    .from('knowledge_base')
                    .select('id,title,grade,subject,file_url,file_path,created_at')
                    .eq('type', 'SYLLABUS')
                    .order('created_at', { ascending: false })
                    .limit(6);

                const gradeFilter = `%${selectedClass}%`;
                const subjectFilter = `%${selectedSubject}%`;
                const [gradeResult, subjectResult] = await Promise.all([
                    baseQuery().ilike('grade', gradeFilter),
                    baseQuery().ilike('subject', subjectFilter),
                ]);

                const combined = [...(gradeResult.data || []), ...(subjectResult.data || [])] as SyllabusDocument[];
                const deduped = combined.filter((doc, index, items) => index === items.findIndex(item => item.id === doc.id));
                if (!cancelled) setSyllabusDocs(deduped.slice(0, 6));
            } catch {
                if (!cancelled) setSyllabusDocs([]);
            } finally {
                if (!cancelled) setDocsLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [selectedClass, selectedSubject]);

    const updateTopicStatus = (topicId: string, status: TopicStatus) => {
        setTopics(current => current.map(topic => (topic.id === topicId ? { ...topic, status } : topic)));
    };

    const syncLabel = teacherId
        ? syncStatus === 'SYNCED'
            ? 'Cloud saved'
            : syncStatus === 'SYNCING'
                ? 'Saving'
                : syncStatus === 'ERROR'
                    ? 'Offline copy'
                    : 'Local copy'
        : 'Local only';

    return (
        <section className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600 mb-1">Syllabus Tracker</p>
                    <h3 className="text-lg font-black text-slate-900">Stay ahead of the syllabus deadline</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Track what has been covered, what is in progress, and what still needs a lesson plan.</p>
                </div>
                <div className="flex flex-wrap gap-2 self-start">
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${risk.className}`}>
                        <Clock3 className="w-3.5 h-3.5" />
                        {risk.label}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {syncLabel}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Coverage</p>
                    <p className="text-sm font-black text-slate-900">{progress}% complete</p>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] font-semibold text-slate-500">{canTrack ? `${completedCount} of ${topics.length} topics marked done.` : 'Pick a class and subject to begin tracking.'}</p>
                {!canTrack ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 space-y-3">
                        <p>Start by choosing a class and subject above. Once selected, the syllabus tracker will show real progress for that teaching pair.</p>
                        <button type="button" onClick={() => onNavigate('CREATION_HUB')} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 transition-colors">
                            Open Lesson Maker <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : null}
            </div>

            {canTrack ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:col-span-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Active topic</p>
                        <h4 className="mt-1 text-base font-black text-slate-900">{activeTopic?.title ?? 'No topic yet'}</h4>
                        <p className="mt-1 text-xs font-semibold text-slate-600">{activeTopic?.strand ?? 'Select a class and subject to load the starter syllabus.'}</p>
                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
                            <Sparkles className="w-3.5 h-3.5" />
                            {activeTopic ? `${activeTopic.estimatedWeeks} estimated week${activeTopic.estimatedWeeks === 1 ? '' : 's'}` : 'Ready for your first lesson'}
                        </div>
                    </div>
                    <div className="sm:col-span-2 xl:col-span-2 flex flex-col gap-2">
                        {topics.map(topic => (
                            <div key={topic.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-sm font-black text-slate-900">{topic.title}</h4>
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{topic.strand}</span>
                                        </div>
                                        <p className="mt-1 text-[11px] font-semibold text-slate-500">Estimated time: {topic.estimatedWeeks} week{topic.estimatedWeeks === 1 ? '' : 's'}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {(Object.keys(STATUS_LABELS) as TopicStatus[]).map(status => {
                                            const isActive = topic.status === status;
                                            return (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => updateTopicStatus(topic.id, status)}
                                                    className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${isActive ? STATUS_STYLES[status] : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-emerald-300 hover:text-emerald-700'}`}
                                                >
                                                    {STATUS_LABELS[status]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onNavigate('SCHEMES')} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 transition-colors">
                    Generate Scheme <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onNavigate('LESSON_PLAN_GENERATOR')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
                    Plan Next Lesson <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onNavigate('QUIZ')} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-700 hover:border-emerald-200 hover:text-emerald-700 transition-colors">
                    Create Quiz <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Official syllabus sources</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">Pulled from the curriculum library for this class and subject.</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">{docsLoading ? 'Loading' : `${syllabusDocs.length} found`}</span>
                </div>
                {syllabusDocs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-xs font-semibold text-slate-500">
                        {canTrack ? 'No syllabus record found yet. The starter tracker is still active, but this class/subject should be indexed in the knowledge base soon.' : 'Select a class and subject first, then we will look up the official syllabus records here.'}
                    </div>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {syllabusDocs.map(doc => (
                            <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 bg-white p-3 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                                <p className="text-sm font-black text-slate-900 line-clamp-2">{doc.title}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{doc.grade} • {doc.subject}</p>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};
