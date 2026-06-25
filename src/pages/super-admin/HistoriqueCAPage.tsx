import { useState, useEffect, type CSSProperties } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

type Periode = 'jour' | 'semaine' | 'mois' | 'annee';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

function formatLabel(label: string | number, periode: Periode): string {
  if (periode === 'jour') return `${label}h`;
  if (periode === 'annee') return MOIS[Number(label) - 1] || String(label);
  if (typeof label === 'string' && label.includes('-')) {
    const d = new Date(label);
    if (periode === 'semaine') return JOURS[d.getDay()] + ' ' + d.getDate();
    return d.getDate() + '/' + (d.getMonth()+1);
  }
  return String(label);
}

const CustomTooltip = ({ active, payload, label, periode }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1px solid #dde5f4', borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,55,133,0.1)' }}>
      <p style={{ fontSize:12, color:'#8a96b0', margin:'0 0 4px' }}>{formatLabel(label, periode)}</p>
      <p style={{ fontSize:15, fontWeight:700, color:'#1465BB', margin:0 }}>{Number(payload[0].value).toLocaleString('fr-FR')} FCFA</p>
      {payload[0].payload.nb_ventes > 0 && <p style={{ fontSize:11, color:'#4a5578', margin:'3px 0 0' }}>{payload[0].payload.nb_ventes} vente{payload[0].payload.nb_ventes>1?'s':''}</p>}
    </div>
  );
};

