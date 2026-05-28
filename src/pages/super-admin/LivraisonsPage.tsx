import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';

const DELIVERIES = [
  { ref: 'LV-5881', destination: 'Paris 8e', chauffeur: 'Nadia', status: 'En cours', date: '17 mai' },
  { ref: 'LV-5887', destination: 'Lyon 2e', chauffeur: 'Karim', status: 'Préparé', date: '18 mai' },
  { ref: 'LV-5902', destination: 'Nantes', chauffeur: 'Sébastien', status: 'Livré', date: '16 mai' },
  { ref: 'LV-5915', destination: 'Rennes', chauffeur: 'Amélie', status: 'Retard', date: '18 mai' },
];

const STATS = [
  { label: 'Livraisons actives', value: '26', detail: '12 en transit', color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Retards', value: '4', detail: '3 aujourd’hui', color: '#d0a83a', bg: '#fdf3d7' },
  { label: 'Livraisons terminées', value: '198', detail: 'Semaine dernière', color: '#1465BB', bg: '#dbe8ff' },
];

export default function LivraisonsPage() {
  return (
    <>
      <PageHeader title="Livraisons" subtitle="Suivez les trajets en cours, les retards et les points de livraison de l’ensemble des courses enregistrées." />
      <StatGrid items={STATS} />
      <Table
        data={DELIVERIES}
        columns={[
          { key: 'ref', label: 'Référence' },
          { key: 'destination', label: 'Destination' },
          { key: 'chauffeur', label: 'Livreur' },
          { key: 'status', label: 'Statut' },
          { key: 'date', label: 'Date' },
        ]}
        searchKeys={['ref', 'destination', 'chauffeur', 'status']}
        pageSize={6}
      />
    </>
  );
}
