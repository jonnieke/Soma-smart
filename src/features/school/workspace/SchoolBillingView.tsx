import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock, XCircle, AlertCircle, Zap, Users, Star, ArrowRight, ChevronRight } from 'lucide-react';
import { schoolBillingService, SchoolSubscription, SchoolSubscriptionTransaction } from '../../../services/schoolBillingService';
import { SCHOOL_PLANS } from '../../../data/pricing';
import { SubscriptionPlan } from '../../../types';

interface Props {
  schoolId: string;
  adminUserId?: string;
  canManage?: boolean;
  onSubscriptionChange?: (sub: SchoolSubscription | null) => void;
}


const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    NONE: 'bg-slate-100 text-slate-500',
  };
  const Icon = status === 'ACTIVE' ? CheckCircle : status === 'PENDING' ? Clock : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
};

const PlanCard: React.FC<{
  plan: SubscriptionPlan;
  isActive: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
  disabled?: boolean;
}> = ({ plan, isActive, onSelect, disabled }) => (
  <div className={`relative rounded-2xl border-2 p-6 flex flex-col gap-4 transition-all ${isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
    {isActive && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full">CURRENT PLAN</div>
    )}
    {plan.savings && (
      <div className={`absolute -top-3 right-4 text-[10px] font-black px-3 py-1 rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>{plan.savings}</div>
    )}

    <div>
      <h3 className="text-sm font-black text-slate-900 dark:text-white">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-3xl font-black text-slate-900 dark:text-white">KES {plan.price.toLocaleString()}</span>
        <span className="text-xs text-slate-500">/term</span>
      </div>
    </div>

    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>{plan.teacherSeatLimit === 0 ? 'Unlimited' : `Up to ${plan.teacherSeatLimit}`} teacher seats</span>
      </div>
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-violet-500 shrink-0" />
        <span>{plan.aiCredits?.toLocaleString()} shared AI credits/term</span>
      </div>
      {(plan.features ?? []).slice(2).map((f) => (
        <div key={f} className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>{f}</span>
        </div>
      ))}
    </div>

    <button
      onClick={() => onSelect(plan)}
      disabled={disabled || isActive}
      className={`mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 cursor-default'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
      }`}
    >
      {isActive ? 'Active Plan' : `Subscribe — KES ${plan.price.toLocaleString()}`}
      {!isActive && <ArrowRight className="w-4 h-4" />}
    </button>
  </div>
);

export const SchoolBillingView: React.FC<Props> = ({ schoolId, adminUserId = 'admin_user', canManage = true, onSubscriptionChange }) => {
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<SchoolSubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      const [sub, history] = await Promise.all([
        schoolBillingService.getSchoolSubscription(schoolId),
        Promise.resolve(schoolBillingService.getSchoolBillingHistory(schoolId)),
      ]);
      setSubscription(sub);
      setBillingHistory(history);
      setLoading(false);
    };
    void load();
  }, [schoolId]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setInitiating(true);
    setError('');
    try {
      const result = await schoolBillingService.initiateSchoolPayment(schoolId, plan.id, {
        userId: adminUserId,
        email: 'admin@school.co.ke',
        firstName: 'School',
        lastName: 'Admin',
        phone: '0722000000',
      });

      // Simulate verification & activation (in production, done via PesaPal webhook)
      await new Promise((r) => setTimeout(r, 800));
      const activated = await schoolBillingService.verifyAndActivateSchoolSubscription(schoolId, result.reference, adminUserId);
      setSubscription(activated);
      if (onSubscriptionChange) onSubscriptionChange(activated);
      setBillingHistory(await schoolBillingService.getSchoolBillingHistory(schoolId));

      setSuccessMsg(`${plan.name} subscription activated successfully! AI credits have been provisioned.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment initiation failed.');
    } finally {
      setInitiating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const activePlanId = subscription?.status === 'ACTIVE' ? subscription.planId : null;
  const daysRemaining = subscription?.expiresAt ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" /> School Workspace Billing
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your school assessment workspace subscription and AI credits.</p>
      </div>

      {/* Current subscription status */}
      {subscription ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 dark:text-white">Current Subscription</h3>
            <StatusChip status={subscription.status} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Plan</p>
              <p className="font-black text-slate-900 dark:text-white">{subscription.planName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Teacher Seats</p>
              <p className="font-black text-slate-900 dark:text-white">{subscription.teacherSeatLimit === 0 ? 'Unlimited' : subscription.teacherSeatLimit}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">AI Credits</p>
              <p className="font-black text-indigo-600">{subscription.aiCredits.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Expires In</p>
              <p className={`font-black ${daysRemaining != null && daysRemaining <= 14 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                {daysRemaining != null ? `${daysRemaining} days` : '—'}
              </p>
            </div>
          </div>
          {daysRemaining != null && daysRemaining <= 14 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. Renew now to avoid service interruption.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">No Active Subscription</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Subscribe below to unlock the full school assessment workspace, shared AI credits, and multi-teacher collaboration features.</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{successMsg}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Plan cards */}
      {canManage && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-indigo-500" /> Available Plans
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SCHOOL_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isActive={plan.id === activePlanId}
                onSelect={handleSelectPlan}
                disabled={initiating}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Payment processed securely via M-Pesa / PesaPal. Plans are termly (3-month) subscriptions.
          </p>
        </div>
      )}

      {/* Billing history */}
      {billingHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">Billing History</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {billingHistory.map((txn) => (
              <div key={txn.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{txn.description}</p>
                  <p className="text-xs text-slate-500">{new Date(txn.createdAt).toLocaleDateString()} · {txn.method}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-slate-900 dark:text-white text-sm">KES {txn.amountKes.toLocaleString()}</span>
                  <StatusChip status={txn.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