export default function HistoriqueCAPage() {
  const [periode, setPeriode]   = useState<Periode>('mois');
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async (p = periode) => {
    setLoading(true);
    try {
      const res = await api.get(`/ventes/historique-ca?periode=${p}`);
      setData(res.data);
      setLastRefresh(new Date());
    } catch {
      toast.error('Erreur chargement CA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [periode]);

  const changePeriode = (p: Periode) => { setPeriode(p); };

  const chartData = data?.historique?.map((h: any) => ({
    label: h.label,
    ca: Number(h.ca_reel || 0),
    nb_ventes: Number(h.nb_ventes || 0),
    remises: Number(h.total_remises || 0),
  })) || [];

  const caTotal    = Number(data?.totaux?.ca_total || 0);
  const nbVentes   = Number(data?.totaux?.nb_ventes || 0);
  const totalRemises = Number(data?.totaux?.total_remises || 0);
  const evolution  = Number(data?.evolution || 0);
  const caPrec     = Number(data?.periode_prec?.ca || 0);
  const jourMax    = chartData.reduce((max: any, d: any) => d.ca > (max?.ca || 0) ? d : max, null);

  const PERIODES: {key: Periode; label: string}[] = [
    { key:'jour',    label:"Aujourd'hui" },
    { key:'semaine', label:'Cette semaine' },
    { key:'mois',    label:'Ce mois' },
    { key:'annee',   label:'Cette année' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Historique du Chiffre d'Affaires</h1>
          <p style={T.sub}>CA réel — ventes dont la livraison est clôturée</p>
        </div>
        <button onClick={()=>load()} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578' }}>
          <RefreshCw size={13}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Sélecteur de période */}
      <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
        {PERIODES.map(p => (
          <button key={p.key} onClick={()=>changePeriode(p.key)}
            style={{ padding:'9px 18px', borderRadius:20, border:`1.5px solid ${periode===p.key?'#1465BB':'#dde5f4'}`, background:periode===p.key?'#1465BB':'white', color:periode===p.key?'white':'#4a5578', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {/* CA Total réel */}
        <div style={{ ...T.card, gridColumn:'span 2' } as CSSProperties}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
            <div>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>CA Réel de la période</p>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:32, fontWeight:700, color:'#1465BB', margin:0 }}>
                {loading ? '…' : caTotal.toLocaleString('fr-FR')}
              </p>
              <p style={{ fontSize:13, color:'#8a96b0', margin:'4px 0 0' }}>FCFA — {nbVentes} vente{nbVentes>1?'s':''} clôturées</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                {evolution >= 0
                  ? <><ArrowUpRight size={16} color="#0a9e6e"/><span style={{ fontSize:14, fontWeight:700, color:'#0a9e6e' }}>+{evolution}%</span></>
                  : <><ArrowDownRight size={16} color="#e53e3e"/><span style={{ fontSize:14, fontWeight:700, color:'#e53e3e' }}>{evolution}%</span></>}
              </div>
              <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>vs période précédente</p>
              <p style={{ fontSize:12, color:'#4a5578', margin:'2px 0 0' }}>{caPrec.toLocaleString('fr-FR')} FCFA avant</p>
            </div>
          </div>
        </div>

        {/* Remises */}
        <div style={T.card}>
          <p style={{ fontSize:12, color:'#8a96b0', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>Total Remises</p>
          <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#e53e3e', margin:0 }}>
            {loading ? '…' : totalRemises.toLocaleString('fr-FR')}
          </p>
          <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>FCFA de réduction accordée</p>
          {caTotal > 0 && <p style={{ fontSize:11, color:'#e53e3e', margin:'3px 0 0' }}>{((totalRemises/(caTotal+totalRemises))*100).toFixed(1)}% du brut</p>}
        </div>

        {/* Meilleur jour */}
        <div style={T.card}>
          <p style={{ fontSize:12, color:'#8a96b0', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>Meilleure période</p>
          {jourMax ? (
            <>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:'#0a9e6e', margin:0 }}>
                {jourMax.ca.toLocaleString('fr-FR')}
              </p>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>FCFA — {formatLabel(jourMax.label, periode)}</p>
              <p style={{ fontSize:11, color:'#0a9e6e', margin:'2px 0 0' }}>{jourMax.nb_ventes} vente{jourMax.nb_ventes>1?'s':''}</p>
            </>
          ) : <p style={{ fontSize:13, color:'#8a96b0', margin:0 }}>—</p>}
        </div>
      </div>

      {/* Graphique en barres */}
      <div style={{ ...T.card, marginBottom:22 }}>
        <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:20 }}>
          <BarChart2 size={16} style={{ marginRight:8, verticalAlign:'middle', color:'#1465BB' }}/>
          Évolution du CA — {PERIODES.find(p=>p.key===periode)?.label}
        </h3>
        {loading ? (
          <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Chargement…</p>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height:280, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <TrendingUp size={36} color="#dde5f4"/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Aucune livraison clôturée sur cette période</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top:5, right:10, left:10, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fb" vertical={false}/>
              <XAxis dataKey="label" tickFormatter={(v)=>formatLabel(v,periode)} tick={{ fontSize:11, fill:'#8a96b0' }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={(v)=>v>=1000?`${(v/1000).toFixed(0)}k`:v} tick={{ fontSize:11, fill:'#8a96b0' }} axisLine={false} tickLine={false} width={50}/>
              <Tooltip content={<CustomTooltip periode={periode}/>}/>
              <Bar dataKey="ca" radius={[6,6,0,0]} maxBarSize={60}>
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={i === chartData.findIndex((d:any)=>d===jourMax) ? '#0a9e6e' : '#1465BB'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tableau détaillé */}
      {!loading && chartData.length > 0 && (
        <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', alignItems:'center', gap:8 }}>
            <Calendar size={15} color="#1465BB"/>
            <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', margin:0 }}>Détail par période</h3>
          </div>
          <div className="urs-table-desktop" style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>{['Période','CA Réel (FCFA)','Nb ventes','Remises (FCFA)','Part du total'].map(h=>(
                  <th key={h} style={T.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {[...chartData].reverse().map((row: any, i: number) => {
                  const part = caTotal > 0 ? ((row.ca / caTotal) * 100).toFixed(1) : '0';
                  const isBest = row === jourMax;
                  return (
                    <tr key={i} style={{ background: isBest ? '#f0fdf4' : 'white' }}
                      onMouseEnter={e=>e.currentTarget.style.background=isBest?'#dcfce7':'#f6f9ff'}
                      onMouseLeave={e=>e.currentTarget.style.background=isBest?'#f0fdf4':'white'}>
                      <td style={{ ...T.td, fontWeight:600, color:'#0d1b3e' }}>
                        {formatLabel(row.label, periode)}
                        {isBest && <span style={{ marginLeft:8, fontSize:10, background:'#dcfce7', color:'#166534', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>Meilleur</span>}
                      </td>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{row.ca.toLocaleString('fr-FR')}</td>
                      <td style={{ ...T.td, color:'#4a5578' }}>{row.nb_ventes}</td>
                      <td style={{ ...T.td, color:'#e53e3e' }}>{row.remises > 0 ? `− ${row.remises.toLocaleString('fr-FR')}` : '—'}</td>
                      <td style={T.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'#f0f4fb', borderRadius:3, maxWidth:100 }}>
                            <div style={{ height:'100%', width:`${part}%`, background:'linear-gradient(90deg,#1465BB,#003785)', borderRadius:3 }}/>
                          </div>
                          <span style={{ fontSize:12, color:'#1465BB', fontWeight:600, minWidth:35 }}>{part}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Total */}
                <tr style={{ background:'#f0f4ff', fontWeight:700 }}>
                  <td style={{ ...T.td, fontWeight:700, color:'#0d1b3e' }}>TOTAL</td>
                  <td style={{ ...T.td, fontWeight:700, color:'#1465BB', fontSize:15 }}>{caTotal.toLocaleString('fr-FR')}</td>
                  <td style={{ ...T.td, fontWeight:700, color:'#4a5578' }}>{nbVentes}</td>
                  <td style={{ ...T.td, fontWeight:700, color:'#e53e3e' }}>{totalRemises > 0 ? `− ${totalRemises.toLocaleString('fr-FR')}` : '—'}</td>
                  <td style={{ ...T.td, color:'#1465BB', fontWeight:700 }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Cartes mobile */}
          <div className="urs-cards-mobile">
            {[...chartData].reverse().map((row: any, i: number) => {
              const part = caTotal > 0 ? ((row.ca / caTotal) * 100).toFixed(1) : '0';
              const isBest = row === jourMax;
              return (
                <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4fb', background: isBest?'#f0fdf4':'white' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontWeight:600, color:'#0d1b3e', fontSize:14 }}>
                      {formatLabel(row.label, periode)}
                      {isBest && <span style={{ marginLeft:8, fontSize:10, background:'#dcfce7', color:'#166534', padding:'1px 7px', borderRadius:10 }}>Meilleur</span>}
                    </span>
                    <span style={{ fontWeight:700, color:'#1465BB', fontSize:15 }}>{row.ca.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style={{ display:'flex', gap:16, fontSize:12, color:'#4a5578' }}>
                    <span>{row.nb_ventes} vente{row.nb_ventes>1?'s':''}</span>
                    {row.remises > 0 && <span style={{ color:'#e53e3e' }}>−{row.remises.toLocaleString('fr-FR')} remise</span>}
                    <span style={{ color:'#1465BB', fontWeight:600 }}>{part}% du total</span>
                  </div>
                  <div style={{ height:4, background:'#f0f4fb', borderRadius:2, marginTop:8 }}>
                    <div style={{ height:'100%', width:`${part}%`, background:'linear-gradient(90deg,#1465BB,#003785)', borderRadius:2 }}/>
                  </div>
                </div>
              );
            })}
            <div style={{ padding:'12px 16px', background:'#f0f4ff', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontWeight:700, color:'#0d1b3e' }}>TOTAL</span>
              <span style={{ fontWeight:700, color:'#1465BB' }}>{caTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  h1: { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub: { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card: { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  th: { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 16px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td: { padding:'11px 16px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
};
