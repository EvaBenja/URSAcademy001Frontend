import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const t = Cookies.get('urs_token') || localStorage.getItem('urs_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('urs_token');
      localStorage.removeItem('urs_token');
      localStorage.removeItem('urs_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Rôle courant — mis à jour par AuthContext au login
let _currentRole = '';

export const setCurrentRole = (role: string) => { _currentRole = role; };

export const getRole = (): string => {
  if (_currentRole) return _currentRole;
  try {
    const u = localStorage.getItem('urs_user');
    const role = u ? JSON.parse(u).role : '';
    if (role) _currentRole = role;
    return role;
  } catch { return ''; }
};

// ── Auth ──────────────────────────────────────────────────
export const authService = {
  login:    (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:   () => api.post('/auth/logout'),
  register: (data: object) => api.post('/auth/register', data),
  me:       () => api.get('/auth/me'),
};

// ── Produits ──────────────────────────────────────────────
// Rôles avec accès CRUD: gestionnaire, super_admin, admin
// Rôles avec accès lecture seule: vendeur, coordinateur, livreur
const ROLES_PRODUITS_FULL = ['super_admin', 'gestionnaire', 'admin'];

export const produitsService = {
  getAll: (params?: object) => {
    const role = getRole();
    // Si role vide (race condition) ou role non admin → produits-liste (safe)
    const endpoint = role && ROLES_PRODUITS_FULL.includes(role) ? '/produits' : '/produits-liste';
    return api.get(endpoint, { params });
  },
  create: (data: object)             => api.post('/produits', data),
  update: (id: number, data: object) => api.put(`/produits/${id}`, data),
  delete: (id: number)               => api.delete(`/produits/${id}`),
};

// ── Ventes ────────────────────────────────────────────────
export const ventesService = {
  getAll:     (params?: object) => api.get('/ventes', { params }),
  create:     (data: object)    => api.post('/ventes', data),
  stats:      ()                => api.get('/ventes/stats'),
  classement: ()                => api.get('/ventes/classement'),
  annuler:    (id: number, motif: string) => api.post(`/ventes/${id}/annuler`, { motif }),
};

// ── Demandes ──────────────────────────────────────────────
// POST /demandes → livreur soumet une demande
// PATCH /demandes/{id}/valider → gestionnaire valide
// PATCH /demandes/{id}/refuser → gestionnaire refuse
export const demandesService = {
  getAll:  (params?: object) => api.get('/demandes', { params }),
  create:  (data: object)    => api.post('/demandes', data),
  valider: (id: number, data: { montant_carburant: number }) =>
    api.patch(`/demandes/${id}/valider`, data),
  refuser: (id: number, motif: string) =>
    api.patch(`/demandes/${id}/refuser`, { motif }),
  cloturer: (id: number, data: object) =>
    api.patch(`/demandes/${id}/cloturer`, data),
};

// ── Livraisons ────────────────────────────────────────────
export const livraisonsService = {
  getAll:       (params?: object) => api.get('/livraisons', { params }),
  create:       (data: object)    => api.post('/livraisons', data),
  show:         (id: number)      => api.get(`/livraisons/${id}`),
  updateStatut: (id: number, statut: string) =>
    api.patch(`/livraisons/${id}/statut`, { statut }),
  valider:      (id: number, data: { montant_carburant: number; notes?: string }) =>
    api.post(`/livraisons/${id}/valider`, data),
  accepter:     (id: number) => api.post(`/livraisons/${id}/accepter`),
  rejeter:      (id: number, motif: string, motifCategorie?: string) =>
    api.post(`/livraisons/${id}/rejeter`, { motif, motif_categorie: motifCategorie }),
  cloturer:     (id: number, data: { produits_statuts?: { id: number; statut: string }[]; notes_cloture?: string }) =>
    api.post(`/livraisons/${id}/cloturer`, data),
  validerCloture: (id: number) => api.post(`/livraisons/${id}/valider-cloture`),
  refuserCloture: (id: number, motif: string) => api.post(`/livraisons/${id}/refuser-cloture`, { motif }),
  assigner:     (id: number, livreurId?: number) => api.post(`/livraisons/${id}/assigner`, livreurId ? { livreur_id: livreurId } : {}),
};

// ── Dossiers ──────────────────────────────────────────────
export const dossiersService = {
  getAll:   (params?: object) => api.get('/dossiers', { params }),
  cloturer: (id: number)      => api.post(`/dossiers/${id}/cloturer`),
};

// ── Utilisateurs ──────────────────────────────────────────
export const utilisateursService = {
  getAll:  (params?: object)          => api.get('/utilisateurs', { params }),
  create:  (data: object)             => api.post('/utilisateurs', data),
  update:  (id: number, data: object) => api.put(`/utilisateurs/${id}`, data),
  delete:  (id: number)               => api.delete(`/utilisateurs/${id}`),
  roles:   ()                         => api.get('/roles'),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardService = {
  stats:            () => api.get('/dashboard/stats'),
  graphVentes:      (periode?: string) =>
    api.get('/dashboard/ventes', { params: { periode } }),
  demandesRecentes: () => api.get('/dashboard/demandes-recentes'),
};

// ── Dépenses ─────────────────────────────────────────────
export const depensesService = {
  getAll:  (params?: object) => api.get('/depenses', { params }),
  create:  (data: object)    => api.post('/depenses', data),
  update:  (id: number, data: object) => api.put(`/depenses/${id}`, data),
  delete:  (id: number)      => api.delete(`/depenses/${id}`),
  stats:   ()                => api.get('/depenses/stats'),
};

// ── Géolocalisation ───────────────────────────────────────
export const geoService = {
  updatePosition: (latitude: number, longitude: number) =>
    api.post('/position', { latitude, longitude }),
  livreurs:   () => api.get('/livreurs/positions'),
  plusProche: (latitude: number, longitude: number) =>
    api.post('/livreurs/plus-proche', { latitude, longitude }),
};
