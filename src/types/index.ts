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
  super_admin:          'Super Admin',
  gestionnaire:         'Gestionnaire',
  coordinateur:         'Coordinateur',
  vendeur:              'Vendeur',
  livreur:              'Livreur',
  compta:               'Comptable',
  media_buyer:          'Media Buyer',
  coordinateur_general: 'Coordinateur Général',
};

export const ROLE_HOME: Record<string, string> = {
  super_admin:          '/dashboard',
  gestionnaire:         '/gestionnaire/dashboard',
  coordinateur:         '/coordinateur/livraisons',
  vendeur:              '/vendeur/produits',
  livreur:              '/livreur/demandes',
  compta:               '/compta/dashboard',
  media_buyer:          '/media-buyer/dashboard',
  coordinateur_general: '/coord-general/closing',
};

export const ROLE_COLORS: Record<string, string> = {
  super_admin:          '#1465BB',
  gestionnaire:         '#0a9e6e',
  coordinateur:         '#d0a83a',
  vendeur:              '#7c3aed',
  livreur:              '#0891b2',
  compta:               '#dc2626',
  media_buyer:          '#ea580c',
  coordinateur_general: '#0369a1',
};