import { useState, type CSSProperties } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Star, Award, Target } from 'lucide-react';
import { useStore } from '../../store/ventesStore';

export default function ClassementVendeursPage() {
  const { ventes, classementVendeurs } = useStore();
  const [periode, setPeriode] = useState<'jour'|'semaine'|'mois'>('jour');

  const classement = classementVendeurs();

  // Stats globales
  const totalCA      = classement.reduce((s, c) => s + c.total, 0);
  const totalVentes  = classement.reduce((s, c) => s + c.nb, 0);
  const totalLivrees = classement.reduce((s, c) => s + c.livrees, 0);
  const meilleur     = classement[0];

  // Toutes les ventes par vendeur pour le détail
  const detailParVendeur = classement.map(c => {
    const sesVentes = ventes.filter(v => v.vendeurId === c.vendeurId && v.statut !== 'refusee');
    const enAttente = sesVentes.filter(v => v.statut === 'en_attente').length;
    const enCours   = sesVentes.filter(v => ['en_livraison','notif_livreur','validee'].includes(v.statut)).length;
    const tauxLiv   = c.nb > 0 ? Math.round((c.livrees / c.nb) * 100) : 0;
    return { ...c, enAttente, enCours, tauxLiv, sesVentes };
  });

  const medals   = ['🥇','🥈','🥉'];
  const podiumBg = ['linear-gradient(135deg,#d0a83a,#ae8f1e)','linear-gradient(135deg,#94a3b8,#64748b)','linear-gradient(135deg,#cd7c2a,#92400e)'];

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Classement des Vendeurs</h1>
          <p style={T.sub}>Performance et suivi des ventes par vendeur</p>
        </div>
        {/* Filtre période */}
        <div style={{ display:'flex', gap:4, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4' }}>
          {(['jour','semaine','mois'] as const).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              style={{ padding:'7px 16px', borderRadius:7, border:'none', background:periode===p?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:periode===p?'white':'#4a5578', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', textTransform:'capitalize' }}>
              {p === 'jour' ? "Aujourd'hui" : p === 'semaine' ? 'Cette semaine' : 'Ce mois'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats globales */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'CA total',        val:totalCA.toLocaleString()+' FCFA', color:'#1465BB', bg:'#e0f0ff', Icon:TrendingUp   },
          { label:'Total ventes',    val:totalVentes,                      color:'#0a9e6e', bg:'#dcfce7', Icon:Target       },
          { label:'Ventes livrées',  val:totalLivrees,                     color:'#d0a83a', bg:'#fdf3d7', Icon:Award        },
          { label:'Vendeurs actifs', val:classement.length,                color:'#7c3aed', bg:'#ede9fe', Icon:Star         },
        ].map(({ label, val, color, bg, Icon }) => (
          <div key={label} style={T.statCard}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${color}22` }}>
                <Icon size={18} color={color}/>
              </div>
              <div>
                <p style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color, lineHeight:1 }}>{val}</p>
                <p style={{ fontSize:11, color:'#8a96b0', marginTop:3 }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Podium top 3 */}
      {classement.length >= 1 && (
        <div style={{ ...T.card, marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <Trophy size={18} color="#d0a83a"/>
            <h2 style={T.cardTitle}>Podium du jour</h2>
          </div>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', gap:16 }}>
            {/* 2e place */}
            {classement[1] && (
              <div style={{ textAlign:'center', flex:1, maxWidth:200 }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:podiumBg[1], display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'white', margin:'0 auto 10px', border:'3px solid white', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
                  {classement[1].nom[0]}
                </div>
                <p style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:600, color:'#0d1b3e', marginBottom:3 }}>{classement[1].nom}</p>
                <p style={{ fontSize:13, fontWeight:700, color:'#64748b', marginBottom:6 }}>{classement[1].total.toLocaleString()} FCFA</p>
                <div style={{ background:podiumBg[1], borderRadius:'8px 8px 0 0', height:80, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:28 }}>🥈</span>
                </div>
              </div>
            )}
            {/* 1re place */}
            <div style={{ textAlign:'center', flex:1, maxWidth:220 }}>
              <div style={{ position:'relative', display:'inline-block', marginBottom:10 }}>
                <div style={{ width:68, height:68, borderRadius:'50%', background:podiumBg[0], display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'white', border:'4px solid white', boxShadow:'0 6px 20px rgba(208,168,58,0.4)' }}>
                  {classement[0].nom[0]}
                </div>
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', fontSize:22 }}>👑</div>
              </div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#0d1b3e', marginBottom:4 }}>{classement[0].nom}</p>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#d0a83a', marginBottom:8 }}>{classement[0].total.toLocaleString()} FCFA</p>
              <div style={{ background:podiumBg[0], borderRadius:'8px 8px 0 0', height:110, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:32 }}>🥇</span>
              </div>
            </div>
            {/* 3e place */}
            {classement[2] && (
              <div style={{ textAlign:'center', flex:1, maxWidth:200 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:podiumBg[2], display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'white', margin:'0 auto 10px', border:'3px solid white', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
                  {classement[2].nom[0]}
                </div>
                <p style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:600, color:'#0d1b3e', marginBottom:3 }}>{classement[2].nom}</p>
                <p style={{ fontSize:13, fontWeight:700, color:'#92400e', marginBottom:6 }}>{classement[2].total.toLocaleString()} FCFA</p>
                <div style={{ background:podiumBg[2], borderRadius:'8px 8px 0 0', height:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:24 }}>🥉</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classement détaillé */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
          <h2 style={T.cardTitle}>Classement complet</h2>
          <span style={{ marginLeft:'auto', background:'#f4f7fd', color:'#4a5578', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>
            {detailParVendeur.length} vendeur{detailParVendeur.length>1?'s':''}
          </span>
        </div>

        {detailParVendeur.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px' }}>
            <Trophy size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune vente enregistrée pour cette période</p>
          </div>
        ) : detailParVendeur.map((c, i) => {
          const pct     = totalCA > 0 ? (c.total / totalCA) * 100 : 0;
          const maxTotal = detailParVendeur[0].total;
          const barPct  = maxTotal > 0 ? (c.total / maxTotal) * 100 : 0;
          const isBest  = i === 0;

          return (
            <div key={c.vendeurId} style={{ marginBottom:16, padding:'16px', borderRadius:12, background: isBest ? 'linear-gradient(135deg,#fff9e6,#fffbf0)' : '#f8faff', border: isBest ? '1.5px solid #d0a83a' : '1px solid #f0f4fb' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
                {/* Rang */}
                <div style={{ width:36, height:36, borderRadius:9, background: isBest ? 'linear-gradient(135deg,#d0a83a,#ae8f1e)' : i===1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' : i===2 ? 'linear-gradient(135deg,#cd7c2a,#92400e)' : '#f0f4fb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize: i < 3 ? 18 : 13, fontWeight:700, color: i < 3 ? 'white' : '#8a96b0' }}>{medals[i] || `#${i+1}`}</span>
                </div>
                {/* Avatar */}
                <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'white', flexShrink:0 }}>
                  {c.nom[0]}
                </div>
                {/* Infos */}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#0d1b3e' }}>{c.nom}</p>
                    {isBest && <span style={{ background:'#fdf3d7', color:'#854d0e', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>⭐ Leader</span>}
                  </div>
                  <p style={{ fontSize:12, color:'#8a96b0' }}>
                    {c.nb} vente{c.nb>1?'s':''} · {c.livrees} livrée{c.livrees>1?'s':''} · taux {c.tauxLiv}%
                  </p>
                </div>
                {/* CA */}
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color: isBest ? '#d0a83a' : '#1465BB' }}>
                    {c.total.toLocaleString()}
                    <span style={{ fontSize:11, color:'#8a96b0', fontFamily:'DM Sans,sans-serif', fontWeight:400 }}> FCFA</span>
                  </p>
                  <p style={{ fontSize:11, color:'#8a96b0' }}>{pct.toFixed(1)}% du CA total</p>
                </div>
              </div>

              {/* Barre de progression */}
              <div style={{ background:'#e8f0ff', borderRadius:20, height:7, overflow:'hidden', marginBottom:10 }}>
                <div style={{ height:'100%', width:`${barPct}%`, background: isBest ? 'linear-gradient(90deg,#d0a83a,#ae8f1e)' : 'linear-gradient(90deg,#2196F3,#1465BB)', borderRadius:20, transition:'width .5s ease' }}/>
              </div>

              {/* Mini stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[
                  { label:'En attente', val:c.enAttente, color:'#d0a83a' },
                  { label:'En cours',   val:c.enCours,   color:'#1465BB' },
                  { label:'Livrées',    val:c.livrees,   color:'#0a9e6e' },
                  { label:'Total',      val:c.nb,        color:'#7c3aed' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background:'white', borderRadius:8, padding:'7px 10px', textAlign:'center', border:'1px solid #f0f4fb' }}>
                    <p style={{ fontSize:16, fontWeight:700, color, lineHeight:1 }}>{val}</p>
                    <p style={{ fontSize:10, color:'#8a96b0', marginTop:3 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const T = {
  h1:       { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:      { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:     { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  statCard: { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
};