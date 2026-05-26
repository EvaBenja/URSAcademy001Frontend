import { useState, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Clock, Truck, Eye, X, AlertTriangle, Square, CheckSquare } from 'lucide-react';
import { useStore, validerVente, refuserVente, type StatutVente } from '../../store/ventesStore';

const STATUT_CONFIG: Record<StatutVente, { label: string; bg: string; color: string }> = {
  en_attente:      { label: 'En attente',     bg: '#fef9c3', color: '#854d0e' },
  validee:         { label: 'Validée',        bg: '#dbeafe', color: '#1e40af' },
  notif_livreur:   { label: 'Notif.livreur',  bg: '#e0f0ff', color: '#1465BB' },
  rejetee_livreur: { label: 'Rejet livreur',  bg: '#fee2e2', color: '#991b1b' },
  en_livraison:    { label: 'En livraison',   bg: '#fdf3d7', color: '#854d0e' },
  livree:          { label: 'Livrée ✓',       bg: '#dcfce7', color: '#166534' },
  non_livree:      { label: 'Non livrée',     bg: '#fee2e2', color: '#991b1b' },
  refusee:         { label: 'Refusée',        bg: '#f1f5f9', color: '#475569' },
};

interface ProduitCommande {
  id: string;
  nom: string;
  qte: number;
  prixVente: number;
}

