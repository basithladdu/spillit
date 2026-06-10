import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center bg-background"
        role="status"
        aria-label="Checking authentication"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" aria-hidden />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;