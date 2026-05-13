import { useState, type FormEvent, type CSSProperties } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Edit3, 
  Package, 
  History,
  AlertCircle,
  User,
  Layers,
  Tag
} from 'lucide-react';

// --- Interfaces ---
interface Product {
  ref: string;
  produit: string;
  poids: string;
  stock: number;
  prixRef: number; // Prix plancher fixé par le gestionnaire
}

interface Movement {
  id: string;
  produit: string;
  type: 'Entrée' | 'Sortie';
  quantite: string;
  operateur: string;
  date: string;
}

export default function ProduitsPage() {
  // --- États ---
  const [products, setProducts] = useState<Product[]>([
    { ref: 'PR-101', produit: 'Sachet de mil', poids: '20 kg', stock: 45, prixRef: 12500 },
    { ref: 'PR-102', produit: 'Huile d’arachide', poids: '5 L', stock: 30, prixRef: 6500 },
    { ref: 'PR-103', produit: 'Couscous local', poids: '10 kg', stock: 22, prixRef: 8000 },
  ]);
  
  const [movements, setMovements] = useState<Movement[]>([]);
  const [modalType, setModalType] = useState<'mouvement' | 'edition' | null>(null);

  // États Formulaires
  const [moveForm, setMoveForm] = useState({ produit: '', type: 'Entrée' as 'Entrée' | 'Sortie', quantite: '', operateur: '' });
  const [editForm, setEditForm] = useState<Product>({ ref: '', produit: '', poids: '', stock: 0, prixRef: 0 });

  // Utilitaire formatage
  const formatCFA = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

  // --- Actions ---
  const handleMoveSubmit = (e: FormEvent) => {
    e.preventDefault();
    const qty = parseInt(moveForm.quantite);
    const existing = products.find(p => p.produit === moveForm.produit);

    if (moveForm.type === 'Sortie' && existing && existing.stock < qty) {
      alert("⚠️ Stock insuffisant en magasin !");
      return;
    }

    const newMove: Movement = {
      id: `MT-${Math.floor(Math.random() * 9000)}`,
      produit: moveForm.produit,
      type: moveForm.type,
      quantite: `${moveForm.type === 'Entrée' ? '+' : '-'}${qty}`,
      operateur: moveForm.operateur,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    };

    setMovements([newMove, ...movements]);
    setProducts(prev => prev.map(p => 
      p.produit === moveForm.produit 
        ? { ...p, stock: moveForm.type === 'Entrée' ? p.stock + qty : p.stock - qty } 
        : p
    ));

    setModalType(null);
    setMoveForm({ produit: '', type: 'Entrée', quantite: '', operateur: '' });
  };

  const handleEditProduct = (e: FormEvent) => {
    e.preventDefault();
    setProducts(prev => prev.map(p => p.ref === editForm.ref ? editForm : p));
    setModalType(null);
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f4f7fe', minHeight: '100vh' }}>
      <PageHeader 
        title="Catalogue & Stocks" 
        subtitle="Fixez les prix de référence et gérez l'inventaire magasin." 
      />

      {/* --- Section Cartes Statistiques --- */}
      <div style={statsContainer}>
        <div style={statCard}>
          <div style={{ ...iconCircle, background: '#e0eaff', color: '#3b82f6' }}><Package size={20}/></div>
          <div><p style={statLabel}>Total Produits</p><h3 style={statValue}>{products.length}</h3></div>
        </div>
        <div style={statCard}>
          <div style={{ ...iconCircle, background: '#fef2f2', color: '#ef4444' }}><AlertCircle size={20}/></div>
          <div><p style={statLabel}>Alertes Stock</p><h3 style={statValue}>{products.filter(p => p.stock < 10).length}</h3></div>
        </div>
        <div style={{ ...statCard, cursor: 'pointer', background: '#1465BB', color: 'white' }} onClick={() => setModalType('mouvement')}>
          <div style={{ ...iconCircle, background: 'rgba(255,255,255,0.2)', color: 'white' }}><Plus size={20}/></div>
          <div><p style={{ ...statLabel, color: 'rgba(255,255,255,0.8)' }}>Mouvement</p><h3 style={{ ...statValue, color: 'white' }}>Flux Stock</h3></div>
        </div>
      </div>

      {/* --- Table Principale : Inventaire & Tarification --- */}
      <div style={sectionCard}>
        <div style={sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="#1465BB" />
            <h2 style={sectionTitle}>Inventaire & Prix de Référence</h2>
          </div>
        </div>
        <Table<Product>
          data={products}
          columns={[
            { key: 'ref', label: 'Réf.' },
            { key: 'produit', label: 'Désignation', render: (row) => <span style={{fontWeight: 600, color: '#1e293b'}}>{row.produit}</span> },
            { 
                key: 'prixRef', 
                label: 'Prix Réf. (Plancher)', 
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1465BB', fontWeight: 700 }}>
                    <Tag size={14} />
                    {formatCFA(row.prixRef)}
                  </div>
                )
            },
            { key: 'poids', label: 'Poids' },
            { 
              key: 'stock', 
              label: 'Quantité',
              render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontWeight: 800, 
                    color: row.stock < 10 ? '#ef4444' : '#1465BB',
                    fontSize: '15px'
                  }}>{row.stock}</span>
                  {row.stock < 10 && <span style={badgeCritique}>Bas</span>}
                </div>
              )
            }
          ]}
          actions={(row) => (
            <button onClick={() => { setEditForm(row); setModalType('edition'); }} style={btnActionTable}>
              <Edit3 size={15} /> Modifier
            </button>
          )}
        />
      </div>

      {/* --- Historique des Mouvements --- */}
      <div style={{ ...sectionCard, marginTop: '30px' }}>
        <div style={sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} color="#64748b" />
            <h2 style={sectionTitle}>Derniers Flux Magasin</h2>
          </div>
        </div>
        <Table<Movement>
          data={movements}
          columns={[
            { key: 'date', label: 'Date' },
            { key: 'produit', label: 'Article' },
            { 
              key: 'type', 
              label: 'Mouvement',
              render: (row) => (
                <span style={{ 
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  background: row.type === 'Entrée' ? '#dcfce7' : '#fee2e2',
                  color: row.type === 'Entrée' ? '#166534' : '#991b1b',
                  display: 'inline-flex', alignItems: 'center', gap: 4
                }}>
                   {row.type === 'Entrée' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />} {row.type}
                </span>
              )
            },
            { key: 'quantite', label: 'Qté' },
            { key: 'operateur', label: 'Par', render: (row) => <div style={{display:'flex', alignItems:'center', gap:5}}><User size={12}/>{row.operateur}</div> }
          ]}
        />
      </div>

      {/* --- MODAL : FLUX DE STOCK --- */}
      <Modal open={modalType === 'mouvement'} onClose={() => setModalType(null)} title="Enregistrer un mouvement">
        <form onSubmit={handleMoveSubmit} style={modalForm}>
          <div style={inputGroup}>
            <label style={labelStyle}>Article concerné</label>
            <select style={inputStyle} value={moveForm.produit} onChange={e => setMoveForm({...moveForm, produit: e.target.value})} required>
              <option value="">Choisir un produit...</option>
              {products.map(p => <option key={p.ref} value={p.produit}>{p.produit}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div style={inputGroup}>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={moveForm.type} onChange={e => setMoveForm({...moveForm, type: e.target.value as any})}>
                <option value="Entrée">Entrée (+)</option>
                <option value="Sortie">Sortie (-)</option>
              </select>
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Quantité</label>
              <input type="number" style={inputStyle} value={moveForm.quantite} onChange={e => setMoveForm({...moveForm, quantite: e.target.value})} required />
            </div>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Nom de l'opérateur</label>
            <input style={inputStyle} placeholder="Nom du responsable" value={moveForm.operateur} onChange={e => setMoveForm({...moveForm, operateur: e.target.value})} required />
          </div>
          <button type="submit" style={btnSubmitModal}>Valider le flux</button>
        </form>
      </Modal>

      {/* --- MODAL : ÉDITION PRODUIT & PRIX REF --- */}
      <Modal open={modalType === 'edition'} onClose={() => setModalType(null)} title="Gestion Fiche Article">
        <form onSubmit={handleEditProduct} style={modalForm}>
          <div style={inputGroup}>
            <label style={labelStyle}>Désignation du produit</label>
            <input style={inputStyle} value={editForm.produit} onChange={e => setEditForm({...editForm, produit: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
            <div style={inputGroup}>
              <label style={{...labelStyle, color: '#1465BB'}}>Prix de Référence (CFA)</label>
              <input type="number" style={{...inputStyle, border: '2px solid #1465BB'}} value={editForm.prixRef} onChange={e => setEditForm({...editForm, prixRef: parseInt(e.target.value)})} />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Poids / Format</label>
              <input style={inputStyle} value={editForm.poids} onChange={e => setEditForm({...editForm, poids: e.target.value})} />
            </div>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>Ajustement du Stock</label>
            <input type="number" style={inputStyle} value={editForm.stock} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} />
          </div>
          <button type="submit" style={btnSubmitModal}>Enregistrer les modifications</button>
        </form>
      </Modal>
    </div>
  );
}

// --- Styles ---
const statsContainer: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' };
const statCard: CSSProperties = { background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #eef2f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const iconCircle: CSSProperties = { width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statLabel: CSSProperties = { margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 500 };
const statValue: CSSProperties = { margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' };
const sectionCard: CSSProperties = { background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', border: '1px solid #eef2f6' };
const sectionHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const sectionTitle: CSSProperties = { fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 };
const modalForm: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputGroup: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#475569' };
const inputStyle: CSSProperties = { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' };
const btnSubmitModal: CSSProperties = { padding: '14px', background: '#1465BB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px' };
const btnActionTable: CSSProperties = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' };
const badgeCritique: CSSProperties = { background: '#fef2f2', color: '#ef4444', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' };