import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
    MessageCircle,
    Phone,
    Mail,
    Clock,
    MapPin,
    Copy,
    Check,
    ArrowLeft,
    HelpCircle,
    ChevronDown,
    Sparkles,
    User,
    Tag,
    MessageSquare,
    ExternalLink,
    ShieldCheck,
    Headphones
} from 'lucide-react';
import { buildWhatsAppUrl, openWhatsAppShare } from '../services/whatsappService';

const TARGET_WHATSAPP_NUMBER = '0722763760'; // Normalized internally to 254722763760
const DISPLAY_PHONE_NUMBER = '+254 722 763 760';

interface FAQItem {
    question: string;
    answer: string;
}

const FAQS: FAQItem[] = [
    {
        question: 'How quickly will I get a response on WhatsApp?',
        answer: 'Our support team and AI assistance reply almost instantly on WhatsApp during working hours (7:00 AM - 8:00 PM EAT, Monday to Saturday).'
    },
    {
        question: 'What information should I include in my query?',
        answer: 'Please include your full name, role (Learner, Parent, Teacher, or School Admin), and a short description of what you need help with (e.g., M-Pesa payment verification, revision papers access, or school portal setup).'
    },
    {
        question: 'Can I pay for subscription directly via M-Pesa?',
        answer: 'Yes! You can complete subscription payments directly on our Pricing page via M-Pesa or reach out to our WhatsApp support team at 0722763760 for direct guidance.'
    },
    {
        question: 'How can schools enroll multiple learners or teachers?',
        answer: 'School administrators can request custom bulk packages. Fill out the contact form selecting "School Package / Bulk Access" as your category, and our team will get in touch with specialized pricing.'
    }
];

const INQUIRY_PRESETS = [
    {
        id: 'mpesa',
        label: 'M-Pesa & Pricing Help',
        category: 'Subscription & Billing',
        message: 'Hi Soma AI support team, I need help with M-Pesa subscription payment / plan activation.'
    },
    {
        id: 'revision',
        label: 'Revision Papers & KCSE',
        category: 'Revision & Exam Papers',
        message: 'Hello, I have a question regarding CBC / KCSE revision papers and marking schemes.'
    },
    {
        id: 'school',
        label: 'School Package Setup',
        category: 'School Packages',
        message: 'Hi, we are interested in setting up Soma AI for our school learners and teachers.'
    },
    {
        id: 'akili',
        label: 'Ask Akili AI Guidance',
        category: 'Technical Support',
        message: 'Hi, I need assistance using Ask Akili AI tutor for step-by-step revision.'
    }
];

