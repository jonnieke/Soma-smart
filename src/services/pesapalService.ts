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
        if (materialId) {
            return pesapalService.initiateMaterialPayment(userId, materialId, plan.name, Number(plan.price), customer);
        }

        const { data, error } = await supabase.functions.invoke('pesapal/initiate-order', {
            body: {
                userId,
                planId: plan.id,
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
            client_user_id: userId
        };
    },

    /**
     * Initiates a marketplace material purchase via Pesapal
     */
    async initiateMaterialPayment(userId: string, materialId: string, _materialTitle: string, _price: number, customer: { email: string; firstName: string; lastName: string; phone: string }) {
        const { data, error } = await supabase.functions.invoke('pesapal/initiate-order', {
            body: {
                userId,
                materialId,
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
        return data;
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
