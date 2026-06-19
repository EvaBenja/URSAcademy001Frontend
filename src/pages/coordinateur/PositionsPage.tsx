import { useState, useEffect, type CSSProperties } from 'react';
import { Navigation, MapPin, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { geoService, livraisonsService } from '../../services/api';
import LivreurMap, { isHorsZone, OUAGA_RADIUS_KM, type LivreurPoint } from '../../components/ui/LivreurMap';
import toast from 'react-hot-toast';

const COLORS = ['#2196F3','#0a9e6e','#d0a83a','#e53e3e','#7c3aed','#0891b2'];

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
  const nomLivreur = (p:any) => `${p.livreur?.prenom||p.prenom||p.name||''} ${p.livreur?.nom||p.nom||''}`.trim() || 'Livreur';

  // Sépare les livreurs dans Ouaga (affichables sur la carte) des hors-zone (badge uniquement)
  const dansZone = positions.filter(p => !isHorsZone(Number(p.latitude), Number(p.longitude)));
  const horsZone = positions.filter(p => isHorsZone(Number(p.latitude), Number(p.longitude)));

  const mapPoints: LivreurPoint[] = dansZone.map((p, i) => {
    const livs = getLivsLivreur(p.id);
    return {
      id: p.id,
      nom: nomLivreur(p),
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      sousLabel: livs.length > 0 ? `${livs.length} livraison${livs.length>1?'s':''} en cours` : 'Disponible',
      couleur: COLORS[i % COLORS.length],
      selected: selected?.id === p.id,
    };
  });

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Positions des livreurs</h1>
          <p style={T.sub}>Suivi GPS en temps réel sur Ouagadougou — actualisation toutes les 20s</p>
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

      {/* Alerte livreurs hors zone */}
      {horsZone.length > 0 && (
        <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <AlertTriangle size={18} color="#854d0e" style={{flexShrink:0}}/>
          <span style={{ fontSize:13, color:'#854d0e' }}>
            <strong>{horsZone.length}</strong> livreur{horsZone.length>1?'s':''} hors zone (à plus de {OUAGA_RADIUS_KM} km de Ouagadougou) — non affiché{horsZone.length>1?'s':''} sur la carte :
          </span>
          {horsZone.map(p => (
            <span key={p.id} style={{ background:'#fde68a', color:'#78350f', fontSize:12, fontWeight:600, padding:'2px 10px', borderRadius:20 }}>
              {nomLivreur(p)}
            </span>
          ))}
        </div>
      )}

      <div className="map-layout" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:18 }}>
        {/* Carte réelle */}
        <div style={T.card}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:14 }}>Carte GPS — Ouagadougou</h3>
          {mapPoints.length === 0 ? (
            <div style={{ height:340, borderRadius:12, border:'1px solid #dde5f4', background:'#f8faff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
              <MapPin size={32} color="#8a96b0"/>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#8a96b0', textAlign:'center', padding:'0 24px' }}>
                Aucun livreur à Ouagadougou ne partage sa position actuellement
              </p>
            </div>
          ) : (
            <LivreurMap
              points={mapPoints}
              height={340}
              selectedId={selected?.id ?? null}
              onSelect={(id) => {
                const p = positions.find(x => x.id === id);
                setSelected(prev => prev?.id === id ? null : p);
              }}
            />
          )}
        </div>

        {/* Liste livreurs */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', margin:0 }}>Livreurs actifs</h3>
          {positions.length === 0 ? (
            <div style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:20, textAlign:'center' }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#8a96b0' }}>Aucun livreur en ligne</p>
            </div>
          ) : positions.map((p:any, i:number) => {
            const c = COLORS[i % COLORS.length];
            const livs = getLivsLivreur(p.id);
            const isSel = selected?.id === p.id;
            const horsZ = isHorsZone(Number(p.latitude), Number(p.longitude));
            return (
              <div key={p.id||i} onClick={()=>setSelected(isSel?null:p)}
                style={{ background:'white', borderRadius:12, border:`1.5px solid ${isSel?c:'#dde5f4'}`, padding:14, cursor:'pointer', transition:'all .2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${c},${c}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {nomLivreur(p)[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0, overflow:'hidden' }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomLivreur(p)}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#8a96b0' }}>
                      <Clock size={10}/> {p.position_updated_at ? new Date(p.position_updated_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—'}
                    </div>
                  </div>
                  {horsZ ? (
                    <span style={{ background:'#fde68a', color:'#78350f', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, flexShrink:0, whiteSpace:'nowrap' }}>Hors zone</span>
                  ) : (
                    <span style={{ background:'#dcfce7', color:'#166534', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, flexShrink:0, whiteSpace:'nowrap' }}>GPS ✓</span>
                  )}
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
