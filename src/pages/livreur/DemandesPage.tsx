import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { 
  Plus, Package, MapPin, User, CheckCircle2, 
  Clock, Search, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';

// --- Types ---
interface Product {
  id: number;
  ref: string;
  label: string;
  weight: string;
  stock: number;
}

interface DossierItem {
  product_id: number;
  label: string;
  quantity: number;
}

interface Dossier {
  id?: number;
  uid: string;
  client_name: string;
  recipient_name: string;
  delivery_zone: string; // Changé en string libre
  status: 'pending' | 'validated' | 'rejected';
  created_at: string;
  items: DossierItem[];
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, ref: 'PR-MIL', label: 'Sachet de mil', weight: '20 kg', stock: 45 },
  { id: 2, ref: 'PR-OIL', label: 'Huile d’arachide (Sina)', weight: '5 L', stock: 30 },
  { id: 3, ref: 'PR-COU', label: 'Couscous local', weight: '10 kg', stock: 22 },
  { id: 4, ref: 'PR-KAR', label: 'Beurre de Karité', weight: '2 kg', stock: 18 },
  { id: 5, ref: 'PR-SUC', label: 'Sucre SOSUCO', weight: '1 kg', stock: 150 },
];

export default function DemandesPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  
  // États du formulaire
  const [formData, setFormData] = useState({ 
    client_name: '', 
    recipient_name: '', 
    delivery_zone: '' // Saisie manuelle
  });
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [dossiers, setDossiers] = useState<Dossier[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('urs_dossiers_v2');
    if (saved) setDossiers(JSON.parse(saved));
  }, []);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => 
      p.label.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.ref.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch]);

  const toggleProduct = (id: number) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(prev => prev.filter(pId => pId !== id));
    } else {
      setSelectedProductIds(prev => [...prev, id]);
      if (!quantities[id]) setQuantities(prev => ({ ...prev, [id]: 1 }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      uid: `DL-${Math.floor(1000 + Math.random() * 9000)}`,
      ...formData,
      status: 'pending',
      created_at: new Date().toISOString(),
      items: selectedProductIds.map(id => ({
        product_id: id,
        label: MOCK_PRODUCTS.find(p => p.id === id)?.label || '',
        quantity: quantities[id] || 1
      }))
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedDossiers = [payload as Dossier, ...dossiers];
      setDossiers(updatedDossiers);
      localStorage.setItem('urs_dossiers_v2', JSON.stringify(updatedDossiers));

      setShowForm(false);
      setFormData({ client_name: '', recipient_name: '', delivery_zone: '' });
      setSelectedProductIds([]);
      setQuantities({});
    } catch (error) {
      alert("Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 50px' }}>
      <PageHeader 
        title="Mes dossiers" 
        subtitle="Créez vos bons de sortie et suivez leur validation." 
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>Flux des demandes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer',
            background: showForm ? '#f1f5f9' : '#1465BB',
            color: showForm ? '#475569' : 'white',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {showForm ? 'Annuler' : <><Plus size={18} /> Nouveau dossier</>}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 32, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 30 }}>
              <Field label="Client">
                <input required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="Ex: Boutique Wend Konta" style={inputStyle} />
              </Field>
              <Field label="Destinataire">
                <input required value={formData.recipient_name} onChange={e => setFormData({...formData, recipient_name: e.target.value})} placeholder="Ex: Mme Sanon" style={inputStyle} />
              </Field>
              <Field label="Zone / Lieu de livraison">
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    required 
                    value={formData.delivery_zone} 
                    onChange={e => setFormData({...formData, delivery_zone: e.target.value})} 
                    placeholder="Ex: Patte d'oie, Secteur 15" 
                    style={{ ...inputStyle, paddingLeft: 36 }} 
                  />
                </div>
              </Field>
            </div>

            {/* --- Catalogue de produits --- */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: 12, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    placeholder="Rechercher un produit..." 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 36, background: 'white' }} 
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1465BB' }}>{selectedProductIds.length} produits</div>
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', fontSize: 11, color: '#64748b', textAlign: 'left', textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '12px 15px', width: 40 }}></th>
                      <th style={{ padding: '12px 15px' }}>Désignation</th>
                      <th style={{ padding: '12px 15px', width: 120 }}>Qté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const active = selectedProductIds.includes(p.id);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: active ? '#f0f9ff' : 'white' }}>
                          <td style={{ padding: 10, textAlign: 'center' }}>
                            <input type="checkbox" checked={active} onChange={() => toggleProduct(p.id)} style={{ width: 18, height: 18 }} />
                          </td>
                          <td style={{ padding: 10 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{p.label}</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>Stock: {p.stock} • {p.weight}</div>
                          </td>
                          <td style={{ padding: 10 }}>
                            <input 
                              type="number" min="1" disabled={!active}
                              value={quantities[p.id] || ''}
                              onChange={e => setQuantities({...quantities, [p.id]: parseInt(e.target.value)})}
                              placeholder="0"
                              style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || selectedProductIds.length === 0}
              style={{ 
                marginTop: 24, width: '100%', padding: 16, background: '#1465BB', color: 'white', 
                border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: loading || selectedProductIds.length === 0 ? 0.6 : 1 
              }}
            >
              {loading ? 'Envoi en cours...' : 'Soumettre le dossier de livraison'}
            </button>
          </form>
        </div>
      )}

      {/* --- Liste des Dossiers --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {dossiers.map(d => <DossierCard key={d.uid} dossier={d} />)}
      </div>
    </div>
  );
}

// --- Composants Internes ---

function Field({ label, children }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{label}</label>
      {children}
    </div>
  );
}

function DossierCard({ dossier }: { dossier: Dossier }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#f1f5f9', padding: 10, borderRadius: 8 }}><Package size={20} color="#1465BB" /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{dossier.uid} — {dossier.client_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(dossier.created_at).toLocaleDateString()} • {dossier.delivery_zone}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Badge status={dossier.status} />
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: '0 20px 20px', background: '#fafafa', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ padding: '15px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <DetailItem icon={<User size={14}/>} label="Destinataire" value={dossier.recipient_name} />
            <DetailItem icon={<MapPin size={14}/>} label="Lieu Exact" value={dossier.delivery_zone} />
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px 12px' }}>Produit</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Quantité</th>
                </tr>
              </thead>
              <tbody>
                {dossier.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 12px' }}>{item.label}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const styles: any = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'En attente', icon: <Clock size={12}/> },
    validated: { bg: '#DCFCE7', text: '#166534', label: 'Validé', icon: <CheckCircle2 size={12}/> },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.text }}>
      {s.icon} {s.label}
    </span>
  );
}

function DetailItem({ icon, label, value }: any) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {value}
      </p>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff',
  transition: 'all 0.2s'
};