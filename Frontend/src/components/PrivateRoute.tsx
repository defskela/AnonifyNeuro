import React from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { session } from '../auth/session';
import type { Role } from '../auth/session';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const token = session.getToken();
  const [isLoading, setIsLoading] = React.useState(Boolean(token && allowedRoles && !session.getRole()));
  const [role, setRole] = React.useState<Role | null>(session.getRole());

  React.useEffect(() => {
    let mounted = true;
    if (!token || !allowedRoles || role) {
      return;
    }

    authApi.getProfile()
      .then((profile) => {
        if (!mounted) {
          return;
        }
        session.setRole(profile.role);
        setRole(profile.role);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        session.clear();
        setRole(null);
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [allowedRoles, role, token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};
