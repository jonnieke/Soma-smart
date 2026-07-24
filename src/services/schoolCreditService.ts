import { SchoolCreditAllocation } from '../types/schoolWorkspace';
import { paperStudioService } from './paperStudioService';

const SCHOOL_CREDITS_STORAGE_KEY = 'soma_school_credit_allocations';

export const schoolCreditService = {
  /**
   * Gets current credit allocation for a school
   */
  async getSchoolCreditAllocation(schoolId: string): Promise<SchoolCreditAllocation> {
    try {
      const raw = localStorage.getItem(SCHOOL_CREDITS_STORAGE_KEY);
      if (raw) {
        const parsed: SchoolCreditAllocation[] = JSON.parse(raw);
        const match = parsed.find((c) => c.schoolId === schoolId);
        if (match) return match;
      }
    } catch (_) {}

    const defaultAllocation: SchoolCreditAllocation = {
      id: `alloc_${schoolId}`,
      schoolId,
      totalAllocatedCredits: 5000,
      usedCredits: 850,
      remainingCredits: 4150,
      term: 'Term 1',
      userLimits: {},
      departmentLimits: {},
      suspendedUserIds: [],
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_CREDITS_STORAGE_KEY, JSON.stringify([defaultAllocation]));
    } catch (_) {}

    return defaultAllocation;
  },

  /**
   * Deducts credits following credit priority rules:
   * 1. Check if user is suspended from AI generation
   * 2. Try School Workspace Credits first
   * 3. Fallback to Personal Credits if allowed
   */
  async deductCreditsForPaperGeneration(params: {
    schoolId?: string;
    userId: string;
    departmentId?: string;
    costInCredits: number;
    allowPersonalFallback?: boolean;
  }): Promise<{
    success: boolean;
    sourceUsed: 'SCHOOL' | 'PERSONAL' | 'NONE';
    remainingCredits: number;
    message?: string;
  }> {
    const { schoolId, userId, departmentId, costInCredits, allowPersonalFallback = true } = params;

    if (schoolId) {
      const alloc = await this.getSchoolCreditAllocation(schoolId);

      // Check if user suspended
      if (alloc.suspendedUserIds?.includes(userId)) {
        return {
          success: false,
          sourceUsed: 'NONE',
          remainingCredits: alloc.remainingCredits,
          message: 'AI generation for your account has been temporarily suspended by your school administrator.',
        };
      }

      // Check user limit
      if (alloc.userLimits && alloc.userLimits[userId] !== undefined) {
        const userLimit = alloc.userLimits[userId];
        if (userLimit <= 0) {
          return {
            success: false,
            sourceUsed: 'NONE',
            remainingCredits: alloc.remainingCredits,
            message: `You have reached your allocated school AI credit limit (${userLimit} credits).`,
          };
        }
      }

      // Check if sufficient school credits available
      if (alloc.remainingCredits >= costInCredits) {
        alloc.remainingCredits -= costInCredits;
        alloc.usedCredits += costInCredits;
        if (alloc.userLimits && alloc.userLimits[userId] !== undefined) {
          alloc.userLimits[userId] = Math.max(0, alloc.userLimits[userId] - costInCredits);
        }
        alloc.updatedAt = new Date().toISOString();

        try {
          const raw = localStorage.getItem(SCHOOL_CREDITS_STORAGE_KEY);
          let list: SchoolCreditAllocation[] = raw ? JSON.parse(raw) : [];
          const idx = list.findIndex((c) => c.schoolId === schoolId);
          if (idx >= 0) list[idx] = alloc;
          else list.push(alloc);
          localStorage.setItem(SCHOOL_CREDITS_STORAGE_KEY, JSON.stringify(list));
        } catch (_) {}

        return {
          success: true,
          sourceUsed: 'SCHOOL',
          remainingCredits: alloc.remainingCredits,
        };
      }
    }

    // Fallback to personal credits if allowed
    if (allowPersonalFallback) {
      const personalRemaining = paperStudioService.deductCredits(0);
      if (personalRemaining >= costInCredits) {
        const updatedPersonal = paperStudioService.deductCredits(costInCredits);
        return {
          success: true,
          sourceUsed: 'PERSONAL',
          remainingCredits: updatedPersonal,
        };
      }
    }

    return {
      success: false,
      sourceUsed: 'NONE',
      remainingCredits: 0,
      message: 'Insufficient AI credits remaining in school or personal balance.',
    };
  },

  /**
   * Admin updates credit allocation
   */
  async updateSchoolCredits(
    schoolId: string,
    updates: Partial<SchoolCreditAllocation>
  ): Promise<SchoolCreditAllocation> {
    const current = await this.getSchoolCreditAllocation(schoolId);
    const updated: SchoolCreditAllocation = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(SCHOOL_CREDITS_STORAGE_KEY);
      let list: SchoolCreditAllocation[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((c) => c.schoolId === schoolId);
      if (idx >= 0) list[idx] = updated;
      else list.push(updated);
      localStorage.setItem(SCHOOL_CREDITS_STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}

    return updated;
  },
};