export default function ValidationVentesPage() {
  // --- DONNÉES FICTIVES ENRICHIES POUR TES TESTS ---
  const ventesFictives = [
    {
      id: 'v1',
      ref: 'REF-2026-001',
      vendeurNom: 'Awa Diop',
      montantTotal: 147500,
      zone: 'Zone A - Centre',
      statut: 'en_attente' as StatutVente,
      date: '26/05/2026 18:42',
      note: 'Client pressé, vérifier la disponibilité du Riz Luxe.',
      produitsListe: [
        { id: 'p1_1', nom: 'Sac de Riz Luxe 25kg', qte: 3, prixVente: 22000 },
        { id: 'p1_2', nom: 'Huile de table 5L', qte: 5, prixVente: 7500 },
        { id: 'p1_3', nom: 'Carton de Pâtes Alimentaires', qte: 4, prixVente: 6500 },
        { id: 'p1_4', nom: 'Pack de Canettes Jus de Fruits', qte: 2, prixVente: 9000 }
      ]
    },
    {
      id: 'v2',
      ref: 'REF-2026-002',
      vendeurNom: 'Moussa Traoré',
      montantTotal: 45000,
      zone: 'Zone B - Nord',
      statut: 'en_attente' as StatutVente,
      date: '26/05/2026 18:15',
      note: 'Livraison boutique Orange',
      produitsListe: [
        { id: 'p2_1', nom: 'Carton de Lait en Poudre', qte: 1, prixVente: 30000 },
        { id: 'p2_2', nom: 'Paquet de Sucre Saint-Louis', qte: 10, prixVente: 1500 }
      ]
    },
    {
      id: 'v3',
      ref: 'REF-2026-003',
      vendeurNom: 'Koffi Mensah',
      montantTotal: 85000,
      zone: 'Zone C - Sud',
      statut: 'en_livraison' as StatutVente,
      date: '26/05/2026 16:30',
      note: '',
      produitsListe: [
        { id: 'p3_1', nom: 'Sac de Ciment 50kg', qte: 17, prixVente: 5000 }
      ]
    }
  ];

  const [ventes, setVentes] = useState(ventesFictives);
  const [detail, setDetail] = useState<typeof ventesFictives[0] | null>(null);
  const [refusModal, setRefusModal] = useState<string | null>(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [filterStatut, setFilterStatut] = useState<'tous' | StatutVente>('en_attente');
  const [produitsVerifies, setProduitsVerifies] = useState<Record<string, boolean>>({});

  // Stats dynamiques
  const enAttente = ventes.filter(v => v.statut === 'en_attente').length;
  const enCours   = ventes.filter(v => ['en_livraison', 'notif_livreur'].includes(v.statut)).length;
  const livrees   = ventes.filter(v => v.statut === 'livree').length;
  const rejets    = ventes.filter(v => v.statut === 'rejetee_livreur').length;

  const filtered = ventes.filter(v => filterStatut === 'tous' || v.statut === filterStatut);

  const handleOpenDetail = (vente: typeof ventesFictives[0]) => {
    setDetail(vente);
    const initialCheckState: Record<string, boolean> = {};
    vente.produitsListe.forEach((p: ProduitCommande) => {
      initialCheckState[p.id] = true;
    });
    setProduitsVerifies(initialCheckState);
  };

  const toggleProduitCheck = (pId: string) => {
    setProduitsVerifies(prev => ({ ...prev, [pId]: !prev[pId] }));
  };

  const doValider = (id: string) => {
    setVentes(prev => prev.map(v => v.id === id ? { ...v, statut: 'validee' as StatutVente } : v));
    setDetail(null);
  };

  const doRefuser = () => {
    if (!refusModal) return;
    setVentes(prev => prev.map(v => v.id === refusModal ? { ...v, statut: 'refusee' as StatutVente } : v));
    setRefusModal(null);
    setMotifRefus('');
  };

  return (
    <div style={{ padding: 28, background: '#f0f4fb', minHeight: '100vh' }}>
      <div style={{ marginBottom: 26 }}>
        <h1 style={T.h1}>Validation des Ventes</h1>
        <p style={T.sub}>Validez ou refusez les ventes soumises par les vendeurs</p>
      </div>

      {/* Cartes Stats Premium (Design Initial Restauré) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'En attente',     val: enAttente, color: '#d0a83a', bg: '#fdf3d7', Icon: Clock, status: 'en_attente' },
          { label: 'En livraison',   val: enCours,   color: '#1465BB', bg: '#e0f0ff', Icon: Truck, status: 'en_livraison' },
          { label: 'Livrées',        val: livrees,   color: '#0a9e6e', bg: '#dcfce7', Icon: CheckCircle, status: 'livree' },
          { label: 'Rejets livreur', val: rejets,    color: '#e53e3e', bg: '#fee2e2', Icon: AlertTriangle, status: 'rejetee_livreur' },
        ].map(({ label, val, color, bg, Icon, status }) => (
          <div key={label} style={{ ...T.statCard, cursor: 'pointer' }} onClick={() => setFilterStatut(status as any)}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 700, color, lineHeight: 1, margin: 0 }}>{val}</p>
              <p style={{ fontSize: 11, color: '#8a96b0', marginTop: 4, margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres de Statut */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['tous', 'en_attente', 'validee', 'en_livraison', 'livree', 'refusee', 'rejetee_livreur'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatut(s)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${filterStatut === s ? '#1465BB' : '#dde5f4'}`, background: filterStatut === s ? '#1465BB' : 'white', color: filterStatut === s ? 'white' : '#4a5578', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
            {s === 'tous' ? 'Toutes' : STATUT_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Tableau Principal */}
      <div style={T.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {['Réf.', 'Vendeur', 'Nombre d\'articles', 'Total Commande', 'Zone', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} style={T.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', fontFamily: 'Cormorant Garamond,serif', fontSize: 16, color: '#8a96b0' }}>Aucune vente</td></tr>
              ) : filtered.map(v => {
                const sc = STATUT_CONFIG[v.statut];
                return (
                  <tr key={v.id} onMouseEnter={e => e.currentTarget.style.background = '#f6f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ ...T.td, fontWeight: 700, color: '#1465BB' }}>{v.ref}</td>
                    <td style={T.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1465BB,#003785)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {v.vendeurNom[0]}
                        </div>
                        {v.vendeurNom}
                      </div>
                    </td>
                    <td style={{ ...T.td, fontWeight: 500 }}>{v.produitsListe.length} article(s) distinct(s)</td>
                    <td style={{ ...T.td, fontWeight: 700, color: '#1465BB' }}>{v.montantTotal.toLocaleString()} <span style={{ fontSize: 10, color: '#8a96b0' }}>FCFA</span></td>
                    <td style={T.td}>{v.zone}</td>
                    <td style={T.td}>
                      <span style={{ background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{sc.label}</span>
                    </td>
                    <td style={{ ...T.td, color: '#8a96b0', whiteSpace: 'nowrap' }}>{v.date}</td>
                    <td style={T.td}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => handleOpenDetail(v)} style={{ ...T.iconBtn, color: '#1465BB' }} title="Ouvrir la liste d'articles"><Eye size={13} /></button>
                        {v.statut === 'en_attente' && (
                          <>
                            <button onClick={() => doValider(v.id)} style={{ ...T.iconBtn, color: '#0a9e6e', borderColor: '#bbf7d0', background: '#f0fdf4' }} title="Tout valider directement"><CheckCircle size={13} /></button>
                            <button onClick={() => { setRefusModal(v.id); setMotifRefus(''); }} style={{ ...T.iconBtn, color: '#e53e3e', borderColor: '#fecaca', background: '#fff5f5' }} title="Refuser"><XCircle size={13} /></button>
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
      </div>

      {/* MODAL : DESIGN INITIAL ÉLÉGANT + LOGIQUE DE COCHE PAR PRODUIT */}
      {detail && (
        <div onClick={() => setDetail(null)} style={T.overlay}>
          <div onClick={e => e.stopPropagation()} style={{ ...T.modalBox, maxWidth: 500 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Point de Pointage — {detail.ref}</h3>
              <button onClick={() => setDetail(null)} style={T.modalClose}><X size={15} /></button>
            </div>
            
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Infos récapitulatives */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f0f4fb' }}>
                <span style={{ fontSize: 13, color: '#8a96b0', fontWeight: 500 }}>Vendeur associé</span>
                <span style={{ fontSize: 13, color: '#0d1b3e', fontWeight: 600 }}>{detail.vendeurNom} ({detail.zone})</span>
              </div>
              
              {detail.note && (
                <div style={{ background: '#f4f7fd', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#4a5578', fontStyle: 'italic', borderLeft: '3px solid #1465BB' }}>
                  💡 {detail.note}
                </div>
              )}

              <p style={{ fontSize: 12, fontWeight: 700, color: '#8a96b0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 10, marginBottom: 4 }}>
                Articles à valider pour inventaire :
              </p>

              {/* LISTE DES PRODUITS AVEC CASES À COCHER INDIVIDUELLES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '240px', overflowY: 'auto' }}>
                {detail.produitsListe.map((p: ProduitCommande) => {
                  const isChecked = !!produitsVerifies[p.id];
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => detail.statut === 'en_attente' && toggleProduitCheck(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        borderRadius: 10,
                        border: '1px solid',
                        borderColor: isChecked ? '#bbf7d0' : '#fecaca',
                        background: isChecked ? '#f0fdf4' : '#fff5f5',
                        cursor: detail.statut === 'en_attente' ? 'pointer' : 'default',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {detail.statut === 'en_attente' ? (
                          isChecked ? <CheckSquare size={18} color="#0a9e6e" /> : <Square size={18} color="#e53e3e" />
                        ) : (
                          <CheckCircle size={16} color="#1465BB" />
                        )}
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isChecked ? '#166534' : '#991b1b', display: 'block' }}>{p.nom}</span>
                          <span style={{ fontSize: 11, color: '#8a96b0' }}>Prix unitaire : {p.prixVente.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0d1b3e' }}>× {p.qte}</span>
                    </div>
                  );
                })}
              </div>

              {/* Pied du modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f4fb' }}>
                <div>
                  <span style={{ fontSize: 11, color: '#8a96b0', display: 'block' }}>Montant Brut Global</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1465BB' }}>{detail.montantTotal.toLocaleString()} FCFA</span>
                </div>

                {detail.statut === 'en_attente' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setRefusModal(detail.id); setDetail(null); }} 
                      style={{ padding: '8px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                      Refuser
                    </button>
                    <button onClick={() => doValider(detail.id)} 
                      style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(90deg,#0a9e6e,#065f46)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13, boxShadow: '0 2px 6px rgba(10,158,110,0.2)' }}>
                      ✓ Valider cochés
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal refus */}
      {refusModal && (
        <div onClick={() => setRefusModal(null)} style={T.overlay}>
          <div onClick={e => e.stopPropagation()} style={{ ...T.modalBox, maxWidth: 420 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Motif de refus</h3>
              <button onClick={() => setRefusModal(null)} style={T.modalClose}><X size={15} /></button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={T.lbl}>Indiquez le motif du refus</label>
              <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)} placeholder="Ex: Prix trop bas, stock insuffisant…" rows={4} style={{ ...T.inp, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setRefusModal(null)} style={T.btnCancel, { flex: 1 }}>Annuler</button>
                <button onClick={doRefuser} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'linear-gradient(90deg,#e53e3e,#991b1b)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Confirmer le refus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// RESTAURATION DESIGN INITIAL TOKENS (Playfair + Garamond et ombres douces)
const T = {
  h1: { fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 700, color: '#0d1b3e', margin: 0 } as CSSProperties,
  sub: { fontFamily: 'Cormorant Garamond,serif', fontSize: 16, color: '#4a5578', marginTop: 4 } as CSSProperties,
  card: { background: 'white', borderRadius: 14, border: '1px solid #dde5f4', boxShadow: '0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  statCard: { background: 'white', borderRadius: 12, border: '1px solid #dde5f4', padding: '1.1rem 1.3rem', display: 'flex', alignItems: 'center', gap: 13, boxShadow: '0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th: { fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase' as const, color: '#8a96b0', padding: '11px 14px', background: '#f4f7fd', borderBottom: '1px solid #dde5f4', textAlign: 'left' as const, whiteSpace: 'nowrap' as const },
  td: { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid #f0f4fb', verticalAlign: 'middle' as const },
  lbl: { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5578', marginBottom: 5 } as CSSProperties,
  inp: { width: '100%', padding: '9px 12px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 14, outline: 'none', color: '#0d1b3e', background: 'white', boxSizing: 'border-box' as const, fontFamily: 'DM Sans,sans-serif' } as CSSProperties,
  btnCancel: { padding: '9px 18px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', fontSize: 14, cursor: 'pointer', color: '#4a5578', fontFamily: 'DM Sans,sans-serif' } as CSSProperties,
  overlay: { position: 'fixed' as const, inset: 0, zIndex: 200, background: 'rgba(13,27,62,0.45)', display: 'flex', alignItems: 'center', justifyCenter: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' },
  modalBox: { background: 'white', borderRadius: 14, width: '100%', maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 20px 60px rgba(0,55,133,0.2)', border: '1px solid #dde5f4' },
  modalHeader: { display: 'flex', alignItems: 'center', justifycontent: 'space-between', justifyContent: 'space-between', padding: '18px 22px', background: 'linear-gradient(90deg,#003785,#1465BB)', position: 'sticky' as const, top: 0 },
  modalTitle: { fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 600, color: 'white', margin: 0 } as CSSProperties,
  modalClose: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifycenter: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' } as CSSProperties,
  iconBtn: { width: 28, height: 28, borderRadius: 6, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifycenter: 'center', justifyContent: 'center' } as CSSProperties,
};