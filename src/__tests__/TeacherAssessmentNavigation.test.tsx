import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TeacherAssessmentNavigation } from '../features/teacher/TeacherAssessmentNavigation';

const Location = () => <output>{useLocation().pathname}</output>;
describe('Persistent assessment navigation', () => {
  it.each([
    ['Paper Studio', '/teacher/paper-studio'],
    ['Create an assessment', '/teacher/paper-studio/create'],
  ])('opens %s without setup or a submenu', (label, route) => {
    render(<MemoryRouter initialEntries={['/teacher']}><TeacherAssessmentNavigation /><Location /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Assessment tools' })).toBeVisible();
    const link = screen.getByRole('link', { name: label });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', route);
    fireEvent.click(link);
    expect(screen.getByText(route)).toBeInTheDocument();
  });
});
