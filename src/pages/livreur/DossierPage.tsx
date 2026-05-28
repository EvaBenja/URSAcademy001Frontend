import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { 
  Plus, Package, MapPin, User, CheckCircle2, 
  Clock, Search, AlertCircle, ChevronDown, ChevronUp,
  TrendingUp, Calendar, CheckSquare, Lock
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
  delivery_zone: string;
  status: 'pending' | 'validated' | 'closed'; // closed = clôturé par gestionnaire
  created_at: string;
  items: DossierItem[];
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, ref: 'PR-MIL', label: 'Sachet de mil', weight: '20 kg', stock: 45 },
  { id: 2, ref: 'PR-OIL', label: 'Huile d’arachide', weight: '5 L', stock: 30 },
  { id: 3, ref: 'PR-COU', label: 'Couscous local', weight: '10 kg', stock: 22 },
];

export default function DemandesPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  
  // États pour la création/modification
  const [formData, setFormData] = useState({ client_name: '', recipient_name: '', delivery_zone: '' });
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem('urs_dossiers_v3');
    if (saved) setDossiers(JSON.parse(saved));
  }, []);

  // Séparation des dossiers
  const todayStr = new Date().toLocaleDateString();
  const activeDossier = dossiers.find(d => new Date(d.created_at).toLocaleDateString() === todayStr && d.status !== 'closed');
  const historyDossiers = dossiers.filter(d => new Date(d.created_at).toLocaleDateString() !== todayStr || d.status === 'closed');

  // Stats (Simulées pour l'exemple)
  const stats = {
    today: dossiers.filter(d => new Date(d.created_at).toLocaleDateString() === todayStr).length,
    week: dossiers.length, // À filtrer par date réelle plus tard
    closed: dossiers.filter(d => d.status === 'closed').length
  };

  const handleUpdateActive = (field: string, value: string) => {
    const updated = dossiers.map(d => {
      if (d.uid === activeDossier?.uid) {
        return { ...d, [field]: value };
      }
      return d;
    });
    setDossiers(updated);
    localStorage.setItem('urs_dossiers_v3', JSON.stringify(updated));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newDossier: Dossier = {
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
    const updated = [newDossier, ...dossiers];
    setDossiers(updated);
    localStorage.setItem('urs_dossiers_v3', JSON.stringify(updated));
    setShowForm(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 50px' }}>
      <PageHeader title="Espace Livreur" subtitle="Gérez vos livraisons quotidiennes et consultez vos performances." />

      {/* --- Dashboard de Performance --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard title="Aujourd'hui" value={stats.today} icon={<Calendar color="#1465BB" />} subtitle="Livraisons prévues" />
        <StatCard title="Cette Semaine" value={stats.week} icon={<TrendingUp color="#10b981" />} subtitle="Total livraisons" />
        <StatCard title="Clôturées" value={stats.closed} icon={<CheckSquare color="#6366f1" />} subtitle="Livrées & validées" />
      </div>

      {/* --- Section Dossier du Jour --- */}
      <h2 style={sectionTitleStyle}>Dossier de livraison actif</h2>
      {activeDossier ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '2px solid #1465BB', padding: 24, marginBottom: 40, boxShadow: '0 4px 12px rgba(20, 101, 187, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
             <span style={{ fontWeight: 800, color: '#1465BB' }}>DOCUMENT ACTIF : {activeDossier.uid}</span>
             <Badge status={activeDossier.status} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Client (Non modifiable)">
                <div style={readOnlyInputStyle}><Lock size={14} /> {activeDossier.client_name}</div>
              </Field>
              <Field label="Destinataire">
                <input 
                  value={activeDossier.recipient_name} 
                  onChange={e => handleUpdateActive('recipient_name', e.target.value)}
                  style={inputStyle} 
                />
              </Field>
              <Field label="Zone / Destination">
                <input 
                  value={activeDossier.delivery_zone} 
                  onChange={e => handleUpdateActive('delivery_zone', e.target.value)}
                  style={inputStyle} 
                />
              </Field>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
               <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Package size={16} /> Produits dans le camion
               </p>
               {activeDossier.items.map((item, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: 14 }}>
                   <span>{item.label}</span>
                   <span style={{ fontWeight: 700 }}>x{item.quantity}</span>
                 </div>
               ))}
               <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>* Les quantités de stock sont verrouillées après soumission.</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 30, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1', marginBottom: 40 }}>
          <p style={{ color: '#64748b' }}>Aucun dossier actif pour aujourd'hui.</p>
          <button onClick={() => setShowForm(true)} style={primaryBtnStyle}>Créer le dossier du jour</button>
        </div>
      )}

      {/* --- Historique des Dossiers --- */}
      <h2 style={sectionTitleStyle}>Historique & Clôtures</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {historyDossiers.map(d => <DossierCard key={d.uid} dossier={d} />)}
      </div>

      {/* --- Modal Formulaire (Simplifié pour l'exemple) --- */}
      {showForm && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Nouveau Dossier</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input placeholder="Nom Client" onChange={e => setFormData({...formData, client_name: e.target.value})} style={inputStyle} required />
              <input placeholder="Destinataire" onChange={e => setFormData({...formData, recipient_name: e.target.value})} style={inputStyle} required />
              <input placeholder="Zone" onChange={e => setFormData({...formData, delivery_zone: e.target.value})} style={inputStyle} required />
              
              <p style={{ fontWeight: 700, fontSize: 14, margin: '10px 0 5px' }}>Sélectionner Produits</p>
              {MOCK_PRODUCTS.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" onChange={() => setSelectedProductIds(prev => [...prev, p.id])} />
                  <span style={{ flex: 1 }}>{p.label}</span>
                  <input type="number" placeholder="Qté" style={{ width: 60 }} onChange={e => setQuantities({...quantities, [p.id]: parseInt(e.target.value)})} />
                </div>
              ))}
              
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" style={primaryBtnStyle}>Soumettre</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ ...primaryBtnStyle, background: '#ef4444' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sous-composants ---

