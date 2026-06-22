import { useState, useEffect, type CSSProperties } from 'react';
import { TrendingUp, Package, Users, BarChart2, RefreshCw } from 'lucide-react';
import { ventesService, dashboardService } from '../../services/api';
import toast from 'react-hot-toast';

export default function RapportsPage() {
  const [ventes,     setVentes]     = useState<any[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [classement, setClassement] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [vr, sr, cr] = await Promise.all([
        ventesService.getAll(),
        dashboardService.stats(),
        ventesService.classement(),
      ]);
      setVentes(vr.data || []);
      setStats(sr.data);
      setClassement(cr.data || []);
    } catch { toast.error('Erreur chargement rapports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const caTotal      = ventes.filter(v=>v.statut==='validee').reduce((s,v)=>s+Number(v.montant_total||0),0);
  const nbValidees   = ventes.filter(v=>v.statut==='validee').length;
  const nbAttente    = ventes.filter(v=>v.statut==='en_attente').length;
  const tauxValid    = ventes.length > 0 ? Math.round((nbValidees/ventes.length)*100) : 0;

  // CA par jour (7 derniers jours)
  const ventesParJour = Array.from({length:7},(_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    const key = d.toISOString().split('T')[0];
    const total = ventes.filter(v=>v.date_vente===key && v.statut==='validee').reduce((s,v)=>s+Number(v.montant_total||0),0);
    return { jour: d.toLocaleDateString('fr-FR',{weekday:'short'}), total, nb: ventes.filter(v=>v.date_vente===key).length };
  });
  const maxCA = Math.max(...ventesParJour.map(v=>v.total),1);

  // Top zones
  const ventesParZone: Record<string,number> = {};
  ventes.filter(v=>v.statut==='validee').forEach(v => {
    const z = v.zone_livraison||'Non définie';
    ventesParZone[z] = (ventesParZone[z]||0)+Number(v.montant_total||0);
  });
  const topZones = Object.entries(ventesParZone).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const maxZone  = Math.max(...topZones.map(z=>z[1]),1);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement des rapports…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Rapports & Analyses</h1>
          <p style={T.sub}>Vue agrégée de l'activité commerciale</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
          <RefreshCw size={14}/> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          {label:"CA total validé",  val:`${caTotal.toLocaleString('fr-FR')} FCFA`, sub:`${nbValidees} ventes`, color:'#1465BB', bg:'#e0f0ff', Icon:TrendingUp},
          {label:'Taux validation',  val:`${tauxValid}%`, sub:`${ventes.length} total`, color:'#0a9e6e', bg:'#dcfce7', Icon:BarChart2 },
          {label:'En attente valid.',val:nbAttente,        sub:'À traiter',             color:'#d0a83a', bg:'#fdf3d7', Icon:Package   },
          {label:'Livreurs actifs',  val:stats?.total_livreurs||0, sub:'Enregistrés',   color:'#7c3aed', bg:'#ede9fe', Icon:Users    },
        ].map(({label,val,sub,color,bg,Icon}) => (
          <div key={label} style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.3rem' }}>
            <div style={{ width:42, height:42, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
              <Icon size={18} color={color}/>
            </div>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color, margin:'0 0 4px', wordBreak:'break-all' }}>{val}</p>
            <p style={{ fontSize:13, color:'#0d1b3e', fontWeight:500, margin:'0 0 2px' }}>{label}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Graphes */}
      <div className="charts-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }}>
        {/* CA 7 jours */}
        <div style={T.card}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:18 }}>CA des 7 derniers jours</h3>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:150, padding:'0 4px' }}>
            {ventesParJour.map((d,i) => {
              const pct = (d.total/maxCA)*100;
              const isMax = d.total === Math.max(...ventesParJour.map(v=>v.total));
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:9, color:'#8a96b0', whiteSpace:'nowrap' }}>{d.total>0?(d.total>=1000?Math.round(d.total/1000)+'k':d.total):''}</span>
                  <div style={{ width:'100%', height:`${Math.max(pct,3)}%`, background:isMax?'linear-gradient(180deg,#2196F3,#1465BB)':'#e0f0ff', borderRadius:'5px 5px 0 0', minHeight:4 }}/>
                  <span style={{ fontSize:10, color:isMax?'#1465BB':'#8a96b0', fontWeight:isMax?700:400 }}>{d.jour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top zones */}
        <div style={T.card}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:18 }}>Top zones par CA</h3>
          {topZones.length === 0 ? (
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#8a96b0', textAlign:'center', padding:'30px 0' }}>Aucune donnée</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {topZones.map(([zone,ca],i) => {
                const colors=['#1465BB','#0a9e6e','#d0a83a','#7c3aed','#0891b2'];
                return (
                  <div key={zone}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:500, color:'#0d1b3e' }}>{zone}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:colors[i] }}>{ca.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div style={{ height:8, background:'#f0f4fb', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(ca/maxZone)*100}%`, background:colors[i], borderRadius:4 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Classement */}
      <div style={T.card}>
        <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:18 }}>Performance des vendeurs</h3>
        {classement.length === 0 ? (
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0', textAlign:'center', padding:'20px' }}>Aucune vente validée</p>
        ) : (
          <>
            <div className="urs-table-desktop" style={{ overflowX:'auto' }}>
              <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
                <thead>
                  <tr>{['Rang','Vendeur','Nb ventes','CA total','Part'].map(h=>(
                    <th key={h} style={T.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {classement.map((c:any, i:number) => {
                    const part = caTotal > 0 ? Math.round((c.total/caTotal)*100) : 0;
                    return (
                      <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                        <td style={{ ...T.td, fontWeight:700 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
                        <td style={T.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700, flexShrink:0 }}>
                              {(c.vendeur||'?')[0]}
                            </div>
                            {c.vendeur}
                          </div>
                        </td>
                        <td style={{ ...T.td, textAlign:'center', fontWeight:700, color:'#1465BB' }}>{c.nombre_ventes}</td>
                        <td style={{ ...T.td, fontWeight:700, color:'#0a9e6e' }}>{Number(c.total).toLocaleString('fr-FR')} FCFA</td>
                        <td style={T.td}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:6, background:'#f0f4fb', borderRadius:3 }}>
                              <div style={{ height:'100%', width:`${part}%`, background:'linear-gradient(90deg,#1465BB,#003785)', borderRadius:3 }}/>
                            </div>
                            <span style={{ fontSize:12, fontWeight:600, color:'#1465BB', minWidth:30 }}>{part}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartes mobile */}
            <div className="urs-cards-mobile">
              {classement.map((c:any, i:number) => {
                const part = caTotal > 0 ? Math.round((c.total/caTotal)*100) : 0;
                return (
                  <div key={i} style={{ padding:'14px 4px', borderBottom: i<classement.length-1 ? '1px solid #f0f4fb' : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontSize:18, fontWeight:700, width:28, textAlign:'center', flexShrink:0 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700, flexShrink:0 }}>
                        {(c.vendeur||'?')[0]}
                      </div>
                      <span style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.vendeur}</span>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13, paddingLeft:38 }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:'#8a96b0' }}>Nb ventes</span>
                        <span style={{ fontWeight:700, color:'#1465BB' }}>{c.nombre_ventes}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ color:'#8a96b0' }}>CA total</span>
                        <span style={{ fontWeight:700, color:'#0a9e6e' }}>{Number(c.total).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:6, background:'#f0f4fb', borderRadius:3 }}>
                          <div style={{ height:'100%', width:`${part}%`, background:'linear-gradient(90deg,#1465BB,#003785)', borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:'#1465BB', minWidth:30 }}>{part}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <style>{`
        @media(max-width:1024px){.kpi-grid{grid-template-columns:repeat(2,1fr)!important;} .charts-grid{grid-template-columns:1fr!important;}}
        @media(max-width:640px){.kpi-grid{grid-template-columns:1fr 1fr!important;}}
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
};
