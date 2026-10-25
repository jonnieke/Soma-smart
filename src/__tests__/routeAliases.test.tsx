import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTE_ALIASES } from '../config/routeAliases';
import { RedirectKeepQuery } from '../components/RedirectKeepQuery';

const Where: React.FC = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="where">{pathname + search}</div>;
};

const renderAt = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        {Object.entries(ROUTE_ALIASES).map(([from, to]) => (
          <Route key={from} path={from} element={<RedirectKeepQuery to={to} />} />
        ))}
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

describe('route aliases', () => {
  it('sends the legacy learner pool URL to the free pool and keeps its filters', () => {
    renderAt('/learner-pool?grade=Form%204&subject=Biology&pool=abc');
    expect(screen.getByTestId('where')).toHaveTextContent(
      '/free-pool?grade=Form%204&subject=Biology&pool=abc'
    );
  });

  it('maps the friendly door names to their canonical pages', () => {
    const expected: Record<string, string> = {
      '/homework': '/',
      '/revise': '/revision',
      '/papers': '/exam-papers',
      '/past-papers': '/exam-papers',
      '/pool': '/free-pool',
    };
    for (const [from, to] of Object.entries(expected)) {
      expect(ROUTE_ALIASES[from]).toBe(to);
    }
  });

  it('never aliases to another alias, so a redirect is a single hop', () => {
    for (const target of Object.values(ROUTE_ALIASES)) {
      expect(ROUTE_ALIASES[target]).toBeUndefined();
    }
  });

  it('does not redirect the paper runner that other pages deep-link into', () => {
    expect(ROUTE_ALIASES['/revision/dashboard']).toBeUndefined();
  });
});