function StatCard({ title, value, icon, subtitle }: any) {
  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 10 }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', fontWeight: 600 }}>{title}</p>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{value}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function DossierCard({ dossier }: { dossier: Dossier }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ background: dossier.status === 'closed' ? '#f8fafc' : '#fff', borderRadius: 12, border: '1px solid #e2e8f0', opacity: dossier.status === 'closed' ? 0.8 : 1 }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Package size={20} color={dossier.status === 'closed' ? '#94a3b8' : '#1465BB'} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{dossier.uid} — {dossier.client_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{new Date(dossier.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <Badge status={dossier.status} />
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      {isOpen && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '15px 0' }}>
            <DetailItem label="Destinataire" value={dossier.recipient_name} />
            <DetailItem label="Zone" value={dossier.delivery_zone} />
          </div>
          {dossier.status === 'closed' && (
             <div style={{ padding: 10, background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
               <CheckCircle2 size={14} /> Cette livraison a été clôturée par le gestionnaire.
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const styles: any = {
    pending: { bg: '#FEF3C7', text: '#92400E', label: 'En attente' },
    validated: { bg: '#DBEAFE', text: '#1E40AF', label: 'Validé' },
    closed: { bg: '#DCFCE7', text: '#166534', label: 'Clôturé' },
  };
  const s = styles[status] || styles.pending;
  return <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.text }}>{s.label}</span>;
}

function DetailItem({ label, value }: any) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{label}</label>
      {children}
    </div>
  );
}

// --- Styles ---
const sectionTitleStyle = { fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 };
const inputStyle = { padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' };
const readOnlyInputStyle = { ...inputStyle, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', gap: 8, borderStyle: 'dashed' };
const primaryBtnStyle = { padding: '10px 20px', background: '#1465BB', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' };
const modalOverlayStyle: any = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { background: '#fff', padding: 30, borderRadius: 15, width: '90%', maxWidth: 500 };

