import { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import type { Role, User } from '../types';

const ROLE_HOME: Record<Role, string> = {
  super_admin:  '/dashboard',
  gestionnaire: '/gestionnaire/dashboard',
  coordinateur: '/coordinateur/livraisons',
  vendeur:      '/vendeur/produits',
  livreur:      '/livreur/livraisons',
};

// ── localStorage helpers ──────────────────────────────────────
const save  = (u:User) => localStorage.setItem('urs_user', JSON.stringify(u));
const clear = ()       => {
  localStorage.removeItem('urs_user');
  localStorage.removeItem('urs_token');
  Cookies.remove('urs_token');
  Cookies.remove('urs_user');
};
const getSavedUser = (): User|null => {
  try { const s = localStorage.getItem('urs_user'); return s ? JSON.parse(s) : null; }
  catch { return null; }
};

// ── Context ───────────────────────────────────────────────────
interface AuthCtx {
  user:            User|null;
  token:           string|null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email:string, password:string) => Promise<void>;
  logout:          () => void;
  hasRole:         (roles:Role|Role[]) => boolean;
}

const AuthContext = createContext<AuthCtx|null>(null);

export function AuthProvider({ children }:{ children:ReactNode }) {
  const [user,      setUser]    = useState<User|null>(getSavedUser());
  const [token,     setToken]   = useState<string|null>(localStorage.getItem('urs_token'));
  const [isLoading, setLoading] = useState(false);

  const login = async (email:string, password:string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Email ou mot de passe incorrect');
        throw new Error('bad credentials');
      }

      const apiUser: User = {
        id:        data.user.id,
        prenom:    data.user.prenom || data.user.name || '',
        nom:       data.user.nom || '',
        email:     data.user.email,
        telephone: data.user.telephone || '',
        role:      data.user.role as Role,
        statut:    data.user.statut || 'actif',
      };

      localStorage.setItem('urs_token', data.token);
      Cookies.set('urs_token', data.token, { expires: 7 });
      save(apiUser);
      setToken(data.token);
      setUser(apiUser);
      toast.success(`Bienvenue, ${apiUser.prenom || apiUser.email} !`);
      window.location.href = ROLE_HOME[apiUser.role] || '/';

    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const t = localStorage.getItem('urs_token');
      if (t) {
        await fetch(
          `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/auth/logout`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${t}`,
              'Accept': 'application/json'
            },
          }
        );
      }
    } catch {}
    clear();
    setUser(null);
    setToken(null);
    toast.success('Déconnexion réussie');
    window.location.href = '/login';
  };

  const hasRole = (roles:Role|Role[]) => {
    if (!user) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated:!!token&&!!user, isLoading, login, logout, hasRole }}>
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