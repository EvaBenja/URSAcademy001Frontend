import { useState, type CSSProperties } from 'react';
import { MapPin, AlertTriangle, RefreshCw, X, CheckCircle, User } from 'lucide-react';
import { useStore, reassignerLivreur, type StatutVente } from '../../store/ventesStore';
import KilometragePanel from '../../components/dashboard/KilometragePanel';

const STATUT_CONFIG: Record<string,{label:string;bg:string;color:string}> = {
  en_attente:      {label:'En attente',    bg:'#fef9c3',color:'#854d0e'},
  validee:         {label:'Validée',       bg:'#dbeafe',color:'#1e40af'},
  notif_livreur:   {label:'Notif.livreur', bg:'#e0f0ff',color:'#1465BB'},
  rejetee_livreur: {label:'Rejet livreur', bg:'#fee2e2',color:'#991b1b'},
  en_livraison:    {label:'En livraison',  bg:'#fdf3d7',color:'#854d0e'},
  livree:          {label:'Livrée ✓',      bg:'#dcfce7',color:'#166534'},
  non_livree:      {label:'Non livrée',    bg:'#fee2e2',color:'#991b1b'},
  refusee:         {label:'Refusée',       bg:'#f1f5f9',color:'#475569'},
};

const STATUT_LIV = {
  disponible: {label:'Disponible', bg:'#dcfce7', color:'#166534'},
  en_course:  {label:'En course',  bg:'#fdf3d7', color:'#854d0e'},
  hors_ligne: {label:'Hors ligne', bg:'#f1f5f9', color:'#475569'},
};

type TabType = 'alertes' | 'livreurs' | 'livraisons' | 'kilometrage';

