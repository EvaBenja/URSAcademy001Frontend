
import { useState, type CSSProperties } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Download, Calendar, Package, Truck, Users } from 'lucide-react';
import { useStore } from '../../store/ventesStore';

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const CA_MOIS  = [3200000,4100000,3800000,5200000,6800000,5900000,7200000,6500000,8100000,7400000,9200000,8700000];
const VTE_MOIS = [42,58,51,70,88,75,94,82,108,96,124,115];

export default function RapportsPage() {
  const { ventes, produits, classementVendeurs } = useStore();
  const [periode, setPeriode] = useState<'semaine'|'mois'|'annee'>('mois');

  const classement   = classementVendeurs();
  const totalCA      = ventes.filter(v=>v.statut!=='refusee').reduce((s,v)=>s+v.montantTotal,0);
  const totalLivrees = ventes.filter(v=>v.statut==='livree').length;
  const stockBas     = produits.filter(p=>p.stock<10).length;
  const tauxLivraison= ventes.length>0?Math.round((totalLivrees/ventes.length)*100):0;
  const maxCA        = Math.max(...CA_MOIS);
  const maxVte       = Math.max(...VTE_MOIS);

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Rapports & Analyses</h1>
          <p style={T.sub}>Vue synthétique des performances de votre activité</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <div style={{ display:'flex', gap:4, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4' }}>
            {(['semaine','mois','annee'] as const).map(p => (
              <button key={p} onClick={()=>setPeriode(p)}
                style={{ padding:'7px 14px', borderRadius:7, border:'none', background:periode===p?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:periode===p?'white':'#4a5578', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                {p==='semaine'?'Semaine':p==='mois'?'Mois':'Année'}
              </button>
            ))}
          </div>
          <button style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, background:'linear-gradient(90deg,#d0a83a,#ae8f1e)', color:'white', border:'none', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            <Download size={14}/> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:"Chiffre d'affaires",  val:totalCA.toLocaleString()+' FCFA', evo:'+12.5%', up:true,  color:'#1465BB', bg:'#e0f0ff', Icon:TrendingUp   },
          { label:'Ventes livrées',       val:totalLivrees,                     evo:'+8.3%',  up:true,  color:'#0a9e6e', bg:'#dcfce7', Icon:Truck        },
          { label:'Taux de livraison',    val:tauxLivraison+'%',                evo:'+2.1%',  up:true,  color:'#7c3aed', bg:'#ede9fe', Icon:BarChart2    },
          { label:'Alertes stock',        val:stockBas,                         evo:stockBas>0?'⚠️':'✓', up:stockBas===0, color:'#d0a83a', bg:'#fdf3d7', Icon:Package },
        ].map(({ label, val, evo, up, color, bg, Icon }) => (
          <div key={label} style={T.statCard}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${color}22` }}>
                <Icon size={18} color={color}/>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:up?'#0a9e6e':'#e53e3e', background:up?'#dcfce7':'#fee2e2', padding:'3px 8px', borderRadius:20 }}>
                {up?<TrendingUp size={10} style={{display:'inline',marginRight:3}}/>:<TrendingDown size={10} style={{display:'inline',marginRight:3}}/>}
                {evo}
              </span>
            </div>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16, marginBottom:20 }}>

        {/* Évolution CA */}
        <div style={T.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={T.cardTitle}>Évolution du CA mensuel</h2>
            <span style={{ fontFamily:'Cormorant Garamond,serif', fontSize:13, color:'#4a5578' }}>Année 2024</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:150 }}>
            {CA_MOIS.map((v, i) => {
              const pct    = (v / maxCA) * 100;
              const isMax  = v === maxCA;
              const isCurr = i === 4;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:9, color: isMax?'#d0a83a':'#8a96b0', fontWeight:isMax?700:400 }}>
                    {(v/1000000).toFixed(1)}M
                  </span>
                  <div style={{ width:'100%', height:`${pct}%`, borderRadius:'4px 4px 0 0', background: isMax?'linear-gradient(180deg,#d0a83a,#ae8f1e)':isCurr?'linear-gradient(180deg,#2196F3,#1465BB)':'#e0f0ff', minHeight:6, transition:'all .3s', boxShadow: isMax?'0 3px 8px rgba(208,168,58,0.4)':isCurr?'0 3px 8px rgba(33,150,243,0.3)':'none' }}/>
                  <span style={{ fontSize:9, color:isCurr?'#1465BB':'#8a96b0', fontWeight:isCurr?600:400 }}>{MOIS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Répartition ventes */}
        <div style={T.card}>
          <h2 style={{ ...T.cardTitle, marginBottom:18 }}>Répartition des ventes</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Livrées',       val:ventes.filter(v=>v.statut==='livree').length,                              color:'#0a9e6e', bg:'#dcfce7' },
              { label:'En livraison',  val:ventes.filter(v=>v.statut==='en_livraison').length,                        color:'#1465BB', bg:'#e0f0ff' },
              { label:'En attente',    val:ventes.filter(v=>v.statut==='en_attente').length,                          color:'#d0a83a', bg:'#fdf3d7' },
              { label:'Non livrées',   val:ventes.filter(v=>['non_livree','rejetee_livreur'].includes(v.statut)).length, color:'#e53e3e', bg:'#fee2e2' },
              { label:'Refusées',      val:ventes.filter(v=>v.statut==='refusee').length,                             color:'#94a3b8', bg:'#f1f5f9' },
            ].map(({ label, val, color, bg }) => {
              const pct = ventes.length > 0 ? Math.round((val/ventes.length)*100) : 0;
              return (
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, color:'#4a5578', fontWeight:500 }}>{label}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color }}>{val}</span>
                      <span style={{ background:bg, color, fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:10 }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ background:'#f0f4fb', borderRadius:20, height:6, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:20, transition:'width .5s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ventes par mois + Classement */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16, marginBottom:20 }}>

        {/* Nb ventes mois */}
        <div style={T.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={T.cardTitle}>Nombre de ventes par mois</h2>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:120 }}>
            {VTE_MOIS.map((v,i) => {
              const pct   = (v/maxVte)*100;
              const isCurr = i === 4;
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:9, color:isCurr?'#1465BB':'#8a96b0' }}>{v}</span>
                  <div style={{ width:'100%', height:`${pct}%`, borderRadius:'4px 4px 0 0', background:isCurr?'linear-gradient(180deg,#2196F3,#1465BB)':'#e0f0ff', minHeight:4 }}/>
                  <span style={{ fontSize:9, color:isCurr?'#1465BB':'#8a96b0', fontWeight:isCurr?600:400 }}>{MOIS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Vendeurs */}
        <div style={T.card}>
          <h2 style={{ ...T.cardTitle, marginBottom:16 }}>Top vendeurs</h2>
          {classement.length === 0 ? (
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#8a96b0', textAlign:'center', padding:'20px 0' }}>Aucune donnée</p>
          ) : classement.slice(0,5).map((c,i) => {
            const medals = ['🥇','🥈','🥉'];
            const pct    = classement[0].total > 0 ? (c.total/classement[0].total)*100 : 0;
            return (
              <div key={c.vendeurId} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:4 }}>
                  <span style={{ fontSize:16, width:24 }}>{medals[i]||`#${i+1}`}</span>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                    {c.nom[0]}
                  </div>
                  <span style={{ flex:1, fontSize:13, fontWeight:500, color:'#0d1b3e' }}>{c.nom}</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:14, fontWeight:700, color:'#1465BB' }}>
                    {(c.total/1000).toFixed(0)}k FCFA
                  </span>
                </div>
                <div style={{ background:'#f0f4fb', borderRadius:20, height:4, overflow:'hidden', marginLeft:33 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:i===0?'linear-gradient(90deg,#d0a83a,#ae8f1e)':'linear-gradient(90deg,#2196F3,#1465BB)', borderRadius:20 }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock critique */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Package size={18} color="#d0a83a"/>
          <h2 style={T.cardTitle}>Produits à réapprovisionner</h2>
          <span style={{ marginLeft:'auto', background:'#fdf3d7', color:'#854d0e', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>
            {stockBas} produit{stockBas>1?'s':''}
          </span>
        </div>
        {stockBas === 0 ? (
          <div style={{ textAlign:'center', padding:'24px', background:'#f0fdf4', borderRadius:10 }}>
            <p style={{ color:'#166534', fontWeight:500 }}>✅ Tous les stocks sont suffisants</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
            {produits.filter(p=>p.stock<10).map(p => (
              <div key={p.ref} style={{ background:p.stock<=3?'#fff5f5':'#fffbeb', borderRadius:10, padding:'12px 14px', border:`1px solid ${p.stock<=3?'#fecaca':'#fcd34d'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{p.nom}</p>
                  <span style={{ background:p.stock<=3?'#fee2e2':'#fef9c3', color:p.stock<=3?'#991b1b':'#854d0e', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:8 }}>
                    {p.stock<=3?'🔴 Critique':'🟡 Bas'}
                  </span>
                </div>
                <p style={{ fontSize:11, color:'#8a96b0', marginTop:3 }}>{p.categorie} · {p.poids}</p>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                  <span style={{ fontSize:12, color:'#4a5578' }}>Stock actuel</span>
                  <span style={{ fontSize:14, fontWeight:800, color:p.stock<=3?'#e53e3e':'#d0a83a' }}>{p.stock} unités</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const T = {
  h1:        { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:       { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:      { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  statCard:  { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
};