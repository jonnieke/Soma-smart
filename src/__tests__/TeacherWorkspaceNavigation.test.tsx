import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TeacherWorkspaceNavigation } from '../components/TeacherWorkspaceNavigation';

const LocationProbe = () => { const location = useLocation(); return <><output>{location.pathname}</output><output>{JSON.stringify(location.state)}</output></>; };

describe('TeacherWorkspaceNavigation', () => {
  it.each([0, 1])('preserves explicit homepage intent for link %s', index => {
    render(<MemoryRouter initialEntries={['/teacher/paper-studio']}><TeacherWorkspaceNavigation /><LocationProbe /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole('link', { name: /Soma homepage/ })[index]);
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('{"fromDashboard":true}')).toBeInTheDocument();
  });
  it('appears on standalone teacher tools but not inside the dashboard shell', () => {
    const standalone = render(
      <MemoryRouter initialEntries={['/teacher/assessments/assessment-1']}>
        <TeacherWorkspaceNavigation />
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: 'Teacher workspace' })).toBeInTheDocument();
    standalone.unmount();

    render(
      <MemoryRouter initialEntries={['/teacher/notes']}>
        <TeacherWorkspaceNavigation />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('navigation', { name: 'Teacher workspace' })).not.toBeInTheDocument();
  });

  it('returns to the teacher homepage from Paper Studio', () => {
    render(
      <MemoryRouter initialEntries={['/teacher/paper-studio']}>
        <TeacherWorkspaceNavigation />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Teacher workspace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Paper Studio/i })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('link', { name: /Teacher home/i }));
    expect(screen.getByText('/teacher')).toBeInTheDocument();
  });
});
