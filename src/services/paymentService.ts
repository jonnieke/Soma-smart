import { getAdminPaymentRows } from './transactionAccessService';

export interface Transaction {
    id: string;
    user_id?: string;
    user: string;
    type: string;
    amount: number;
    method: string;
    status: string;
    date: string;
}
export interface AdminStats {
    totalRevenue: number; activeTrials: number; verifiedUsers: number; activePro: number;
}
// Never simulate paid transactions in the browser.
export const initiateMpesaVerification = async (_phoneNumber: string) => ({
    success: false, message: 'Use the secure M-Pesa checkout to verify a payment.'
});
export const initiateCardVerification = async (_cardNumber: string) => ({
    success: false, message: 'Use the secure checkout to verify a card payment.'
});
export const getAdminStats = async (): Promise<AdminStats> => {
    const txs = await getAdminPaymentRows();
    const paid = txs.filter((t: any) => t.status === 'SUCCESS');
    return {
        totalRevenue: paid.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
        activeTrials: paid.filter((t: any) => t.type === 'VERIFICATION').length,
        verifiedUsers: new Set(paid.map((t: any) => t.user_id).filter(Boolean)).size,
        activePro: new Set(paid.filter((t: any) => t.type === 'SUBSCRIPTION').map((t: any) => t.user_id).filter(Boolean)).size,
    };
};
export const getTransactions = async (): Promise<Transaction[]> => {
    const rows = await getAdminPaymentRows();
    return rows.map((t: any) => ({ id: t.id, user_id: t.user_id, user: t.user, type: t.type,
        amount: t.amount, method: 'Not recorded in report', status: t.status,
        date: new Date(t.created_at).toLocaleString() }));
};
