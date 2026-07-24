import React from 'react';
import { SchoolWorkspaceLayout } from '../../school/workspace/SchoolWorkspaceLayout';

interface SchoolWorkspaceProps {
  onBack: () => void;
  onOpenPaper: (paperId: string) => void;
}

export const SchoolWorkspace: React.FC<SchoolWorkspaceProps> = ({ onBack, onOpenPaper }) => {
  return (
    <SchoolWorkspaceLayout
      onBackToTeacherStudio={onBack}
      onOpenPaper={onOpenPaper}
    />
  );
};
