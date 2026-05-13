import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Ajoute le token JWT à chaque requête
api.interceptors.request.use((cfg) => {
  const t = Cookies.get('urs_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Redirige vers /login si 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('urs_token');
      Cookies.remove('urs_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──
export const authService = {
  login:    (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:   () => api.post('/auth/logout'),
  register: (data: object)  => api.post('/auth/register', data),
  me:       () => api.get('/auth/me'),
};

// ── Produits ──
export const produitsService = {
  getAll:  (params?: object) => api.get('/produits', { params }),
  create:  (data: object)    => api.post('/produits', data),
  update:  (id: number, data: object) => api.put(`/produits/${id}`, data),
  delete:  (id: number)      => api.delete(`/produits/${id}`),
};

// ── Ventes ──
export const ventesService = {
  getAll:  (params?: object) => api.get('/ventes', { params }),
  create:  (data: object)    => api.post('/ventes', data),
  stats:   ()                => api.get('/ventes/stats'),
};

// ── Livraisons ──
export const livraisonsService = {
  getAll:       (params?: object) => api.get('/livraisons', { params }),
  updateStatut: (id: number, statut: string) => api.patch(`/livraisons/${id}/statut`, { statut }),
  positions:    () => api.get('/livraisons/positions'),
};

// ── Demandes livreurs ──
export const demandesService = {
  getAll:  (params?: object) => api.get('/demandes', { params }),
  create:  (data: object)    => api.post('/demandes', data),
  valider: (id: number)      => api.patch(`/demandes/${id}/valider`),
  refuser: (id: number)      => api.patch(`/demandes/${id}/refuser`),
};

// ── Dossiers journaliers ──
export const dossiersService = {
  getAll:   (params?: object) => api.get('/dossiers', { params }),
  cloturer: (id: number)      => api.post(`/dossiers/${id}/cloturer`),
};

// ── Utilisateurs ──
export const utilisateursService = {
  getAll:  (params?: object)      => api.get('/utilisateurs', { params }),
  create:  (data: object)          => api.post('/utilisateurs', data),
  update:  (id: number, data: object) => api.put(`/utilisateurs/${id}`, data),
  delete:  (id: number)            => api.delete(`/utilisateurs/${id}`),
};

// ── Dashboard ──
export const dashboardService = {
  stats:            () => api.get('/dashboard/stats'),
  graphVentes:      (periode?: string) => api.get('/dashboard/ventes', { params: { periode } }),
  demandesRecentes: () => api.get('/dashboard/demandes-recentes'),
};