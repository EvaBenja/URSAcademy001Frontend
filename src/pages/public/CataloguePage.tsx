import { useState, useEffect, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, X, MapPin, Phone, Send, Package } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

export default function CataloguePage() {
  const { code } = useParams<{ code: string }>();
  const [boutique,  setBoutique]  = useState<any>(null);
  const [produits,  setProduits]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [panier,    setPanier]    = useState<Record<number,number>>({});
  const [modal,     setModal]     = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [success,   setSuccess]   = useState(false);
  const [form,      setForm]      = useState({ client_nom:'', client_telephone:'', client_quartier:'', lien_localisation:'', note_urgence:'' });

  useEffect(() => {
    fetch(`${API}/catalogue/${code}`)
      .then(r => r.json())
      .then(d => {
        if (d.message) { setError(d.message); }
        else { setBoutique(d.boutique); setProduits(d.produits || []); }
      })
      .catch(() => setError('Impossible de charger le catalogue'))
      .finally(() => setLoading(false));
  }, [code]);

  const qty = (id: number) => panier[id] || 0;
  const add = (id: number) => setPanier(p => ({ ...p, [id]: (p[id]||0)+1 }));
  const rem = (id: number) => setPanier(p => { const n = {...p}; if (n[id]>1) n[id]--; else delete n[id]; return n; });
  const total = produits.filter(p=>panier[p.id]).reduce((s,p)=>s+(p.prix_unitaire*panier[p.id]),0);
  const nbItems = Object.values(panier).reduce((s,v)=>s+v,0);

  const submit = async () => {
    if (!form.client_nom.trim() || !form.client_telephone.trim()) return;
    const items = Object.entries(panier).map(([id,q])=>({ produit_id:Number(id), quantite:q }));
    if (!items.length) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/catalogue/${code}/commande`, {
        method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify({ ...form, items })
      });
      const d = await r.json();
      if (r.ok) { setSuccess(true); setPanier({}); setModal(false); }
      else alert(d.message || 'Erreur');
    } catch { alert('Erreur réseau'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f7fd' }}>
      <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:22, color:'#8a96b0' }}>Chargement du catalogue…</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f4f7fd', padding:24 }}>
      <Package size={48} color="#dde5f4" style={{ marginBottom:16 }}/>
      <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, color:'#0d1b3e', margin:0 }}>Catalogue introuvable</p>
      <p style={{ color:'#8a96b0', marginTop:8 }}>{error}</p>
    </div>
  );

  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f4f7fd', padding:24, textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
      <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:28, color:'#0d1b3e', margin:0 }}>Commande envoyée !</h2>
      <p style={{ color:'#4a5578', marginTop:12, maxWidth:340 }}>Votre commande a été enregistrée. Un livreur vous contactera bientôt au numéro indiqué.</p>
      <button onClick={()=>setSuccess(false)} style={{ marginTop:20, padding:'12px 24px', borderRadius:10, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:15, fontWeight:600 }}>
        Continuer les achats
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7fd' }}>
      {/* Header boutique */}
      <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', padding:'24px 20px', textAlign:'center' }}>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:26, color:'white', margin:0 }}>{boutique.nom}</h1>
        {(boutique.ville||boutique.pays) && (
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:13, margin:'6px 0 0', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <MapPin size={13}/>{[boutique.ville, boutique.pays].filter(Boolean).join(', ')}
          </p>
        )}
        {boutique.telephone && (
          <a href={`tel:${boutique.telephone}`} style={{ color:'#d0a83a', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:4 }}>
            <Phone size={12}/>{boutique.telephone}
          </a>
        )}
      </div>

      {/* Produits */}
      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 16px 100px' }}>
        <p style={{ fontSize:13, color:'#8a96b0', marginBottom:16 }}>{produits.length} produit{produits.length>1?'s':''} disponible{produits.length>1?'s':''}</p>

        {produits.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <Package size={48} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:20, color:'#8a96b0' }}>Aucun produit disponible</p>
          </div>
        ) : produits.map((p:any) => (
          <div key={p.id} style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'16px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:0 }}>{p.nom}</p>
              {p.unite && <p style={{ fontSize:12, color:'#8a96b0', margin:'2px 0 0' }}>/ {p.unite}</p>}
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#0a9e6e', margin:'6px 0 0' }}>
                {Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {qty(p.id) > 0 ? (
                <>
                  <button onClick={()=>rem(p.id)} style={T.qtyBtn}><Minus size={14}/></button>
                  <span style={{ fontSize:16, fontWeight:700, color:'#0d1b3e', minWidth:24, textAlign:'center' }}>{qty(p.id)}</span>
                  <button onClick={()=>add(p.id)} style={{ ...T.qtyBtn, background:'#1465BB', color:'white' }}><Plus size={14}/></button>
                </>
              ) : (
                <button onClick={()=>add(p.id)} style={{ padding:'8px 16px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                  <Plus size={13}/> Ajouter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton panier flottant */}
      {nbItems > 0 && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:50, width:'calc(100% - 32px)', maxWidth:568 }}>
          <button onClick={()=>setModal(true)} style={{ width:'100%', padding:'14px 20px', borderRadius:12, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 8px 24px rgba(0,55,133,0.35)' }}>
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'2px 10px', fontSize:14 }}>{nbItems} article{nbItems>1?'s':''}</span>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}><ShoppingCart size={18}/> Commander</span>
            <span style={{ fontFamily:'Playfair Display,serif', color:'#d0a83a' }}>{total.toLocaleString('fr-FR')} FCFA</span>
          </button>
        </div>
      )}

      {/* Modal commande */}
      {modal && (
        <div style={{ position:'fixed', inset:0, zIndex:100, background:'rgba(13,27,62,0.5)', display:'flex', alignItems:'flex-end', backdropFilter:'blur(3px)' }}>
          <div style={{ background:'white', borderRadius:'20px 20px 0 0', width:'100%', maxHeight:'90vh', overflowY:'auto', padding:'24px 20px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:20, color:'#0d1b3e', margin:0 }}>Votre commande</h3>
              <button onClick={()=>setModal(false)} style={{ background:'#f4f7fd', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
            </div>

            {/* Récap panier */}
            {produits.filter(p=>panier[p.id]).map(p=>(
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb', fontSize:14 }}>
                <span style={{ color:'#0d1b3e' }}>{p.nom} ×{panier[p.id]}</span>
                <span style={{ fontWeight:600, color:'#0a9e6e' }}>{(p.prix_unitaire*panier[p.id]).toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontSize:16, fontWeight:700 }}>
              <span>Total</span>
              <span style={{ color:'#0a9e6e' }}>{total.toLocaleString('fr-FR')} FCFA</span>
            </div>

            <div style={{ height:1, background:'#f0f4fb', margin:'8px 0 16px' }}/>

            {/* Formulaire client */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={T.lbl}>Votre nom *</label>
                <input value={form.client_nom} onChange={e=>setForm(f=>({...f,client_nom:e.target.value}))} placeholder="Prénom et nom" style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>Téléphone *</label>
                <input value={form.client_telephone} onChange={e=>setForm(f=>({...f,client_telephone:e.target.value}))} placeholder="Ex: 07 00 00 00" style={T.inp} type="tel"/>
              </div>
              <div>
                <label style={T.lbl}>Quartier / Secteur</label>
                <input value={form.client_quartier} onChange={e=>setForm(f=>({...f,client_quartier:e.target.value}))} placeholder="Ex: Secteur 15, Pissy…" style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>📍 Lien de localisation</label>
                <input value={form.lien_localisation} onChange={e=>setForm(f=>({...f,lien_localisation:e.target.value}))} placeholder="Collez votre lien Google Maps…" style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>Note (optionnel)</label>
                <input value={form.note_urgence} onChange={e=>setForm(f=>({...f,note_urgence:e.target.value}))} placeholder="Instructions particulières…" style={T.inp}/>
              </div>
            </div>

            <button onClick={submit} disabled={submitting||!form.client_nom||!form.client_telephone}
              style={{ width:'100%', marginTop:20, padding:'14px', borderRadius:12, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:submitting||!form.client_nom||!form.client_telephone?0.5:1 }}>
              <Send size={16}/>{submitting?'Envoi…':'Envoyer la commande'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  qtyBtn: { width:32, height:32, borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#4a5578' } as CSSProperties,
  lbl: { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:4 } as CSSProperties,
  inp: { width:'100%', padding:'10px 12px', border:'1.5px solid #dde5f4', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
};
