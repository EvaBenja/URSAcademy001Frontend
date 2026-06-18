import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, X, Edit2, Trash2, TrendingDown, RefreshCw } from 'lucide-react';
import { depensesService } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value:'courant',    label:'⚡ Courant / Électricité' },
  { value:'loyer',      label:'🏠 Loyer' },
  { value:'salaire',    label:'👤 Salaire' },
  { value:'transport',  label:'🚗 Transport / Carburant' },
  { value:'produits',   label:'📦 Achat produits' },
  { value:'entretien',  label:'🔧 Entretien / Réparation' },
  { value:'autre',      label:'📋 Autre' },
];

const CAT_COLORS: Record<string,{bg:string;color:string}> = {
  courant:   {bg:'#fef9c3', color:'#854d0e'},
  loyer:     {bg:'#dbeafe', color:'#1e40af'},
  salaire:   {bg:'#ede9fe', color:'#5b21b6'},
  transport: {bg:'#fdf3d7', color:'#92400e'},
  produits:  {bg:'#dcfce7', color:'#166534'},
  entretien: {bg:'#fee2e2', color:'#991b1b'},
  autre:     {bg:'#f1f5f9', color:'#475569'},
};

const EMPTY = {
  categorie: 'courant',
  motif: '',
  montant: 0,
  date_depense: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function DepensesPage() {
  const [depenses,  setDepenses]  = useState<any[]>([]);
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<'nouveau'|'edition'|null>(null);
  const [editing,   setEditing]   = useState<any>(null);
  const [form,      setForm]      = useState<any>(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [filterCat, setFilterCat] = useState('tous');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [dr, sr] = await Promise.allSettled([
        depensesService.getAll(),
        depensesService.stats(),
      ]);
      if (dr.status === 'fulfilled') setDepenses(dr.value.data || []);
      if (sr.status === 'fulfilled') setStats(sr.value.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const openNew = () => { setEditing(null); setForm({...EMPTY}); setModal('nouveau'); };
  const openEdit = (d: any) => {
    setEditing(d);
    setForm({ categorie:d.categorie, motif:d.motif, montant:d.montant, date_depense:d.date_depense, notes:d.notes||'' });
    setModal('edition');
  };

  const handleSave = async () => {
    if (!form.motif.trim() || !form.montant) { toast.error('Motif et montant obligatoires'); return; }
    setSaving(true);
    try {
      if (modal === 'edition' && editing) {
        await depensesService.update(editing.id, form);
        toast.success('Dépense modifiée');
      } else {
        await depensesService.create(form);
        toast.success('Dépense enregistrée');
      }
      setModal(null);
      load();
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try { await depensesService.delete(id); toast.success('Supprimée'); load(); }
    catch { toast.error('Erreur'); }
  };

  const filtered = filterCat === 'tous' ? depenses : depenses.filter(d => d.categorie === filterCat);
  const totalFiltered = filtered.reduce((s, d) => s + Number(d.montant), 0);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Dépenses</h1>
          <p style={T.sub}>Suivez toutes les dépenses de la structure</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578' }}>
            <RefreshCw size={14}/>
          </button>
          <button onClick={openNew} style={T.btnPrimary}><Plus size={15}/> Nouvelle dépense</button>
        </div>
      </div>

      {/* Stats par catégorie */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:22 }}>
          <div style={{ background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:12, padding:'1.1rem', color:'white', gridColumn:'span 2' }}>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', margin:'0 0 4px' }}>Total dépenses</p>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#d0a83a', margin:0 }}>
              {Number(stats.total||0).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          {(stats.par_categorie||[]).map((c:any) => {
            const cc = CAT_COLORS[c.categorie]||{bg:'#f1f5f9',color:'#475569'};
            const cat = CATEGORIES.find(x=>x.value===c.categorie);
            return (
              <div key={c.categorie} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1rem' }}>
                <p style={{ fontSize:11, color:'#8a96b0', margin:'0 0 4px' }}>{cat?.label||c.categorie}</p>
                <p style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:cc.color, margin:0 }}>
                  {Number(c.total).toLocaleString('fr-FR')} F
                </p>
                <p style={{ fontSize:10, color:'#8a96b0', margin:'2px 0 0' }}>{c.nombre} entrée{c.nombre>1?'s':''}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtres catégorie */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={()=>setFilterCat('tous')}
          style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filterCat==='tous'?'#1465BB':'#dde5f4'}`, background:filterCat==='tous'?'#1465BB':'white', color:filterCat==='tous'?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
          Toutes
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={()=>setFilterCat(c.value)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filterCat===c.value?'#1465BB':'#dde5f4'}`, background:filterCat===c.value?'#1465BB':'white', color:filterCat===c.value?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {c.label}
          </button>
        ))}
        {filterCat !== 'tous' && (
          <span style={{ marginLeft:'auto', fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'#1465BB' }}>
            {totalFiltered.toLocaleString('fr-FR')} FCFA
          </span>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>{['#','Date','Catégorie','Motif','Montant FCFA','Ajouté par','Notes','Actions'].map(h=>(
                <th key={h} style={T.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
                  Aucune dépense enregistrée
                </td></tr>
              ) : filtered.map((d:any) => {
                const cc = CAT_COLORS[d.categorie]||{bg:'#f1f5f9',color:'#475569'};
                const cat = CATEGORIES.find(x=>x.value===d.categorie);
                return (
                  <tr key={d.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{d.id}</td>
                    <td style={{ ...T.td, color:'#8a96b0', whiteSpace:'nowrap' }}>{d.date_depense}</td>
                    <td style={T.td}>
                      <span style={{ background:cc.bg, color:cc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                        {cat?.label||d.categorie}
                      </span>
                    </td>
                    <td style={{ ...T.td, fontWeight:500 }}>{d.motif}</td>
                    <td style={{ ...T.td, fontWeight:700, color:'#e53e3e' }}>{Number(d.montant).toLocaleString('fr-FR')}</td>
                    <td style={{ ...T.td, fontSize:12, color:'#8a96b0' }}>
                      {d.user ? `${d.user.prenom||d.user.name||''} ${d.user.nom||''}`.trim() : '—'}
                    </td>
                    <td style={{ ...T.td, fontSize:12, color:'#8a96b0', maxWidth:150 }}>
                      <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {d.notes||'—'}
                      </span>
                    </td>
                    <td style={T.td}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={()=>openEdit(d)} style={{ ...T.iconBtn, color:'#1465BB' }}><Edit2 size={13}/></button>
                        <button onClick={()=>handleDelete(d.id)} style={{ ...T.iconBtn, color:'#e53e3e', borderColor:'#fecaca', background:'#fff5f5' }}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Total en bas */}
        {filtered.length > 0 && (
          <div style={{ padding:'12px 18px', borderTop:'1px solid #f0f4fb', display:'flex', justifyContent:'flex-end', gap:8, alignItems:'center' }}>
            <span style={{ fontSize:13, color:'#8a96b0' }}>Total affiché :</span>
            <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#e53e3e' }}>
              {totalFiltered.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={()=>setModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>{modal==='nouveau'?'Nouvelle dépense':'Modifier la dépense'}</h3>
              <button onClick={()=>setModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={T.lbl}>Catégorie *</label>
                  <select value={form.categorie} onChange={e=>setForm((f:any)=>({...f,categorie:e.target.value}))} style={T.inp}>
                    {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={T.lbl}>Date *</label>
                  <input type="date" value={form.date_depense} onChange={e=>setForm((f:any)=>({...f,date_depense:e.target.value}))} style={T.inp}/>
                </div>
              </div>
              <div>
                <label style={T.lbl}>Motif * (description courte)</label>
                <input value={form.motif} onChange={e=>setForm((f:any)=>({...f,motif:e.target.value}))} placeholder="Ex: Facture courant du mois de juin" style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>Montant (FCFA) *</label>
                <input type="number" min={0} value={form.montant} onChange={e=>setForm((f:any)=>({...f,montant:+e.target.value}))}
                  style={{ ...T.inp, fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#e53e3e' }} placeholder="0"/>
              </div>
              <div>
                <label style={T.lbl}>Notes (optionnel)</label>
                <textarea value={form.notes} onChange={e=>setForm((f:any)=>({...f,notes:e.target.value}))}
                  placeholder="Détails supplémentaires…" rows={3}
                  style={{ ...T.inp, resize:'none' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(null)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578', fontSize:14 }}>Annuler</button>
                <button onClick={handleSave} disabled={saving||!form.motif.trim()||!form.montant}
                  style={{ ...T.btnPrimary, opacity:saving||!form.motif.trim()||!form.montant?0.5:1 }}>
                  {saving ? 'Enregistrement…' : modal==='nouveau'?'Enregistrer':'Modifier'}
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
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:{ width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:500, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
