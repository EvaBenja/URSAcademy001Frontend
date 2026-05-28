import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types/index';

interface Props {
  children: React.ReactNode;
  roles?:   Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4fb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 42, height: 42,
          border: '3px solid #dde5f4',
          borderTop: '3px solid #2196F3',
          borderRadius: '50%',
          animation: 'spin .8s linear infinite',
          margin: '0 auto 14px',
        }} />
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#4a5578' }}>
          Chargement…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}