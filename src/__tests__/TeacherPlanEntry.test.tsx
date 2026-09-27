import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { PricingPage } from '../pages/PricingPage';
vi.mock('../context/AppContext', () => ({ useApp: () => ({ isPro: true, role: 'TEACHER', subscriptionPlan: 'MONTHLY', refreshProfile: vi.fn() }) }));
vi.mock('../lib/supabase', () => ({ supabase: {} }));
vi.mock('../services/pesapalService', () => ({ pesapalService: {} }));
vi.mock('../components/Shared', () => ({ Button: (props: any) => <button {...props} /> }));
vi.mock('react-helmet-async', () => ({ Helmet: () => null }));
vi.mock('../features/subscription/PricingPage', () => ({ PricingPage: ({ initialTab, onSelectPlan }: any) => <><span>Selected segment: {initialTab}</span><button onClick={() => onSelectPlan({ id: 't_termly', segment: 'TEACHER', duration: 'TERMLY' })}>Choose teacher plan</button></> }));
const Probe = () => { const loc = useLocation(); return <output>{loc.pathname}:{loc.state?.initiatePaymentFor?.id}</output>; };
it('opens teacher plans from the limit link and forwards an existing Pro teacher to checkout', () => {
  render(<MemoryRouter initialEntries={['/pricing?segment=TEACHER']}><PricingPage /><Probe /></MemoryRouter>);
  expect(screen.getByText('Selected segment: TEACHER')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Choose teacher plan' }));
  expect(screen.getByText('/teacher:t_termly')).toBeInTheDocument();
});
