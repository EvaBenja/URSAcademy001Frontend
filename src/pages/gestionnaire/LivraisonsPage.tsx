import { useState, useEffect, type CSSProperties } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { 
  Clock, 
  Truck, 
  Edit3, 
  History,
  AlertTriangle,
  CheckCircle2,
  User,
  Package,
  ClipboardList
} from 'lucide-react';

// --- Types ---
interface ProductItem {
  product_id: number;
  label: string;
  quantity: number;
  vendu: boolean;
}

interface DossierRow {
  id: number;
  uid: string;
  created_at: string;
  updated_at?: string; 
  livreur: string;
  destination: string;
  client_name: string;
  status: 'pending' | 'validated' | 'rejected';
  items: ProductItem[];
  [key: string]: any; 
}

const INITIAL_DATA: DossierRow[] = [
  {
    id: 1, uid: 'DL-2024-001', created_at: '2024-05-12T08:00:00',
    livreur: 'Moussa Traoré', destination: 'Zone A - Centre', client_name: 'Supermarché Faso',
    status: 'pending',
    items: [
        { product_id: 101, label: 'Sacs de Mil', quantity: 10, vendu: false },
        { product_id: 103, label: 'Huile de palme 20L', quantity: 2, vendu: false }
    ]
  },
  {
    id: 2, uid: 'DL-2024-002', created_at: '2024-05-12T08:30:00', updated_at: '09:45',
    livreur: 'Aïcha Koné', destination: 'Zone B - Marché Sud', client_name: 'Boutique Étoile',
    status: 'validated',
    items: [{ product_id: 201, label: 'Cartons Savon', quantity: 15, vendu: true }]
  }
];

