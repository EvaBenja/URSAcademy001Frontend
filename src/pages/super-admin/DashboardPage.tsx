import { Package, TrendingUp, Truck, Users, AlertCircle, Clock, ArrowUpRight } from 'lucide-react';

const STATS = [
  { label: "Chiffre d'affaires", value: '7 850 000', unit: 'FCFA', evo: '+12.5%', up: true,  Icon: TrendingUp, color: '#1465BB', bg: '#e0f0ff' },
  { label: 'Stock total',        value: '12 450 000', unit: 'FCFA', evo: '+5.3%',  up: true,  Icon: Package,    color: '#0a9e6e', bg: '#dcfce7' },
  { label: 'Livraisons en cours',value: '12',         unit: '',     evo: '3 en retard', up: false, Icon: Truck, color: '#d0a83a', bg: '#fdf3d7' },
  { label: 'Livreurs actifs',    value: '18',         unit: '',     evo: "+2 auj.",  up: true,  Icon: Users,  color: '#7c3aed', bg: '#ede9fe' },
];

const DEMANDES = [
  { ref: '#1250', livreur: 'Jean Kossi',   date: '14 Mai, 10:30', statut: 'en_attente' },
  { ref: '#1249', livreur: 'Koffi Dossou', date: '14 Mai, 09:15', statut: 'en_attente' },
  { ref: '#1248', livreur: 'Abdou M.',     date: '14 Mai, 09:40', statut: 'en_attente' },
  { ref: '#1247', livreur: 'Salifou A.',   date: '14 Mai, 08:10', statut: 'valide'     },
];

const VENTES_WEEK = [42, 68, 55, 82, 73, 91, 87];
const JOURS       = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function StatutBadge({ s }: { s: string }) {
  const MAP: Record<string, [string, string, string]> = {
    en_attente: ['#fef9c3', '#854d0e', 'En attente'],
    valide:     ['#dcfce7', '#166534', 'Validé'],
    refuse:     ['#fee2e2', '#991b1b', 'Refusé'],
  };
  const [bg, color, label] = MAP[s] || ['#f1f5f9', '#475569', s];
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

export default function DashboardPage() {
  const maxVal = Math.max(...VENTES_WEEK);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600, color: '#0d1b3e', marginBottom: 4 }}>
          Tableau de bord
        </h1>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#4a5578' }}>
          Vue d'ensemble de votre activité — données en temps réel
        </p>
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map(({ label, value, unit, evo, up, Icon, color, bg }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem 1.5rem', transition: 'all .2s' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 6px 20px rgba(0,55,133,0.11)'; el.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}22` }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: up ? '#0a9e6e' : '#d0a83a', background: up ? '#dcfce7' : '#fdf3d7', padding: '3px 9px', borderRadius: 20 }}>
                {evo}
              </span>
            </div>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#0d1b3e', lineHeight: 1 }}>
              {value}
            </p>
            {unit && <p style={{ fontSize: 11, color: '#8a96b0', marginBottom: 3 }}>{unit}</p>}
            <p style={{ fontSize: 12, color: '#4a5578', marginTop: 5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 16 }}>

        {/* Graphe ventes */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>Évolution des ventes</h3>
            <select style={{ fontSize: 12, color: '#4a5578', border: '1.5px solid #dde5f4', borderRadius: 6, padding: '4px 10px', background: '#f4f7fd', outline: 'none' }}>
              <option>Cette semaine</option>
              <option>Ce mois</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, padding: '0 4px' }}>
            {VENTES_WEEK.map((h, i) => {
              const pct = (h / maxVal) * 100;
              const isToday = i === 5;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', height: `${pct}%`,
                    background: isToday ? 'linear-gradient(180deg, #2196F3, #1465BB)' : '#e0f0ff',
                    borderRadius: '5px 5px 0 0', transition: 'all .3s',
                    boxShadow: isToday ? '0 3px 10px rgba(33,150,243,0.35)' : 'none',
                    minHeight: 6,
                  }} />
                  <span style={{ fontSize: 10, color: isToday ? '#1465BB' : '#8a96b0', fontWeight: isToday ? 600 : 400 }}>{JOURS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carte livreurs */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>Localisation des livreurs</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#0a9e6e', background: '#dcfce7', padding: '3px 9px', borderRadius: 20 }}>En direct</span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #e0f4fb, #e8f0ff)', borderRadius: 10, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid #dde5f4' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,55,133,0.04) 0px, transparent 1px, transparent 26px), repeating-linear-gradient(90deg, rgba(0,55,133,0.04) 0px, transparent 1px, transparent 26px)' }} />
            {[{ x: 25, y: 35, c: '#2196F3' }, { x: 55, y: 60, c: '#0a9e6e' }, { x: 72, y: 30, c: '#d0a83a' }, { x: 42, y: 75, c: '#7c3aed' }, { x: 80, y: 65, c: '#0891b2' }].map((p, i) => (
              <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 24, height: 24, background: p.c, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid white', boxShadow: `0 2px 6px ${p.c}66` }} />
            ))}
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 12, color: '#4a5578', position: 'relative', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 6 }}>
              Carte GPS temps réel
            </span>
          </div>
        </div>

        {/* Demandes récentes */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>Demandes en attente</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#d0a83a', fontWeight: 600 }}>
              <AlertCircle size={12} />
              {DEMANDES.filter(d => d.statut === 'en_attente').length} actives
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMANDES.map(d => (
              <div key={d.ref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 8, background: '#f4f7fd', border: '1px solid #edf1fa' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1465BB' }}>{d.ref}</span>
                    <span style={{ fontSize: 12, color: '#0d1b3e' }}>{d.livreur}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8a96b0' }}>
                    <Clock size={10} /> {d.date}
                  </div>
                </div>
                <StatutBadge s={d.statut} />
              </div>
            ))}
          </div>
          <a href="/dashboard/demandes-livreurs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14, fontSize: 12, color: '#1465BB', fontWeight: 600 }}>
            Voir toutes les demandes <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}