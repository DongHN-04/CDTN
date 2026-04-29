import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Nếu không có quyền, chuyển hướng về trang dashboard mặc định của role đó
    // Có thể chuyển đến trang 403 Forbidden
    return <Navigate to="/" />;
  }

  return children;
};

export default RoleBasedRoute;