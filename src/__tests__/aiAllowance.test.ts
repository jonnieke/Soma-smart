import { expect, it } from 'vitest';
import { parseAiAllowance } from '../services/aiAllowance';

it('reads explicit server allowance counts without hardcoding plan limits', () => {
  expect(parseAiAllowance({ code: 'FEATURE_LIMIT_REACHED', plan: 'free', limit: 3, usageCount: 3 }))
    .toEqual({ plan: 'FREE', limit: 3, usageCount: 3 });
});
it('does not interpret provider failures as a purchase opportunity', () => {
  expect(parseAiAllowance({ code: 'SYSTEM_QUOTA', limit: 20 })).toBeUndefined();
  expect(parseAiAllowance(null)).toBeUndefined();
});
it('does not show invalid server counts', () => {
  expect(parseAiAllowance({ code: 'FEATURE_LIMIT_REACHED', limit: -1, usageCount: '3' }))
    .toEqual({ plan: undefined, limit: undefined, usageCount: undefined });
});
