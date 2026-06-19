import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { Eye, X, Clock, RefreshCw, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { ventesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'Active',     bg:'#dbeafe', color:'#1e40af'},
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af'},
  annulee:    {label:'Refusée',    bg:'#f1f5f9', color:'#475569'},
};

const PAGE_SIZE = 15;

export default function ValidationVentesPage() {
  const [ventes,      setVentes]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState<any>(null);
  const [filter,      setFilter]      = useState('tous');
  const [page,        setPage]        = useState(1);
  const [lastRefresh, setLastRefresh] = useState(new Date());

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
    const t = setInterval(() => load(true), 10000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [filter]);

  const filtered  = filter === 'tous' ? ventes : ventes.filter(v => v.statut === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const actives  = ventes.filter(v => v.statut === 'en_attente').length;
  const annulees = ventes.filter(v => v.statut === 'annulee').length;
  const livrees  = ventes.filter(v => v.livraison?.statut === 'terminee').length;

  if (loading) return (
    <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement…
    </p>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Suivi des Ventes</h1>
          <p style={T.sub}>Consultation des ventes soumises et livrées — lecture uniquement</p>
        </div>
        <button onClick={()=>load(false)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
          <RefreshCw size={14}/>
          {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',     val:ventes.length, color:'#1465BB', s:'tous'    },
          {label:'Actives',   val:actives,        color:'#1e40af', s:'en_attente'},
          {label:'Livrées',   val:livrees,        color:'#0a9e6e', s:'tous' },
          {label:'Refusées',  val:annulees,       color:'#475569', s:'annulee'  },
        ].map(({label,val,color,s}) => (
          <div key={label} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer', transition:'all .15s' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        {(['tous','en_attente','annulee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 16px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer', fontWeight:filter===s?600:400 }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0' }}>
          {filtered.length} vente{filtered.length>1?'s':''} — page {page}/{Math.max(totalPages,1)}
        </span>
      </div>

      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflow:'hidden' }}>
        <div className="urs-table-desktop" style={{ overflowX:'auto' }}>
          <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>{['#','Vendeur','Produit(s)','Total FCFA','Zone','Statut','Date','Livreur','Actions'].map(h=>(
                <th key={h} style={T.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={9} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
                  Aucune vente
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
                      {v.statut === 'annulee' && v.motif_annulation && (
                        <p style={{ fontSize:11, color:'#e53e3e', margin:'4px 0 0', fontStyle:'italic', maxWidth:160 }}>
                          Motif : {v.motif_annulation}
                        </p>
                      )}
                    </td>
                    <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{v.date_vente}</td>
                    <td style={T.td}>
                      {v.livraison ? (
                        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10,
                          background:v.livraison.statut==='terminee'?'#dcfce7':v.livraison.statut==='livree_attente_validation'?'#ede9fe':v.livraison.statut==='en_cours'?'#dbeafe':'#fef9c3',
                          color:v.livraison.statut==='terminee'?'#166534':v.livraison.statut==='livree_attente_validation'?'#5b21b6':v.livraison.statut==='en_cours'?'#1e40af':'#854d0e' }}>
                          <Truck size={10}/> {v.livraison.livreur ? `${v.livraison.livreur.prenom||v.livraison.livreur.name||''}` : 'Non assigné'}
                        </span>
                      ) : <span style={{fontSize:11,color:'#dde5f4'}}>—</span>}
                    </td>
                    <td style={T.td}>
                      <button onClick={()=>setDetail(v)} style={{ ...T.iconBtn, color:'#1465BB' }} title="Voir détail">
                        <Eye size={13}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cartes mobile */}
        <div className="urs-cards-mobile">
          {paginated.length === 0 ? (
            <p style={{ padding:'40px 18px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
              Aucune vente
            </p>
          ) : paginated.map((v:any) => {
            const sc = STATUT[v.statut]||{label:v.statut,bg:'#f1f5f9',color:'#475569'};
            const nomV = v.caissiere
              ? `${v.caissiere.prenom||v.caissiere.name||''} ${v.caissiere.nom||''}`.trim()
              : '—';
            const produits = v.items?.length > 0
              ? v.items.map((i:any)=>`${i.produit?.nom} ×${i.quantite}`).join(', ')
              : `${v.produit?.nom||'—'} ×${v.quantite}`;
            return (
              <div key={v.id} style={{ padding:'14px 16px', borderBottom:'1px solid #f0f4fb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0 }}>
                      {(nomV[0]||'?')}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <span style={{ fontWeight:700, color:'#1465BB', fontSize:13 }}>#{v.id}</span>
                      <p style={{ fontSize:13, color:'#0d1b3e', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nomV}</p>
                    </div>
                  </div>
                  <button onClick={()=>setDetail(v)} style={{ ...T.iconBtn, color:'#1465BB', flexShrink:0 }} title="Voir détail">
                    <Eye size={13}/>
                  </button>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <span style={{ color:'#8a96b0', flexShrink:0 }}>Produit(s)</span>
                    <span style={{ color:'#4a5578', textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{produits}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#8a96b0' }}>Total</span>
                    <span style={{ fontWeight:700, color:'#1465BB' }}>{Number(v.montant_total).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#8a96b0' }}>Zone</span>
                    <span style={{ color:'#4a5578' }}>{v.zone_livraison||'—'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#8a96b0' }}>Statut</span>
                    <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
                  </div>
                  {v.statut === 'annulee' && v.motif_annulation && (
                    <p style={{ fontSize:11, color:'#e53e3e', margin:0, fontStyle:'italic' }}>Motif : {v.motif_annulation}</p>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#8a96b0' }}>Date</span>
                    <span style={{ color:'#4a5578' }}>{v.date_vente}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#8a96b0' }}>Livreur</span>
                    {v.livraison ? (
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10,
                        background:v.livraison.statut==='terminee'?'#dcfce7':v.livraison.statut==='livree_attente_validation'?'#ede9fe':v.livraison.statut==='en_cours'?'#dbeafe':'#fef9c3',
                        color:v.livraison.statut==='terminee'?'#166534':v.livraison.statut==='livree_attente_validation'?'#5b21b6':v.livraison.statut==='en_cours'?'#1e40af':'#854d0e' }}>
                        <Truck size={10}/> {v.livraison.livreur ? `${v.livraison.livreur.prenom||v.livraison.livreur.name||''}` : 'Non assigné'}
                      </span>
                    ) : <span style={{fontSize:11,color:'#dde5f4'}}>—</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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

      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Vente #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {detail.items?.length > 0 && (
                <div style={{ marginBottom:8 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#8a96b0', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>
                    Produits ({detail.items.length})
                  </p>
                  {detail.items.map((it:any) => (
                    <div key={it.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'#f8faff', borderRadius:8, marginBottom:5, fontSize:13, gap:8, flexWrap:'wrap' }}>
                      <div style={{ minWidth:0 }}>
                        <span style={{ fontWeight:600 }}>{it.produit?.nom}</span>
                        <span style={{ color:'#8a96b0', marginLeft:8 }}>× {it.quantite}</span>
                        {it.remise > 0 && <span style={{ color:'#e53e3e', marginLeft:8, fontSize:11 }}>Remise: {Number(it.remise).toLocaleString('fr-FR')} FCFA</span>}
                      </div>
                      <span style={{ fontWeight:700, color:'#1465BB', flexShrink:0, whiteSpace:'nowrap' }}>{Number(it.sous_total).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
              )}
              {[
                ['Vendeur',     `${detail.caissiere?.prenom||detail.caissiere?.name||''} ${detail.caissiere?.nom||''}`.trim()||'—'],
                ['Total',       `${Number(detail.montant_total).toLocaleString('fr-FR')} FCFA`],
                ['Zone',        detail.zone_livraison||'—'],
                ['Date',        detail.date_vente],
                ['Statut',      STATUT[detail.statut]?.label||detail.statut],
                ['Client',      detail.client_nom||'—'],
                ['Tél. client', detail.client_telephone||'—'],
                ['Quartier',    detail.client_quartier||'—'],
                ['Livreur',     detail.livraison?.livreur ? `${detail.livraison.livreur.prenom||detail.livraison.livreur.name||''} ${detail.livraison.livreur.nom||''}`.trim() : 'Non assigné'],
                ['Statut livraison', detail.livraison ? (
                    {en_attente:'Disponible', validee:'Assignée', en_cours:'En livraison', rejetee:'Rejetée', livree_attente_validation:'En attente validation', terminee:'Clôturée'}[detail.livraison.statut] || detail.livraison.statut
                  ) : 'Aucune'],
                ['Notes',       detail.notes||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
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
