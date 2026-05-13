import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';

const ORDERS = [
  { ref: 'VD-2401', client: 'Agence Jean', total: '3 420 €', status: 'Livré', date: '15 mai' },
  { ref: 'VD-2405', client: 'Boutique Sud', total: '1 860 €', status: 'En cours', date: '17 mai' },
  { ref: 'VD-2410', client: 'E-commerce A', total: '920 €', status: 'Payé', date: '18 mai' },
  { ref: 'VD-2413', client: 'Magasin B', total: '2 310 €', status: 'Annulé', date: '18 mai' },
];

const STATS = [
  { label: 'Chiffre d’affaires', value: '48 700 €', detail: '+19 %', color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Commandes ce mois', value: '132', detail: '24 nouvelles', color: '#1465BB', bg: '#dbe8ff' },
  { label: 'Panier moyen', value: '369 €', detail: 'Stable', color: '#8a96b0', bg: '#f4f7fd' },
];

export default function VentesPage() {
  return (
    <>
      <PageHeader title="Ventes" subtitle="Analysez les performances commerciales, les ventes récentes et les tendances de revenus pour l’ensemble de la plateforme." />
      <StatGrid items={STATS} />
      <Table
        data={ORDERS}
        columns={[
          { key: 'ref', label: 'Commande' },
          { key: 'client', label: 'Client' },
          { key: 'total', label: 'Valeur' },
          { key: 'status', label: 'Statut' },
          { key: 'date', label: 'Date' },
        ]}
        searchKeys={['ref', 'client', 'status']}
        pageSize={6}
      />
    </>
  );
}
