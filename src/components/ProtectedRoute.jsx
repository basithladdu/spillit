import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, role }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return null; // Or a spinner

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If a specific role is required (e.g., 'municipal_admin')
  if (role && userRole !== role) {
    // Redirect unauthorized users to home or a "Not Authorized" page
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;