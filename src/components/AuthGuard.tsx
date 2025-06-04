import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optionally render a loading spinner or message
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>; 
  }

  if (!user) {
    // Redirect to the auth page, saving the current location
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
} 