import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
  const userRole = user.role ? user.role.toLowerCase() : '';

  if (!normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default RoleBasedRoute;