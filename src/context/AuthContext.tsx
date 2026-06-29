import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { authService, setCurrentRole } from '../services/api';
import type { Role, User } from '../types';

const ROLE_HOME: Record<Role, string> = {
  super_admin:  '/dashboard',
  gestionnaire: '/gestionnaire/dashboard',
  coordinateur: '/coordinateur/livraisons',
  vendeur:      '/vendeur/produits',
  livreur:      '/livreur/livraisons',
  compta:       '/compta/dashboard',
};

// ── helpers persistance ────────────────────────────────────────────────
const saveToken = (t: string) => {
  Cookies.set('urs_token', t, { expires: 7 });
  localStorage.setItem('urs_token', t);
};
const saveUser = (u: User) => localStorage.setItem('urs_user', JSON.stringify(u));
const clearAll = () => {
  Cookies.remove('urs_token');
  localStorage.removeItem('urs_token');
  localStorage.removeItem('urs_user');
};
const getSavedUser = (): User | null => {
  try {
    const s = localStorage.getItem('urs_user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};
const getSavedToken = (): string | null =>
  Cookies.get('urs_token') || localStorage.getItem('urs_token') || null;

// ── Normalise la réponse API → User frontend ──────────────────────────
function normalizeUser(apiUser: any): User {
  return {
    id:        apiUser.id,
    prenom:    apiUser.prenom || '',
    nom:       apiUser.nom || '',
    email:     apiUser.email,
    telephone: apiUser.telephone || '',
    role:      (apiUser.role as Role) || 'vendeur',
    statut:    apiUser.statut || 'actif',
  };
}

// ── Context ───────────────────────────────────────────────────────────
interface AuthCtx {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email: string, password: string) => Promise<void>;
  logout:          () => void;
  hasRole:         (roles: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]    = useState<User | null>(() => { const u = getSavedUser(); if (u) setCurrentRole(u.role); return u; });
  const [token,     setToken]   = useState<string | null>(getSavedToken());
  const [isLoading, setLoading] = useState(false);

  // Vérification du token au démarrage
  useEffect(() => {
    const savedToken = getSavedToken();
    if (savedToken && !user) {
      authService.me()
        .then(res => {
          const u = normalizeUser(res.data.user);
          saveUser(u);
          setUser(u);
          setToken(savedToken);
          setCurrentRole(u.role);
        })
        .catch(() => {
          clearAll();
          setUser(null);
          setToken(null);
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const { token: t, user: apiUser } = res.data;
      const u = normalizeUser(apiUser);
      saveToken(t);
      setCurrentRole(u.role);
      saveUser(u);
      setToken(t);
      setUser(u);
      toast.success(`Bienvenue, ${u.prenom} !`);
      window.location.href = ROLE_HOME[u.role] || '/login';
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAll();
    setUser(null);
    setToken(null);
    toast.success('Déconnexion réussie');
    window.location.href = '/login';
  };

  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login, logout, hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export type { Role, User };