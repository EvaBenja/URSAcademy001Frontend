import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';

const REQUESTS = [
  { ref: 'BF-226-01', client: 'SODIBO', type: 'Distribution', zone: 'Ouagadougou (Zone Industrielle)', statut: 'En attente' },
  { ref: 'BF-226-02', client: 'CIMFASO', type: 'Logistique', zone: 'Bobo-Dioulasso', statut: 'Acceptée' },
  { ref: 'BF-226-03', client: 'TotalEnergies BF', type: 'Approvisionnement', zone: 'Koudougou', statut: 'En cours' },
  { ref: 'BF-226-04', client: 'FANAF', type: 'Livraison Express', zone: 'Ouahigouya', statut: 'En attente' },
  { ref: 'BF-226-05', client: 'Hôtel Silmandé', type: 'Retour client', zone: 'Ouagadougou (Paspanga)', statut: 'Acceptée' },
];

export default function DemandesPage() {
  // Fonction pour styliser les statuts (Badges)
  const renderStatut = (row: any) => {
    const colors: Record<string, { bg: string, text: string }> = {
      'En attente': { bg: '#FEF3C7', text: '#92400E' }, // Orange/Jaune
      'Acceptée':   { bg: '#DCFCE7', text: '#166534' }, // Vert
      'En cours':   { bg: '#DBEAFE', text: '#1E40AF' }, // Bleu
    };
    const style = colors[row.statut] || { bg: '#F1F5F9', text: '#475569' };

    return (
      <span style={{ 
        padding: '4px 10px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: 600, 
        backgroundColor: style.bg, 
        color: style.text 
      }}>
        {row.statut}
      </span>
    );
  };

  return (
    <>
      <PageHeader 
        title="Gestion des Livraisons" 
        subtitle="Suivi en temps réel des commandes nationales." 
      />
      
      <Table
        data={REQUESTS}
        columns={[
          { key: 'ref', label: 'Réf.', width: 120 },
          { key: 'client', label: 'Client' },
          { key: 'type', label: 'Type de service' },
          { key: 'zone', label: 'Localité / Zone' },
          { key: 'statut', label: 'Statut', render: renderStatut },
        ]}
        searchKeys={['ref', 'client', 'zone']}
        pageSize={6}
        actions={(row) => (
          <button style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #1465BB',
            background: 'transparent',
            color: '#1465BB',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }} onClick={() => console.log('Gérer', row.ref)}>
            Gérer
          </button>
        )}
      />
    </>
  );
}