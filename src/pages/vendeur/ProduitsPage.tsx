import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const PRODUCTS = [
  { ref: 'VP-101', name: 'Tapis de sol', prix: '29 €', stock: 74, statut: 'Actif' },
  { ref: 'VP-107', name: 'Lampe LED', prix: '18 €', stock: 21, statut: 'À réapprovisionner' },
  { ref: 'VP-115', name: 'Chargeur rapide', prix: '24 €', stock: 56, statut: 'Actif' },
];

export default function ProduitsPage() {
  return (
    <>
      <PageHeader title="Produits" subtitle="Listez vos articles, suivez leur stock et révisez les fiches produits avant leur publication." />
      <Table
        data={PRODUCTS}
        columns={[
          { key: 'ref', label: 'Référence' },
          { key: 'name', label: 'Produit' },
          { key: 'prix', label: 'Prix' },
          { key: 'stock', label: 'Stock' },
          { key: 'statut', label: 'Statut' },
        ]}
        searchKeys={['ref', 'name', 'statut']}
        pageSize={6}
      />
    </>
  );
}
