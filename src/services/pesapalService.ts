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
    async initiatePayment(userId: string, plan: SubscriptionPlan, customer: { email: string, firstName: string, lastName: string, phone: string }, materialId?: string) {
        // Encode duration in reference for Edge Function to parse
        const reference = plan.isCreditPack
            ? `CREDIT_${plan.credits || 0}_${userId.slice(0, 5)}_${Date.now()}`
            : `SUB_${plan.duration}_${userId.slice(0, 5)}_${Date.now()}`;

        // ... existing transaction logic ...
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: plan.price,
            type: plan.isCreditPack ? 'CREDIT_PACK' : 'SUBSCRIPTION',
            status: 'PENDING',
            method: 'MPESA',
            reference_code: reference,
            description: plan.isCreditPack ? `${plan.credits || 0} learning credits` : `Somo Smart ${plan.name}`,
            created_at: new Date().toISOString()
        });

        // Construct callback URL with optional materialId for auto-open feature
        let callbackUrl = `${window.location.origin}/pricing?status=verifying&ref=${reference}`;
        if (materialId) {
            callbackUrl += `&materialId=${materialId}`;
        }

        // 2. Call Edge Function with subpath routing
        const { data, error } = await supabase.functions.invoke('pesapal/initiate-order', {
            body: {
                amount: plan.price,
                description: plan.isCreditPack ? `Somo Smart ${plan.name}` : `Somo Smart ${plan.name} Subscription`,
                reference: reference,
                callback_url: callbackUrl,
                billing_address: {
                    email_address: customer.email,
                    phone_number: customer.phone,
                    first_name: customer.firstName,
                    last_name: customer.lastName,
                    country_code: "KE"
                }
            }
        });


        if (error) {
            console.error("Supabase Function Error:", error);
            throw error;
        }
        return {
            ...data,
            client_reference: reference,
            client_user_id: userId
        }; // contains redirect_url
    },

    /**
     * Initiates a marketplace material purchase via Pesapal
     */
    async initiateMaterialPayment(userId: string, materialId: string, materialTitle: string, price: number, customer: { email: string; firstName: string; lastName: string; phone: string }) {
        const reference = `MKT_${Date.now()}_${userId.slice(0, 5)}`;

        await supabase.from('transactions').insert({
            user_id: userId,
            amount: price,
            type: 'MARKETPLACE_PURCHASE',
            status: 'PENDING',
            method: 'MPESA',
            reference_code: reference,
            description: `MKT:${materialId}|${materialTitle.slice(0, 50)}`,
            created_at: new Date().toISOString()
        });

        const callbackUrl = `${window.location.origin}/pricing?status=verifying&ref=${reference}`;

        const { data, error } = await supabase.functions.invoke('pesapal/initiate-order', {
            body: {
                amount: price,
                description: `Soma Smart Marketplace: ${materialTitle}`,
                reference,
                callback_url: callbackUrl,
                billing_address: {
                    email_address: customer.email,
                    phone_number: customer.phone,
                    first_name: customer.firstName,
                    last_name: customer.lastName,
                    country_code: 'KE'
                }
            }
        });

        if (error) throw error;
        return { ...data, client_reference: reference };
    },

    /**
     * Checks the status of a specific order
     */
    async checkTransactionStatus(params: string | { orderTrackingId?: string | null; merchantReference?: string | null }) {
        const body = typeof params === 'string'
            ? { OrderTrackingId: params }
            : {
                OrderTrackingId: params.orderTrackingId || undefined,
                merchantReference: params.merchantReference || undefined
            };

        const { data, error } = await supabase.functions.invoke('pesapal/check-status', {
            body
        });

        if (error) throw error;
        return data;
    }
};
