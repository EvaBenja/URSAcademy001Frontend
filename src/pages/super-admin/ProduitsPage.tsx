import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { produitsService } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = { reference:'', nom:'', prix_unitaire:0, prix_gros:0, quantite_stock:0, unite:'unité' };

export default function SAProduitsPage() {
  const [produits, setProduits] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<'nouveau'|'edition'|null>(null);
  const [form,     setForm]     = useState<any>(EMPTY);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await produitsService.getAll(); setProduits(r.data || []); }
    catch { toast.error('Erreur chargement produits'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nom || !form.reference) { toast.error('Référence et nom obligatoires'); return; }
    setSaving(true);
    try {
      if (modal === 'edition') { await produitsService.update(form.id, form); toast.success('Produit modifié'); }
      else { await produitsService.create(form); toast.success('Produit créé'); }
      setModal(null); load();
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try { await produitsService.delete(id); toast.success('Supprimé'); load(); }
    catch { toast.error('Erreur suppression'); }
  };

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Catalogue Produits</h1>
          <p style={T.sub}>Gérez tous les produits — visibles par vendeurs et livreurs</p>
        </div>
        <button onClick={()=>{setForm(EMPTY);setModal('nouveau');}} style={T.btnPrimary}><Plus size={15}/> Nouveau produit</button>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total produits',  val:produits.length,                                 color:'#1465BB'},
          {label:'Stock faible (<10)',val:produits.filter(p=>p.quantite_stock<10).length, color:'#e53e3e'},
          {label:'Unités en stock', val:produits.reduce((s,p)=>s+p.quantite_stock,0),    color:'#0a9e6e'},
        ].map(({label,val,color}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
        <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>{['Référence','Produit','Prix (FCFA)','Stock','Unité','Actions'].map(h=>(
              <th key={h} style={T.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {produits.length === 0 ? (
              <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:16 }}>
                Aucun produit — ajoutez votre premier produit
              </td></tr>
            ) : produits.map((p:any) => (
              <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{p.reference}</td>
                <td style={{ ...T.td, fontWeight:500 }}>{p.nom}</td>
                <td style={{ ...T.td, fontWeight:700 }}>{Number(p.prix_unitaire).toLocaleString('fr-FR')}</td>
                <td style={T.td}>{p.prix_gros > 0 ? <span style={{fontWeight:600,color:'#7c3aed'}}>{Number(p.prix_gros).toLocaleString('fr-FR')}</span> : <span style={{color:'#dde5f4'}}>—</span>}</td>
                <td style={T.td}>{p.prix_gros > 0 ? <span style={{fontWeight:700,color:'#0a9e6e'}}>+{Number(p.prix_unitaire-p.prix_gros).toLocaleString('fr-FR')} F</span> : <span style={{color:'#dde5f4'}}>—</span>}</td>
                <td style={T.td}>
                  <span style={{ fontWeight:700, color:p.quantite_stock<10?'#e53e3e':'#0a9e6e', fontSize:15 }}>{p.quantite_stock}</span>
                  {p.quantite_stock < 10 && <span style={{ marginLeft:7, background:'#fee2e2', color:'#e53e3e', fontSize:10, padding:'2px 7px', borderRadius:6, fontWeight:700 }}>BAS</span>}
                </td>
                <td style={{ ...T.td, color:'#8a96b0' }}>{p.unite||'—'}</td>
                <td style={T.td}>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={()=>{setForm({...p});setModal('edition');}} style={{ ...T.iconBtn, color:'#1465BB' }}><Edit2 size={13}/></button>
                    <button onClick={()=>handleDelete(p.id)} style={{ ...T.iconBtn, color:'#e53e3e', borderColor:'#fecaca', background:'#fff5f5' }}><Trash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={()=>setModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>{modal==='nouveau'?'Nouveau produit':'Modifier le produit'}</h3>
              <button onClick={()=>setModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div><label style={T.lbl}>Référence *</label><input style={T.inp} value={form.reference||''} onChange={e=>setForm((f:any)=>({...f,reference:e.target.value}))} disabled={modal==='edition'} placeholder="Ex: PROD-001"/></div>
              <div><label style={T.lbl}>Désignation *</label><input style={T.inp} value={form.nom||''} onChange={e=>setForm((f:any)=>({...f,nom:e.target.value}))} placeholder="Ex: Huile moteur 5L"/></div>
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={T.lbl}>Prix unitaire (FCFA)</label><input type="number" min={0} style={T.inp} value={form.prix_unitaire||0} onChange={e=>setForm((f:any)=>({...f,prix_unitaire:+e.target.value}))}/></div>
                <div><label style={T.lbl}>Stock initial</label><input type="number" min={0} style={T.inp} value={form.quantite_stock||0} onChange={e=>setForm((f:any)=>({...f,quantite_stock:+e.target.value}))}/></div>
              </div>
              <div>
                <label style={{ ...T.lbl, color:'#7c3aed' }}>Prix en gros (FCFA) — optionnel</label>
                <input type="number" min={0} style={{ ...T.inp, borderColor:'#ddd6fe' }} value={form.prix_gros||0} onChange={e=>setForm((f:any)=>({...f,prix_gros:+e.target.value}))} placeholder="0 = non défini"/>
                <p style={{ fontSize:11, color:'#8a96b0', margin:'5px 0 0' }}>
                  Sert de référence pour calculer la remise totale accordée par les vendeurs sur ce produit (prix unitaire − prix en gros).
                </p>
              </div>
              <div><label style={T.lbl}>Unité</label><input style={T.inp} value={form.unite||''} onChange={e=>setForm((f:any)=>({...f,unite:e.target.value}))} placeholder="kg, L, unité, carton…"/></div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button onClick={()=>setModal(null)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578', fontSize:14 }}>Annuler</button>
                <button onClick={handleSave} disabled={saving||!form.nom||!form.reference} style={{ ...T.btnPrimary, opacity:saving||!form.nom||!form.reference?0.5:1 }}>
                  {saving?'Enregistrement…':modal==='nouveau'?'Créer':'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-3{grid-template-columns:1fr 1fr!important;}}`}</style>
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
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
