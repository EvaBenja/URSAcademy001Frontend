import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';

const PRODUCTS = [
  { ref: 'PR-1023', name: 'Sac de livraison isolé', vendor: 'Vendeur 1', stock: 84, status: 'Actif' },
  { ref: 'PR-1087', name: 'Boîte smart pack', vendor: 'Vendeur 3', stock: 18, status: 'Rupture proche' },
  { ref: 'PR-1130', name: 'Scanner mobile', vendor: 'Vendeur 2', stock: 42, status: 'Actif' },
  { ref: 'PR-1194', name: 'Gilet haute visibilité', vendor: 'Vendeur 4', stock: 29, status: 'Actif' },
];

const STATS = [
  { label: 'Total produits', value: '124', detail: '+12 ce mois', color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Articles faibles', value: '8', detail: 'Recommandé réassort', color: '#d0a83a', bg: '#fdf3d7' },
  { label: 'Vendeurs actifs', value: '24', detail: '6 nouveaux', color: '#1465BB', bg: '#dbe8ff' },
];

export default function ProduitsPage() {
  return (
    <>
      <PageHeader title="Produits" subtitle="Surveillez le catalogue global et suivez le stock pour chaque produit commercialisé sur la plateforme." />
      <StatGrid items={STATS} />
      <Table
        data={PRODUCTS}
        columns={[
          { key: 'ref',   label: 'Référence' },
          { key: 'name',  label: 'Produit' },
          { key: 'vendor', label: 'Vendeur' },
          { key: 'stock', label: 'Stock' },
          { key: 'status', label: 'Statut' },
        ]}
        searchKeys={['ref', 'name', 'vendor', 'status']}
        pageSize={6}
      />
    </>
  );
}
