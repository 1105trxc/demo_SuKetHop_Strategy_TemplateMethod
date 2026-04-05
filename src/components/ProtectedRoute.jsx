import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    // Nếu có vé (token) thì cho đi tiếp (Outlet), không có thì đá về /login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}