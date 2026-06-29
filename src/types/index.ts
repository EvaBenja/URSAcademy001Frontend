// Type definitions - kept here to avoid circular imports
export type Role = 'super_admin' | 'gestionnaire' | 'coordinateur' | 'vendeur' | 'livreur' | 'compta';

export interface User {
  id:        number;
  prenom:    string;
  nom:       string;
  email:     string;
  telephone: string;
  role:      Role;
  statut:    string;
  livreurId?: string;
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin:  'Super Admin',
  gestionnaire: 'Gestionnaire',
  coordinateur: 'Coordinateur',
  vendeur:      'Vendeur',
  livreur:      'Livreur',
};

export const ROLE_HOME: Record<string, string> = {
  super_admin:  '/dashboard',
  gestionnaire: '/gestionnaire/dashboard',
  coordinateur: '/coordinateur/livraisons',
  vendeur:      '/vendeur/produits',
  livreur:      '/livreur/demandes',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin:  '#1465BB',
  gestionnaire: '#0a9e6e',
  coordinateur: '#d0a83a',
  vendeur:      '#7c3aed',
  livreur:      '#0891b2',
};