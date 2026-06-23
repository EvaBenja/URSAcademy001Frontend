import { useState, useEffect, type CSSProperties } from 'react';
import { MapPin, Eye, X, Navigation, AlertTriangle, Users, Zap, RefreshCw } from 'lucide-react';
import { livraisonsService, utilisateursService, geoService } from '../../services/api';
import toast from 'react-hot-toast';
import SearchBar from '../../components/ui/SearchBar';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente:                {label:'En attente',                    bg:'#fef9c3', color:'#854d0e'},
  validee:                   {label:'Assignée — attente accord',     bg:'#dbeafe', color:'#1e40af'},
  en_cours:                  {label:'En livraison',                  bg:'#dcfce7', color:'#166634'},
  rejetee:                   {label:'Rejetée — à réassigner',        bg:'#fee2e2', color:'#991b1b'},
  livree_attente_validation: {label:'Clôturée — attente validation', bg:'#ede9fe', color:'#5b21b6'},
  terminee:                  {label:'Terminée',                      bg:'#f1f5f9', color:'#475569'},
};

export default function CoordLivraisonsPage() {
  const [livraisons,   setLivraisons]   = useState<any[]>([]);
  const [livreurs,     setLivreurs]     = useState<any[]>([]);
  const [positions,    setPositions]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [detail,       setDetail]       = useState<any>(null);
  const [reassignModal,setReassignModal]= useState<any>(null);
  const [filter,       setFilter]       = useState('tous');
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, []);

  const load = async (silent = false) => {
    try {
      const [lr, ur, pr] = await Promise.all([
        livraisonsService.getAll(),
        utilisateursService.getAll({ role: 'livreur' }),
        geoService.livreurs().catch(() => ({ data: [] })),
      ]);
      setLivraisons(lr.data || []);
      setLivreurs(ur.data?.filter((u:any) => u.role?.nom === 'livreur' || u.role_nom === 'livreur') || []);
      setPositions(pr.data || []);
    } catch { if (!silent) toast.error('Erreur chargement livraisons'); }
    finally { setLoading(false); }
  };

  // GPS auto (exclut le livreur rejeteur automatiquement côté backend)
  const doAssignerGPS = async (livraison: any) => {
    setSaving(true);
    toast.loading('Recherche du livreur le plus proche…', { id: `gps-${livraison.id}` });
    try {
      const res = await livraisonsService.assigner(livraison.id);
      toast.success(
        `✓ Assigné : ${res.data.livreur}${res.data.distance ? ` (${res.data.distance})` : ''}`,
        { id: `gps-${livraison.id}`, duration: 5000 }
      );
      setReassignModal(null); setDetail(null); load();
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Aucun livreur disponible', { id: `gps-${livraison.id}` });
    } finally { setSaving(false); }
  };

  // Assignation manuelle à un livreur choisi
  const doAssignerManuel = async (livraison: any, livreurId: number, nomLivreur: string) => {
    setSaving(true);
    try {
      await livraisonsService.assigner(livraison.id, livreurId);
      toast.success(`✓ Course #${livraison.id} assignée à ${nomLivreur}`);
      setReassignModal(null); setDetail(null); load();
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const [queryC, setQueryC] = useState('');
  const rejetees   = livraisons.filter(l => l.statut === 'rejetee');
  const filteredBase = filter === 'tous' ? livraisons : livraisons.filter((l:any) => l.statut === filter);
  const filtered = filteredBase.filter((l:any) => {
    if (!queryC.trim()) return true;
    const q = queryC.toLowerCase();
    const nomLiv = `${l.livreur?.prenom||l.livreur?.name||''} ${l.livreur?.nom||''}`.toLowerCase();
    return nomLiv.includes(q) || (l.zone_livraison||'').toLowerCase().includes(q) || String(l.id).includes(q);
  });

  // Livreur GPS actif = a une position récente
  const livreurActif = (livreurId: number) => positions.find((p:any) => p.id === livreurId);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Coordination des Livraisons</h1>
          <p style={T.sub}>Assignez les livreurs — GPS auto ou choix manuel</p>
        </div>
        <button onClick={()=>load()} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578' }}>
          <RefreshCw size={13}/>
        </button>
      </div>

      {/* Alerte courses rejetées */}
      {rejetees.length > 0 && (
        <div style={{ background:'linear-gradient(90deg,#e53e3e,#991b1b)', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <AlertTriangle size={20} color="white" style={{flexShrink:0}}/>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'white', margin:0 }}>
              {rejetees.length} course{rejetees.length>1?'s':''} rejetée{rejetees.length>1?'s':''} — réassignation nécessaire
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.75)', margin:0 }}>
              {rejetees.map((l:any) => {
                const nomRej = l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : '?';
                return `Course #${l.id} rejetée par ${nomRej}`;
              }).join(' · ')}
            </p>
          </div>
          <button onClick={()=>setFilter('rejetee')}
            style={{ padding:'8px 14px', borderRadius:8, background:'white', border:'none', color:'#e53e3e', fontWeight:700, cursor:'pointer', fontSize:13, flexShrink:0 }}>
            Gérer →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',      val:livraisons.length,                                   color:'#1465BB', s:'tous'     },
          {label:'En attente', val:livraisons.filter(l=>l.statut==='en_attente').length, color:'#d0a83a', s:'en_attente'},
          {label:'En cours',   val:livraisons.filter(l=>l.statut==='en_cours').length,   color:'#0a9e6e', s:'en_cours' },
          {label:'Rejetées',   val:rejetees.length,                                      color:'#e53e3e', s:'rejetee'  },
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="tabs-scroll" style={{ display:'flex', gap:8, marginBottom:14 }}>
        {(['tous','en_attente','validee','en_cours','rejetee','terminee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
            {s==='rejetee' && rejetees.length > 0 && <span style={{ marginLeft:5, background:'#e53e3e', color:'white', borderRadius:10, padding:'0 6px', fontSize:10, fontWeight:700 }}>{rejetees.length}</span>}
          </button>
        ))}
      </div>

      <SearchBar value={queryC} onChange={setQueryC} placeholder="Rechercher par zone, livreur, #id…" count={filteredBase.length} filtered={filtered.length} style={{ marginBottom:12 }}/>

      {/* Table desktop */}
      <div className="urs-table-desktop" style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
        <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>{['#','Zone','Livreur assigné','Statut','Date','Action'].map(h=>(
              <th key={h} style={T.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif' }}>Aucune livraison</td></tr>
            ) : filtered.map((l:any) => {
              const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
              const nomL = l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : null;
              return (
                <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}
                  style={{ background: l.statut==='rejetee' ? '#fff5f5' : 'white' }}>
                  <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{l.id}</td>
                  <td style={T.td}><span style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={12} color="#1465BB"/>{l.zone_livraison||'—'}</span></td>
                  <td style={T.td}>
                    {nomL ? (
                      <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', background: l.statut==='rejetee'?'#e53e3e':'linear-gradient(135deg,#0891b2,#0e7490)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10, fontWeight:700, flexShrink:0 }}>
                          {nomL[0]}
                        </div>
                        {nomL}
                        {l.statut==='rejetee' && <span style={{ fontSize:10, color:'#e53e3e', fontWeight:600 }}>⚠ a rejeté</span>}
                      </span>
                    ) : (
                      <button onClick={()=>setReassignModal(l)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'1.5px dashed #1465BB', background:'#e0f0ff', color:'#1465BB', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                        <Navigation size={12}/> Assigner
                      </button>
                    )}
                  </td>
                  <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span></td>
                  <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={T.td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setDetail(l)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                      {l.statut === 'rejetee' && (
                        <button onClick={()=>setReassignModal(l)}
                          style={{ ...T.iconBtn, color:'#e53e3e', borderColor:'#fecaca', background:'#fff5f5', width:'auto', padding:'0 10px', fontSize:11, fontWeight:600 }}>
                          <Navigation size={11}/> Réassigner
                        </button>
                      )}
                      {l.statut === 'en_attente' && !nomL && (
                        <button onClick={()=>setReassignModal(l)}
                          style={{ ...T.iconBtn, color:'#7c3aed', borderColor:'#ddd6fe', background:'#f5f3ff', width:'auto', padding:'0 10px', fontSize:11 }}>
                          <Navigation size={11}/> Assigner
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cartes mobile */}
      <div className="urs-cards-mobile" style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4' }}>
        {filtered.length === 0 ? (
          <p style={{ padding:'40px 18px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif' }}>Aucune livraison</p>
        ) : filtered.map((l:any) => {
          const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
          const nomL = l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : null;
          return (
            <div key={l.id} style={{ padding:'14px 16px', borderBottom:'1px solid #f0f4fb', background:l.statut==='rejetee'?'#fff5f5':'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                <span style={{ fontWeight:700, color:'#1465BB', fontSize:14 }}>#{l.id}</span>
                <div style={{ display:'flex', gap:5 }}>
                  <button onClick={()=>setDetail(l)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                  {(l.statut === 'rejetee' || (l.statut === 'en_attente' && !nomL)) && (
                    <button onClick={()=>setReassignModal(l)}
                      style={{ ...T.iconBtn, color: l.statut==='rejetee'?'#e53e3e':'#7c3aed', borderColor: l.statut==='rejetee'?'#fecaca':'#ddd6fe', background: l.statut==='rejetee'?'#fff5f5':'#f5f3ff', width:'auto', padding:'0 10px', fontSize:11, fontWeight:600 }}>
                      <Navigation size={11}/> {l.statut==='rejetee'?'Réassigner':'Assigner'}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#8a96b0' }}>Zone</span>
                  <span style={{ display:'flex', alignItems:'center', gap:5, color:'#4a5578' }}><MapPin size={12} color="#1465BB"/>{l.zone_livraison||'—'}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#8a96b0' }}>Livreur</span>
                  {nomL ? <span style={{ color: l.statut==='rejetee'?'#e53e3e':'#4a5578' }}>{nomL}{l.statut==='rejetee'?' ⚠':''}</span>
                        : <span style={{ color:'#8a96b0', fontStyle:'italic' }}>Non assigné</span>}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#8a96b0' }}>Statut</span>
                  <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
                </div>
                {l.motif_rejet && <p style={{ fontSize:11, color:'#e53e3e', margin:0 }}>Motif : {l.motif_rejet}</p>}
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#8a96b0' }}>Date</span>
                  <span style={{ color:'#4a5578' }}>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Réassignation */}
      {reassignModal && (
        <div onClick={()=>setReassignModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:480 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>
                {reassignModal.statut==='rejetee' ? `Réassigner la course #${reassignModal.id}` : `Assigner la course #${reassignModal.id}`}
              </h3>
              <button onClick={()=>setReassignModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>

              {/* Info du rejet si applicable */}
              {reassignModal.statut==='rejetee' && reassignModal.livreur && (
                <div style={{ background:'#fff5f5', borderRadius:8, padding:'10px 14px', border:'1px solid #fecaca' }}>
                  <p style={{ fontSize:13, color:'#991b1b', margin:0, fontWeight:600 }}>
                    ⚠ Rejetée par : {`${reassignModal.livreur.prenom||reassignModal.livreur.name||''} ${reassignModal.livreur.nom||''}`.trim()}
                  </p>
                  {reassignModal.motif_rejet && <p style={{ fontSize:12, color:'#e53e3e', margin:'4px 0 0' }}>Motif : {reassignModal.motif_rejet}</p>}
                </div>
              )}

              {/* Assignation auto GPS */}
              <button onClick={()=>doAssignerGPS(reassignModal)} disabled={saving}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:10, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', cursor:'pointer', opacity:saving?0.6:1 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Zap size={18} color="white"/>
                </div>
                <div style={{ textAlign:'left' }}>
                  <p style={{ fontSize:14, fontWeight:700, margin:0 }}>Assigner automatiquement</p>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', margin:0 }}>Le livreur GPS le plus proche (hors rejeteur)</p>
                </div>
              </button>

              {/* Séparateur */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'#dde5f4' }}/>
                <span style={{ fontSize:12, color:'#8a96b0' }}>ou choisir manuellement</span>
                <div style={{ flex:1, height:1, background:'#dde5f4' }}/>
              </div>

              {/* Liste livreurs */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#4a5578', marginBottom:4 }}>
                  <Users size={13} color="#1465BB"/>
                  <span>{livreurs.length} livreur{livreurs.length>1?'s':''} dans le système</span>
                  {positions.length > 0 && <span style={{ color:'#0a9e6e' }}>· {positions.length} avec GPS actif</span>}
                </div>
                {livreurs.length === 0 ? (
                  <p style={{ fontSize:13, color:'#8a96b0', textAlign:'center', padding:'20px 0' }}>Aucun livreur enregistré</p>
                ) : livreurs.map((lv:any) => {
                  const rejeteId = reassignModal.livreur?.id;
                  const estRejeteur = lv.id === rejeteId;
                  const gps = livreurActif(lv.id);
                  const nom = `${lv.prenom||lv.name||''} ${lv.nom||''}`.trim();
                  return (
                    <div key={lv.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10,
                      background: estRejeteur ? '#fff5f5' : '#f8faff',
                      border: `1px solid ${estRejeteur?'#fecaca':'#dde5f4'}`,
                      opacity: estRejeteur ? 0.5 : 1 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background: estRejeteur?'#fee2e2':'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color: estRejeteur?'#e53e3e':'white', fontSize:12, fontWeight:700, flexShrink:0 }}>
                        {(nom[0]||'?')}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color: estRejeteur?'#991b1b':'#0d1b3e', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {nom} {estRejeteur && '(a rejeté cette course)'}
                        </p>
                        <p style={{ fontSize:11, margin:0, color: gps?'#0a9e6e':'#8a96b0' }}>
                          {gps ? '📍 GPS actif' : '📍 GPS non disponible'}
                          {lv.telephone && ` · ${lv.telephone}`}
                        </p>
                      </div>
                      {!estRejeteur && (
                        <button onClick={()=>doAssignerManuel(reassignModal, lv.id, nom)} disabled={saving}
                          style={{ padding:'6px 14px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0, opacity:saving?0.6:1 }}>
                          Assigner
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Course #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Zone',         detail.zone_livraison||'—'],
                ['Livreur',      detail.livreur ? `${detail.livreur.prenom||detail.livreur.name||''} ${detail.livreur.nom||''}`.trim() : 'Non assigné'],
                ['Client',       detail.client_nom||'—'],
                ['Téléphone',    detail.client_telephone||'—'],
                ['Quartier',     detail.client_quartier||'—'],
                ['Statut',       STATUT[detail.statut]?.label||detail.statut],
                ['Date',         detail.date_livraison||'—'],
                ['Motif rejet',  detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color: l==='Motif rejet'&&v!=='—'?'#e53e3e':'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
              {(detail.statut === 'rejetee' || detail.statut === 'en_attente') && (
                <button onClick={()=>{setReassignModal(detail);setDetail(null);}} style={{ marginTop:8, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Navigation size={14}/> {detail.statut==='rejetee'?'Réassigner ce livreur':'Assigner un livreur'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:{ width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
