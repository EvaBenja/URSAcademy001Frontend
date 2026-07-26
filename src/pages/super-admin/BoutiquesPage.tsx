import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, X, Copy, RefreshCw, Link, Store, Check } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATALOGUE_BASE = window.location.origin + '/catalogue/';

export default function BoutiquesPage() {
  const [boutiques, setBoutiques] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [copied,    setCopied]    = useState<number|null>(null);
  const [form,      setForm]      = useState({ nom:'', pays:'Burkina Faso', ville:'Ouagadougou', telephone:'', email:'', adresse:'' });

  const load = async () => {
    setLoading(true);
    try { const r = await api.get('/boutiques'); setBoutiques(r.data || []); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const copyLink = (code: string, id: number) => {
    const link = CATALOGUE_BASE + code;
    // Méthode robuste compatible mobile
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(id);
        toast.success('Lien copié !');
        setTimeout(() => setCopied(null), 2000);
      }).catch(() => fallbackCopy(link, id));
    } else {
      fallbackCopy(link, id);
    }
  };

  const fallbackCopy = (text: string, id: number) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      setCopied(id);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Impossible de copier — sélectionnez le lien manuellement');
    }
    document.body.removeChild(el);
  };

  const regenerer = async (id: number) => {
    try {
      await api.post(`/boutiques/${id}/regenerer-code`);
      toast.success('Nouveau code généré');
      load();
    } catch { toast.error('Erreur'); }
  };

  const creer = async () => {
    if (!form.nom.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    try {
      await api.post('/boutiques', form);
      toast.success('Boutique créée ✓');
      setModal(false);
      setForm({ nom:'', pays:'Burkina Faso', ville:'Ouagadougou', telephone:'', email:'', adresse:'' });
      load();
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const toggleActif = async (b: any) => {
    try {
      await api.put(`/boutiques/${b.id}`, { actif: !b.actif });
      toast.success(b.actif ? 'Boutique désactivée' : 'Boutique activée');
      load();
    } catch { toast.error('Erreur'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Boutiques en ligne</h1>
          <p style={T.sub}>Partagez le lien catalogue avec vos clients</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
            <RefreshCw size={14} color="#4a5578"/>
          </button>
          <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <Plus size={14}/> Nouvelle boutique
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : boutiques.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'50px' }}>
          <Store size={48} color="#dde5f4" style={{ marginBottom:12 }}/>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, color:'#8a96b0', margin:0 }}>Aucune boutique</p>
          <button onClick={()=>setModal(true)} style={{ marginTop:16, padding:'10px 20px', borderRadius:8, background:'#1465BB', color:'white', border:'none', cursor:'pointer', fontWeight:600 }}>
            Créer ma première boutique
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {boutiques.map((b:any) => (
            <div key={b.id} style={{ ...T.card, opacity:b.actif?1:0.65 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:18 }}>
                    {b.nom[0]}
                  </div>
                  <div>
                    <p style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', margin:0 }}>{b.nom}</p>
                    <p style={{ fontSize:12, color:'#8a96b0', margin:'2px 0 0' }}>{[b.ville, b.pays].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:b.actif?'#dcfce7':'#f1f5f9', color:b.actif?'#166534':'#475569' }}>
                    {b.actif?'Active':'Inactive'}
                  </span>
                  <button onClick={()=>toggleActif(b)} style={{ fontSize:11, padding:'4px 10px', borderRadius:7, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>
                    {b.actif?'Désactiver':'Activer'}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { label:'Utilisateurs', val:b.users_count||0 },
                  { label:'Produits',     val:b.produits_count||0 },
                  { label:'Ventes',       val:b.ventes_count||0 },
                ].map(({label,val}) => (
                  <div key={label} style={{ background:'#f8faff', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                    <p style={{ fontSize:18, fontWeight:700, color:'#1465BB', margin:0 }}>{val}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Lien catalogue */}
              <div style={{ background:'#f0fdf4', borderRadius:10, padding:'12px 14px', border:'1px solid #86efac' }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'.5px', margin:'0 0 8px', display:'flex', alignItems:'center', gap:5 }}>
                  <Link size={11}/> Lien catalogue client
                </p>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <code style={{ fontSize:12, color:'#0d1b3e', background:'white', padding:'6px 10px', borderRadius:7, border:'1px solid #dde5f4', flex:1, wordBreak:'break-all', minWidth:0 }}>
                    {CATALOGUE_BASE}{b.code_invitation}
                  </code>
                  <button onClick={()=>copyLink(b.code_invitation, b.id)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:copied===b.id?'#0a9e6e':'#1465BB', color:'white', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0 }}>
                    {copied===b.id ? <><Check size={13}/> Copié</> : <><Copy size={13}/> Copier</>}
                  </button>
                  <button onClick={()=>regenerer(b.id)}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578', flexShrink:0 }}>
                    <RefreshCw size={13}/>
                  </button>
                </div>
                <p style={{ fontSize:11, color:'#166534', margin:'6px 0 0' }}>
                  Envoyez ce lien à vos clients — ils peuvent passer commande sans créer de compte.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création boutique */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:460, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', background:'linear-gradient(90deg,#003785,#1465BB)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'white', margin:0 }}>Nouvelle boutique</h3>
              <button onClick={()=>setModal(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={T.lbl}>Nom de la boutique *</label><input value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: URS Store Ouagadougou" style={T.inp}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={T.lbl}>Pays</label><input value={form.pays} onChange={e=>setForm(f=>({...f,pays:e.target.value}))} style={T.inp}/></div>
                <div><label style={T.lbl}>Ville</label><input value={form.ville} onChange={e=>setForm(f=>({...f,ville:e.target.value}))} style={T.inp}/></div>
              </div>
              <div><label style={T.lbl}>Téléphone</label><input value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="07 00 00 00" style={T.inp}/></div>
              <div><label style={T.lbl}>Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="contact@boutique.com" style={T.inp}/></div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button onClick={()=>setModal(false)} style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={creer} disabled={saving||!form.nom}
                  style={{ padding:'9px 20px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving||!form.nom?0.5:1 }}>
                  {saving?'Création…':'Créer la boutique'}
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
  h1:     { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:    { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:   { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.3rem' } as CSSProperties,
  lbl:    { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:4 } as CSSProperties,
  inp:    { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};
