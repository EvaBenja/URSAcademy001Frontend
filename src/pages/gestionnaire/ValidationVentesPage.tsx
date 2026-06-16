import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Eye, X, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ventesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af'},
  annulee:    {label:'Refusée',    bg:'#f1f5f9', color:'#475569'},
};

const PAGE_SIZE = 15;

export default function ValidationVentesPage() {
  const [ventes,      setVentes]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState<any>(null);
  const [filter,      setFilter]      = useState('en_attente');
  const [saving,      setSaving]      = useState(false);
  const [page,        setPage]        = useState(1);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refusModal,  setRefusModal]  = useState<any>(null);
  const [motif,       setMotif]       = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await ventesService.getAll();
      setVentes(r.data || []);
      setLastRefresh(new Date());
    } catch { if (!silent) toast.error('Erreur chargement ventes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    // Refresh automatique toutes les 10s
    const t = setInterval(() => load(true), 10000);
    return () => clearInterval(t);
  }, [load]);

  // Remettre à la page 1 quand le filtre change
  useEffect(() => { setPage(1); }, [filter]);

  const doValider = async (id: number) => {
    setSaving(true);
    try { await ventesService.valider(id); toast.success('Vente validée ✓'); setDetail(null); load(true); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doRefuser = async () => {
    if (!refusModal || !motif.trim()) { toast.error('Le motif est obligatoire'); return; }
    setSaving(true);
    try {
      await ventesService.annuler(refusModal.id, motif);
      toast.success('Vente refusée');
      setRefusModal(null); setMotif(''); setDetail(null); load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  // Filtrage
  const filtered  = filter === 'tous' ? ventes : ventes.filter(v => v.statut === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // Stats
  const enAttente = ventes.filter(v => v.statut === 'en_attente').length;
  const validees  = ventes.filter(v => v.statut === 'validee').length;
  const annulees  = ventes.filter(v => v.statut === 'annulee').length;

  if (loading) return (
    <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement…
    </p>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Validation des Ventes</h1>
          <p style={T.sub}>Toutes les ventes soumises par les vendeurs — refresh auto 10s</p>
        </div>
        <button onClick={()=>load(false)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
          <RefreshCw size={14}/>
          {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'En attente', val:enAttente, color:'#d0a83a', bg:'#fdf3d7', s:'en_attente'},
          {label:'Validées',   val:validees,  color:'#0a9e6e', bg:'#dcfce7', s:'validee'  },
          {label:'Annulées',   val:annulees,  color:'#475569', bg:'#f1f5f9', s:'annulee'  },
          {label:'Total',      val:ventes.length, color:'#1465BB', bg:'#e0f0ff', s:'tous' },
        ].map(({label,val,color,bg,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer', display:'flex', alignItems:'center', gap:13, transition:'all .15s' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {s==='en_attente' ? <Clock size={17} color={color}/> : s==='validee' ? <CheckCircle size={17} color={color}/> : s==='annulee' ? <XCircle size={17} color={color}/> : <Eye size={17} color={color}/>}
            </div>
            <div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        {(['tous','en_attente','validee','annulee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer', fontWeight:filter===s?600:400 }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
            {s==='en_attente' && enAttente > 0 && (
              <span style={{ marginLeft:6, background:'#d0a83a', color:'white', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>
                {enAttente}
              </span>
            )}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0' }}>
          {filtered.length} vente{filtered.length>1?'s':''} — page {page}/{Math.max(totalPages,1)}
        </span>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>{['#','Vendeur','Produit(s)','Total FCFA','Zone','Statut','Date','Livreur','Actions'].map(h=>(
                <th key={h} style={T.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
                  {filter==='en_attente' ? '✓ Aucune vente en attente de validation' : 'Aucune vente'}
                </td></tr>
              ) : paginated.map((v:any) => {
                const sc = STATUT[v.statut]||{label:v.statut,bg:'#f1f5f9',color:'#475569'};
                const nomV = v.caissiere
                  ? `${v.caissiere.prenom||v.caissiere.name||''} ${v.caissiere.nom||''}`.trim()
                  : '—';
                const produits = v.items?.length > 0
                  ? v.items.map((i:any)=>`${i.produit?.nom} ×${i.quantite}`).join(', ')
                  : `${v.produit?.nom||'—'} ×${v.quantite}`;
                return (
                  <tr key={v.id}
                    onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{v.id}</td>
                    <td style={T.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                          {(nomV[0]||'?')}
                        </div>
                        <span style={{ fontSize:13, fontWeight:500 }}>{nomV}</span>
                      </div>
                    </td>
                    <td style={{ ...T.td, fontSize:12, maxWidth:180 }}>
                      <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={produits}>
                        {produits}
                      </span>
                    </td>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>
                      {Number(v.montant_total).toLocaleString('fr-FR')}
                    </td>
                    <td style={T.td}>{v.zone_livraison||'—'}</td>
                    <td style={T.td}>
                      <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{v.date_vente}</td>
                    <td style={T.td}>
                      {v.livraison ? (
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10,
                          background:v.livraison.statut==='terminee'?'#dcfce7':v.livraison.statut==='en_cours'?'#dbeafe':'#fef9c3',
                          color:v.livraison.statut==='terminee'?'#166534':v.livraison.statut==='en_cours'?'#1e40af':'#854d0e' }}>
                          🚚 {v.livraison.livreur ? `${v.livraison.livreur.prenom||v.livraison.livreur.name||''}` : 'Non assigné'}
                        </span>
                      ) : <span style={{fontSize:11,color:'#dde5f4'}}>—</span>}
                    </td>
                    <td style={T.td}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={()=>setDetail(v)} style={{ ...T.iconBtn, color:'#1465BB' }} title="Voir détail">
                          <Eye size={13}/>
                        </button>
                        {v.statut === 'en_attente' && (
                          <>
                            <button onClick={()=>doValider(v.id)} disabled={saving}
                              style={{ ...T.iconBtn, color:'#0a9e6e', borderColor:'#bbf7d0', background:'#f0fdf4' }} title="Valider">
                              <CheckCircle size={13}/>
                            </button>
                            <button onClick={()=>{setRefusModal(v);setMotif('');}} disabled={saving}
                              style={{ ...T.iconBtn, color:'#e53e3e', borderColor:'#fecaca', background:'#fff5f5' }} title="Refuser">
                              <XCircle size={13}/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderTop:'1px solid #f0f4fb', flexWrap:'wrap', gap:10 }}>
            <span style={{ fontSize:13, color:'#8a96b0' }}>
              {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} sur {filtered.length}
            </span>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{ ...T.iconBtn, color:'#1465BB', opacity:page===1?0.3:1 }}>
                <ChevronLeft size={15}/>
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1).map(p => (
                <button key={p} onClick={()=>setPage(p)}
                  style={{ width:32, height:32, borderRadius:6, border:`1.5px solid ${p===page?'#1465BB':'#dde5f4'}`, background:p===page?'#1465BB':'white', color:p===page?'white':'#4a5578', cursor:'pointer', fontSize:13, fontWeight:p===page?700:400 }}>
                  {p}
                </button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ ...T.iconBtn, color:'#1465BB', opacity:page===totalPages?0.3:1 }}>
                <ChevronRight size={15}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Vente #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {/* Produits multiples */}
              {detail.items?.length > 0 && (
                <div style={{ marginBottom:8 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#8a96b0', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>
                    Produits ({detail.items.length})
                  </p>
                  {detail.items.map((it:any) => (
                    <div key={it.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'#f8faff', borderRadius:8, marginBottom:5, fontSize:13 }}>
                      <div>
                        <span style={{ fontWeight:600 }}>{it.produit?.nom}</span>
                        <span style={{ color:'#8a96b0', marginLeft:8 }}>× {it.quantite}</span>
                        {it.remise > 0 && <span style={{ color:'#e53e3e', marginLeft:8, fontSize:11 }}>Remise: {Number(it.remise).toLocaleString('fr-FR')} FCFA</span>}
                      </div>
                      <span style={{ fontWeight:700, color:'#1465BB' }}>{Number(it.sous_total).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
              )}
              {[
                ['Vendeur', `${detail.caissiere?.prenom||detail.caissiere?.name||''} ${detail.caissiere?.nom||''}`.trim()||'—'],
                ['Total',   `${Number(detail.montant_total).toLocaleString('fr-FR')} FCFA`],
                ['Zone',    detail.zone_livraison||'—'],
                ['Date',    detail.date_vente],
                ['Statut',  STATUT[detail.statut]?.label||detail.statut],
                ['Notes',   detail.notes||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v}</span>
                </div>
              ))}
              {detail.statut === 'en_attente' && (
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button onClick={()=>{setRefusModal(detail);setDetail(null);setMotif('');}} disabled={saving}
                    style={{ flex:1, padding:'11px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer' }}>
                    Refuser la vente
                  </button>
                  <button onClick={()=>doValider(detail.id)} disabled={saving}
                    style={{ flex:1, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer' }}>
                    {saving ? '…' : 'Valider ✓'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal refus avec motif obligatoire */}
      {refusModal && (
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Refuser la vente #{refusModal.id}</h3>
              <button onClick={()=>setRefusModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
                Le stock sera remis et le vendeur pourra voir le motif du refus.
              </p>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 }}>
                  Motif du refus * (obligatoire)
                </label>
                <textarea value={motif} onChange={e=>setMotif(e.target.value)}
                  placeholder="Ex: Prix incorrect, produit indisponible, informations client manquantes…"
                  rows={4}
                  style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${motif.trim()?'#dde5f4':'#fca5a5'}`, borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
                {!motif.trim() && <p style={{ fontSize:11, color:'#e53e3e', margin:'4px 0 0' }}>Ce champ est obligatoire</p>}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRefusModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>
                  Annuler
                </button>
                <button onClick={doRefuser} disabled={saving||!motif.trim()}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', opacity:saving||!motif.trim()?0.5:1 }}>
                  {saving ? 'Refus…' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:768px){ .stats-4{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:{ width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:500, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
