import PageHeader from '../../components/ui/PageHeader';

const SETTINGS = [
  { label: 'Mode maintenance', value: 'Désactivé', description: 'Permet de bloquer temporairement l’accès public.' },
  { label: 'Notifications email', value: 'Activées', description: 'Alertes sur les nouvelles commandes et livraisons.' },
  { label: 'Historique des accès', value: '30 jours', description: 'Durée de conservation des journaux d’activité.' },
];

export default function ParametresPage() {
  return (
    <>
      <PageHeader title="Paramètres" subtitle="Configurez les paramètres globaux de la plateforme, les notifications et les règles opérationnelles." />
      <div style={{ display: 'grid', gap: 16, maxWidth: 760 }}>
        {SETTINGS.map(item => (
          <div key={item.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1.3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1b3e', margin: 0 }}>{item.label}</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1465BB', background: '#e5efff', padding: '6px 10px', borderRadius: 999 }}>{item.value}</span>
            </div>
            <p style={{ fontSize: 13, color: '#4a5578', margin: 0 }}>{item.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
