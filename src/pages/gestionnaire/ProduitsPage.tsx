import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Plus, ArrowUpRight, ArrowDownLeft, Edit3, Package, History, AlertCircle, Layers, Tag } from 'lucide-react';
import { produitsService } from '../../services/api';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  reference: string;
  nom: string;
  prix_unitaire: number;
  quantite_stock: number;
  unite?: string;
}

export default function ProduitsPage() {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalType, setModalType] = useState<'nouveau'|'edition'|null>(null);
  const [editForm,  setEditForm]  = useState<Partial<Product>>({});
  const [saving,    setSaving]    = useState(false);

  const formatCFA = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await produitsService.getAll();
      setProducts(res.data);
    } catch { toast.error('Erreur chargement produits'); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setEditForm({ reference:'', nom:'', prix_unitaire:0, quantite_stock:0, unite:'unité' });
    setModalType('nouveau');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalType === 'edition' && editForm.id) {
        await produitsService.update(editForm.id, editForm);
        toast.success('Produit modifié');
      } else {
        await produitsService.create(editForm);
        toast.success('Produit créé');
      }
      setModalType(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await produitsService.delete(id);
      toast.success('Produit supprimé');
      load();
    } catch { toast.error('Erreur lors de la suppression'); }
  };

  if (loading) return <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</div>;

  return (
    <div style={{ minHeight:'100vh' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <PageHeader title="Catalogue & Stocks" subtitle="Gérez l'inventaire et les prix de référence." />
        <button onClick={openNew} style={S.btnPrimary}><Plus size={15}/> Nouveau produit</button>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:30 }}>
        <div style={S.statCard}>
          <div style={{ ...S.iconCircle, background:'#e0eaff', color:'#3b82f6' }}><Package size={20}/></div>
          <div><p style={S.statLabel}>Total Produits</p><h3 style={S.statValue}>{products.length}</h3></div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.iconCircle, background:'#fef2f2', color:'#ef4444' }}><AlertCircle size={20}/></div>
          <div><p style={S.statLabel}>Stock Faible (&lt;10)</p><h3 style={S.statValue}>{products.filter(p=>p.quantite_stock<10).length}</h3></div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.iconCircle, background:'#dcfce7', color:'#0a9e6e' }}><Layers size={20}/></div>
          <div><p style={S.statLabel}>Stock Total</p><h3 style={S.statValue}>{products.reduce((s,p)=>s+p.quantite_stock,0)}</h3></div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:20, padding:24, boxShadow:'0 10px 15px -3px rgba(0,0,0,0.04)', border:'1px solid #eef2f6' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <Layers size={20} color="#1465BB"/>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#1e293b', margin:0 }}>Inventaire & Prix</h2>
        </div>
        <Table<Product>
          data={products}
          columns={[
            { key:'reference', label:'Réf.' },
            { key:'nom', label:'Désignation', render:(row)=><span style={{fontWeight:600,color:'#1e293b'}}>{row.nom}</span> },
            { key:'prix_unitaire', label:'Prix Réf.',
              render:(row)=>(
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'#1465BB', fontWeight:700 }}>
                  <Tag size={14}/>{formatCFA(row.prix_unitaire)}
                </div>
              )
            },
            { key:'unite', label:'Unité', render:(row)=><span>{row.unite||'—'}</span> },
            { key:'quantite_stock', label:'Stock',
              render:(row)=>(
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:800, color:row.quantite_stock<10?'#ef4444':'#1465BB', fontSize:15 }}>{row.quantite_stock}</span>
                  {row.quantite_stock<10 && <span style={{ background:'#fef2f2', color:'#ef4444', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:700 }}>BAS</span>}
                </div>
              )
            },
          ]}
          actions={(row)=>(
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>{setEditForm({...row});setModalType('edition');}} style={S.btnAction}><Edit3 size={14}/> Modifier</button>
              <button onClick={()=>handleDelete(row.id)} style={{ ...S.btnAction, color:'#e53e3e', borderColor:'#fecaca' }}>Suppr.</button>
            </div>
          )}
        />
      </div>

      {/* Modal */}
      <Modal open={!!modalType} onClose={()=>setModalType(null)} title={modalType==='nouveau'?'Nouveau produit':'Modifier le produit'}>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={S.lbl}>Référence *</label>
            <input style={S.inp} value={editForm.reference||''} onChange={e=>setEditForm(f=>({...f,reference:e.target.value}))} required disabled={modalType==='edition'}/>
          </div>
          <div>
            <label style={S.lbl}>Désignation *</label>
            <input style={S.inp} value={editForm.nom||''} onChange={e=>setEditForm(f=>({...f,nom:e.target.value}))} required/>
          </div>
          <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ ...S.lbl, color:'#1465BB' }}>Prix unitaire (FCFA) *</label>
              <input type="number" style={{ ...S.inp, border:'2px solid #1465BB' }} value={editForm.prix_unitaire||0} onChange={e=>setEditForm(f=>({...f,prix_unitaire:+e.target.value}))} required min={0}/>
            </div>
            <div>
              <label style={S.lbl}>Stock *</label>
              <input type="number" style={S.inp} value={editForm.quantite_stock||0} onChange={e=>setEditForm(f=>({...f,quantite_stock:+e.target.value}))} required min={0}/>
            </div>
          </div>
          <div>
            <label style={S.lbl}>Unité (ex: kg, L, unité)</label>
            <input style={S.inp} value={editForm.unite||''} onChange={e=>setEditForm(f=>({...f,unite:e.target.value}))} placeholder="unité"/>
          </div>
          <button type="submit" disabled={saving} style={{ padding:14, background:saving?'#94a3b8':'#1465BB', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:15 }}>
            {saving?'Enregistrement…':modalType==='nouveau'?'Créer le produit':'Enregistrer'}
          </button>
        </form>
      </Modal>

      <style>{`
        @media (max-width: 768px) { .stats-3 { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

const S = {
  statCard:  { background:'white', padding:20, borderRadius:16, display:'flex', alignItems:'center', gap:15, border:'1px solid #eef2f6', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)' } as CSSProperties,
  iconCircle:{ width:45, height:45, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  statLabel: { margin:0, fontSize:13, color:'#64748b', fontWeight:500 } as CSSProperties,
  statValue: { margin:0, fontSize:22, fontWeight:700, color:'#1e293b' } as CSSProperties,
  lbl:       { display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:5 } as CSSProperties,
  inp:       { padding:12, borderRadius:10, border:'1px solid #cbd5e1', outline:'none', fontSize:14, width:'100%', boxSizing:'border-box' as const } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  btnAction: { padding:'8px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', color:'#64748b', fontSize:13, display:'flex', alignItems:'center', gap:5 } as CSSProperties,
};