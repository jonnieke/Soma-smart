import { supabase } from '../lib/supabase';

export interface Transaction {
    id: string;
    user_id?: string;
    user: string; // Display name
    type: 'VERIFICATION' | 'SUBSCRIPTION';
    amount: number;
    method: 'MPESA' | 'CARD';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    date: string;
}

export interface AdminStats {
    totalRevenue: number;
    activeTrials: number;
    verifiedUsers: number;
    activePro: number;
}

export const initiateMpesaVerification = async (phoneNumber: string): Promise<{ success: boolean; message: string }> => {
    // 1. Create a Pending Transaction
    const { error } = await supabase.from('transactions').insert({
        amount: 1,
        type: 'VERIFICATION',
        status: 'SUCCESS', // Simulating instant success for demo
        method: 'MPESA',
        reference_code: phoneNumber, // storing phone as ref for now
        created_at: new Date().toISOString()
    });

    if (error) {
        console.error("Payment Error:", error);
        return { success: false, message: "Connection failed. Please try again." };
    }

    return { success: true, message: "STK Push sent! Payment received." };
};

export const initiateCardVerification = async (cardNumber: string): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase.from('transactions').insert({
        amount: 0,
        type: 'VERIFICATION',
        status: 'SUCCESS',
        method: 'CARD',
        reference_code: `CARD-***${cardNumber.slice(-4)}`,
        created_at: new Date().toISOString()
    });

    if (error) return { success: false, message: "Card processing failed." };
    return { success: true, message: "Card verified successfully!" };
};

export const getAdminStats = async (): Promise<AdminStats> => {
    // Fetch real aggregates
    const { data: txs, error } = await supabase.from('transactions').select('*');

    if (error || !txs) return { totalRevenue: 0, activeTrials: 0, verifiedUsers: 0, activePro: 0 };

    const totalRevenue = txs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const activeTrials = txs.filter(t => t.type === 'VERIFICATION').length;
    const verifiedUsers = txs.filter(t => t.status === 'SUCCESS').length;
    const activePro = txs.filter(t => t.type === 'SUBSCRIPTION').length;

    return { totalRevenue, activeTrials, verifiedUsers, activePro };
};

export const getTransactions = async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error || !data) return [];

    return data.map((t: any) => ({
        id: t.id,
        user: t.reference_code || 'Unknown User',
        type: t.type,
        amount: t.amount,
        method: t.method || 'MPESA',
        status: t.status,
        date: new Date(t.created_at).toLocaleString()
    }));
};
