import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const REPORTS = [
  { ref: 'DJ-122', date: '16 mai', auteur: 'Julie', statut: 'Publié', note: 'Activité stable' },
  { ref: 'DJ-123', date: '17 mai', auteur: 'Marc', statut: 'Brouillon', note: '5 retards' },
  { ref: 'DJ-124', date: '18 mai', auteur: 'Sophie', statut: 'Publié', note: 'Trafic fluide' },
  { ref: 'DJ-125', date: '18 mai', auteur: 'Lucas', statut: 'En revue', note: 'Problème de zone' },
];

export default function DossiersJournaliersPage() {
  return (
    <>
      <PageHeader title="Dossiers journaliers" subtitle="Consultez les rapports de livraison quotidiens pour identifier les anomalies et suivre l’activité terrain." />
      <Table
        data={REPORTS}
        columns={[
          { key: 'ref', label: 'Dossier' },
          { key: 'date', label: 'Date' },
          { key: 'auteur', label: 'Auteur' },
          { key: 'statut', label: 'Statut' },
          { key: 'note', label: 'Résumé' },
        ]}
        searchKeys={['ref', 'auteur', 'statut', 'note']}
        pageSize={6}
      />
    </>
  );
}
