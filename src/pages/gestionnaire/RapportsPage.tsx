import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';
import { TrendingUp, Users, CheckCircle } from 'lucide-react';

// --- Données converties en FCFA ---
const REPORTS = [
  { 
    label: 'Chiffre d’affaires global', 
    value: '42 111 000 FCFA', 
    detail: '+21% ce mois', 
    color: '#0a9e6e', 
    bg: '#dcfce7',
    icon: <TrendingUp size={20} />
  },
  { 
    label: 'Ventes réalisées', 
    value: '214', 
    detail: 'Semaine en cours', 
    color: '#1465BB', 
    bg: '#dbe8ff',
    icon: <Users size={20} />
  },
  { 
    label: 'Commandes validées', 
    value: '39', 
    detail: '9 en attente', 
    color: '#d0a83a', 
    bg: '#fdf3d7',
    icon: <CheckCircle size={20} />
  },
];

const SELLER_SALES = [
  { vendeur: 'Camille', ca: 12132500, commandes: 62, statut: 'Actif' },
  { vendeur: 'Issa', ca: 9775000, commandes: 44, statut: 'Actif' },
  { vendeur: 'Mélanie', ca: 6376000, commandes: 28, statut: 'Actif' },
  { vendeur: 'Moussa', ca: 4185000, commandes: 18, statut: 'Actif' },
];

// Utilitaire simple pour formater l'argent
const formatCFA = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

export default function RapportsPage() {
  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader 
        title="Rapports & Performance" 
        subtitle="Analyse financière et suivi des performances de vente." 
      />

      {/* Les indicateurs clés */}
      <div style={{ marginBottom: 32 }}>
        <StatGrid items={REPORTS} />
      </div>

      {/* Section Tableau de Performance */}
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Performance par Vendeur
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Classement basé sur le volume d'affaires encaissé.</p>
        </div>

        <Table
          data={SELLER_SALES}
          columns={[
            { 
                key: 'vendeur', 
                label: 'Vendeur',
                render: (row) => <span style={{ fontWeight: 600 }}>{row.vendeur}</span>
            },
            { 
              key: 'ca', 
              label: 'Chiffre d’Affaires',
              render: (row) => (
                <span style={{ color: '#1465BB', fontWeight: 700 }}>
                  {formatCFA(row.ca)}
                </span>
              )
            },
            { 
                key: 'commandes', 
                label: 'Commandes',
                render: (row) => <span style={{ textAlign: 'center' }}>{row.commandes}</span>
            },
            { 
              key: 'statut', 
              label: 'Statut',
              render: (row) => (
                <span style={{ 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  background: '#dcfce7', 
                  color: '#166534',
                  fontWeight: 600
                }}>
                  {row.statut}
                </span>
              )
            },
          ]}
          searchKeys={['vendeur']}
          pageSize={5}
        />
      </div>
    </div>
  );
}