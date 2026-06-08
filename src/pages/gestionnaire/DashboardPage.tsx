import { useState, useEffect, type CSSProperties } from 'react';
import { TrendingUp, Truck, Clock, CheckCircle, Trophy, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { dashboardService, ventesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function GestDashboardPage() {
  const { user }      = useAuth();
  const [stats,       setStats]      = useState<any>(null);
  const [classement,  setClassement] = useState<any[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [lastRefresh, setLastRefresh]= useState(new Date());

  const doLoad = async () => {
    try {
      const [sr, cr] = await Promise.all([
        dashboardService.stats(),
        ventesService.classement(),
      ]);
      setStats(sr.data);
      setClassement(cr.data.slice(0, 15));
      setLastRefresh(new Date());
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    doLoad();
    const t = setInterval(doLoad, 15000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement du tableau de bord…
    </div>
  );

  const STAT_CARDS = [
    { label:'Ventes en attente',  val: stats?.ventes_en_attente   ?? 0, Icon:Clock,        color:'#d0a83a', bg:'#fdf3d7' },
    { label:'Ventes validées',    val: stats?.nombre_ventes        ?? 0, Icon:CheckCircle,  color:'#0a9e6e', bg:'#dcfce7' },
    { label:'Produits stock bas', val: stats?.stock_faible         ?? 0, Icon:AlertCircle,  color:'#e53e3e', bg:'#fee2e2' },
    { label:'Livraisons actives', val: stats?.livraisons_en_cours  ?? 0, Icon:Truck,        color:'#3b82f6', bg:'#dbeafe' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Bonjour, {user?.prenom} 👋</h1>
          <p style={T.sub}>Tableau de bord — données en temps réel</p>
        </div>
        <button onClick={doLoad}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
          <RefreshCw size={14}/>
          {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Stats cards */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {STAT_CARDS.map(({ label, val, Icon, color, bg }) => (
          <div key={label} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.2rem', display:'flex', alignItems:'center', gap:14, transition:'all .2s' }}
            onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 6px 20px rgba(0,55,133,0.1)'; el.style.transform='translateY(-2px)'; }}
            onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; el.style.transform='none'; }}>
            <div style={{ width:44, height:44, borderRadius:11, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={20} color={color}/>
            </div>
            <div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:28, fontWeight:700, color, margin:0, lineHeight:1 }}>{val}</p>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'6px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CA total */}
      {stats?.total_ventes > 0 && (
        <div style={{ background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:14, padding:'1.4rem', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:'0 0 6px' }}>Chiffre d'affaires total (ventes validées)</p>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:32, fontWeight:700, color:'#d0a83a', margin:0 }}>
              {Number(stats.total_ventes).toLocaleString('fr-FR')} <span style={{ fontSize:16, color:'rgba(255,255,255,0.5)' }}>FCFA</span>
            </p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:'0 0 4px' }}>Livraisons en attente</p>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'white', margin:0 }}>
              {stats?.livraisons_en_attente ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Classement top 15 */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <Trophy size={18} color="#d0a83a"/>
          <h2 style={T.cardTitle}>Top 15 vendeurs</h2>
          <span style={{ marginLeft:'auto', fontSize:11, color:'#8a96b0' }}>
            Mis à jour : {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
          </span>
        </div>

        {classement.length === 0 ? (
          <div style={{ textAlign:'center', padding:'30px', background:'#f8faff', borderRadius:10, border:'1px dashed #dde5f4' }}>
            <Trophy size={28} color="#dde5f4" style={{ marginBottom:10 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0', margin:0 }}>
              Le classement apparaît dès la première vente soumise
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {classement.map((c:any, i:number) => {
              const medals: Record<number,string> = {0:'🥇',1:'🥈',2:'🥉'};
              const rang = medals[i] || `#${i+1}`;
              const isTop3 = i < 3;
              return (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 14px', borderRadius:10,
                  background: isTop3 ? `linear-gradient(90deg,${['#fdf3d7','#f8faff','#fdf3d7'][i]},#f8faff)` : '#f8faff',
                  border: isTop3 ? `1.5px solid ${['#d0a83a','#94a3b8','#cd7f32'][i]}` : '1px solid #f0f4fb',
                }}>
                  <span style={{ fontSize:isTop3?20:14, fontWeight:700, width:32, textAlign:'center', flexShrink:0, color:isTop3?'inherit':'#8a96b0' }}>
                    {rang}
                  </span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0 }}>{c.vendeur}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>
                      {c.nombre_ventes} vente{c.nombre_ventes>1?'s':''} soumise{c.nombre_ventes>1?'s':''}
                    </p>
                  </div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color: isTop3 ? '#1465BB' : '#4a5578' }}>
                    {Number(c.total).toLocaleString('fr-FR')} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){ .stats-grid{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
};
