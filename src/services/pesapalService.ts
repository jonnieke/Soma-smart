import { supabase } from '../lib/supabase';
import { SubscriptionPlan } from '../types';

/**
 * Pesapal Service
 * Connects the frontend to the Supabase Edge Function 'pesapal'
 */
export const pesapalService = {
    /**
     * Initiates a payment and returns the redirect_url for the iframe
     */
    async initiatePayment(userId: string, plan: SubscriptionPlan, customer: { email: string, firstName: string, lastName: string, phone: string }) {
        const reference = `SUB-${userId.slice(0, 5)}-${Date.now()}`;

        // 1. Record pending transaction in Supabase first
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: plan.price,
            type: 'SUBSCRIPTION',
            status: 'PENDING',
            method: 'MPESA', // Default method for tracking
            reference_code: reference,
            created_at: new Date().toISOString()
        });

        // 2. Call Edge Function
        const { data, error } = await supabase.functions.invoke('pesapal', {
            body: {
                path: 'initiate-order', // Note: My internal path handler in edge function
                amount: plan.price,
                description: `Soma Smart ${plan.name} Subscription`,
                reference: reference,
                callback_url: `${window.location.origin}/pricing?status=verifying&ref=${reference}`,
                billing_address: {
                    email_address: customer.email,
                    phone_number: customer.phone,
                    first_name: customer.firstName,
                    last_name: customer.lastName,
                    country_code: "KE"
                }
            }
        });

        if (error) throw error;
        return data; // contains redirect_url
    },

    /**
     * Checks the status of a specific order
     */
    async checkTransactionStatus(orderTrackingId: string) {
        const { data, error } = await supabase.functions.invoke('pesapal', {
            body: {
                path: 'check-status',
                OrderTrackingId: orderTrackingId
            }
        });

        if (error) throw error;
        return data;
    }
};
