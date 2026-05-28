import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const REQUESTS = [
  { ref: 'DL-0031', motif: 'Nouvelle tournée', chauffeur: 'Laura', zone: 'Paris', status: 'Validée' },
  { ref: 'DL-0034', motif: 'Aide livraison', chauffeur: 'Rachid', zone: 'Lyon', status: 'En attente' },
  { ref: 'DL-0038', motif: 'Urgence colis', chauffeur: 'Yasmine', zone: 'Toulouse', status: 'Refusée' },
  { ref: 'DL-0040', motif: 'Formation', chauffeur: 'Romain', zone: 'Nantes', status: 'Validée' },
];

export default function DemandesLivreursPage() {
  return (
    <>
      <PageHeader title="Demandes livreurs" subtitle="Validez et suivez les demandes des livreurs pour les tournées, les remplacements et les affaires urgentes." />
      <Table
        data={REQUESTS}
        columns={[
          { key: 'ref', label: 'Référence' },
          { key: 'motif', label: 'Motif' },
          { key: 'chauffeur', label: 'Livreur' },
          { key: 'zone', label: 'Zone' },
          { key: 'status', label: 'Statut' },
        ]}
        searchKeys={['ref', 'motif', 'chauffeur', 'zone', 'status']}
        pageSize={6}
      />
    </>
  );
}
