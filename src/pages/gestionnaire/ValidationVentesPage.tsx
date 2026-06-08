import { useState, useEffect, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Eye, X, Clock } from 'lucide-react';
import { ventesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af'},
  annulee:    {label:'Annulée',    bg:'#f1f5f9', color:'#475569'},
};

export default function ValidationVentesPage() {
  const [ventes,  setVentes]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail,  setDetail]  = useState<any>(null);
  const [filter,  setFilter]  = useState('en_attente');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);
  const load = async () => {
    try { const r = await ventesService.getAll(); setVentes(r.data || []); }
    catch { toast.error('Erreur chargement ventes'); }
    finally { setLoading(false); }
  };

  const doValider = async (id: number) => {
    setSaving(true);
    try { await ventesService.valider(id); toast.success('Vente validée ✓'); setDetail(null); load(); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doAnnuler = async (id: number) => {
    setSaving(true);
    try { await ventesService.annuler(id); toast.success('Vente annulée'); setDetail(null); load(); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'tous' ? ventes : ventes.filter(v => v.statut === filter);
  const enAttente = ventes.filter(v => v.statut === 'en_attente').length;

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Validation des Ventes</h1>
        <p style={T.sub}>Validez ou annulez les ventes soumises par les vendeurs</p>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'En attente', val:enAttente,                                         color:'#d0a83a', s:'en_attente'},
          {label:'Validées',   val:ventes.filter(v=>v.statut==='validee').length,     color:'#0a9e6e', s:'validee'  },
          {label:'Annulées',   val:ventes.filter(v=>v.statut==='annulee').length,     color:'#475569', s:'annulee'  },
          {label:'Total',      val:ventes.length,                                     color:'#1465BB', s:'tous'     },
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer', display:'flex', alignItems:'center', gap:13 }}>
            <div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','en_attente','validee','annulee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0', alignSelf:'center' }}>{filtered.length} vente{filtered.length>1?'s':''}</span>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>{['#','Vendeur','Produit(s)','Total FCFA','Zone','Statut','Date','Actions'].map(h=>(
              <th key={h} style={T.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
                {filter==='en_attente' ? '✓ Aucune vente en attente de validation' : 'Aucune vente'}
              </td></tr>
            ) : filtered.map((v:any) => {
              const sc = STATUT[v.statut]||{label:v.statut,bg:'#f1f5f9',color:'#475569'};
              const nomVendeur = v.caissiere ? `${v.caissiere.prenom||v.caissiere.name||''} ${v.caissiere.nom||''}`.trim() : '—';
              const produits = v.items && v.items.length > 0
                ? v.items.map((i:any) => `${i.produit?.nom||'?'} ×${i.quantite}`).join(', ')
                : `${v.produit?.nom||'—'} ×${v.quantite}`;
              return (
                <tr key={v.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{v.id}</td>
                  <td style={T.td}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                        {nomVendeur[0]||'?'}
                      </div>
                      <span style={{ fontSize:13 }}>{nomVendeur}</span>
                    </div>
                  </td>
                  <td style={{ ...T.td, fontSize:12, maxWidth:180 }}><span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{produits}</span></td>
                  <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{Number(v.montant_total).toLocaleString('fr-FR')}</td>
                  <td style={T.td}>{v.zone_livraison||'—'}</td>
                  <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span></td>
                  <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{v.date_vente}</td>
                  <td style={T.td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setDetail(v)} style={{ ...T.iconBtn, color:'#1465BB' }} title="Détail"><Eye size={13}/></button>
                      {v.statut === 'en_attente' && (
                        <>
                          <button onClick={()=>doValider(v.id)} disabled={saving} style={{ ...T.iconBtn, color:'#0a9e6e', borderColor:'#bbf7d0', background:'#f0fdf4' }} title="Valider"><CheckCircle size={13}/></button>
                          <button onClick={()=>doAnnuler(v.id)} disabled={saving} style={{ ...T.iconBtn, color:'#e53e3e', borderColor:'#fecaca', background:'#fff5f5' }} title="Annuler"><XCircle size={13}/></button>
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
              {detail.items && detail.items.length > 0 ? (
                <div style={{ marginBottom:8 }}>
                  <p style={{ fontSize:12, color:'#8a96b0', marginBottom:8 }}>PRODUITS ({detail.items.length})</p>
                  {detail.items.map((it:any) => (
                    <div key={it.id} style={{ display:'flex', justifyContent:'space-between', padding:'7px 10px', background:'#f8faff', borderRadius:8, marginBottom:5, fontSize:13 }}>
                      <span style={{ fontWeight:500 }}>{it.produit?.nom} × {it.quantite}</span>
                      <span style={{ fontWeight:700, color:'#1465BB' }}>{Number(it.sous_total).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {[
                ['Vendeur',   `${detail.caissiere?.prenom||detail.caissiere?.name||''} ${detail.caissiere?.nom||''}`.trim()||'—'],
                ['Total',     `${Number(detail.montant_total).toLocaleString('fr-FR')} FCFA`],
                ['Zone',      detail.zone_livraison||'—'],
                ['Date',      detail.date_vente],
                ['Statut',    STATUT[detail.statut]?.label||detail.statut],
                ['Notes',     detail.notes||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v}</span>
                </div>
              ))}
              {detail.statut === 'en_attente' && (
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button onClick={()=>doAnnuler(detail.id)} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer' }}>Annuler</button>
                  <button onClick={()=>doValider(detail.id)} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer' }}>
                    {saving?'…':'Valider'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
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
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:500, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
