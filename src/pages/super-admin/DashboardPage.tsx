import { useState, useEffect } from 'react';
import { Package, TrendingUp, Truck, Users, AlertCircle, Clock, ArrowUpRight } from 'lucide-react';
import { dashboardService } from '../../services/api';

interface Stats {
  total_ventes: number;
  nombre_ventes: number;
  ventes_en_attente: number;
  total_produits: number;
  stock_faible: number;
  livraisons_en_cours: number;
  livraisons_en_attente: number;
  total_livreurs: number;
}

function StatutBadge({ s }: { s: string }) {
  const MAP: Record<string, [string, string, string]> = {
    en_attente: ['#fef9c3', '#854d0e', 'En attente'],
    validee:    ['#dcfce7', '#166534', 'Validé'],
    rejetee:    ['#fee2e2', '#991b1b', 'Rejeté'],
  };
  const [bg, color, label] = MAP[s] || ['#f1f5f9', '#475569', s];
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{label}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [demandes, setDemandes] = useState<any[]>([]);
  const [ventes, setVentes] = useState<number[]>([42, 68, 55, 82, 73, 91, 87]);
  const [loading, setLoading] = useState(true);

  const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, demandesRes, ventesRes] = await Promise.all([
          dashboardService.stats(),
          dashboardService.demandesRecentes(),
          dashboardService.graphVentes('semaine'),
        ]);
        setStats(statsRes.data);
        setDemandes(demandesRes.data.slice(0, 4));
        if (ventesRes.data?.length > 0) {
          setVentes(ventesRes.data.map((v: any) => Number(v.total) || 0));
        }
      } catch (e) {
        console.error('Erreur dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxVal = Math.max(...ventes, 1);

  const STAT_CARDS = stats ? [
    { label: "Chiffre d'affaires", value: Number(stats.total_ventes).toLocaleString(), unit: 'FCFA', Icon: TrendingUp, color: '#1465BB', bg: '#e0f0ff', evo: `${stats.nombre_ventes} ventes` },
    { label: 'Produits en stock',  value: stats.total_produits,  unit: '',     Icon: Package,    color: '#0a9e6e', bg: '#dcfce7', evo: `${stats.stock_faible} alertes` },
    { label: 'Livraisons en cours',value: stats.livraisons_en_cours, unit: '', Icon: Truck,      color: '#d0a83a', bg: '#fdf3d7', evo: `${stats.livraisons_en_attente} en attente` },
    { label: 'Livreurs actifs',    value: stats.total_livreurs,  unit: '',     Icon: Users,      color: '#7c3aed', bg: '#ede9fe', evo: 'Enregistrés' },
  ] : [];

  return (
    <div style={{ minHeight: '60vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600, color: '#0d1b3e', marginBottom: 4 }}>
          Tableau de bord
        </h1>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#4a5578' }}>
          Vue d'ensemble de votre activité — données en temps réel
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#8a96b0', fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>
          Chargement des données…
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {STAT_CARDS.map(({ label, value, unit, evo, Icon, color, bg }) => (
              <div key={label} style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem 1.5rem' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 6px 20px rgba(0,55,133,0.11)'; el.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#0a9e6e', background: '#dcfce7', padding: '3px 9px', borderRadius: 20 }}>{evo}</span>
                </div>
                <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#0d1b3e', lineHeight: 1 }}>{value}</p>
                {unit && <p style={{ fontSize: 11, color: '#8a96b0', marginBottom: 3 }}>{unit}</p>}
                <p style={{ fontSize: 12, color: '#4a5578', marginTop: 5 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 16 }}>
            {/* Graphe ventes */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>Évolution des ventes</h3>
                <select style={{ fontSize: 12, color: '#4a5578', border: '1.5px solid #dde5f4', borderRadius: 6, padding: '4px 10px', background: '#f4f7fd', outline: 'none' }}>
                  <option>Cette semaine</option><option>Ce mois</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130, padding: '0 4px' }}>
                {ventes.slice(0, 7).map((h, i) => {
                  const pct = (h / maxVal) * 100;
                  const isLast = i === ventes.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: '100%', height: `${pct}%`, background: isLast ? 'linear-gradient(180deg,#2196F3,#1465BB)' : '#e0f0ff', borderRadius: '5px 5px 0 0', minHeight: 6 }} />
                      <span style={{ fontSize: 10, color: isLast ? '#1465BB' : '#8a96b0', fontWeight: isLast ? 600 : 400 }}>{JOURS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Localisation */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>Localisation des livreurs</h3>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0a9e6e', background: '#dcfce7', padding: '3px 9px', borderRadius: 20 }}>En direct</span>
              </div>
              <div style={{ background: 'linear-gradient(135deg,#e0f4fb,#e8f0ff)', borderRadius: 10, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid #dde5f4' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,55,133,0.04) 0px,transparent 1px,transparent 26px),repeating-linear-gradient(90deg,rgba(0,55,133,0.04) 0px,transparent 1px,transparent 26px)' }} />
                {[{ x: 25, y: 35, c: '#2196F3' }, { x: 55, y: 60, c: '#0a9e6e' }, { x: 72, y: 30, c: '#d0a83a' }].map((p, i) => (
                  <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: 22, height: 22, background: p.c, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', border: '2px solid white', boxShadow: `0 2px 6px ${p.c}66` }} />
                ))}
                <span style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 12, color: '#4a5578', position: 'relative', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 6 }}>Carte GPS temps réel</span>
              </div>
            </div>

            {/* Demandes récentes */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600, color: '#0d1b3e' }}>Demandes récentes</h3>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#d0a83a', fontWeight: 600 }}>
                  <AlertCircle size={12} />{demandes.filter(d => d.statut === 'en_attente').length} actives
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {demandes.length === 0 ? (
                  <p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 14, color: '#8a96b0', textAlign: 'center', padding: '20px 0' }}>Aucune demande récente</p>
                ) : demandes.map((d: any, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 8, background: '#f4f7fd', border: '1px solid #edf1fa' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1465BB' }}>#{d.id}</span>
                        <span style={{ fontSize: 12, color: '#0d1b3e' }}>{d.livreur?.name || 'Livreur'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8a96b0' }}>
                        <Clock size={10} /> {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <StatutBadge s={d.statut} />
                  </div>
                ))}
              </div>
              <a href="/dashboard/demandes-livreurs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 14, fontSize: 12, color: '#1465BB', fontWeight: 600 }}>
                Voir toutes <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .charts-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        }
      `}</style>
    </div>
  );
}