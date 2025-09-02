import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  return currentUser ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;