export default function LivraisonsPage() {
  const [dossiers, setDossiers] = useState<DossierRow[]>(INITIAL_DATA);
  const [selectedDossier, setSelectedDossier] = useState<DossierRow | null>(null);
  const [activeAction, setActiveAction] = useState<'modifier' | 'review' | null>(null);
  const [editForm, setEditForm] = useState({ destination: '', client_name: '' });
  const [motifRejet, setMotifRejet] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('urs_dossiers_v4');
    if (saved) {
      try { setDossiers(JSON.parse(saved)); } catch (e) { localStorage.removeItem('urs_dossiers_v4'); }
    }
  }, []);

  const closeModal = () => {
    setSelectedDossier(null);
    setActiveAction(null);
  };

  const handleOpenEdit = (dossier: DossierRow) => {
    setSelectedDossier(dossier);
    setEditForm({ destination: dossier.destination, client_name: dossier.client_name });
    setActiveAction('modifier');
  };

  const saveModification = () => {
    if (!selectedDossier) return;
    const now = new Date();
    const time = `${now.getHours()}h${now.getMinutes().toString().padStart(2, '0')}`;
    const updated = dossiers.map(d => d.uid === selectedDossier.uid ? { ...d, ...editForm, updated_at: time } : d);
    setDossiers(updated);
    localStorage.setItem('urs_dossiers_v4', JSON.stringify(updated));
    closeModal();
  };

  const validateDossier = () => {
    if (!selectedDossier) return;
    const updated: DossierRow[] = dossiers.map(d => d.uid === selectedDossier.uid ? { ...d, status: 'validated' as const } : d);
    setDossiers(updated);
    localStorage.setItem('urs_dossiers_v4', JSON.stringify(updated));
    closeModal();
  };

  const rejectDossier = () => {
    if (!selectedDossier) return;
    const updated: DossierRow[] = dossiers.map(d => d.uid === selectedDossier.uid ? { ...d, status: 'rejected' as const, updated_at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) } : d);
    setDossiers(updated);
    localStorage.setItem('urs_dossiers_v4', JSON.stringify(updated));
    closeModal();
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader title="Livraisons" subtitle="Validation des départs et contrôle marchandise." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard label="En Attente (Départ)" count={dossiers.filter(d => d.status === 'pending').length} color="#ef4444" icon={<Clock />} />
        <StatCard label="Livraisons Validées" count={dossiers.filter(d => d.status === 'validated').length} color="#10b981" icon={<CheckCircle2 />} />
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Table<DossierRow>
          data={dossiers}
          columns={[
            { key: 'uid', label: 'Réf.', render: (row) => <span style={{fontWeight: 600}}>{row.uid}</span> },
            { key: 'livreur', label: 'Livreur', render: (row) => <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={14}/> {row.livreur}</div> },
            { key: 'destination', label: 'Destination', render: (row) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{row.destination}</div>
                  {row.updated_at && <div style={{ fontSize: '10px', color: '#f59e0b' }}>Modifié à {row.updated_at}</div>}
                </div>
              )
            },
            { key: 'status', label: 'État', render: (row) => <StatusBadge status={row.status} /> }
          ]}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => handleOpenEdit(row)} style={btnStyle}><Edit3 size={14}/></button>
              <button onClick={() => { setSelectedDossier(row); setActiveAction('review'); setMotifRejet(''); }} style={btnDetail}>
                Voir
              </button>
              {row.status === 'rejected' && (
                <span style={{ color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={14} /> Rejeté
                </span>
              )}
            </div>
          )}
        />
      </div>

      <Modal open={!!activeAction} onClose={closeModal} title={activeAction === 'review' ? "Contrôle Livraison" : "Gestion"}>
        {selectedDossier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeAction === 'modifier' && (
              <>
                <label style={labelStyle}>Destination <input style={inputStyle} value={editForm.destination} onChange={e => setEditForm({...editForm, destination: e.target.value})} /></label>
                <label style={labelStyle}>Client <input style={inputStyle} value={editForm.client_name} onChange={e => setEditForm({...editForm, client_name: e.target.value})} /></label>
                <button onClick={saveModification} style={btnBigPrimary}>Mettre à jour le bon</button>
              </>
            )}

            {activeAction === 'review' && (
              <>
                <div style={infoBox}>
                  <ClipboardList size={20} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>Commande {selectedDossier.uid}</p>
                    <p style={{ margin: '6px 0 0', color: '#475569' }}>Livreur : {selectedDossier.livreur}</p>
                    <p style={{ margin: '4px 0 0', color: '#475569' }}>Destination : {selectedDossier.destination}</p>
                    <p style={{ margin: '4px 0 0', color: '#475569' }}>Client : {selectedDossier.client_name}</p>
                    <p style={{ margin: '4px 0 0', color: '#475569' }}>Statut : {selectedDossier.status === 'pending' ? 'En attente' : selectedDossier.status === 'validated' ? 'Validée' : 'Rejetée'}</p>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: 0, fontWeight: 700, marginBottom: 10 }}>Produits à vérifier</p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {selectedDossier.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, background: 'white', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 600 }}>{item.label}</span>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: 999, fontWeight: 700 }}>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDossier.status === 'pending' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <label style={labelStyle}>
                        Motif de rejet
                        <textarea
                          value={motifRejet}
                          onChange={e => setMotifRejet(e.target.value)}
                          placeholder="Expliquez pourquoi vous souhaitez refuser cette commande"
                          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={validateDossier} style={btnBigSuccess}>Valider la commande</button>
                      <button onClick={rejectDossier} style={btnBigReject} disabled={!motifRejet.trim()}>
                        Rejeter avec motif
                      </button>
                    </div>
                  </>
                )}

                {selectedDossier.status === 'validated' && (
                  <div style={{ padding: 14, borderRadius: 10, background: '#dcfce7', border: '1px solid #86efac', color: '#166534' }}>
                    Livraison déjà validée. Aucune action supplémentaire requise.
                  </div>
                )}

                {selectedDossier.status === 'rejected' && (
                  <div style={{ padding: 14, borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c' }}>
                    Livraison rejetée. Vous pouvez consulter le dossier ou corriger la commande via le bouton Modifier.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// --- Styles & Helpers ---
const StatCard = ({ label, count, color, icon }: any) => (
  <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: 12 }}>
    <div style={{ color, background: `${color}10`, padding: '8px', borderRadius: '8px' }}>{icon}</div>
    <div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{label}</div><div style={{ fontSize: '24px', fontWeight: 700 }}>{count}</div></div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  return (
    <span style={{ 
        background: isPending ? '#fef2f2' : isRejected ? '#fee2e2' : '#dcfce7', 
        color: isPending ? '#b91c1c' : isRejected ? '#991b1b' : '#047857', 
        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700 
    }}>
      {isPending ? 'EN ATTENTE' : isRejected ? 'REJETÉ' : 'VALIDÉ'}
    </span>
  );
};

const btnStyle = { padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const btnSuccess = { padding: '8px 16px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '12px' };
const btnReject = { padding: '8px 16px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '12px' };
const btnDetail = { padding: '8px 16px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '12px' };
const btnBigPrimary = { width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' };
const btnBigSuccess = { ...btnBigPrimary, background: '#10b981' };
const btnBigReject = { ...btnBigPrimary, background: '#ef4444' };

const infoBox: CSSProperties = { display: 'flex', gap: 12, padding: '12px', background: '#f0f9ff', color: '#0369a1', borderRadius: '8px', fontSize: '13px', lineHeight: '1.4' };
const labelStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '12px', fontWeight: 600, color: '#475569' };
const inputStyle: CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' };