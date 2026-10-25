import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/** Redirects to `to` while keeping the incoming query string and hash. */
export const RedirectKeepQuery: React.FC<{ to: string }> = ({ to }) => {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: to, search, hash }} replace />;
};
