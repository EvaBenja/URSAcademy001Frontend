import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';

const STATS = [
  { label: 'Livraisons actives', value: '18', detail: '6 en cours', color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Retards', value: '2', detail: 'Revue requise', color: '#d0a83a', bg: '#fdf3d7' },
  { label: 'Rapports', value: '14', detail: 'Nouveaux', color: '#1465BB', bg: '#dbe8ff' },
];

const DELIVERIES = [
  { ref: 'GL-3201', client: 'Artisan X', destination: 'Marseille', status: 'En cours', date: '18 mai' },
  { ref: 'GL-3207', client: 'Magasin Y', destination: 'Aix-en-Provence', status: 'Prêt', date: '18 mai' },
  { ref: 'GL-3212', client: 'Service Z', destination: 'Avignon', status: 'Livré', date: '17 mai' },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard Gestionnaire" subtitle="Vue synthétique des livraisons et des rapports clés pour assurer le pilotage de l’activité terrain." />
      <StatGrid items={STATS} />
      <Table
        data={DELIVERIES}
        columns={[
          { key: 'ref', label: 'Référence' },
          { key: 'client', label: 'Client' },
          { key: 'destination', label: 'Destination' },
          { key: 'status', label: 'Statut' },
          { key: 'date', label: 'Date' },
        ]}
        searchKeys={['ref', 'client', 'destination', 'status']}
        pageSize={6}
      />
    </>
  );
}
