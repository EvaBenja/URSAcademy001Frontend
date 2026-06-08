import { useState, useEffect, type CSSProperties } from 'react';
import { Package, TrendingUp, Truck, Clock, CheckCircle, Trophy, AlertCircle } from 'lucide-react';
import { dashboardService, ventesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function GestDashboardPage() {
  const { user }     = useAuth();
  const [stats,      setStats]      = useState<any>(null);
  const [classement, setClassement] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const doLoad = () => Promise.all([dashboardService.stats(), ventesService.classement()])
      .then(([sr, cr]) => { setStats(sr.data); setClassement(cr.data.slice(0,5)); })
      .catch(() => {})
      .finally(() => setLoading(false));
    doLoad();
    const t = setInterval(doLoad, 15000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement du tableau de bord…
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Bonjour, {user?.prenom} 👋</h1>
        <p style={T.sub}>Tableau de bord gestionnaire — aperçu en temps réel</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Ventes en attente', val:stats?.ventes_en_attente ?? 0,  Icon:Clock,        color:'#d0a83a', bg:'#fdf3d7' },
          { label:'Ventes validées',   val:stats?.nombre_ventes ?? 0,      Icon:CheckCircle,  color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Stock faible',      val:stats?.stock_faible ?? 0,       Icon:AlertCircle,  color:'#e53e3e', bg:'#fee2e2' },
          { label:'Livraisons actives',val:stats?.livraisons_en_cours ?? 0,Icon:Truck,        color:'#3b82f6', bg:'#dbeafe' },
        ].map(({ label, val, Icon, color, bg }) => (
          <div key={label} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.2rem', display:'flex', alignItems:'center', gap:14, transition:'all .2s' }}
            onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 20px rgba(0,55,133,0.1)'; el.style.transform='translateY(-2px)'; }}
            onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='none'; }}>
            <div style={{ width:44, height:44, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={20} color={color}/>
            </div>
            <div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:26, fontWeight:700, color, margin:0, lineHeight:1 }}>{val}</p>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'5px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Classement */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <Trophy size={18} color="#d0a83a"/>
          <h2 style={T.cardTitle}>Top vendeurs</h2>
          {classement.length === 0 && (
            <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0', fontStyle:'italic' }}>
              Aucune vente validée pour le moment
            </span>
          )}
        </div>
        {classement.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', background:'#f8faff', borderRadius:10, border:'1px dashed #dde5f4' }}>
            <Trophy size={28} color="#dde5f4" style={{ marginBottom:10 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0', margin:0 }}>
              Le classement apparaît dès la première vente validée
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {classement.map((c:any, i:number) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:10, background:i===0?'linear-gradient(90deg,#fdf3d7,#fef9c3)':'#f8faff', border:i===0?'1.5px solid #d0a83a':'1px solid #f0f4fb' }}>
                <span style={{ fontSize:20, width:30, textAlign:'center', flexShrink:0 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0 }}>{c.vendeur}</p>
                  <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>{c.nombre_ventes} vente{c.nombre_ventes>1?'s':''}</p>
                </div>
                <span style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:i===0?'#d0a83a':'#0d1b3e' }}>
                  {Number(c.total).toLocaleString('fr-FR')} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)', marginTop:0 } as CSSProperties,
  cardTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
};
