import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Lock, X } from 'lucide-react';
import { bilansService } from '../../services/api';
import toast from 'react-hot-toast';

const cleanNom = (nom?: string): string => {
  if (!nom) return '—';
  return nom.replace(/(\[Arch[ié]v[eé]\]\s*)*/gi, '').trim() || nom;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

interface Saisie { livree: string; retour: string; }

export default function BilanPage() {
  const [bilan,      setBilan]      = useState<any>(null);
  const [historique, setHistorique] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saisies,    setSaisies]    = useState<Record<number, Saisie>>({});
  const [notes,      setNotes]      = useState('');
  const [confirm,    setConfirm]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [ouvert,     setOuvert]     = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [b, h] = await Promise.allSettled([bilansService.monBilan(), bilansService.historique()]);
    if (b.status === 'fulfilled') {
      const data = b.value.data;
      setBilan(data);
      const init: Record<number, Saisie> = {};
      (data.lignes || []).forEach((l: any) => {
        init[l.id] = { livree: String(l.qte_livree ?? 0), retour: String(l.qte_retour ?? 0) };
      });
      setSaisies(init);
      setNotes(data.notes || '');
    } else {
      setBilan(null); // 404 : aucun bilan aujourd'hui
    }
    if (h.status === 'fulfilled') setHistorique(h.value.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const lignes: any[] = bilan?.lignes || [];
  const estCloture = bilan?.statut === 'cloture';

  const num = (v: string) => Math.max(0, parseInt(v || '0', 10) || 0);

  const calcul = (l: any) => {
    const s = saisies[l.id] || { livree: '0', retour: '0' };
    const livree = num(s.livree);
    const retour = num(s.retour);
    const ecart  = l.qte_remise - livree - retour; // >0 : non justifié, <0 : dépassement
    return { livree, retour, ecart };
  };

  const depassements = lignes.filter(l => calcul(l).ecart < 0);
  const ecarts       = lignes.filter(l => calcul(l).ecart > 0);

  const setChamp = (id: number, champ: keyof Saisie, val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return;
    setSaisies(s => ({ ...s, [id]: { ...(s[id] || { livree: '0', retour: '0' }), [champ]: val } }));
  };

  const tenterCloture = () => {
    if (depassements.length > 0) { toast.error('Livré + restant dépasse la quantité remise'); return; }
    if (ecarts.length > 0 && !notes.trim()) {
      toast.error('Expliquez les écarts dans la note avant de clôturer');
      return;
    }
    setConfirm(true);
  };

  const cloturer = async () => {
    if (!bilan) return;
    setSaving(true);
    try {
      await bilansService.cloturer(bilan.id, {
        lignes: lignes.map(l => {
          const c = calcul(l);
          return { id: l.id, qte_livree: c.livree, qte_retour: c.retour };
        }),
        notes: notes.trim() || null,
      });
      toast.success('Journée clôturée ✓');
      setConfirm(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la clôture');
    } finally { setSaving(false); }
  };

  const totaux = (b: any) => (b.lignes || []).reduce(
    (a: any, l: any) => ({ recu: a.recu + l.qte_remise, livre: a.livre + l.qte_livree, reste: a.reste + l.qte_retour }),
    { recu: 0, livre: 0, reste: 0 });

  const passes = historique.filter(h => !bilan || h.id !== bilan.id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={T.h1}>Mon bilan du jour</h1>
          <p style={T.sub}>Produits reçus, livrés et restants — à clôturer avant minuit</p>
        </div>
        <button onClick={load} style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer' }}>
          <RefreshCw size={14} color="#4a5578" />
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 60, color: '#8a96b0', fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>Chargement…</p>
      ) : !bilan ? (
        <div style={{ ...T.card, textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, color: '#0d1b3e', margin: '0 0 6px' }}>Aucun produit remis aujourd'hui</p>
          <p style={{ fontSize: 13, color: '#8a96b0', margin: 0 }}>Le gestionnaire doit d'abord enregistrer les produits qui vous sont remis.</p>
        </div>
      ) : (
        <>
          {estCloture && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontSize: 13, fontWeight: 600 }}>
              <Lock size={15} /> Journée clôturée le {new Date(bilan.valide_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — le gestionnaire peut la vérifier.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {lignes.map(l => {
              const c = calcul(l);
              const sys = bilan.ventes_systeme?.[l.produit_id];
              const diffSys = sys !== undefined ? sys !== c.livree : c.livree > 0;
              return (
                <div key={l.id} style={{ ...T.card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0d1b3e', margin: 0 }}>{cleanNom(l.produit?.nom)}</p>
                    <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0 }}>
                      Remis : {l.qte_remise}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={T.lbl}>Livré</label>
                      <input inputMode="numeric" disabled={estCloture} value={saisies[l.id]?.livree ?? '0'}
                        onChange={e => setChamp(l.id, 'livree', e.target.value)} style={{ ...T.inp, ...(estCloture ? T.inpOff : {}) }} />
                    </div>
                    <div>
                      <label style={T.lbl}>Restant (non livré)</label>
                      <input inputMode="numeric" disabled={estCloture} value={saisies[l.id]?.retour ?? '0'}
                        onChange={e => setChamp(l.id, 'retour', e.target.value)} style={{ ...T.inp, ...(estCloture ? T.inpOff : {}) }} />
                    </div>
                  </div>
                  {!estCloture && c.ecart !== 0 && (
                    <p style={{ fontSize: 12, fontWeight: 600, margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 5, color: c.ecart < 0 ? '#991b1b' : '#9a3412' }}>
                      <AlertTriangle size={13} />
                      {c.ecart < 0 ? `Dépassement de ${-c.ecart} : livré + restant > remis` : `${c.ecart} produit(s) non justifié(s)`}
                    </p>
                  )}
                  {diffSys && (
                    <p style={{ fontSize: 11, color: '#8a96b0', margin: '6px 0 0' }}>
                      Selon le système : {sys ?? 0} livraison(s) enregistrée(s) pour ce produit aujourd'hui.
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ ...T.card, marginBottom: 14 }}>
            <label style={T.lbl}>Note {ecarts.length > 0 && !estCloture ? '(obligatoire : expliquez les écarts)' : '(facultatif)'}</label>
            <textarea value={notes} disabled={estCloture} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Ex : 1 produit endommagé, client absent…"
              style={{ ...T.inp, resize: 'none', ...(estCloture ? T.inpOff : {}) }} />
          </div>

          {!estCloture && (
            <button onClick={tenterCloture}
              style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(90deg,#0a9e6e,#065f46)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle size={17} /> Clôturer ma journée
            </button>
          )}
        </>
      )}

      {/* Historique */}
      {!loading && passes.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#4a5578', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 10px' }}>Historique de mes bilans</p>
          <div style={{ ...T.card, padding: 0, overflow: 'hidden' }}>
            {passes.map(h => {
              const t = totaux(h);
              const open = ouvert === h.id;
              return (
                <div key={h.id} style={{ borderBottom: '1px solid #f0f4fb' }}>
                  <div onClick={() => setOuvert(open ? null : h.id)} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 10 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0d1b3e', margin: 0, textTransform: 'capitalize' }}>{fmtDate(h.date)}</p>
                      <p style={{ fontSize: 11, color: '#8a96b0', margin: '2px 0 0' }}>
                        Reçus {t.recu} · Livrés {t.livre} · Restants {t.reste}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: h.statut === 'cloture' ? '#dcfce7' : '#fef9c3', color: h.statut === 'cloture' ? '#166534' : '#854d0e' }}>
                        {h.statut === 'cloture' ? 'Clôturé' : 'Non clôturé'}
                      </span>
                      {open ? <ChevronUp size={14} color="#8a96b0" /> : <ChevronDown size={14} color="#8a96b0" />}
                    </div>
                  </div>
                  {open && (
                    <div style={{ padding: '4px 16px 12px', background: '#f8faff' }}>
                      {(h.lignes || []).map((l: any) => (
                        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', color: '#4a5578' }}>
                          <span style={{ color: '#0d1b3e', fontWeight: 600 }}>{cleanNom(l.produit?.nom)}</span>
                          <span>Reçu {l.qte_remise} · Livré {l.qte_livree} · Reste {l.qte_retour}</span>
                        </div>
                      ))}
                      {h.notes && <p style={{ fontSize: 11, color: '#8a96b0', fontStyle: 'italic', margin: '6px 0 0' }}>Note : {h.notes}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirm && (
        <div onClick={() => !saving && setConfirm(false)} style={T.overlay}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 400, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'linear-gradient(90deg,#0a9e6e,#065f46)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, color: 'white', margin: 0 }}>Clôturer ma journée ?</h3>
              <button onClick={() => setConfirm(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
            </div>
            <div style={{ padding: 18 }}>
              <p style={{ fontSize: 13, color: '#4a5578', margin: '0 0 14px' }}>
                Une fois validé, vous ne pourrez plus modifier ce bilan. Le gestionnaire le vérifiera demain. Cette action n'affecte pas le stock.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirm(false)} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer', color: '#4a5578' }}>Retour</button>
                <button onClick={cloturer} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, background: '#0a9e6e', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '…' : 'Confirmer'}
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
  card: { background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1rem 1.2rem' } as CSSProperties,
  lbl: { fontSize: 12, fontWeight: 600, color: '#4a5578', display: 'block', marginBottom: 4 } as CSSProperties,
  inp: { width: '100%', padding: '9px 12px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box' } as CSSProperties,
  inpOff: { background: '#f4f7fd', color: '#4a5578' } as CSSProperties,
  overlay: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(13,27,62,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', padding: 16 } as CSSProperties,
};
