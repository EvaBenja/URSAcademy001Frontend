import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Play, X, Check, MessageCircle, Package, Trash2 } from 'lucide-react';
import { boutiquePubService, storageUrl } from '../../services/api';
import { lienWhatsApp } from '../../utils/boutique';

const fcfa = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

interface Produit {
  id: number; produit_id: number; titre: string; description: string | null;
  images: string[]; video: string | null; prix: number; dispo_max: number;
}

/* ───────────── Carte produit ───────────── */
function CarteProduit({ p, onCommander }: { p: Produit; onCommander: (p: Produit, qte: number) => void }) {
  const urls = (p.images || []).map(i => storageUrl(i) || '');
  const videoUrl = p.video ? storageUrl(p.video) : null;
  const [media, setMedia] = useState<number | 'video'>(0);
  const [qte, setQte] = useState(1);
  const [lire, setLire] = useState(false);
  const longue = (p.description || '').length > 180;

  return (
    <article style={S.carte}>
      <div style={S.mediaBox}>
        {media === 'video' && videoUrl ? (
          <video src={videoUrl} controls autoPlay playsInline preload="metadata" style={S.mediaFill} />
        ) : urls.length > 0 ? (
          <img src={urls[typeof media === 'number' ? Math.min(media, urls.length - 1) : 0]} alt={p.titre} loading="lazy" style={{ ...S.mediaFill, objectFit: 'cover' }} />
        ) : (
          <div style={{ ...S.mediaFill, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2fb' }}>
            <Package size={42} color="#b4bfd6" />
          </div>
        )}
      </div>

      {(urls.length > 1 || videoUrl) && (
        <div style={S.miniatures}>
          {urls.map((u, i) => (
            <button key={u} onClick={() => setMedia(i)} aria-label={`Photo ${i + 1}`}
              style={{ ...S.mini, outline: media === i ? '2px solid #1465BB' : '2px solid transparent' }}>
              <img src={u} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
          {videoUrl && (
            <button onClick={() => setMedia('video')} aria-label="Voir la vidéo"
              style={{ ...S.mini, background: '#0d1b3e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: 11, fontWeight: 600, width: 'auto', padding: '0 10px', outline: media === 'video' ? '2px solid #1465BB' : '2px solid transparent' }}>
              <Play size={13} fill="white" /> Vidéo
            </button>
          )}
        </div>
      )}

      <div style={{ padding: '14px 16px 16px' }}>
        <h2 style={S.titreProduit}>{p.titre}</h2>
        <p style={S.prix}>{fcfa(p.prix)}</p>

        {p.description && (
          <div style={{ marginTop: 10 }}>
            <p style={{
              ...S.texte, margin: 0, whiteSpace: 'pre-line',
              ...(longue && !lire ? { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
            }}>{p.description}</p>
            {longue && (
              <button onClick={() => setLire(l => !l)} style={S.lien}>{lire ? 'Réduire' : 'Lire le mode d\'emploi complet'}</button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <div style={S.stepper}>
            <button onClick={() => setQte(q => Math.max(1, q - 1))} aria-label="Moins" style={S.stepBtn}><Minus size={15} /></button>
            <span style={{ minWidth: 26, textAlign: 'center', fontWeight: 700, color: '#0d1b3e' }}>{qte}</span>
            <button onClick={() => setQte(q => Math.min(p.dispo_max, q + 1))} aria-label="Plus" style={S.stepBtn}><Plus size={15} /></button>
          </div>
          <button onClick={() => onCommander(p, qte)} style={S.btnCommander}>
            <ShoppingBag size={16} /> Commander
          </button>
        </div>
        {p.dispo_max <= 3 && <p style={{ fontSize: 12, color: '#b45309', margin: '8px 0 0' }}>Plus que {p.dispo_max} en stock</p>}
      </div>
    </article>
  );
}

/* ───────────── Page ───────────── */
export default function BoutiquePubPage() {
  const { code = '' } = useParams();
  const [data, setData] = useState<{ vendeur: any; produits: Produit[] } | null>(null);
  const [etat, setEtat] = useState<'chargement' | 'ok' | 'introuvable' | 'erreur'>('chargement');
  const [panier, setPanier] = useState<Record<number, number>>({});
  const [formOuvert, setFormOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState<{ numero: number; montant: number; resume: string } | null>(null);
  const [form, setForm] = useState({ client_nom: '', client_telephone: '', client_adresse: '', client_ville: '', site_web: '' });

  useEffect(() => {
    let annule = false;
    boutiquePubService.get(code)
      .then(r => { if (!annule) { setData(r.data); setEtat('ok'); document.title = r.data.vendeur?.nom || 'Boutique'; } })
      .catch(e => { if (!annule) setEtat(e.response?.status === 404 ? 'introuvable' : 'erreur'); });
    return () => { annule = true; };
  }, [code]);

  const produits = data?.produits || [];
  const parId = useMemo(() => new Map(produits.map(p => [p.produit_id, p])), [produits]);

  const lignes = Object.entries(panier)
    .map(([id, qte]) => ({ p: parId.get(Number(id)), qte }))
    .filter((l): l is { p: Produit; qte: number } => !!l.p && l.qte > 0);
  const total = lignes.reduce((s, l) => s + l.p.prix * l.qte, 0);
  const nbArticles = lignes.reduce((s, l) => s + l.qte, 0);

  const commander = (p: Produit, qte: number) => {
    setPanier(pa => ({ ...pa, [p.produit_id]: qte }));
    setErreur(''); setSucces(null); setFormOuvert(true);
  };

  const changerQte = (p: Produit, delta: number) => {
    setPanier(pa => {
      const n = Math.max(0, Math.min(p.dispo_max, (pa[p.produit_id] || 0) + delta));
      const copie = { ...pa };
      if (n === 0) delete copie[p.produit_id]; else copie[p.produit_id] = n;
      return copie;
    });
  };

  const valider = async () => {
    setErreur('');
    if (!form.client_nom.trim()) { setErreur('Indiquez votre nom'); return; }
    if (!/^[0-9+\s().-]{8,20}$/.test(form.client_telephone.trim())) { setErreur('Numéro de téléphone invalide'); return; }
    if (!form.client_adresse.trim()) { setErreur('Indiquez votre quartier ou adresse de livraison'); return; }
    if (lignes.length === 0) { setErreur('Votre panier est vide'); return; }

    setEnvoi(true);
    try {
      const r = await boutiquePubService.commander(code, {
        client_nom: form.client_nom.trim(),
        client_telephone: form.client_telephone.trim(),
        client_adresse: form.client_adresse.trim(),
        client_ville: form.client_ville.trim() || null,
        site_web: form.site_web,
        items: lignes.map(l => ({ produit_id: l.p.produit_id, quantite: l.qte })),
      });
      setSucces({
        numero: r.data.numero, montant: r.data.montant ?? total,
        resume: lignes.map(l => `${l.qte} × ${l.p.titre}`).join(', '),
      });
      setPanier({});
    } catch (e: any) {
      const errs = e.response?.data?.errors;
      const premier = errs ? (Object.values(errs)[0] as string[])[0] : null;
      if (e.response?.status === 429) setErreur('Trop de tentatives. Patientez une minute puis réessayez.');
      else setErreur(premier || e.response?.data?.message || 'Impossible d\'enregistrer la commande. Vérifiez votre connexion et réessayez.');
    } finally { setEnvoi(false); }
  };

  const fermerForm = () => { if (!envoi) { setFormOuvert(false); if (succes) setSucces(null); } };

  const nomBoutique = data?.vendeur?.nom || 'Boutique';
  const wa = lienWhatsApp(data?.vendeur?.whatsapp_boutique, `Bonjour, je suis intéressé(e) par vos produits sur ${nomBoutique}.`);
  const waCommande = succes
    ? lienWhatsApp(data?.vendeur?.whatsapp_boutique,
        `Bonjour, je viens de passer la commande n°${succes.numero} sur ${nomBoutique} : ${succes.resume}. Total : ${fcfa(succes.montant)}. Je m'appelle ${form.client_nom}.`)
    : null;

  if (etat === 'chargement') {
    return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 20, color: '#5b6785' }}>Chargement de la boutique…</p></div>;
  }
  if (etat !== 'ok' || !data) {
    return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: 24 }}>
      <div>
        <Package size={44} color="#b4bfd6" />
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, color: '#0d1b3e', margin: '12px 0 6px' }}>
          {etat === 'introuvable' ? 'Boutique introuvable' : 'Boutique momentanément indisponible'}
        </h1>
        <p style={{ color: '#5b6785', fontSize: 14, margin: 0 }}>
          {etat === 'introuvable' ? 'Ce lien n\'est pas valide. Demandez-le à nouveau au vendeur.' : 'Vérifiez votre connexion puis rechargez la page.'}
        </p>
      </div>
    </div>;
  }

  return (
    <div style={{ ...S.page, paddingBottom: nbArticles > 0 ? 90 : 0 }}>
      <header style={S.entete}>
        <div style={S.conteneur}>
          <h1 style={S.titreBoutique}>{nomBoutique}</h1>
          {data.vendeur.description && <p style={S.descBoutique}>{data.vendeur.description}</p>}
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" style={S.btnWa}>
              <MessageCircle size={16} /> Discuter sur WhatsApp
            </a>
          )}
        </div>
      </header>

      <main style={{ ...S.conteneur, paddingTop: 20, paddingBottom: 30 }}>
        {produits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 10px', color: '#5b6785' }}>
            <Package size={40} color="#b4bfd6" />
            <p style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 19, margin: '10px 0 0' }}>Cette boutique n'a pas encore de produits disponibles.</p>
          </div>
        ) : (
          <div style={S.grille}>
            {produits.map(p => <CarteProduit key={p.id} p={p} onCommander={commander} />)}
          </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#8a96b0', marginTop: 28 }}>Paiement à la livraison · Boutique propulsée par URS</p>
      </main>

      {nbArticles > 0 && !formOuvert && (
        <div style={S.barre}>
          <button onClick={() => { setErreur(''); setFormOuvert(true); }} style={S.barreBtn}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShoppingBag size={18} /> Ma commande ({nbArticles})</span>
            <span style={{ fontWeight: 700 }}>{fcfa(total)}</span>
          </button>
        </div>
      )}

      {formOuvert && (
        <div onClick={fermerForm} style={S.overlay}>
          <div onClick={e => e.stopPropagation()} style={S.feuille} role="dialog" aria-modal="true">
            <div style={S.feuilleTete}>
              <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, margin: 0, color: 'white' }}>{succes ? 'Commande enregistrée' : 'Finaliser ma commande'}</h2>
              <button onClick={fermerForm} aria-label="Fermer" style={S.fermer}><X size={16} /></button>
            </div>

            {succes ? (
              <div style={{ padding: 22, textAlign: 'center' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#dcfce7', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={28} color="#166534" />
                </div>
                <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 19, color: '#0d1b3e', margin: '0 0 6px' }}>Merci {form.client_nom.split(' ')[0]} !</p>
                <p style={{ fontSize: 14, color: '#4a5578', margin: '0 0 4px' }}>Votre commande n°{succes.numero} est bien reçue.</p>
                <p style={{ fontSize: 13, color: '#5b6785', margin: '0 0 4px' }}>{succes.resume}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#003785', margin: '0 0 14px' }}>{fcfa(succes.montant)} à payer à la livraison</p>
                <p style={{ fontSize: 13, color: '#5b6785', margin: '0 0 16px' }}>Le vendeur ou un livreur vous appellera au {form.client_telephone} pour confirmer.</p>
                {waCommande && (
                  <a href={waCommande} target="_blank" rel="noreferrer" style={{ ...S.btnWa, width: '100%', justifyContent: 'center', boxSizing: 'border-box', marginBottom: 10 }}>
                    <MessageCircle size={16} /> Prévenir le vendeur sur WhatsApp
                  </a>
                )}
                <button onClick={fermerForm} style={S.btnSecondaire}>Continuer mes achats</button>
              </div>
            ) : (
              <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  {lignes.map(l => (
                    <div key={l.p.produit_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #eef2fb' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0d1b3e', margin: 0 }}>{l.p.titre}</p>
                        <p style={{ fontSize: 12, color: '#5b6785', margin: '2px 0 0' }}>{fcfa(l.p.prix * l.qte)}</p>
                      </div>
                      <div style={S.stepper}>
                        <button onClick={() => changerQte(l.p, -1)} aria-label="Moins" style={S.stepBtn}><Minus size={14} /></button>
                        <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700 }}>{l.qte}</span>
                        <button onClick={() => changerQte(l.p, 1)} aria-label="Plus" style={S.stepBtn}><Plus size={14} /></button>
                      </div>
                      <button onClick={() => changerQte(l.p, -l.qte)} aria-label="Retirer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', padding: 4 }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {lignes.length === 0 && <p style={{ fontSize: 13, color: '#8a96b0', margin: 0 }}>Votre panier est vide.</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontWeight: 700, color: '#0d1b3e' }}>
                    <span>Total</span><span style={{ color: '#003785' }}>{fcfa(total)}</span>
                  </div>
                </div>

                <div>
                  <label style={S.etiquette}>Votre nom complet *</label>
                  <input value={form.client_nom} maxLength={100} autoComplete="name" onChange={e => setForm(f => ({ ...f, client_nom: e.target.value }))} style={S.champ} />
                </div>
                <div>
                  <label style={S.etiquette}>Téléphone *</label>
                  <input value={form.client_telephone} inputMode="tel" autoComplete="tel" placeholder="Ex : 70 00 00 00" onChange={e => setForm(f => ({ ...f, client_telephone: e.target.value }))} style={S.champ} />
                </div>
                <div>
                  <label style={S.etiquette}>Quartier / adresse de livraison *</label>
                  <input value={form.client_adresse} maxLength={255} placeholder="Ex : Tampouy, près du marché" onChange={e => setForm(f => ({ ...f, client_adresse: e.target.value }))} style={S.champ} />
                </div>
                <div>
                  <label style={S.etiquette}>Ville</label>
                  <input value={form.client_ville} maxLength={100} onChange={e => setForm(f => ({ ...f, client_ville: e.target.value }))} style={S.champ} />
                </div>

                {/* Anti-robots : invisible pour un humain */}
                <input type="text" name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true"
                  value={form.site_web} onChange={e => setForm(f => ({ ...f, site_web: e.target.value }))}
                  style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />

                {erreur && <p role="alert" style={{ background: '#fee2e2', color: '#991b1b', fontSize: 13, padding: '9px 12px', borderRadius: 8, margin: 0 }}>{erreur}</p>}

                <button onClick={valider} disabled={envoi || lignes.length === 0} style={{ ...S.btnCommander, width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, opacity: envoi || lignes.length === 0 ? 0.6 : 1 }}>
                  {envoi ? 'Envoi en cours…' : `Valider ma commande · ${fcfa(total)}`}
                </button>
                <p style={{ fontSize: 12, color: '#5b6785', textAlign: 'center', margin: 0 }}>Vous payez à la livraison, après avoir reçu le produit.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────── Styles ───────────── */
const S = {
  page: { background: '#f5f7fb', minHeight: '100vh', color: '#0d1b3e', fontFamily: "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif" } as CSSProperties,
  conteneur: { maxWidth: 1040, margin: '0 auto', padding: '0 16px' } as CSSProperties,
  entete: { background: 'linear-gradient(135deg,#002a66,#1465BB)', padding: '28px 0 24px', color: 'white' } as CSSProperties,
  titreBoutique: { fontFamily: 'Playfair Display,serif', fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 } as CSSProperties,
  descBoutique: { fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.88)', margin: '8px 0 0', maxWidth: 640, whiteSpace: 'pre-line' } as CSSProperties,
  btnWa: { display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '10px 18px', borderRadius: 999, background: '#25D366', color: '#053b1d', fontWeight: 700, fontSize: 14, textDecoration: 'none' } as CSSProperties,
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 18 } as CSSProperties,
  carte: { background: 'white', borderRadius: 16, border: '1px solid #e3e9f5', overflow: 'hidden', display: 'flex', flexDirection: 'column' } as CSSProperties,
  mediaBox: { position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#0d1b3e' } as CSSProperties,
  mediaFill: { position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' } as CSSProperties,
  miniatures: { display: 'flex', gap: 6, padding: '8px 10px 0', overflowX: 'auto' } as CSSProperties,
  mini: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden', padding: 0, border: 'none', cursor: 'pointer', flexShrink: 0, background: '#eef2fb' } as CSSProperties,
  titreProduit: { fontFamily: 'Playfair Display,serif', fontSize: 19, fontWeight: 700, margin: 0, lineHeight: 1.25, color: '#0d1b3e' } as CSSProperties,
  prix: { fontSize: 21, fontWeight: 700, color: '#003785', margin: '4px 0 0' } as CSSProperties,
  texte: { fontSize: 14, lineHeight: 1.6, color: '#3d4766' } as CSSProperties,
  lien: { background: 'none', border: 'none', padding: '4px 0 0', color: '#1465BB', fontWeight: 600, fontSize: 13, cursor: 'pointer' } as CSSProperties,
  stepper: { display: 'flex', alignItems: 'center', border: '1.5px solid #dde5f4', borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as CSSProperties,
  stepBtn: { width: 34, height: 38, border: 'none', background: '#f4f7fd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003785' } as CSSProperties,
  btnCommander: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(90deg,#003785,#1465BB)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' } as CSSProperties,
  btnSecondaire: { width: '100%', padding: '11px', borderRadius: 10, border: '1.5px solid #dde5f4', background: 'white', color: '#4a5578', fontWeight: 600, fontSize: 14, cursor: 'pointer' } as CSSProperties,
  barre: { position: 'fixed', left: 0, right: 0, bottom: 0, padding: '10px 14px calc(10px + env(safe-area-inset-bottom, 0px))', background: 'rgba(245,247,251,0.96)', backdropFilter: 'blur(6px)', borderTop: '1px solid #e3e9f5', zIndex: 50 } as CSSProperties,
  barreBtn: { width: '100%', maxWidth: 560, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#003785,#1465BB)', color: 'white', fontSize: 15, cursor: 'pointer' } as CSSProperties,
  overlay: { position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(13,27,62,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' } as CSSProperties,
  feuille: { background: 'white', width: '100%', maxWidth: 520, maxHeight: '94vh', borderRadius: '18px 18px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' } as CSSProperties,
  feuilleTete: { background: 'linear-gradient(90deg,#002a66,#1465BB)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as CSSProperties,
  fermer: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' } as CSSProperties,
  etiquette: { fontSize: 13, fontWeight: 600, color: '#4a5578', display: 'block', marginBottom: 5 } as CSSProperties,
  champ: { width: '100%', padding: '11px 13px', border: '1.5px solid #dde5f4', borderRadius: 10, fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' } as CSSProperties,
};
