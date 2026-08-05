import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PageSpinner } from './UI/PageStatus';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <PageSpinner label="Checking authentication" />;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