export const ContactUsPage: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        contactInfo: '',
        role: 'Learner',
        category: 'General Inquiry',
        message: ''
    });

    const [copied, setCopied] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const formatWhatsAppMessage = (): string => {
        const nameText = formData.fullName.trim() || '[Your Name]';
        const contactText = formData.contactInfo.trim() || '[Your Phone/Email]';
        const roleText = formData.role;
        const categoryText = formData.category;
        const messageBody = formData.message.trim() || 'I have a query regarding Soma AI services.';

        return [
            '👋 *Soma AI Contact Query*',
            '----------------------------------',
            `👤 *Name:* ${nameText}`,
            `📞 *Contact:* ${contactText}`,
            `🎓 *Role:* ${roleText}`,
            `📌 *Category:* ${categoryText}`,
            '',
            '💬 *Message:*',
            messageBody,
            '----------------------------------',
            'Sent via Soma AI Contact Page (somaai.co.ke)'
        ].join('\n');
    };

    const formattedMessage = formatWhatsAppMessage();
    const whatsappLink = buildWhatsAppUrl(formattedMessage, TARGET_WHATSAPP_NUMBER);

    const handleSendWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        openWhatsAppShare(formattedMessage, TARGET_WHATSAPP_NUMBER);
    };

    const handleQuickPresetSelect = (preset: typeof INQUIRY_PRESETS[0]) => {
        setFormData(prev => ({
            ...prev,
            category: preset.category,
            message: preset.message
        }));
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(formattedMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const toggleFaq = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <Helmet>
                <title>Contact Us - Soma AI | WhatsApp Support 0722763760</title>
                <meta
                    name="description"
                    content="Get in touch with Soma AI. Chat with our support team directly on WhatsApp (0722763760) for instant assistance on revision papers, subscription plans, and school setups."
                />
            </Helmet>

            {/* Header Navigation */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
                                S
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-slate-900">
                                Soma<span className="text-emerald-600">AI</span>
                            </span>
                        </Link>
                    </div>

                    <a
                        href={`https://wa.me/254722763760?text=${encodeURIComponent('Hi Soma AI, I need assistance.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all transform hover:scale-[1.02]"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp 0722763760</span>
                    </a>
                </div>
            </header>

            {/* Hero Banner */}
            <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
                
                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full">
                        <Sparkles className="w-3.5 h-3.5" /> Direct WhatsApp Support
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                        We&apos;re Here to Help You <span className="text-emerald-400">Succeed</span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Have a question about revision papers, M-Pesa payments, or school packages? Send your query directly to our WhatsApp support number <span className="text-emerald-400 font-bold underline decoration-emerald-500/50">0722763760</span> for quick assistance!
                    </p>
                </div>
            </section>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                {/* Contact Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Card 1: WhatsApp Support */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 relative z-10">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black tracking-wider text-emerald-600 uppercase">Fastest Response</span>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">WhatsApp Chat</h3>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                            Send direct queries or chat with our team on WhatsApp.
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-base">{DISPLAY_PHONE_NUMBER}</span>
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                            >
                                <span>Chat Now</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Card 2: Call Support */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-sky-600/30 relative z-10">
                            <Phone className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black tracking-wider text-sky-600 uppercase">Direct Helpline</span>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">Call Us Directly</h3>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                            Available Mon - Sat, 7:00 AM - 8:00 PM EAT.
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-base">0722 763 760</span>
                            <a
                                href="tel:0722763760"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg group-hover:bg-sky-600 group-hover:text-white transition-colors"
                            >
                                <span>Call Line</span>
                                <Phone className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Card 3: Email Support */}
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-purple-600/30 relative z-10">
                            <Mail className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black tracking-wider text-purple-600 uppercase">Official Email</span>
                        <h3 className="text-xl font-bold text-slate-900 mt-1">Email Desk</h3>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                            For official correspondence, partnerships and invoices.
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm truncate">info@somaai.co.ke</span>
                            <a
                                href="mailto:info@somaai.co.ke"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors"
                            >
                                <span>Send Mail</span>
                                <Mail className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Form & Preview Container */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    {/* Left Column: Form (7 cols) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Send WhatsApp Query</h2>
                                <p className="text-slate-500 text-xs sm:text-sm">
                                    Fill out the form below to push your query directly to WhatsApp <span className="font-bold text-emerald-600">0722763760</span>.
                                </p>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Quick Topic Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {INQUIRY_PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handleQuickPresetSelect(preset)}
                                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex flex-col justify-between ${
                                            formData.category === preset.category
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Tag className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSendWhatsApp} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="e.g. Jane Wanjiru"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Phone or Email */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Your Phone Number / Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                                    <input
                                        required
                                        type="text"
                                        value={formData.contactInfo}
                                        onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
                                        placeholder="e.g. 0712345678 or jane@gmail.com"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Role and Category Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        I am a...
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all"
                                    >
                                        <option value="Learner">Learner / Student</option>
                                        <option value="Parent">Parent / Guardian</option>
                                        <option value="Teacher">Teacher / Educator</option>
                                        <option value="School Admin">School Administrator</option>
                                        <option value="General">Other / Visitor</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Inquiry Topic
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all"
                                    >
                                        <option value="Subscription & Billing">Subscription & Billing</option>
                                        <option value="Revision & Exam Papers">Revision & Exam Papers</option>
                                        <option value="Technical Support">Technical Support</option>
                                        <option value="School Packages">School Packages / Bulk</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                    </select>
                                </div>
                            </div>

                            {/* Query Message */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Your Query / Details <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Please describe how we can assist you..."
                                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none text-sm transition-all resize-none"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>Send Query via WhatsApp (0722763760)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCopyMessage}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                                    title="Copy text preview to clipboard"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-emerald-600" />
                                            <span className="text-emerald-700">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 text-slate-500" />
                                            <span>Copy Message</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Live WhatsApp Message Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* WhatsApp Message Preview Card */}
                        <div className="bg-[#efeae2] rounded-3xl p-6 shadow-xl border border-slate-200/80 relative overflow-hidden">
                            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/10 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-[#128C7E] text-white flex items-center justify-center font-bold text-xs">
                                        SA
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">Soma AI WhatsApp Target</h4>
                                        <p className="text-[11px] text-emerald-700 font-medium">+254 722 763 760</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                    Live Message Preview
                                </span>
                            </div>

                            {/* Chat Bubble */}
                            <div className="bg-[#dcf8c6] text-slate-900 p-4 rounded-2xl rounded-tr-none shadow-md text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed border border-emerald-200">
                                {formattedMessage}
                            </div>

                            <p className="text-[11px] text-slate-500 text-center mt-4">
                                Clicking &quot;Send Query via WhatsApp&quot; will open WhatsApp pre-filled with this formatted message.
                            </p>
                        </div>

                        {/* Support Details Box */}
                        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                                <Headphones className="w-5 h-5" /> Support Availability
                            </h3>
                            <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                                <li className="flex items-start gap-3">
                                    <Clock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-white">Working Hours:</span>
                                        <p className="text-slate-400 text-xs">Monday - Saturday: 7:00 AM - 8:00 PM EAT</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-white">Instant AI & Human Assist:</span>
                                        <p className="text-slate-400 text-xs">Akili AI assists 24/7 on website; human support acts fast on WhatsApp 0722763760.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-white">Headquarters:</span>
                                        <p className="text-slate-400 text-xs">Nairobi, Kenya</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Frequently Asked Questions Section */}
                <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/80 mb-12">
                    <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                            <HelpCircle className="w-3.5 h-3.5" /> Got Questions?
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
                        <p className="text-slate-600 text-sm">
                            Everything you need to know about contacting Soma AI support.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto divide-y divide-slate-200">
                        {FAQS.map((faq, index) => (
                            <div key={index} className="py-4">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between text-left font-bold text-slate-900 hover:text-emerald-600 text-base transition-colors py-2"
                                >
                                    <span>{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-slate-400 transition-transform ${
                                            openFaqIndex === index ? 'rotate-180 text-emerald-600' : ''
                                        }`}
                                    />
                                </button>
                                {openFaqIndex === index && (
                                    <p className="mt-2 text-sm text-slate-600 leading-relaxed pr-8 animate-fadeIn">
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
                    <p>© {new Date().getFullYear()} Soma AI. All rights reserved.</p>
                    <p className="flex items-center justify-center gap-4 text-slate-500">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <span>•</span>
                        <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <span>•</span>
                        <Link to="/guide" className="hover:text-white transition-colors">Guide</Link>
                        <span>•</span>
                        <a href={`https://wa.me/254722763760`} target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">WhatsApp 0722763760</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ContactUsPage;
