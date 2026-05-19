import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { Role, User } from '../types';

const ROLE_HOME: Record<Role, string> = {
  super_admin:  '/dashboard',
  gestionnaire: '/gestionnaire/dashboard',
  coordinateur: '/coordinateur/livraisons',
  vendeur:      '/vendeur/produits',
  livreur:      '/livreur/livraisons',
};

// ── Comptes démo ──────────────────────────────────────────────
const DEMO: Record<string, { pw:string; user:User }> = {
  'admin@urs.com': {
    pw:'admin123',
    user:{ id:1, prenom:'Jean', nom:'Admin', email:'admin@urs.com', telephone:'00000001', role:'super_admin', statut:'actif' },
  },
  'gestionnaire@urs.com': {
    pw:'gest123',
    user:{ id:2, prenom:'Koffi', nom:'Dossou', email:'gestionnaire@urs.com', telephone:'00000002', role:'gestionnaire', statut:'actif' },
  },
  'coordinateur@urs.com': {
    pw:'coord123',
    user:{ id:3, prenom:'Abdou', nom:'M.', email:'coordinateur@urs.com', telephone:'00000003', role:'coordinateur', statut:'actif' },
  },
  'vendeur@urs.com': {
    pw:'vend123',
    // vendeurId doit correspondre à l'ID utilisé dans les ventes du store ('vendeur')
    user:{ id:4, prenom:'Abdoulaye', nom:'Sow', email:'vendeur@urs.com', telephone:'00000004', role:'vendeur', statut:'actif' },
  },
  'livreur@urs.com': {
    pw:'livr123',
    // livreurId doit correspondre à 'L1' dans le store
    user:{ id:5, prenom:'Jean', nom:'Kossi', email:'livreur@urs.com', telephone:'00000005', role:'livreur', statut:'actif', livreurId:'L1' },
  },
  // Livreurs supplémentaires pour tester
  'livreur2@urs.com': {
    pw:'livr123',
    user:{ id:6, prenom:'Koffi', nom:'Dossou', email:'livreur2@urs.com', telephone:'00000006', role:'livreur', statut:'actif', livreurId:'L2' },
  },
  'livreur5@urs.com': {
    pw:'livr123',
    user:{ id:7, prenom:'Mariam', nom:'L.', email:'livreur5@urs.com', telephone:'00000007', role:'livreur', statut:'actif', livreurId:'L5' },
  },
  // Vendeurs supplémentaires
  'vendeur2@urs.com': {
    pw:'vend123',
    user:{ id:8, prenom:'Mariam', nom:'Fall', email:'vendeur2@urs.com', telephone:'00000008', role:'vendeur', statut:'actif' },
  },
};

// ── localStorage helpers ──────────────────────────────────────
const save  = (u:User) => localStorage.setItem('urs_user', JSON.stringify(u));
const clear = ()       => { localStorage.removeItem('urs_user'); localStorage.removeItem('urs_token'); };
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
  const [user,     setUser]    = useState<User|null>(getSavedUser());
  const [token,    setToken]   = useState<string|null>(localStorage.getItem('urs_token'));
  const [isLoading,setLoading] = useState(false);

  const login = async (email:string, password:string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    const entry = DEMO[email.trim().toLowerCase()];
    if (!entry || entry.pw !== password.trim()) {
      setLoading(false);
      toast.error('Email ou mot de passe incorrect');
      throw new Error('bad credentials');
    }

    const fakeToken = `tok_${entry.user.role}_${Date.now()}`;
    localStorage.setItem('urs_token', fakeToken);
    save(entry.user);
    setToken(fakeToken);
    setUser(entry.user);
    setLoading(false);
    toast.success(`Bienvenue, ${entry.user.prenom} !`);
    window.location.href = ROLE_HOME[entry.user.role];
  };

  const logout = () => {
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

// Re-export types for backwards compatibility
export type { Role, User };