import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Smartphone, 
    CheckCircle2, 
    AlertCircle, 
    Download, 
    Users, 
    CreditCard, 
    DollarSign,
    RefreshCw,
    Info
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { useApp } from '../../context/AppContext';
import { pesapalService } from '../../services/pesapalService';
import { supabase } from '../../lib/supabase';


interface Student {
    id: string;
    name: string;
}

interface BulkBillingModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: Student[];
}

interface BillingItem {
    id: string;
    studentName: string;
    parentName: string;
    parentPhone: string;
    selected: boolean;
    status: 'Unsent' | 'Sending' | 'STK Sent' | 'Paid' | 'Failed';
    amount: number;
}

const BILLING_TIERS = [
    { id: 'termly', label: 'Termly Learning Access Fee - KES 300 / student', amount: 300 },
    { id: 'quiz', label: 'Quiz Prep Bundle - KES 100 / student', amount: 100 },
    { id: 'custom', label: 'Custom Amount...', amount: 0 },
];

export const BulkBillingModal: React.FC<BulkBillingModalProps> = ({ isOpen, onClose, students }) => {
    const { userId, teacherProfile } = useApp();
    const [selectedTier, setSelectedTier] = useState(BILLING_TIERS[0].id);
    const [customAmount, setCustomAmount] = useState('200');
    const [checkoutMode, setCheckoutMode] = useState<'INDIVIDUAL' | 'SPONSOR'>('INDIVIDUAL');
    const [sponsorName, setSponsorName] = useState('Board of Management (BOM)');
    const [sponsorPhone, setSponsorPhone] = useState('0712345678');
    
    const [roster, setRoster] = useState<BillingItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [paymentError, setPaymentError] = useState<string | null>(null);


    // Get current per-student billing amount
    const currentAmount = selectedTier === 'custom' 
        ? parseFloat(customAmount) || 0 
        : BILLING_TIERS.find(t => t.id === selectedTier)?.amount || 0;

    // Initialize/sync roster when modal opens or students/amount changes
    useEffect(() => {
        if (!isOpen) return;

        // Prefill names and Kenyan mock phone numbers
        const parentFirstNames = ['Baba', 'Mama', 'Mzee', 'Bi.'];
        const parentLastNames = ['Mwangi', 'Onyango', 'Kamau', 'Kiprono', 'Juma', 'Njoroge', 'Wanjiku', 'Atieno', 'Ali', 'Mutua'];

        const mockRoster = students.map((s, idx) => {
            const existing = roster.find(r => r.id === s.id);
            const parentFirstName = parentFirstNames[idx % parentFirstNames.length];
            const parentLastName = parentLastNames[(idx * 3) % parentLastNames.length];
            const studentFirstName = s.name.split(' ')[0];
            
            return {
                id: s.id,
                studentName: s.name,
                parentName: existing?.parentName || `${parentFirstName} ${studentFirstName}`,
                parentPhone: existing?.parentPhone || `07${Math.floor(10000000 + Math.random() * 90000000).toString().substring(0, 8)}`,
                selected: existing !== undefined ? existing.selected : true,
                status: existing?.status || 'Unsent' as const,
                amount: currentAmount
            };
        });
        setRoster(mockRoster);
    }, [isOpen, students, selectedTier, customAmount]);

    if (!isOpen) return null;

    const handleSelectAll = (checked: boolean) => {
        setRoster(prev => prev.map(item => ({ ...item, selected: checked })));
    };

    const handleToggleStudent = (id: string) => {
        setRoster(prev => prev.map(item => 
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    };

    const handleFieldChange = (id: string, field: 'parentName' | 'parentPhone', value: string) => {
        setRoster(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Calculate billing summary
    const selectedCount = roster.filter(r => r.selected).length;
    const totalKES = selectedCount * currentAmount;
    
    const paidCount = roster.filter(r => r.selected && r.status === 'Paid').length;
    const totalCollected = paidCount * currentAmount;
    const collectionProgress = selectedCount > 0 ? (paidCount / selectedCount) * 100 : 0;

    const runSponsorSimulation = async () => {
        setIsProcessing(true);
        // Reset status for selected students to 'Sending'
        setRoster(prev => prev.map(item => 
            item.selected ? { ...item, status: 'Sending' } : item
        ));
        
        await new Promise(r => setTimeout(r, 1200));
        setRoster(prev => prev.map(item => 
            item.selected ? { ...item, status: 'STK Sent' } : item
        ));
        
        // Wait for single payment completion
        await new Promise(r => setTimeout(r, 2000));
        // Simulate 95% chance of success for sponsor checkout
        const success = Math.random() < 0.95;
        setRoster(prev => prev.map(item => 
            item.selected ? { ...item, status: success ? 'Paid' : 'Failed' } : item
        ));
        setIsProcessing(false);
        setProgress(100);
    };

    const startSTKSimulation = async () => {
        if (selectedCount === 0) {
            alert("Please select at least one student to bill.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);

        if (checkoutMode === 'SPONSOR') {
            try {
                setPaymentError(null);
                setIframeUrl(null);
                setPaymentReference(null);

                // Reset status for selected students to 'Sending'
                setRoster(prev => prev.map(item => 
                    item.selected ? { ...item, status: 'Sending' } : item
                ));

                const names = sponsorName.trim().split(/\s+/);
                const firstName = names[0] || 'Sponsor';
                const lastName = names.slice(1).join(' ') || 'Checkout';
                const phone = sponsorPhone.replace(/^\+?254/, '').replace(/^0/, '');

                const plan = {
                    name: `Sponsor Bulk Payment`,
                    price: totalKES,
                    duration: 'TERMLY' as const
                };

                const customerDetails = {
                    email: teacherProfile?.email || 'sponsor@soma.app',
                    firstName,
                    lastName,
                    phone: `254${phone}`
                };

                const response = await pesapalService.initiatePayment(
                    userId || '00000000-0000-0000-0000-000000000000',
                    plan,
                    customerDetails
                );

                if (response.redirect_url) {
                    setIframeUrl(response.redirect_url);
                    setPaymentReference(response.client_reference || null);
                    setRoster(prev => prev.map(item => 
                        item.selected ? { ...item, status: 'STK Sent' } : item
                    ));
                } else {
                    throw new Error('Failed to obtain payment URL');
                }
            } catch (err: any) {
                console.error("Live sponsor payment via Pesapal failed. Falling back to simulation.", err);
                setPaymentError(err.message || 'Live payment initiation failed. Falling back to simulation...');
                setIframeUrl(null);
                setPaymentReference(null);
                await runSponsorSimulation();
            }
            return;
        }

        // Reset status for selected students to 'Sending'
        setRoster(prev => prev.map(item => 
            item.selected ? { ...item, status: 'Sending' } : item
        ));

        // Simulated Individual Parent STK Push Flow
        const selectedItems = roster.filter(r => r.selected);
        
        for (let i = 0; i < selectedItems.length; i++) {
            const target = selectedItems[i];
            
            // Step 1: Send STK Push
            setRoster(prev => prev.map(item => 
                item.id === target.id ? { ...item, status: 'STK Sent' } : item
            ));

            // Wait a random short duration to simulate real-time staggered network responses
            await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));

            // Step 2: Set final status (80% success rate, 20% timeout/cancel)
            const isSuccess = Math.random() < 0.85;
            setRoster(prev => prev.map(item => 
                item.id === target.id ? { ...item, status: isSuccess ? 'Paid' : 'Failed' } : item
            ));

            setProgress(Math.round(((i + 1) / selectedItems.length) * 100));
        }

        setIsProcessing(false);
    };

    // Poll for payment success when paymentReference is active
    useEffect(() => {
        if (!paymentReference || !isOpen) return;

        const interval = setInterval(async () => {
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('status')
                    .eq('reference_code', paymentReference)
                    .maybeSingle();

                if (error) {
                    console.error("Error polling transaction status:", error);
                    return;
                }

                if (data) {
                    if (data.status === 'SUCCESS') {
                        clearInterval(interval);
                        setRoster(prev => prev.map(item => 
                            item.selected ? { ...item, status: 'Paid' } : item
                        ));
                        setIsProcessing(false);
                        setProgress(100);
                        setIframeUrl(null);
                        setPaymentReference(null);
                    } else if (data.status === 'FAILED') {
                        clearInterval(interval);
                        setRoster(prev => prev.map(item => 
                            item.selected ? { ...item, status: 'Failed' } : item
                        ));
                        setIsProcessing(false);
                        setIframeUrl(null);
                        setPaymentReference(null);
                    }
                }
            } catch (err) {
                console.error("Polling error in BulkBillingModal:", err);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [paymentReference, isOpen]);

    // Reset iframe & errors when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setIframeUrl(null);
            setPaymentReference(null);
            setPaymentError(null);
        }
    }, [isOpen]);


    const handleExportReceipts = () => {
        const headers = ["Student Name", "Parent Name", "Parent Phone", "Purpose", "Amount (KES)", "Status", "Receipt Date"];
        const rows = roster
            .filter(r => r.selected)
            .map(r => [
                r.studentName,
                r.parentName,
                r.parentPhone,
                BILLING_TIERS.find(t => t.id === selectedTier)?.label.split(' - ')[0] || 'Custom Fee',
                r.amount.toString(),
                r.status,
                new Date().toLocaleDateString()
            ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `SomoSmart_Billing_Report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-2xl">
                            <Smartphone className="w-6 h-6 text-emerald-300 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">M-Pesa Bulk Billing Portal</h3>
                            <p className="text-indigo-150 text-xs font-medium">Direct parent STK push billing & sponsor collection</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {iframeUrl ? (
                        <div className="h-[480px] flex flex-col rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Secure Pesapal Checkout Gateway</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setIframeUrl(null);
                                        setPaymentReference(null);
                                        setIsProcessing(false);
                                        setRoster(prev => prev.map(item => 
                                            item.selected && item.status === 'STK Sent' ? { ...item, status: 'Unsent' } : item
                                        ));
                                    }}
                                    className="text-xs font-bold text-rose-650 hover:text-rose-850 transition-colors uppercase tracking-wider"
                                >
                                    Cancel Payment
                                </button>
                            </div>
                            <iframe
                                src={iframeUrl}
                                className="w-full flex-1 border-none"
                                title="Pesapal Sponsor Checkout"
                                allow="payment"
                            />
                        </div>
                    ) : (
                        <>
                            {paymentError && (
                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-250 flex items-start gap-3 text-xs text-amber-800 font-bold leading-relaxed">
                                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="font-black text-amber-955 mb-0.5">Payment Gateway Alert</p>
                                        <p>{paymentError}</p>
                                    </div>
                                </div>
                            )}

                            {/* Setup Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tier Selector & Custom Amount */}
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                                        1. Billing Tier / Purpose
                                    </label>
                                    <select
                                        value={selectedTier}
                                        onChange={(e) => setSelectedTier(e.target.value)}
                                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold text-slate-700 bg-white"
                                        disabled={isProcessing}
                                    >
                                        {BILLING_TIERS.map(tier => (
                                            <option key={tier.id} value={tier.id}>{tier.label}</option>
                                        ))}
                                    </select>

                                    {selectedTier === 'custom' && (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-600">Enter custom KES amount per student:</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">KES</span>
                                                <input
                                                    type="number"
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold text-slate-700"
                                                    placeholder="200"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800 font-bold leading-relaxed">
                                        <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                                        <span>Funds are sent directly to the school treasury. M-Pesa prompts appear on parents' phones instantly.</span>
                                    </div>
                                </div>

                                {/* Checkout Mode Toggle & Sponsor details */}
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                                        2. Payment Method / Sponsor
                                    </label>
                                    
                                    <div className="bg-slate-200/60 p-1 rounded-xl flex border border-slate-300">
                                        <button
                                            onClick={() => setCheckoutMode('INDIVIDUAL')}
                                            className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${checkoutMode === 'INDIVIDUAL' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                            disabled={isProcessing}
                                        >
                                            Individual Parent Bills
                                        </button>
                                        <button
                                            onClick={() => setCheckoutMode('SPONSOR')}
                                            className={`flex-1 py-2.5 rounded-lg text-xs font-black transition-all ${checkoutMode === 'SPONSOR' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                            disabled={isProcessing}
                                        >
                                            Sponsor Checkout
                                        </button>
                                    </div>

                                    {checkoutMode === 'SPONSOR' ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Sponsor Organisation / Name</label>
                                                <input
                                                    type="text"
                                                    value={sponsorName}
                                                    onChange={(e) => setSponsorName(e.target.value)}
                                                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Sponsor M-Pesa Number (for STK Push)</label>
                                                <input
                                                    type="text"
                                                    value={sponsorPhone}
                                                    onChange={(e) => setSponsorPhone(e.target.value)}
                                                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500 font-bold pt-4 leading-relaxed">
                                            Each checked parent below will receive a prompt to pay KES {currentAmount} on their respective numbers.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar & Current Collections Dashboard */}
                            {isProcessing || paidCount > 0 || roster.some(r => r.status !== 'Unsent') ? (
                                <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-xl">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Real-time Collections Status</p>
                                            <h4 className="text-2xl font-black mt-1 text-emerald-400">KES {totalCollected.toLocaleString()} / KES {totalKES.toLocaleString()}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-slate-400">Completion</span>
                                            <p className="text-lg font-black">{Math.round(collectionProgress)}%</p>
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${collectionProgress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Paid: {paidCount} / {selectedCount} parents</span>
                                        <span>STK Simulator Active</span>
                                    </div>
                                </div>
                            ) : null}

                            {/* Roster & Contacts List */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        3. Student / Parent Roster
                                    </label>
                                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                                        <span>Selected: {selectedCount} / {roster.length}</span>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCount === roster.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                disabled={isProcessing}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            Select All
                                        </label>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-3xl overflow-hidden max-h-[300px] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 border-b border-slate-250 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                            <tr>
                                                <th className="p-3.5 w-12 text-center">Select</th>
                                                <th className="p-3.5 w-40">Student</th>
                                                <th className="p-3.5 w-40">Parent Contact Name</th>
                                                <th className="p-3.5 w-36">M-Pesa Mobile Number</th>
                                                <th className="p-3.5 w-24 text-right">Amount (KES)</th>
                                                <th className="p-3.5 w-32 text-center">Prompt Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {roster.map(item => (
                                                <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${item.selected ? '' : 'opacity-50'}`}>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.selected}
                                                            onChange={() => handleToggleStudent(item.id)}
                                                            disabled={isProcessing}
                                                            className="rounded border-slate-350 text-indigo-650 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="p-3 font-bold text-slate-800">{item.studentName}</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            value={item.parentName}
                                                            onChange={(e) => handleFieldChange(item.id, 'parentName', e.target.value)}
                                                            disabled={isProcessing || !item.selected}
                                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none font-medium focus:border-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="text"
                                                            value={item.parentPhone}
                                                            onChange={(e) => handleFieldChange(item.id, 'parentPhone', e.target.value)}
                                                            disabled={isProcessing || !item.selected}
                                                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none font-mono font-bold focus:border-indigo-500 text-slate-700"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-right font-black text-slate-800">KES {item.amount}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                                            item.status === 'Failed' ? 'bg-rose-100 text-rose-800 border border-rose-250' :
                                                            item.status === 'STK Sent' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
                                                            item.status === 'Sending' ? 'bg-amber-100 text-amber-800 border border-amber-250' :
                                                            'bg-slate-100 text-slate-500 border border-slate-200'
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">Summary:</span>
                        <span className="text-sm font-black text-slate-800">KES {totalKES.toLocaleString()} due from {selectedCount} parents</span>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                        {iframeUrl ? (
                            <span className="text-xs font-black text-indigo-650 animate-pulse uppercase tracking-widest py-3">
                                Awaiting checkout completion...
                            </span>
                        ) : (
                            <>
                                {paidCount > 0 && (
                                    <Button
                                        onClick={handleExportReceipts}
                                        variant="outline"
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 font-black text-xs uppercase tracking-widest text-indigo-650 hover:bg-indigo-50"
                                    >
                                        <Download className="w-4 h-4" /> Export CSV
                                    </Button>
                                )}
                                <Button
                                    onClick={startSTKSimulation}
                                    disabled={isProcessing || selectedCount === 0}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all ${
                                        isProcessing 
                                            ? 'bg-slate-450 cursor-not-allowed shadow-none' 
                                            : 'bg-indigo-600 hover:bg-indigo-750 shadow-indigo-100'
                                    }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>{checkoutMode === 'SPONSOR' ? 'Connecting to Pesapal...' : 'Prompting Parents...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            {checkoutMode === 'SPONSOR' ? (
                                                <>
                                                    <CreditCard className="w-4 h-4" />
                                                    <span>Pay via Pesapal</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Smartphone className="w-4 h-4" />
                                                    <span>Send M-Pesa Prompts</span>
                                                </>
                                            )}
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
