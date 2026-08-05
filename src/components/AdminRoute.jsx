import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { getAdminEmails, isAdminUser } from '../utils/admin';
import ProtectedRoute from './ProtectedRoute';

function AdminGate({ children }) {
  const { currentUser } = useAuth();
  const toastShown = useRef(false);
  const admins = getAdminEmails();
  const allowed = admins.length > 0 && isAdminUser(currentUser);

  useEffect(() => {
    if (!allowed && !toastShown.current) {
      toastShown.current = true;
      toast.error('You don\u2019t have access to the operations dashboard.');
    }
  }, [allowed]);

  if (!allowed) return <Navigate to="/" replace />;

  return children;
}

function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminGate>{children}</AdminGate>
    </ProtectedRoute>
  );
}

export default AdminRoute;
