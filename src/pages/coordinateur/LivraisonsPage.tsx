import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const DELIVERIES = [
  { ref: 'CL-7801', marchandise: 'Pièces auto', affectation: 'Nadia', zone: 'Paris', statut: 'En route' },
  { ref: 'CL-7804', marchandise: 'Fruits', affectation: 'Karim', zone: 'Lyon', statut: 'Chargement' },
  { ref: 'CL-7808', marchandise: 'Cosmétiques', affectation: 'Lina', zone: 'Nice', statut: 'Livré' },
];

export default function LivraisonsPage() {
  return (
    <>
      <PageHeader title="Livraisons" subtitle="Coordonnez les trajets en cours et surveillez l’avancement des missions de chaque livreur." />
      <Table
        data={DELIVERIES}
        columns={[
          { key: 'ref', label: 'Référence' },
          { key: 'marchandise', label: 'Marchandise' },
          { key: 'affectation', label: 'Affecté à' },
          { key: 'zone', label: 'Zone' },
          { key: 'statut', label: 'Statut' },
        ]}
        searchKeys={['ref', 'marchandise', 'affectation', 'zone', 'statut']}
        pageSize={6}
      />
    </>
  );
}
