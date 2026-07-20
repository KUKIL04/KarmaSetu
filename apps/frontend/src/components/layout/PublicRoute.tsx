import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // If your auth hook has a loading state while verifying the token, handle it here
  if (isLoading) {
    return null; // Or a sleek loading spinner
  }

  // If they are already logged in, bounce them to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the auth pages (Login, Register, etc.)
  return <Outlet />;
}