import PageHeader from '../../components/ui/PageHeader';
import StatGrid from '../../components/ui/StatGrid';
import Table from '../../components/ui/Table';

const METRICS = [
  { label: 'Performance globale', value: '87 %', detail: 'Par rapport à la semaine', color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Taux de livraison', value: '94 %', detail: 'Objectif atteint', color: '#1465BB', bg: '#dbe8ff' },
  { label: 'Nouveaux vendeurs', value: '7', detail: 'Semaine en cours', color: '#d0a83a', bg: '#fdf3d7' },
];

const TREND = [
  { label: 'Clients actifs', value: '1 420' },
  { label: 'Commandes traitées', value: '2 980' },
  { label: 'Satisfaction', value: '89 %' },
];

export default function RapportsPage() {
  return (
    <>
      <PageHeader title="Rapports & Analyses" subtitle="Visualisez les tendances clés et la santé opérationnelle de la plateforme pour piloter les décisions métier." />
      <StatGrid items={METRICS} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {TREND.map(item => (
          <div key={item.label} style={{ background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1.3rem' }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#8a96b0', marginBottom: 10 }}>{item.label}</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#0d1b3e', margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
