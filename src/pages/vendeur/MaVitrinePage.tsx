import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, ImagePlus, Film, Trash2, Pencil, Eye, EyeOff, ExternalLink, Copy, Check, ArrowLeft } from 'lucide-react';
import api, { boutiqueProduitsService, boutiqueVendeurService, storageUrl } from '../../services/api';
import { compresserImage, lienBoutiquePublique, nettoyerNom } from '../../utils/boutique';
import toast from 'react-hot-toast';

const MAX_IMAGES = 5;
const MAX_VIDEO_MO = 15;

interface NouvelleImage { file: File; preview: string; }

export default function MaVitrinePage() {
  const [items,     setItems]     = useState<any[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [code,      setCode]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [copie,     setCopie]     = useState(false);

  // Formulaire (ajout / modification)
  const [modal,       setModal]       = useState(false);
  const [edition,     setEdition]     = useState<any>(null);   // fiche en cours de modification
  const [produitId,   setProduitId]   = useState('');
  const [recherche,   setRecherche]   = useState('');
  const [titre,       setTitre]       = useState('');
  const [description, setDescription] = useState('');
  const [gardees,     setGardees]     = useState<string[]>([]);       // images déjà en ligne
  const [retirees,    setRetirees]    = useState<string[]>([]);       // images à supprimer
  const [nouvelles,   setNouvelles]   = useState<NouvelleImage[]>([]);
  const [videoExiste, setVideoExiste] = useState<string | null>(null);
  const [retirerVideo, setRetirerVideo] = useState(false);
  const [videoFile,   setVideoFile]   = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [progression, setProgression] = useState(0);
  const inputImg   = useRef<HTMLInputElement>(null);
  const inputVideo = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [i, c, l] = await Promise.allSettled([
      boutiqueProduitsService.list(),
      api.get('/produits-liste'),
      boutiqueVendeurService.monLien(),
    ]);
    if (i.status === 'fulfilled') setItems(i.value.data || []);
    else toast.error('Erreur chargement de la vitrine');
    if (c.status === 'fulfilled') setCatalogue(c.value.data || []);
    if (l.status === 'fulfilled') setCode(l.value.data.code_boutique || '');
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Libère les aperçus en mémoire
  useEffect(() => () => { nouvelles.forEach(n => URL.revokeObjectURL(n.preview)); if (videoPreview) URL.revokeObjectURL(videoPreview); }, []); // eslint-disable-line

  const lien = lienBoutiquePublique(code);

  const copierLien = () => {
    navigator.clipboard?.writeText(lien).then(() => { setCopie(true); toast.success('Lien copié !'); setTimeout(() => setCopie(false), 2000); });
  };

  const reinitialiser = () => {
    nouvelles.forEach(n => URL.revokeObjectURL(n.preview));
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setEdition(null); setProduitId(''); setRecherche(''); setTitre(''); setDescription('');
    setGardees([]); setRetirees([]); setNouvelles([]);
    setVideoExiste(null); setRetirerVideo(false); setVideoFile(null); setVideoPreview(null);
    setProgression(0);
  };

  const ouvrirAjout = () => { reinitialiser(); setModal(true); };

  const ouvrirEdition = (it: any) => {
    reinitialiser();
    setEdition(it);
    setTitre(it.titre || '');
    setDescription(it.description || '');
    setGardees(it.images || []);
    setVideoExiste(it.video || null);
    setModal(true);
  };

  const fermer = () => { if (!saving) { setModal(false); reinitialiser(); } };

  const dejaDansVitrine = new Set(items.map(i => Number(i.produit_id)));
  const disponibles = catalogue.filter(p =>
    !dejaDansVitrine.has(Number(p.id)) &&
    (!recherche.trim() || (p.nom || '').toLowerCase().includes(recherche.toLowerCase())));

  const choisirProduit = (id: string) => {
    setProduitId(id);
    const p = catalogue.find(x => String(x.id) === id);
    if (p && !titre.trim()) setTitre(nettoyerNom(p.nom));
  };

  const totalImages = gardees.length + nouvelles.length;

  const ajouterImages = async (files: FileList | null) => {
    if (!files) return;
    const places = MAX_IMAGES - totalImages;
    if (places <= 0) { toast.error(`Maximum ${MAX_IMAGES} photos`); return; }
    const choisies = Array.from(files).slice(0, places);
    if (files.length > places) toast(`Seules ${places} photo(s) ajoutée(s) (maximum ${MAX_IMAGES})`);
    const pretes: NouvelleImage[] = [];
    for (const f of choisies) {
      if (!f.type.startsWith('image/')) { toast.error(`${f.name} n'est pas une image`); continue; }
      const comp = await compresserImage(f);
      pretes.push({ file: comp, preview: URL.createObjectURL(comp) });
    }
    setNouvelles(n => [...n, ...pretes]);
    if (inputImg.current) inputImg.current.value = '';
  };

  const retirerNouvelle = (idx: number) => {
    setNouvelles(n => { URL.revokeObjectURL(n[idx].preview); return n.filter((_, i) => i !== idx); });
  };

  const retirerGardee = (path: string) => {
    setGardees(g => g.filter(x => x !== path));
    setRetirees(r => [...r, path]);
  };

  const choisirVideo = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!/^video\/(mp4|webm|quicktime)$/.test(f.type)) { toast.error('Format accepté : MP4, WebM ou MOV'); return; }
    if (f.size > MAX_VIDEO_MO * 1024 * 1024) {
      toast.error(`Vidéo trop lourde (${(f.size / 1048576).toFixed(1)} Mo). Maximum ${MAX_VIDEO_MO} Mo — faites une vidéo courte.`);
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
    setRetirerVideo(false);
    if (inputVideo.current) inputVideo.current.value = '';
  };

  const enregistrer = async () => {
    if (!edition && !produitId) { toast.error('Choisissez un produit'); return; }
    if (!titre.trim()) { toast.error('Le titre est obligatoire'); return; }

    const fd = new FormData();
    if (!edition) fd.append('produit_id', produitId);
    fd.append('titre', titre.trim());
    fd.append('description', description.trim());
    nouvelles.forEach(n => fd.append('images[]', n.file));
    if (videoFile) fd.append('video', videoFile);
    if (edition) {
      retirees.forEach(p => fd.append('remove_images[]', p));
      if (retirerVideo && !videoFile) fd.append('remove_video', '1');
    }

    setSaving(true); setProgression(0);
    try {
      if (edition) await boutiqueProduitsService.update(edition.id, fd, setProgression);
      else         await boutiqueProduitsService.create(fd, setProgression);
      toast.success(edition ? 'Produit mis à jour ✓' : 'Produit ajouté à votre boutique ✓');
      setSaving(false);
      setModal(false); reinitialiser();
      load();
    } catch (e: any) {
      const errs = e.response?.data?.errors;
      const premier = errs ? (Object.values(errs)[0] as string[])[0] : null;
      toast.error(premier || e.response?.data?.message || 'Erreur lors de l\'enregistrement');
      setSaving(false);
    }
  };

  const basculer = async (it: any) => {
    const fd = new FormData();
    fd.append('actif', it.actif ? '0' : '1');
    try { await boutiqueProduitsService.update(it.id, fd); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  const supprimer = async (it: any) => {
    if (!window.confirm(`Retirer « ${it.titre} » de votre boutique ? Le produit du catalogue et vos ventes ne sont pas touchés.`)) return;
    try { await boutiqueProduitsService.remove(it.id); toast.success('Produit retiré'); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

  return (
    <div>
      <Link to="/vendeur/boutique" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4a5578', textDecoration: 'none', marginBottom: 10 }}>
        <ArrowLeft size={13} /> Ma boutique
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={T.h1}>Ma vitrine</h1>
          <p style={T.sub}>Les produits que vos clients voient sur votre page de vente</p>
        </div>
        <button onClick={ouvrirAjout}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 9, background: 'linear-gradient(90deg,#003785,#1465BB)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus size={15} /> Ajouter un produit
        </button>
      </div>

      {code && (
        <div style={{ ...T.card, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px' }}>
          <code style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#0d1b3e', wordBreak: 'break-all' }}>{lien}</code>
          <button onClick={copierLien} style={T.btnMini}>{copie ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}</button>
          <a href={lien} target="_blank" rel="noreferrer" style={{ ...T.btnMini, textDecoration: 'none' }}><ExternalLink size={12} /> Voir ma page</a>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: 50, color: '#8a96b0', fontFamily: 'Cormorant Garamond,serif', fontSize: 18 }}>Chargement…</p>
      ) : items.length === 0 ? (
        <div style={{ ...T.card, textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, color: '#0d1b3e', margin: '0 0 6px' }}>Votre vitrine est vide</p>
          <p style={{ fontSize: 13, color: '#8a96b0', margin: '0 0 14px' }}>Ajoutez les produits que vous voulez vendre avec leurs photos, une vidéo et une description. Seuls ces produits seront visibles sur votre page.</p>
          <button onClick={ouvrirAjout} style={{ padding: '9px 18px', borderRadius: 8, background: '#1465BB', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ajouter mon premier produit</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => {
            const rupture = (it.produit?.quantite_stock ?? 0) <= 0;
            return (
              <div key={it.id} style={{ ...T.card, display: 'flex', gap: 12, padding: 12, opacity: it.actif ? 1 : 0.6 }}>
                <div style={{ width: 84, height: 84, borderRadius: 10, background: '#eef2fb', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {it.images?.[0]
                    ? <img src={storageUrl(it.images[0]) || ''} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImagePlus size={24} color="#b4bfd6" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0d1b3e', margin: 0 }}>{it.titre}</p>
                  <p style={{ fontSize: 12, color: '#4a5578', margin: '2px 0 6px' }}>
                    {Number(it.produit?.prix_unitaire || 0).toLocaleString('fr-FR')} FCFA · stock {it.produit?.quantite_stock ?? 0}
                  </p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ ...T.tag, background: it.actif ? '#dcfce7' : '#f1f5f9', color: it.actif ? '#166534' : '#475569' }}>{it.actif ? 'Visible' : 'Masqué'}</span>
                    {rupture && <span style={{ ...T.tag, background: '#fee2e2', color: '#991b1b' }}>En rupture — non affiché</span>}
                    <span style={{ ...T.tag, background: '#eef2fb', color: '#1e40af' }}>{(it.images || []).length} photo(s)</span>
                    {it.video && <span style={{ ...T.tag, background: '#eef2fb', color: '#1e40af' }}>Vidéo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => ouvrirEdition(it)} style={T.btnMini}><Pencil size={12} /> Modifier</button>
                    <button onClick={() => basculer(it)} style={T.btnMini}>{it.actif ? <><EyeOff size={12} /> Masquer</> : <><Eye size={12} /> Afficher</>}</button>
                    <button onClick={() => supprimer(it)} style={{ ...T.btnMini, color: '#e53e3e', borderColor: '#fecaca' }}><Trash2 size={12} /> Retirer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div onClick={fermer} style={T.overlay}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', background: 'linear-gradient(90deg,#003785,#1465BB)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, color: 'white', margin: 0 }}>{edition ? 'Modifier le produit' : 'Ajouter un produit à ma boutique'}</h3>
              <button onClick={fermer} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
            </div>

            <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!edition && (
                <div>
                  <label style={T.lbl}>Produit du catalogue *</label>
                  <input placeholder="🔍 Rechercher un produit…" value={recherche} onChange={e => setRecherche(e.target.value)} style={{ ...T.inp, marginBottom: 6 }} />
                  <select value={produitId} onChange={e => choisirProduit(e.target.value)} size={Math.min(5, Math.max(2, disponibles.length))} style={{ ...T.inp, padding: 4 }}>
                    {disponibles.length === 0 && <option disabled>Aucun produit disponible</option>}
                    {disponibles.map(p => (
                      <option key={p.id} value={String(p.id)}>{nettoyerNom(p.nom)} — {Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: '#8a96b0', margin: '4px 0 0' }}>Le prix, le stock et la livraison suivent le produit du catalogue.</p>
                </div>
              )}

              <div>
                <label style={T.lbl}>Titre affiché aux clients *</label>
                <input value={titre} maxLength={150} onChange={e => setTitre(e.target.value)} placeholder="Ex : Spray anti-rayures pour voiture" style={T.inp} />
              </div>

              <div>
                <label style={T.lbl}>Description et mode d'emploi</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} maxLength={5000}
                  placeholder={"À quoi sert ce produit ?\nComment l'utiliser ?\nQuels avantages pour le client ?"}
                  style={{ ...T.inp, resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              <div>
                <label style={T.lbl}>Photos ({totalImages}/{MAX_IMAGES})</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {gardees.map(p => (
                    <div key={p} style={T.vignette}>
                      <img src={storageUrl(p) || ''} alt="" style={T.vignetteImg} />
                      <button onClick={() => retirerGardee(p)} style={T.vignetteX}><X size={11} /></button>
                    </div>
                  ))}
                  {nouvelles.map((n, i) => (
                    <div key={n.preview} style={T.vignette}>
                      <img src={n.preview} alt="" style={T.vignetteImg} />
                      <button onClick={() => retirerNouvelle(i)} style={T.vignetteX}><X size={11} /></button>
                    </div>
                  ))}
                  {totalImages < MAX_IMAGES && (
                    <button onClick={() => inputImg.current?.click()} style={{ ...T.vignette, border: '1.5px dashed #1465BB', background: '#f4f8ff', cursor: 'pointer', color: '#1465BB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImagePlus size={22} />
                    </button>
                  )}
                </div>
                <input ref={inputImg} type="file" accept="image/*" multiple hidden onChange={e => ajouterImages(e.target.files)} />
                <p style={{ fontSize: 11, color: '#8a96b0', margin: '4px 0 0' }}>La première photo sert de couverture. Les photos sont allégées automatiquement.</p>
              </div>

              <div>
                <label style={T.lbl}>Mini-vidéo (facultatif)</label>
                {(videoPreview || (videoExiste && !retirerVideo)) ? (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                    <video src={videoPreview || storageUrl(videoExiste!) || ''} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: 220, display: 'block' }} />
                    <button onClick={() => { if (videoPreview) { URL.revokeObjectURL(videoPreview); setVideoPreview(null); setVideoFile(null); } else setRetirerVideo(true); }}
                      style={{ ...T.vignetteX, width: 26, height: 26, top: 8, right: 8 }}><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => inputVideo.current?.click()}
                    style={{ width: '100%', padding: '14px', borderRadius: 10, border: '1.5px dashed #1465BB', background: '#f4f8ff', cursor: 'pointer', color: '#1465BB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: 13 }}>
                    <Film size={18} /> Ajouter une vidéo (MP4, {MAX_VIDEO_MO} Mo max)
                  </button>
                )}
                <input ref={inputVideo} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={e => choisirVideo(e.target.files)} />
                <p style={{ fontSize: 11, color: '#8a96b0', margin: '4px 0 0' }}>Une vidéo de 15 à 30 secondes montrant le produit en action suffit.</p>
              </div>

              {saving && (
                <div>
                  <div style={{ height: 6, borderRadius: 4, background: '#e5ecf8', overflow: 'hidden' }}>
                    <div style={{ width: `${progression}%`, height: '100%', background: '#1465BB', transition: 'width .2s' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#4a5578', margin: '4px 0 0' }}>Envoi en cours… {progression}%</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={fermer} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer', color: '#4a5578' }}>Annuler</button>
                <button onClick={enregistrer} disabled={saving}
                  style={{ padding: '9px 22px', borderRadius: 8, background: 'linear-gradient(90deg,#003785,#1465BB)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Envoi…' : 'Enregistrer'}
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
  h1:   { fontFamily: 'Playfair Display,serif', fontSize: 24, fontWeight: 700, color: '#0d1b3e', margin: 0 } as CSSProperties,
  sub:  { fontFamily: 'Cormorant Garamond,serif', fontSize: 16, color: '#4a5578', marginTop: 4 } as CSSProperties,
  card: { background: 'white', borderRadius: 14, border: '1px solid #dde5f4' } as CSSProperties,
  lbl:  { fontSize: 13, fontWeight: 600, color: '#4a5578', display: 'block', marginBottom: 5 } as CSSProperties,
  inp:  { width: '100%', padding: '9px 12px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' } as CSSProperties,
  tag:  { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 } as CSSProperties,
  btnMini: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1.5px solid #dde5f4', background: 'white', color: '#4a5578', cursor: 'pointer', fontSize: 11, fontWeight: 600 } as CSSProperties,
  vignette: { position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, padding: 0 } as CSSProperties,
  vignetteImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as CSSProperties,
  vignetteX: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(13,27,62,0.75)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 } as CSSProperties,
  overlay: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(13,27,62,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', padding: 12 } as CSSProperties,
};
