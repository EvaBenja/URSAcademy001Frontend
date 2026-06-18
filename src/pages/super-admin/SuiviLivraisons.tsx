import { useState, useEffect, type CSSProperties } from 'react';
import { MapPin, Truck, Trophy, RefreshCw, Clock } from 'lucide-react';
import { livraisonsService, ventesService, geoService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af'},
  en_cours:   {label:'En cours',   bg:'#dcfce7', color:'#166634'},
  rejetee:    {label:'Rejetée',    bg:'#fee2e2', color:'#991b1b'},
  terminee:   {label:'Terminée',   bg:'#f1f5f9', color:'#475569'},
};

export default function SuiviLivraisonsPage() {
  const [livraisons,  setLivraisons]  = useState<any[]>([]);
  const [classement,  setClassement]  = useState<any[]>([]);
  const [positions,   setPositions]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'carte'|'classement'|'livraisons'>('livraisons');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const [lr, cr, pr] = await Promise.all([
        livraisonsService.getAll(),
        ventesService.classement(),
        geoService.livreurs().catch(() => ({ data: [] })),
      ]);
      setLivraisons(lr.data || []);
      setClassement(cr.data || []);
      setPositions(pr.data || []);
      setLastRefresh(new Date());
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Suivi en temps réel</h1>
          <p style={T.sub}>Livraisons, positions GPS et classement vendeurs</p>
        </div>
        <button onClick={load} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
          <RefreshCw size={14}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'En cours',    val:livraisons.filter(l=>l.statut==='en_cours').length,   color:'#3b82f6'},
          {label:'En attente',  val:livraisons.filter(l=>l.statut==='en_attente').length, color:'#d0a83a'},
          {label:'Terminées',   val:livraisons.filter(l=>l.statut==='terminee').length,   color:'#0a9e6e'},
          {label:'GPS actifs',  val:positions.length,                                     color:'#7c3aed'},
        ].map(({label,val,color}) => (
          <div key={label} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4', width:'fit-content', flexWrap:'wrap' }}>
        {([['livraisons','📦 Livraisons'],['classement','🏆 Classement'],['carte','🗺️ Carte GPS']] as const).map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:'8px 18px', borderRadius:7, border:'none', background:tab===k?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:tab===k?'white':'#4a5578', fontSize:13, fontWeight:tab===k?600:400, cursor:'pointer', whiteSpace:'nowrap' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Livraisons */}
      {tab === 'livraisons' && (
        <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
          <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>{['#','Zone','Livreur','Statut','Date'].map(h=>(
                <th key={h} style={T.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {livraisons.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif' }}>Aucune livraison</td></tr>
              ) : livraisons.map((l:any) => {
                const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
                return (
                  <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{l.id}</td>
                    <td style={T.td}><span style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={12} color="#1465BB"/>{l.zone_livraison||'—'}</span></td>
                    <td style={T.td}>{l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : <span style={{ color:'#8a96b0', fontStyle:'italic' }}>Non assigné</span>}</td>
                    <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span></td>
                    <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Classement */}
      {tab === 'classement' && (
        <div style={T.card}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Trophy size={18} color="#d0a83a"/>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 }}>Classement vendeurs</h2>
          </div>
          {classement.length === 0 ? (
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0', textAlign:'center', padding:'30px' }}>Aucune vente validée pour le moment</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {classement.map((c:any, i:number) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:i===0?'linear-gradient(90deg,#fdf3d7,#fef9c3)':'#f8faff', border:i===0?'1.5px solid #d0a83a':'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
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
      )}

      {/* Carte */}
      {tab === 'carte' && (
        <div style={T.card}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:14 }}>Positions GPS livreurs</h3>
          <div style={{ background:'linear-gradient(135deg,#e0f4fb,#e8f0ff)', borderRadius:12, height:280, position:'relative', overflow:'hidden', border:'1px solid #dde5f4' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,rgba(0,55,133,0.04) 0,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(0,55,133,0.04) 0,transparent 1px,transparent 32px)'}}/>
            {positions.length === 0 ? (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10 }}>
                <MapPin size={32} color="#8a96b0"/>
                <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0', textAlign:'center' }}>Aucun livreur ne partage sa position GPS</p>
              </div>
            ) : positions.map((p:any, i:number) => {
              const colors=['#2196F3','#0a9e6e','#d0a83a','#e53e3e','#7c3aed'];
              const c = colors[i%colors.length];
              return (
                <div key={p.id||i} style={{ position:'absolute', left:`${15+(i*20)%70}%`, top:`${15+(i*25)%70}%` }}>
                  <div style={{ width:22, height:22, borderRadius:'50% 50% 50% 0', background:c, transform:'rotate(-45deg)', border:'2px solid white', boxShadow:`0 2px 8px ${c}66` }}/>
                  <div style={{ background:'white', borderRadius:6, padding:'2px 7px', fontSize:10, fontWeight:700, color:c, marginTop:4, whiteSpace:'nowrap', boxShadow:'0 2px 6px rgba(0,0,0,0.1)' }}>
                    {p.livreur?.prenom||`L${i+1}`}
                  </div>
                </div>
              );
            })}
            <div style={{ position:'absolute', top:10, right:10, background:'rgba(10,158,110,0.9)', color:'white', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 }}>● En direct</div>
          </div>
          {positions.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:14 }}>
              {positions.map((p:any, i:number) => (
                <div key={p.id||i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, background:'#f8faff' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#0891b2,#0e7490)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700, flexShrink:0 }}>
                    {(p.livreur?.prenom||'L')[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{p.livreur?.prenom} {p.livreur?.nom}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0, display:'flex', alignItems:'center', gap:4 }}>
                      <Clock size={10}/> {p.updated_at ? new Date(p.updated_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '—'}
                    </p>
                  </div>
                  <span style={{ background:'#dcfce7', color:'#166534', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>GPS ✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem' } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
};
