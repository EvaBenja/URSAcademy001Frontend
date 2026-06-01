import { useState, useEffect, type CSSProperties } from 'react';
import { Truck, Plus, X, Eye, CheckCircle, Clock, MapPin, Package } from 'lucide-react';
import { livraisonsService, ventesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT_CONFIG: Record<string,{label:string;bg:string;color:string}> = {
  en_attente:   {label:'En attente',   bg:'#fef9c3', color:'#854d0e'},
  en_cours:     {label:'En cours',     bg:'#dbeafe', color:'#1e40af'},
  livree:       {label:'Livrée',       bg:'#dcfce7', color:'#166534'},
  non_livree:   {label:'Non livrée',   bg:'#fee2e2', color:'#991b1b'},
  annulee:      {label:'Annulée',      bg:'#f1f5f9', color:'#475569'},
};

export default function GestLivraisonsPage() {
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [ventes,     setVentes]     = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [detail,     setDetail]     = useState<any>(null);
  const [saving,     setSaving]     = useState(false);
  const [filter,     setFilter]     = useState('tous');
  const [form,       setForm]       = useState({ vente_id:'', zone_livraison:'', notes:'' });

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [lr, vr] = await Promise.all([livraisonsService.getAll(), ventesService.getAll()]);
      setLivraisons(lr.data);
      setVentes(vr.data.filter((v:any) => v.statut === 'validee'));
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const doCreate = async () => {
    if (!form.vente_id) { toast.error('Sélectionnez une vente validée'); return; }
    setSaving(true);
    try {
      await livraisonsService.create(form);
      toast.success('Livraison créée');
      setModal(false); setForm({ vente_id:'', zone_livraison:'', notes:'' });
      load();
    } catch (e:any) { toast.error(e.response?.data?.message||'Erreur'); }
    finally { setSaving(false); }
  };

  const doCloturer = async (id: number) => {
    try { await livraisonsService.cloturer(id); toast.success('Livraison clôturée'); load(); }
    catch (e:any) { toast.error(e.response?.data?.message||'Erreur'); }
  };

  const filtered = filter === 'tous' ? livraisons : livraisons.filter(l => l.statut === filter);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Suivi des Livraisons</h1>
          <p style={T.sub}>Créez et suivez les livraisons assignées</p>
        </div>
        <button onClick={()=>setModal(true)} style={T.btnPrimary}><Plus size={15}/> Créer livraison</button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',       val:livraisons.length,                                  color:'#1465BB', s:'tous'      },
          {label:'En attente',  val:livraisons.filter(l=>l.statut==='en_attente').length, color:'#d0a83a', s:'en_attente'},
          {label:'En cours',    val:livraisons.filter(l=>l.statut==='en_cours').length,  color:'#3b82f6', s:'en_cours'  },
          {label:'Livrées',     val:livraisons.filter(l=>l.statut==='livree').length,    color:'#0a9e6e', s:'livree'    },
        ].map(({label,val,color,s})=>(
          <div key={s} style={{ ...T.statCard, cursor:'pointer', border:`1.5px solid ${filter===s?color:'#dde5f4'}` }} onClick={()=>setFilter(s)}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','en_attente','en_cours','livree','non_livree','annulee']).map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT_CONFIG[s]?.label||s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>{['#','Vente','Livreur','Zone','Statut','Créée le','Actions'].map(h=>(
              <th key={h} style={T.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:16 }}>Aucune livraison</td></tr>
            ) : filtered.map((l:any) => {
              const sc = STATUT_CONFIG[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
              return (
                <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{l.id}</td>
                  <td style={T.td}>Vente #{l.vente_id}</td>
                  <td style={T.td}>{l.livreur ? `${l.livreur.prenom||''} ${l.livreur.nom||''}` : <span style={{ color:'#8a96b0', fontStyle:'italic' }}>Non assigné</span>}</td>
                  <td style={T.td}><span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}><MapPin size={12} color="#1465BB"/>{l.zone_livraison||'—'}</span></td>
                  <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span></td>
                  <td style={{ ...T.td, color:'#8a96b0', fontSize:12 }}>{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={T.td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setDetail(l)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                      {l.statut==='livree' && (
                        <button onClick={()=>doCloturer(l.id)} style={{ ...T.iconBtn, color:'#0a9e6e', borderColor:'#bbf7d0', background:'#f0fdf4', fontSize:11, width:'auto', padding:'0 10px' }}>Clôturer</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal créer */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Créer une livraison</h3>
              <button onClick={()=>setModal(false)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={T.lbl}>Vente validée *</label>
                <select value={form.vente_id} onChange={e=>setForm(f=>({...f,vente_id:e.target.value}))} style={T.inp}>
                  <option value="">Choisir une vente…</option>
                  {ventes.map((v:any)=>(
                    <option key={v.id} value={String(v.id)}>
                      #{v.id} — {v.produit?.nom||'Produit'} × {v.quantite} — {new Intl.NumberFormat('fr-FR').format(v.montant_total)} FCFA
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={T.lbl}>Zone de livraison</label>
                <input value={form.zone_livraison} onChange={e=>setForm(f=>({...f,zone_livraison:e.target.value}))} placeholder="Ex: Adidogomé, Lomé centre…" style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Instructions spéciales…" rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578', fontSize:14 }}>Annuler</button>
                <button onClick={doCreate} disabled={saving||!form.vente_id} style={{ ...T.btnPrimary, opacity:saving||!form.vente_id?0.5:1 }}>
                  {saving?'Création…':'Créer la livraison'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:440 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Livraison #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Vente',    `#${detail.vente_id}`],
                ['Livreur',  detail.livreur?`${detail.livreur.prenom||''} ${detail.livreur.nom||''}`:'Non assigné'],
                ['Zone',     detail.zone_livraison||'—'],
                ['Statut',   STATUT_CONFIG[detail.statut]?.label||detail.statut],
                ['Créée le', new Date(detail.created_at).toLocaleDateString('fr-FR')],
                ['Notes',    detail.notes||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr) !important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  statCard:{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:{ width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
};