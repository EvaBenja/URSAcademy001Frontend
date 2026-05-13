import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const USERS = [
  { nom: 'Claire Dupont', email: 'claire@urs.com', role: 'Gestionnaire', statut: 'Actif', zone: 'Nord' },
  { nom: 'Antoine Perrot', email: 'antoine@urs.com', role: 'Coordinateur', statut: 'Actif', zone: 'Sud' },
  { nom: 'Sofia Martin', email: 'sofia@urs.com', role: 'Vendeur', statut: 'Inactif', zone: 'Est' },
  { nom: 'Nabil Ahmed', email: 'nabil@urs.com', role: 'Livreur', statut: 'Actif', zone: 'Ouest' },
];

export default function UtilisateursPage() {
  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Gérez les accès, les statuts et le rôle de chaque compte utilisateur présent sur le système." />
      <Table
        data={USERS}
        columns={[
          { key: 'nom', label: 'Nom' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Rôle' },
          { key: 'statut', label: 'Statut' },
          { key: 'zone', label: 'Zone' },
        ]}
        searchKeys={['nom', 'email', 'role', 'statut', 'zone']}
        pageSize={6}
      />
    </>
  );
}
