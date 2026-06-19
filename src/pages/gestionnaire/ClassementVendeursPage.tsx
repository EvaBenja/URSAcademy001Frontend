import { useState, useEffect, type CSSProperties } from 'react';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { ventesService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ClassementVendeursPage() {
  const [classement, setClassement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doLoad = () => ventesService.classement()
      .then(r => setClassement(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    doLoad();
    const t = setInterval(doLoad, 15000);
    return () => clearInterval(t);
  }, []);

  const podium = classement.slice(0, 3);
  const reste  = classement.slice(3);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Classement des Vendeurs</h1>
        <p style={T.sub}>Performances de vente du jour — classement en temps réel</p>
      </div>

      {classement.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune vente validée pour le moment</div>
      ) : (
        <>
          {/* Podium */}
          <div className="podium" style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', gap:20, marginBottom:40, flexWrap:'wrap' }}>
            {[podium[1], podium[0], podium[2]].filter(Boolean).map((c: any, i) => {
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
              const heights = ['130px', '170px', '110px'];
              const colors  = ['#C0C0C0','#FFD700','#CD7F32'];
              const emojis  = ['🥈','🥇','🥉'];
              return (
                <div key={rank} style={{ display:'flex', flexDirection:'column', alignItems:'center', width:160 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>{emojis[i]}</div>
                  <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${colors[i]},${colors[i]}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:rank===1?'#5a3e00':'white', marginBottom:10, boxShadow:`0 6px 20px ${colors[i]}66`, border:`3px solid ${colors[i]}` }}>
                    {(c.vendeur||'?')[0]}
                  </div>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'#0d1b3e', textAlign:'center', margin:'0 0 4px' }}>{c.vendeur}</p>
                  <p style={{ fontSize:12, color:'#1465BB', fontWeight:700, margin:'0 0 10px' }}>{new Intl.NumberFormat('fr-FR').format(c.total)} FCFA</p>
                  <div style={{ width:'100%', height:heights[i], background:`linear-gradient(180deg,${colors[i]},${colors[i]}aa)`, borderRadius:'10px 10px 0 0', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:12, border:`1px solid ${colors[i]}` }}>
                    <span style={{ fontSize:28, fontWeight:900, color:'rgba(255,255,255,0.8)' }}>#{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reste */}
          {reste.length > 0 && (
            <div style={T.card}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
                <Award size={18} color="#1465BB"/>
                <h2 style={T.cardTitle}>Suite du classement</h2>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {reste.map((c: any, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 14px', borderRadius:10, background:'#f8faff', border:'1px solid #f0f4fb', flexWrap:'wrap' }}>
                    <span style={{ fontSize:15, fontWeight:700, color:'#8a96b0', width:30, textAlign:'center', flexShrink:0 }}>#{i+4}</span>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#4a5578,#2d3a5a)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, flexShrink:0 }}>
                      {(c.vendeur||'?')[0]}
                    </div>
                    <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
                      <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.vendeur}</p>
                      <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>{c.nombre_ventes} vente{c.nombre_ventes>1?'s':''}</p>
                    </div>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#0d1b3e', flexShrink:0, whiteSpace:'nowrap' }}>
                      {new Intl.NumberFormat('fr-FR').format(c.total)} <span style={{ fontSize:11, color:'#8a96b0' }}>FCFA</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
};