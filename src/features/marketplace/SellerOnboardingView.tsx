import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Shield, CheckCircle, ArrowRight, Building2, Phone, Mail, Award } from 'lucide-react';
import { paperBankMarketplaceService } from '../../services/paperBankMarketplaceService';

export const SellerOnboardingView: React.FC = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<'teacher' | 'school'>('teacher');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [county, setCounty] = useState('Nairobi');
  const [school, setSchool] = useState('');
  const [mpesaPayoutNumber, setMpesaPayoutNumber] = useState('');
  const [copyrightAccepted, setCopyrightAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyrightAccepted) return;

    paperBankMarketplaceService.submitSellerApplication({
      userId: 'teacher_user',
      fullName,
      accountType,
      phone,
      email,
      county,
      school,
      subjects: ['Mathematics', 'Science'],
      grades: ['Form 4', 'Grade 6'],
      teachingExperienceYears: 5,
      mpesaPayoutNumber,
      copyrightDeclarationAccepted: copyrightAccepted,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Seller Application Submitted!</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Your seller application is now under review by the Soma Paper Bank moderation team. You will be notified once verified.
        </p>
        <button
          onClick={() => navigate('/teacher/seller/earnings')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors inline-flex items-center gap-2"
        >
          Go to Seller Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-indigo-600" /> Soma Paper Bank Seller Onboarding
        </h1>
        <p className="text-xs text-slate-500 mt-1">Join trusted Kenyan teachers and schools earning royalties from original examination papers.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-sm">
        {/* Account Type */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType('teacher')}
              className={`p-4 rounded-2xl border text-left font-bold text-xs transition-colors flex items-center gap-3 ${
                accountType === 'teacher' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900' : 'border-slate-200 dark:border-slate-700 text-slate-600'
              }`}
            >
              <UserCheck className="w-5 h-5 text-indigo-600" /> Individual Teacher
            </button>
            <button
              type="button"
              onClick={() => setAccountType('school')}
              className={`p-4 rounded-2xl border text-left font-bold text-xs transition-colors flex items-center gap-3 ${
                accountType === 'school' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900' : 'border-slate-200 dark:border-slate-700 text-slate-600'
              }`}
            >
              <Building2 className="w-5 h-5 text-indigo-600" /> School Institution
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Full Name / School Name</label>
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Mwalimu Kamau" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">M-Pesa Payout Number</label>
            <input required type="tel" value={mpesaPayoutNumber} onChange={(e) => setMpesaPayoutNumber(e.target.value)} placeholder="07XXXXXXXX" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Email Address</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@school.co.ke" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">County</label>
            <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
              {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Uasin Gishu'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Copyright Declaration */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800 space-y-3">
          <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-600" /> Seller Terms &amp; Copyright Declaration
          </h4>
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={copyrightAccepted} onChange={(e) => setCopyrightAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
            <span>I confirm that all published examination resources will be my original work or school-owned materials with legal distribution rights. Copied, leaked, or unauthorized content is strictly prohibited.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!copyrightAccepted}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
        >
          Submit Seller Application <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
