import { useState, useEffect, type CSSProperties } from 'react';
import { Phone, MapPin, Package, RefreshCw, CheckCircle, RotateCcw, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { closingService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  disponible:        { label:'Disponible',         bg:'#dbeafe', color:'#1e40af' },
  prise:             { label:'En cours',           bg:'#fef9c3', color:'#854d0e' },
  a_relancer:        { label:'À relancer',          bg:'#fed7aa', color:'#9a3412' },
  rejetee:           { label:'Rejetée',             bg:'#fee2e2', color:'#991b1b' },
  envoyee_livraison: { label:'En livraison ✓',      bg:'#dcfce7', color:'#166534' },
  livree:            { label:'Livrée ✓',            bg:'#dcfce7', color:'#166534' },
};

export default function ClosingPage() {
  const [commandes, setCommandes]   = useState<any[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [saving,    setSaving]      = useState(false);
  const [filter,    setFilter]      = useState('tous');
  const [modal,     setModal]       = useState<any>(null);
  const [action,    setAction]      = useState<'confirmer'|'relancer'|'rejeter'|null>(null);
  const [motif,     setMotif]       = useState('');
  const [form,      setForm]        = useState({ client_nom:'', client_telephone:'', client_adresse:'', client_ville:'', zone_livraison:'' });
  const [expanded,  setExpanded]    = useState<number|null>(null);

  const load = async () => {
    setLoading(true);
    try { const r = await closingService.getAll(); setCommandes(r.data || []); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'tous' ? commandes : commandes.filter(c => c.statut === filter);

  const prendre = async (id: number) => {
    setSaving(true);
    try { await closingService.prendre(id); toast.success('Commande prise ✓'); load(); }
    catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const openModal = (c: any, a: 'confirmer'|'relancer'|'rejeter') => {
    setModal(c); setAction(a); setMotif('');
    setForm({ client_nom: c.client_nom||'', client_telephone: c.client_telephone||'', client_adresse: c.client_adresse||'', client_ville: c.client_ville||'', zone_livraison: c.client_ville||'' });
  };

  const traiter = async () => {
    if (!modal || !action) return;
    if ((action === 'relancer' || action === 'rejeter') && !motif.trim()) { toast.error('Motif requis'); return; }
    setSaving(true);
    try {
      await closingService.traiter(modal.id, { action, motif, ...form });
      toast.success(action === 'confirmer' ? '✅ Commande confirmée et envoyée en livraison !' : action === 'relancer' ? 'Mise en relance' : 'Commande rejetée');
      setModal(null); setAction(null);
      load();
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const nb = (s: string) => commandes.filter(c=>c.statut===s).length;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Closing Shopify</h1>
          <p style={T.sub}>Commandes à confirmer par téléphone</p>
        </div>
        <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Disponibles',  val:nb('disponible'),        color:'#1465BB' },
          { label:'En cours',     val:nb('prise'),              color:'#d0a83a' },
          { label:'À relancer',   val:nb('a_relancer'),         color:'#ea580c' },
        ].map(({label,val,color})=>(
          <div key={label} style={T.card}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[
          {s:'tous',label:'Toutes'},
          {s:'disponible',label:'Disponibles'},
          {s:'prise',label:'En cours'},
          {s:'a_relancer',label:'À relancer'},
          {s:'rejetee',label:'Rejetées'},
          {s:'envoyee_livraison',label:'En livraison'},
        ].map(({s,label})=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'40px' }}>
          <Package size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune commande</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map((c:any) => {
            const s = STATUT[c.statut] || { label:c.statut, bg:'#f1f5f9', color:'#475569' };
            const isOpen = expanded === c.id;
            const produits = Array.isArray(c.produits) ? c.produits : [];
            return (
              <div key={c.id} style={{ ...T.card, padding:0, overflow:'hidden' }}>
                {/* Header */}
                <div onClick={()=>setExpanded(isOpen?null:c.id)}
                  style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer', background:isOpen?'#f8faff':'white', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1465BB' }}>#{c.shopify_order_number || c.id}</span>
                      <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20 }}>{s.label}</span>
                    </div>
                    <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:'4px 0 2px' }}>{c.client_nom || '—'}</p>
                    {c.client_telephone && (
                      <a href={`tel:${c.client_telephone}`} onClick={e=>e.stopPropagation()}
                        style={{ fontSize:13, color:'#1465BB', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                        <Phone size={12}/> {c.client_telephone}
                      </a>
                    )}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#0a9e6e', margin:0 }}>
                      {Number(c.montant_total).toLocaleString('fr-FR')} {c.devise||'FCFA'}
                    </p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>{new Date(c.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                    {isOpen ? <ChevronUp size={14} color="#8a96b0" style={{marginTop:4}}/> : <ChevronDown size={14} color="#8a96b0" style={{marginTop:4}}/>}
                  </div>
                </div>

                {/* Détail accordéon */}
                {isOpen && (
                  <div style={{ borderTop:'1px solid #f0f4fb' }}>
                    {/* Adresse */}
                    {(c.client_adresse || c.client_ville) && (
                      <div style={{ padding:'10px 16px', background:'#f8faff', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}>
                        <MapPin size={13} color="#1465BB"/>
                        {[c.client_adresse, c.client_ville, c.client_pays].filter(Boolean).join(', ')}
                      </div>
                    )}

                    {/* Produits */}
                    {produits.length > 0 && (
                      <div style={{ padding:'10px 16px' }}>
                        <p style={{ fontSize:11, fontWeight:700, color:'#4a5578', textTransform:'uppercase', letterSpacing:'.5px', margin:'0 0 8px' }}>
                          <Package size={11} style={{ verticalAlign:'middle', marginRight:4 }}/>Produits
                        </p>
                        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                          {produits.map((p:any, i:number) => (
                            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'6px 10px', background:'#f4f7fd', borderRadius:8 }}>
                              <span style={{ color:'#0d1b3e', fontWeight:600 }}>{p.nom} {p.variante ? `(${p.variante})` : ''} ×{p.quantite}</span>
                              <span style={{ color:'#0a9e6e', fontWeight:700 }}>{Number(p.prix).toLocaleString('fr-FR')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Motif relance/rejet si présent */}
                    {(c.motif_relance || c.motif_rejet) && (
                      <div style={{ padding:'8px 16px', background:'#fff7ed', borderTop:'1px solid #fed7aa' }}>
                        <p style={{ fontSize:12, color:'#9a3412', margin:0 }}>
                          {c.motif_relance ? `🔄 Relance : ${c.motif_relance}` : `❌ Rejet : ${c.motif_rejet}`}
                        </p>
                      </div>
                    )}

                    {/* Vendeur assigné */}
                    {c.vendeur && (
                      <div style={{ padding:'8px 16px', background:'#f0f4ff', borderTop:'1px solid #dde5f4', fontSize:12, color:'#4a5578' }}>
                        👤 Prise par : <strong>{`${c.vendeur.prenom||c.vendeur.name||''} ${c.vendeur.nom||''}`.trim()}</strong>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ padding:'12px 16px', borderTop:'1px solid #f0f4fb', background:'#fafbff' }}>
                      {c.statut === 'disponible' && (
                        <button onClick={()=>prendre(c.id)} disabled={saving}
                          style={{ width:'100%', padding:'10px', borderRadius:9, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontWeight:700, fontSize:14, opacity:saving?0.6:1 }}>
                          📞 Prendre cette commande
                        </button>
                      )}
                      {(c.statut === 'prise' || c.statut === 'a_relancer') && (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          <button onClick={()=>openModal(c,'confirmer')} disabled={saving}
                            style={{ flex:1, padding:'9px', borderRadius:8, background:'#dcfce7', color:'#166534', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <CheckCircle size={14}/> Confirmer
                          </button>
                          <button onClick={()=>openModal(c,'relancer')} disabled={saving}
                            style={{ flex:1, padding:'9px', borderRadius:8, background:'#fef9c3', color:'#854d0e', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <RotateCcw size={14}/> Relancer
                          </button>
                          <button onClick={()=>openModal(c,'rejeter')} disabled={saving}
                            style={{ flex:1, padding:'9px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <XCircle size={14}/> Rejeter
                          </button>
                        </div>
                      )}
                      {c.statut === 'envoyee_livraison' && (
                        <p style={{ textAlign:'center', fontSize:13, color:'#166534', fontWeight:600, margin:0 }}>✅ Envoyée en livraison — Vente #{c.vente_id}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal action */}
      {modal && action && (
        <div onClick={()=>setModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:460, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
              background: action==='confirmer'?'linear-gradient(90deg,#0a9e6e,#065f46)':action==='relancer'?'linear-gradient(90deg,#d97706,#b45309)':'linear-gradient(90deg,#991b1b,#7f1d1d)' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'white', margin:0 }}>
                {action==='confirmer'?'✅ Confirmer la commande':action==='relancer'?'🔄 Mettre en relance':'❌ Rejeter la commande'}
              </h3>
              <button onClick={()=>setModal(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
            </div>

            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              {action === 'confirmer' && (
                <>
                  <p style={{ fontSize:13, color:'#4a5578', margin:0 }}>Vérifiez et corrigez les infos client si nécessaire :</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label style={T2.lbl}>Nom client</label><input value={form.client_nom} onChange={e=>setForm(f=>({...f,client_nom:e.target.value}))} style={T2.inp}/></div>
                    <div><label style={T2.lbl}>Téléphone</label><input value={form.client_telephone} onChange={e=>setForm(f=>({...f,client_telephone:e.target.value}))} style={T2.inp}/></div>
                  </div>
                  <div><label style={T2.lbl}>Adresse</label><input value={form.client_adresse} onChange={e=>setForm(f=>({...f,client_adresse:e.target.value}))} style={T2.inp}/></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    <div><label style={T2.lbl}>Ville</label><input value={form.client_ville} onChange={e=>setForm(f=>({...f,client_ville:e.target.value}))} style={T2.inp}/></div>
                    <div><label style={T2.lbl}>Zone livraison</label><input value={form.zone_livraison} onChange={e=>setForm(f=>({...f,zone_livraison:e.target.value}))} style={T2.inp}/></div>
                  </div>
                </>
              )}
              {(action === 'relancer' || action === 'rejeter') && (
                <div>
                  <label style={T2.lbl}>Motif *</label>
                  <textarea value={motif} onChange={e=>setMotif(e.target.value)} rows={3}
                    placeholder={action==='relancer'?'Ex: Pas de réponse, rappeler demain matin…':'Ex: Numéro incorrect, client annulé…'}
                    style={{ ...T2.inp, resize:'none' as const }}/>
                </div>
              )}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(null)} style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={traiter} disabled={saving}
                  style={{ padding:'9px 20px', borderRadius:8, color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving?0.6:1,
                    background: action==='confirmer'?'#0a9e6e':action==='relancer'?'#d97706':'#e53e3e' }}>
                  {saving?'…':action==='confirmer'?'Confirmer et envoyer':action==='relancer'?'Mettre en relance':'Rejeter'}
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
  card:   { background:'white', borderRadius:14, border:'1px solid #dde5f4' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.5)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};
const T2 = {
  lbl: { fontSize:12, fontWeight:600, color:'#4a5578', display:'block', marginBottom:4 } as CSSProperties,
  inp: { width:'100%', padding:'8px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
};
