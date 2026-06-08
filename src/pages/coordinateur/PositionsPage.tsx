import { useState, useEffect, type CSSProperties } from 'react';
import { Navigation, MapPin, Clock, RefreshCw } from 'lucide-react';
import { geoService, livraisonsService } from '../../services/api';
import toast from 'react-hot-toast';

export default function PositionsPage() {
  const [positions,   setPositions]   = useState<any[]>([]);
  const [livraisons,  setLivraisons]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const [pr, lr] = await Promise.all([
        geoService.livreurs().catch(() => ({ data: [] })),
        livraisonsService.getAll(),
      ]);
      setPositions(pr.data || []);
      setLivraisons((lr.data || []).filter((l:any) => l.statut === 'en_cours'));
      setLastRefresh(new Date());
    } catch { toast.error('Erreur chargement positions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);

  const getLivsLivreur = (id: number) => livraisons.filter((l:any) => l.livreur_id === id);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Positions des livreurs</h1>
          <p style={T.sub}>Suivi GPS en temps réel — actualisation toutes les 20s</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
          <RefreshCw size={14}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Livreurs GPS actifs',  val:positions.length,  color:'#0a9e6e'},
          {label:'Livraisons en cours',  val:livraisons.length, color:'#3b82f6'},
          {label:'Sans position GPS',    val:Math.max(0, livraisons.length - positions.length), color:'#d0a83a'},
        ].map(({label,val,color}) => (
          <div key={label} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.2rem', display:'flex', alignItems:'center', gap:13 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:'#e0f0ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Navigation size={18} color={color}/>
            </div>
            <div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="map-layout" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:18 }}>
        {/* Carte */}
        <div style={T.card}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:14 }}>Carte GPS</h3>
          <div style={{ background:'linear-gradient(135deg,#e0f4fb,#e8f0ff)', borderRadius:12, height:340, position:'relative', overflow:'hidden', border:'1px solid #dde5f4' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,55,133,0.04) 0,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(0,55,133,0.04) 0,transparent 1px,transparent 32px)'}}/>
            {positions.length === 0 ? (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
                <MapPin size={36} color="#8a96b0"/>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0', textAlign:'center', padding:'0 30px' }}>
                  Aucun livreur ne partage sa position GPS actuellement
                </p>
              </div>
            ) : positions.map((p:any, i:number) => {
              const colors=['#2196F3','#0a9e6e','#d0a83a','#e53e3e','#7c3aed','#0891b2'];
              const c = colors[i%colors.length];
              const x = 10+(i*22)%75, y = 10+(i*28)%75;
              const isSel = selected?.id === p.id;
              return (
                <div key={p.id||i} onClick={()=>setSelected(isSel?null:p)}
                  style={{ position:'absolute', left:`${x}%`, top:`${y}%`, cursor:'pointer', zIndex:isSel?10:1 }}>
                  <div style={{ width:26, height:26, borderRadius:'50% 50% 50% 0', background:c, transform:'rotate(-45deg)', border:`3px solid ${isSel?'#0d1b3e':'white'}`, boxShadow:`0 3px 10px ${c}66` }}/>
                  <div style={{ background:'white', borderRadius:6, padding:'3px 8px', fontSize:10, fontWeight:700, color:c, boxShadow:'0 2px 8px rgba(0,0,0,0.12)', marginTop:4, whiteSpace:'nowrap' }}>
                    {p.livreur?.prenom||p.name||`Livreur ${i+1}`}
                  </div>
                </div>
              );
            })}
            <div style={{ position:'absolute', top:10, right:10, background:'rgba(10,158,110,0.9)', color:'white', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>
              ● En direct
            </div>
          </div>
        </div>

        {/* Liste livreurs */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', margin:0 }}>Livreurs actifs</h3>
          {positions.length === 0 ? (
            <div style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:20, textAlign:'center' }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#8a96b0' }}>Aucun livreur en ligne</p>
            </div>
          ) : positions.map((p:any, i:number) => {
            const colors=['#2196F3','#0a9e6e','#d0a83a','#e53e3e','#7c3aed'];
            const c = colors[i%colors.length];
            const livs = getLivsLivreur(p.livreur_id||p.id);
            const isSel = selected?.id === p.id;
            return (
              <div key={p.id||i} onClick={()=>setSelected(isSel?null:p)}
                style={{ background:'white', borderRadius:12, border:`1.5px solid ${isSel?c:'#dde5f4'}`, padding:14, cursor:'pointer', transition:'all .2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${c},${c}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {(p.livreur?.prenom||p.name||'L')[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{p.livreur?.prenom||p.name} {p.livreur?.nom||''}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#8a96b0' }}>
                      <Clock size={10}/> {p.updated_at ? new Date(p.updated_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—'}
                    </div>
                  </div>
                  <span style={{ background:'#dcfce7', color:'#166534', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>GPS ✓</span>
                </div>
                {livs.length > 0 && (
                  <div style={{ background:'#f8faff', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#4a5578' }}>
                    <strong>{livs.length}</strong> livraison{livs.length>1?'s':''} en cours
                    {livs[0]?.zone_livraison && <span style={{ color:'#1465BB' }}> — {livs[0].zone_livraison}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media(max-width:900px){ .map-layout{grid-template-columns:1fr!important;} .stats-3{grid-template-columns:1fr!important;} }
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
};
