import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, Plus, X, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { bilansService, produitsService, utilisateursService } from '../../services/api';
import toast from 'react-hot-toast';

const cleanNom = (nom?: string): string => {
  if (!nom) return '—';
  return nom.replace(/(\[Arch[ié]v[eé]\]\s*)*/gi, '').trim() || nom;
};

const isoJour = (decalage = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const nomUser = (u: any) => `${u?.prenom || u?.name || ''} ${u?.nom || ''}`.trim() || '—';

interface LigneForm { produit_id: string; qte: string; }

export default function BilansLivreursPage() {
  const [date,      setDate]      = useState(isoJour());
  const [bilans,    setBilans]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [livreurs,  setLivreurs]  = useState<any[]>([]);
  const [produits,  setProduits]  = useState<any[]>([]);
  const [livreurId, setLivreurId] = useState('');
  const [dateRemise, setDateRemise] = useState(isoJour());
  const [lignes,    setLignes]    = useState<LigneForm[]>([{ produit_id: '', qte: '1' }]);
  const [recherche, setRecherche] = useState('');
  const [saving,    setSaving]    = useState(false);

  const load = async (d = date) => {
    setLoading(true);
    try { const r = await bilansService.parJour(d); setBilans(r.data || []); }
    catch { toast.error('Erreur chargement des bilans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(date); }, [date]);

  const ouvrirModal = async () => {
    setModal(true);
    setLivreurId(''); setLignes([{ produit_id: '', qte: '1' }]); setRecherche(''); setDateRemise(date);
    if (livreurs.length === 0 || produits.length === 0) {
      const [u, p] = await Promise.allSettled([utilisateursService.getAll(), produitsService.getAll()]);
      if (u.status === 'fulfilled') setLivreurs((u.value.data || []).filter((x: any) => x.role?.nom === 'livreur'));
      if (p.status === 'fulfilled') setProduits((p.value.data || []).filter((x: any) => !(x.nom || '').includes('[Archivé]')));
    }
  };

  const produitsFiltres = produits.filter(p =>
    !recherche.trim() || (p.nom || '').toLowerCase().includes(recherche.toLowerCase()) || (p.reference || '').toLowerCase().includes(recherche.toLowerCase()));

  const majLigne = (i: number, champ: keyof LigneForm, val: string) => {
    if (champ === 'qte' && val !== '' && !/^\d+$/.test(val)) return;
    setLignes(ls => ls.map((l, idx) => idx === i ? { ...l, [champ]: val } : l));
  };

  const enregistrer = async () => {
    if (!livreurId) { toast.error('Choisissez un livreur'); return; }
    const valides = lignes.filter(l => l.produit_id && parseInt(l.qte || '0', 10) > 0)
      .map(l => ({ produit_id: Number(l.produit_id), qte_remise: parseInt(l.qte, 10) }));
    if (valides.length === 0) { toast.error('Ajoutez au moins un produit avec une quantité'); return; }

    setSaving(true);
    try {
      // Bilan déjà ouvert pour ce livreur à cette date ? On y ajoute les produits au lieu de créer un doublon.
      const existant = dateRemise === date
        ? bilans.find(b => String(b.livreur_id) === livreurId && b.statut === 'ouvert')
        : null;
      if (existant) await bilansService.ajouter(existant.id, valides);
      else          await bilansService.creer({ livreur_id: Number(livreurId), date: dateRemise, lignes: valides });
      toast.success('Produits remis enregistrés ✓');
      setModal(false);
      if (dateRemise !== date) setDate(dateRemise); else load(date);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally { setSaving(false); }
  };

  const nbClotures = bilans.filter(b => b.statut === 'cloture').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={T.h1}>Bilans des livreurs</h1>
          <p style={T.sub}>Produits remis, livrés et restants — contrôle des clôtures</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => load(date)} style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer' }}>
            <RefreshCw size={14} color="#4a5578" />
          </button>
          <button onClick={ouvrirModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: 'linear-gradient(90deg,#003785,#1465BB)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> Remettre des produits
          </button>
        </div>
      </div>

      {/* Sélecteur de date */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ l: "Aujourd'hui", d: isoJour() }, { l: 'Hier', d: isoJour(-1) }].map(b => (
          <button key={b.l} onClick={() => setDate(b.d)}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${date === b.d ? '#1465BB' : '#dde5f4'}`, background: date === b.d ? '#1465BB' : 'white', color: date === b.d ? 'white' : '#4a5578', fontSize: 12, cursor: 'pointer' }}>
            {b.l}
          </button>
        ))}
        <input type="date" value={date} max={isoJour()} onChange={e => e.target.value && setDate(e.target.value)}
          style={{ padding: '6px 10px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 13 }} />
        {!loading && bilans.length > 0 && (
          <span style={{ fontSize: 12, color: '#8a96b0' }}>{nbClotures}/{bilans.length} clôturé(s)</span>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 60, color: '#8a96b0', fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>Chargement…</p>
      ) : bilans.length === 0 ? (
        <div style={{ ...T.card, textAlign: 'center', padding: 40 }}>
          <p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 18, color: '#8a96b0', margin: 0 }}>Aucun bilan pour cette date</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bilans.map(b => {
            const cloture = b.statut === 'cloture';
            const anomalies = (b.lignes || []).filter((l: any) => {
              const sys = b.ventes_systeme?.[l.produit_id] ?? 0;
              return cloture && ((l.qte_remise - l.qte_livree - l.qte_retour) !== 0 || l.qte_livree !== sys);
            }).length;
            return (
              <div key={b.id} style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8faff', borderBottom: '1px solid #f0f4fb', gap: 10, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0d1b3e', margin: 0 }}>🚚 {nomUser(b.livreur)}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {anomalies > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: '#fee2e2', color: '#991b1b' }}>
                        <AlertTriangle size={11} /> {anomalies} écart(s)
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: cloture ? '#dcfce7' : '#fef9c3', color: cloture ? '#166534' : '#854d0e' }}>
                      {cloture ? <><CheckCircle size={11} /> Clôturé {b.valide_at ? new Date(b.valide_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</> : <><Clock size={11} /> En attente de clôture</>}
                    </span>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#fafbff' }}>
                        {['Produit', 'Remis', 'Livré (déclaré)', 'Restant (déclaré)', 'Ventes système', 'Écart'].map(h => (
                          <th key={h} style={{ textAlign: h === 'Produit' ? 'left' : 'center', padding: '8px 12px', fontSize: 11, color: '#8a96b0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(b.lignes || []).map((l: any) => {
                        const sys = b.ventes_systeme?.[l.produit_id] ?? 0;
                        const ecart = l.qte_remise - l.qte_livree - l.qte_retour;
                        const diffSys = cloture && l.qte_livree !== sys;
                        return (
                          <tr key={l.id} style={{ borderTop: '1px solid #f0f4fb' }}>
                            <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0d1b3e' }}>{cleanNom(l.produit?.nom)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'center' }}>{l.qte_remise}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'center' }}>{cloture ? l.qte_livree : '—'}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'center' }}>{cloture ? l.qte_retour : '—'}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: diffSys ? 700 : 400, color: diffSys ? '#b45309' : 'inherit' }}>{sys}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 700, color: !cloture ? '#8a96b0' : ecart === 0 ? '#166534' : '#991b1b' }}>
                              {!cloture ? '—' : ecart === 0 ? '✓' : ecart > 0 ? `-${ecart}` : `+${-ecart}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {b.notes && (
                  <div style={{ padding: '10px 16px', background: '#fff7ed', borderTop: '1px solid #fed7aa', fontSize: 12, color: '#9a3412' }}>
                    📝 Note du livreur : {b.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ fontSize: 11, color: '#8a96b0', marginTop: 14 }}>
        « Ventes système » = produits des livraisons livrées par ce livreur ce jour-là. Un bilan n'agit jamais sur le stock : il sert uniquement au contrôle.
      </p>

      {modal && (
        <div onClick={() => !saving && setModal(false)} style={T.overlay}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'linear-gradient(90deg,#003785,#1465BB)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, color: 'white', margin: 0 }}>Remettre des produits à un livreur</h3>
              <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
            </div>
            <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
                <div>
                  <label style={T.lbl}>Livreur *</label>
                  <select value={livreurId} onChange={e => setLivreurId(e.target.value)} style={T.inp}>
                    <option value="">— Choisir —</option>
                    {livreurs.map(l => <option key={l.id} value={String(l.id)}>{nomUser(l)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={T.lbl}>Date</label>
                  <input type="date" value={dateRemise} max={isoJour()} onChange={e => setDateRemise(e.target.value)} style={T.inp} />
                </div>
              </div>

              <div>
                <label style={T.lbl}>Produits remis *</label>
                <input placeholder="🔍 Filtrer la liste des produits…" value={recherche} onChange={e => setRecherche(e.target.value)} style={{ ...T.inp, marginBottom: 8 }} />
                {lignes.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={l.produit_id} onChange={e => majLigne(i, 'produit_id', e.target.value)} style={{ ...T.inp, flex: 1, minWidth: 0 }}>
                      <option value="">— Produit —</option>
                      {produitsFiltres.map(p => <option key={p.id} value={String(p.id)}>{cleanNom(p.nom)} (stock {p.quantite_stock})</option>)}
                    </select>
                    <input inputMode="numeric" value={l.qte} onChange={e => majLigne(i, 'qte', e.target.value)} style={{ ...T.inp, width: 70, textAlign: 'center' }} />
                    <button onClick={() => setLignes(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls)}
                      style={{ border: '1.5px solid #fecaca', background: '#fff5f5', borderRadius: 8, width: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={14} color="#e53e3e" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setLignes(ls => [...ls, { produit_id: '', qte: '1' }])}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px dashed #1465BB', background: 'white', color: '#1465BB', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  + Ajouter un produit
                </button>
              </div>

              <p style={{ fontSize: 11, color: '#8a96b0', margin: 0 }}>
                Enregistrer une remise ne modifie pas le stock : seule la vente validée le déduit.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setModal(false)} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer', color: '#4a5578' }}>Annuler</button>
                <button onClick={enregistrer} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(90deg,#003785,#1465BB)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '…' : 'Enregistrer'}
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
  h1:  { fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 700, color: '#0d1b3e', margin: 0 } as CSSProperties,
  sub: { fontFamily: 'Cormorant Garamond,serif', fontSize: 16, color: '#4a5578', marginTop: 4 } as CSSProperties,
  card: { background: 'white', borderRadius: 14, border: '1px solid #dde5f4' } as CSSProperties,
  lbl: { fontSize: 12, fontWeight: 600, color: '#4a5578', display: 'block', marginBottom: 4 } as CSSProperties,
  inp: { width: '100%', padding: '9px 12px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' } as CSSProperties,
  overlay: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(13,27,62,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', padding: 16 } as CSSProperties,
};
