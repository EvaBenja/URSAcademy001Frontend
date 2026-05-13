import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';

const SALES = [
  { ref: 'VS-210', client: 'Client A', montant: '560 €', date: '16 mai', statut: 'Payé' },
  { ref: 'VS-213', client: 'Client B', montant: '320 €', date: '17 mai', statut: 'En attente' },
  { ref: 'VS-217', client: 'Client C', montant: '740 €', date: '18 mai', statut: 'Payé' },
  { ref: 'VS-221', client: 'Client D', montant: '95 €', date: '18 mai', statut: 'Payé' },
];

const STATS = [
  { label: 'Ventes du mois', value: '34', detail: '+16 %', color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Chiffre d’affaires', value: '27 120 €', detail: 'Calcul automatique', color: '#1465BB', bg: '#dbe8ff' },
  { label: 'Produits vendus', value: '142', detail: 'Ce mois-ci', color: '#8a96b0', bg: '#f4f7fd' },
];

const BY_SELLER = [
  { vendeur: 'Vous', ca: '12 450 €', commandes: '18' },
  { vendeur: 'Équipe A', ca: '9 340 €', commandes: '12' },
  { vendeur: 'Équipe B', ca: '5 330 €', commandes: '4' },
];

export default function VentesPage() {
  return (
    <>
      <PageHeader title="Ventes" subtitle="Suivez l’historique quotidien des ventes et votre chiffre d’affaires automatiquement calculé." />
      <StatGrid items={STATS} />

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: 24 }}>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1.3rem' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#8a96b0', marginBottom: 10 }}>Historique des ventes</p>
          <p style={{ fontSize: 14, color: '#4a5578', lineHeight: 1.7 }}>Toutes les ventes enregistrées par les caissières sont centralisées et calculées automatiquement pour afficher votre CA.</p>
        </div>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1.3rem' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#8a96b0', marginBottom: 10 }}>CA par vendeur</p>
          <p style={{ fontSize: 14, color: '#4a5578', lineHeight: 1.7 }}>Cette section vous montre la répartition du chiffre d’affaires entre les vendeurs pour mesurer la performance de chaque point de vente.</p>
        </div>
      </div>

      <Table
        data={BY_SELLER}
        columns={[
          { key: 'vendeur', label: 'Vendeur' },
          { key: 'ca', label: 'CA' },
          { key: 'commandes', label: 'Commandes' },
        ]}
        searchKeys={['vendeur', 'ca']}
        pageSize={6}
      />

      <Table
        data={SALES}
        columns={[
          { key: 'ref', label: 'Commande' },
          { key: 'client', label: 'Client' },
          { key: 'montant', label: 'Montant' },
          { key: 'date', label: 'Date' },
          { key: 'statut', label: 'Statut' },
        ]}
        searchKeys={['ref', 'client', 'statut']}
        pageSize={6}
        emptyText="Aucune vente enregistrée"
      />
    </>
  );
}