export default function CoordinateurLivraisonsPage() {
  const { ventes, livreurs, notifs, mesNotifs } = useStore();
  const [tab,           setTab]           = useState<TabType>('alertes');
  const [reassignModal, setReassignModal] = useState<string|null>(null);
  const [livreurChoisi, setLivreurChoisi] = useState('');

  const mesN        = mesNotifs('coordinateur');
  const nonLues     = mesN.filter((n:any)=>!n.lu).length;
  const alertes     = ventes.filter(v=>['rejetee_livreur','non_livree'].includes(v.statut));
  const sanLivreur  = ventes.filter(v=>v.statut==='validee'&&!v.livreurId);
  const enLivraison = ventes.filter(v=>v.statut==='en_livraison');
  const disponibs   = livreurs.filter(l=>l.statut==='disponible');

  const doReassign = () => {
    if (!reassignModal||!livreurChoisi) return;
    reassignerLivreur(reassignModal, livreurChoisi);
    setReassignModal(null); setLivreurChoisi('');
  };

  const TABS: [TabType,string][] = [
    ['alertes',      `⚠️ Alertes (${alertes.length+sanLivreur.length})`],
    ['livreurs',     `🚴 Livreurs (${livreurs.length})`],
    ['livraisons',   `📦 Livraisons (${ventes.length})`],
    ['kilometrage',  '📍 Kilométrage'],
  ];

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Coordination des Livraisons</h1>
          <p style={T.sub}>Gérez les assignations et suivez les alertes en temps réel</p>
        </div>
        {nonLues > 0 && (
          <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={15} color="#e53e3e"/>
            <span style={{ fontSize:13, fontWeight:600, color:'#991b1b' }}>{nonLues} alerte{nonLues>1?'s':''} non lue{nonLues>1?'s':''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Alertes actives',  val:alertes.length,    color:'#e53e3e', bg:'#fee2e2'},
          {label:'Sans livreur',     val:sanLivreur.length, color:'#d0a83a', bg:'#fdf3d7'},
          {label:'En livraison',     val:enLivraison.length,color:'#1465BB', bg:'#e0f0ff'},
          {label:'Disponibles',      val:disponibs.length,  color:'#0a9e6e', bg:'#dcfce7'},
        ].map(({label,val,color,bg})=>(
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4', width:'fit-content' }}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:tab===id?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:tab===id?'white':'#4a5578', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ TAB ALERTES ══ */}
      {tab==='alertes' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {alertes.length===0 && sanLivreur.length===0 ? (
            <div style={{ ...T.card, textAlign:'center', padding:'48px' }}>
              <CheckCircle size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune alerte en cours ✓</p>
            </div>
          ) : <>
            {alertes.map(v=>(
              <div key={v.id} style={{ ...T.card, border:'1.5px solid #fecaca', background:'#fff5f5' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <AlertTriangle size={18} color="#e53e3e" style={{ flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{v.ref} — {v.produitNom} — {v.zone}</p>
                    <p style={{ fontSize:12, color:'#e53e3e', marginTop:3 }}>
                      {v.statut==='rejetee_livreur'
                        ? `🚫 Rejeté par ${v.livreurNom} : "${v.motifRejet}"`
                        : `❌ Non livrée : "${v.motifRejet}"`}
                    </p>
                  </div>
                  <button onClick={()=>{setReassignModal(v.id);setLivreurChoisi('');}}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                    <RefreshCw size={13}/> Réassigner
                  </button>
                </div>
              </div>
            ))}
            {sanLivreur.map(v=>(
              <div key={v.id} style={{ ...T.card, border:'1.5px solid #fcd34d', background:'#fffbeb' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <AlertTriangle size={18} color="#d0a83a" style={{ flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{v.ref} — {v.produitNom} — Zone : {v.zone}</p>
                    <p style={{ fontSize:12, color:'#d0a83a', marginTop:3 }}>⚠️ Aucun livreur disponible en zone {v.zone}</p>
                  </div>
                  <button onClick={()=>{setReassignModal(v.id);setLivreurChoisi('');}}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'linear-gradient(90deg,#d0a83a,#ae8f1e)', color:'white', border:'none', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                    <User size={13}/> Assigner
                  </button>
                </div>
              </div>
            ))}
          </>}
        </div>
      )}

      {/* ══ TAB LIVREURS ══ */}
      {tab==='livreurs' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {livreurs.map(l=>{
            const sc = STATUT_LIV[l.statut];
            const venteEC = ventes.find(v=>v.livreurId===l.id&&v.statut==='en_livraison');
            return (
              <div key={l.id} style={{ ...T.card, border:`1px solid ${l.statut==='en_course'?'#bfdbfe':'#dde5f4'}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'white', flexShrink:0 }}>
                    {l.nom[0]}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{l.nom}</p>
                    <p style={{ fontSize:12, color:'#8a96b0' }}>{l.zone} · {l.telephone}</p>
                  </div>
                  <span style={{ background:sc.bg, color:sc.color, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10 }}>{sc.label}</span>
                </div>
                {venteEC && <p style={{ fontSize:11, color:'#1465BB', background:'#e0f0ff', borderRadius:6, padding:'4px 8px', marginBottom:8 }}>📦 {venteEC.ref} · {venteEC.produitNom}</p>}
                <p style={{ fontSize:11, color:'#8a96b0' }}>📍 {l.position.lat.toFixed(4)}, {l.position.lng.toFixed(4)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ TAB LIVRAISONS ══ */}
      {tab==='livraisons' && (
        <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>{['Réf.','Vendeur','Produit','Zone','Livreur','Total','Statut','Motif','Màj'].map(h=>(
                  <th key={h} style={T.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {ventes.map(v=>{
                  const sc = STATUT_CONFIG[v.statut]||{label:v.statut,bg:'#f1f5f9',color:'#475569'};
                  return (
                    <tr key={v.id}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.ref}</td>
                      <td style={T.td}>{v.vendeurNom}</td>
                      <td style={T.td}>{v.produitNom}</td>
                      <td style={T.td}>{v.zone}</td>
                      <td style={T.td}>
                        {v.livreurNom
                          ? <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:22, height:22, borderRadius:'50%', background:'#e0f0ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#1465BB' }}>{v.livreurNom[0]}</div>
                              {v.livreurNom}
                            </div>
                          : <span style={{ color:'#8a96b0', fontStyle:'italic' }}>Non assigné</span>}
                      </td>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.montantTotal.toLocaleString()} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                      <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span></td>
                      <td style={{ ...T.td, maxWidth:160, fontSize:12, color:'#e53e3e' }}>{v.motifRejet||<span style={{color:'#c0cce0'}}>—</span>}</td>
                      <td style={{ ...T.td, color:'#8a96b0', whiteSpace:'nowrap', fontSize:12 }}>{v.updatedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ TAB KILOMÉTRAGE ══ */}
      {tab==='kilometrage' && <KilometragePanel livreurs={livreurs}/>}

      {/* Modal réassignation */}
      {reassignModal && (
        <div onClick={()=>setReassignModal(null)} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 }}>Réassigner un livreur</h3>
              <button onClick={()=>setReassignModal(null)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}><X size={15}/></button>
            </div>
            <div style={{ padding:22 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', marginBottom:14 }}>Choisissez un livreur disponible :</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {disponibs.length === 0
                  ? <p style={{ textAlign:'center', color:'#e53e3e', fontSize:13, padding:'16px 0' }}>⚠️ Aucun livreur disponible</p>
                  : disponibs.map(l => (
                    <button key={l.id} onClick={()=>setLivreurChoisi(l.id)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9, border:`1.5px solid ${livreurChoisi===l.id?'#1465BB':'#dde5f4'}`, background:livreurChoisi===l.id?'#e0f0ff':'white', cursor:'pointer', textAlign:'left' }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0 }}>{l.nom[0]}</div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{l.nom}</p>
                        <p style={{ fontSize:11, color:'#8a96b0' }}>Zone : {l.zone} · {l.telephone}</p>
                      </div>
                      {livreurChoisi===l.id && <CheckCircle size={16} color="#1465BB"/>}
                    </button>
                  ))}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setReassignModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' }}>Annuler</button>
                <button onClick={doReassign} disabled={!livreurChoisi}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:livreurChoisi?'linear-gradient(90deg,#1465BB,#003785)':'#94a3b8', color:'white', border:'none', fontWeight:600, cursor:livreurChoisi?'pointer':'not-allowed', fontSize:14 }}>
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  h1:       { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:      { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:     { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  statCard: { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:       { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:       { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
};