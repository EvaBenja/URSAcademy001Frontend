import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const DRIVERS = [
  { nom: 'Nadia', zone: 'Paris', statut: 'En tournée', position: '14h23' },
  { nom: 'Karim', zone: 'Lyon', statut: 'En attente', position: '14h18' },
  { nom: 'Lina', zone: 'Nice', statut: 'Livré', position: '13h57' },
  { nom: 'Romain', zone: 'Nantes', statut: 'En charge', position: '14h05' },
];

export default function PositionsPage() {
  return (
    <>
      <PageHeader title="Positions livreurs" subtitle="Suivez en temps réel les derniers points de passage et le statut de chaque livreur sur le terrain." />
      <Table
        data={DRIVERS}
        columns={[
          { key: 'nom', label: 'Livreur' },
          { key: 'zone', label: 'Zone' },
          { key: 'statut', label: 'Statut' },
          { key: 'position', label: 'Dernière position' },
        ]}
        searchKeys={['nom', 'zone', 'statut']}
        pageSize={6}
      />
    </>
  );
}
