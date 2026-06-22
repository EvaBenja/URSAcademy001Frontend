import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, X, Trash2, ShoppingCart, User, Phone, MapPin } from 'lucide-react';
import { ventesService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ZoneSelect from '../../components/ui/ZoneSelect';
import { QUARTIERS_OUAGA } from '../../data/quartiersOuaga';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af'},
  annulee:    {label:'Refusée',    bg:'#f1f5f9', color:'#475569'},
};
const ZONES = QUARTIERS_OUAGA;

interface CartItem { produit_id:number; nom:string; prix_unitaire:number; prix_gros:number|null; prix_vendeur:number; quantite:number; remise:number; }

export default function VendeurVentesPage() {
  const { user } = useAuth();
  const [ventes,     setVentes]     = useState<any[]>([]);
  const [produits,   setProduits]   = useState<any[]>([]);
  const [classement, setClassement] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [panier,     setPanier]     = useState<CartItem[]>([]);
  const [zone,       setZone]       = useState(ZONES[0]);
  const [dateVente,  setDateVente]  = useState(new Date().toISOString().split('T')[0]);
  const [notes,      setNotes]      = useState('');
  const [clientNom,      setClientNom]      = useState('');
  const [clientTel,      setClientTel]      = useState('');
  const [clientQuartier, setClientQuartier] = useState('');
  const [vendeurPos, setVendeurPos] = useState<{lat:number;lng:number}|null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [vr, pr, cr] = await Promise.allSettled([
      ventesService.getAll(),
      api.get('/produits-liste'),
      ventesService.classement(),
    ]);
    if (vr.status === 'fulfilled') setVentes(vr.value.data || []);
    if (pr.status === 'fulfilled') setProduits(pr.value.data || []);
    if (cr.status === 'fulfilled') setClassement(cr.value.data || []);
    setLoading(false);
  };

  const addToCart = (produitId: string) => {
    const p = produits.find((x:any) => String(x.id) === produitId);
    if (!p) return;
    setPanier(prev => {
      const existing = prev.find(i => i.produit_id === p.id);
      if (existing) return prev.map(i => i.produit_id === p.id ? {...i, quantite: i.quantite+1} : i);
      return [...prev, { produit_id:p.id, nom:p.nom, prix_unitaire:p.prix_unitaire, prix_gros:p.prix_gros||null, prix_vendeur:p.prix_unitaire, quantite:1, remise:0 }];
    });
  };

  const updateItem = (id: number, field: keyof CartItem, val: number) =>
    setPanier(prev => prev.map(i => i.produit_id === id ? {...i, [field]: val} : i));

  const removeItem = (id: number) => setPanier(prev => prev.filter(i => i.produit_id !== id));

  const totalPanier = panier.reduce((s,i) => s + ((i.prix_vendeur * i.quantite) - i.remise), 0);

  const openModal = () => {
    setPanier([]); setZone(ZONES[0]); setNotes('');
    setClientNom(''); setClientTel(''); setClientQuartier('');
    setVendeurPos(null);
    setModal(true);
  };

  const handleSubmit = async () => {
    if (panier.length === 0) { toast.error('Ajoutez au moins un produit'); return; }
    for (const item of panier) {
      if (item.prix_vendeur < item.prix_unitaire) {
        toast.error(`Prix min pour "${item.nom}" : ${item.prix_unitaire.toLocaleString('fr-FR')} FCFA`);
        return;
      }
    }
    setSaving(true);
    try {
      await ventesService.create({
        items: panier.map(i => ({ produit_id:i.produit_id, quantite:i.quantite, prix_vendeur:i.prix_vendeur, remise:i.remise })),
        date_vente:        dateVente,
        zone_livraison:    zone,
        notes,
        client_nom:        clientNom,
        client_telephone:  clientTel,
        client_quartier:   clientQuartier,
        vendeur_latitude:  vendeurPos?.lat ?? null,
        vendeur_longitude: vendeurPos?.lng ?? null,
      });
      toast.success('Vente soumise — course créée pour les livreurs 🚚');
      setModal(false); setPanier([]); setNotes('');
      setClientNom(''); setClientTel(''); setClientQuartier(''); setVendeurPos(null);
      load();
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const mesVentes  = ventes.filter(v => Number(v.caissiere_id) === Number(user?.id));
  const monRang    = classement.findIndex(c => Number(c.caissiere_id) === Number(user?.id));

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Ventes</h1>
          <p style={T.sub}>{produits.length} produit{produits.length>1?'s':''} disponible{produits.length>1?'s':''}</p>
        </div>
        <button onClick={openModal} style={T.btnPrimary}><ShoppingCart size={15}/> Nouvelle vente</button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total ventes', val:mesVentes.length,                                    color:'#1465BB'},
          {label:'En attente',   val:mesVentes.filter(v=>v.statut==='en_attente').length,  color:'#d0a83a'},
          {label:'Validées',     val:mesVentes.filter(v=>v.statut==='validee').length,     color:'#0a9e6e'},
          {label:'Mon rang',     val:monRang >= 0 ? `#${monRang+1}` : '—',                color:'#7c3aed'},
        ].map(({label,val,color}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Classement TOUS les vendeurs */}
      {classement.length > 0 && (
        <div style={{ ...T.card, marginBottom:20 }}>
          <h2 style={{ ...T.cardTitle, marginBottom:14 }}>🏆 Classement — tous les vendeurs</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {classement.map((c:any, i:number) => {
              const isMe = Number(c.caissiere_id) === Number(user?.id);
              const medals: Record<number,string> = {0:'🥇',1:'🥈',2:'🥉'};
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 14px', borderRadius:10,
                  background:isMe?'linear-gradient(90deg,#e0f0ff,#f0f4fb)':'#f8faff',
                  border:isMe?'1.5px solid #1465BB':'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:i<3?18:13, fontWeight:700, width:32, textAlign:'center', flexShrink:0, color:i<3?'inherit':'#8a96b0' }}>
                    {medals[i]||`#${i+1}`}
                  </span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:isMe?700:500, color:'#0d1b3e', margin:0 }}>
                      {c.vendeur} {isMe && <span style={{ fontSize:11, color:'#1465BB' }}>(vous)</span>}
                    </p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>{c.nombre_ventes} vente{c.nombre_ventes>1?'s':''}</p>
                  </div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:14, fontWeight:700, color:isMe?'#1465BB':'#4a5578' }}>
                    {Number(c.total).toLocaleString('fr-FR')} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique */}
      <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb' }}>
          <h2 style={T.cardTitle}>Historique ({mesVentes.length})</h2>
        </div>
        <div className="urs-table-desktop" style={{ overflowX:'auto' }}>
          <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>{['#','Produit(s)','Client','Total FCFA','Zone','Statut','Livraison','Date'].map(h=>(
                <th key={h} style={T.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {mesVentes.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
                  Cliquez sur "Nouvelle vente" pour commencer
                </td></tr>
              ) : mesVentes.map((v:any) => {
                const sc = STATUT[v.statut]||{label:v.statut,bg:'#f1f5f9',color:'#475569'};
                return (
                  <tr key={v.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{v.id}</td>
                    <td style={T.td}>
                      {v.items?.length > 0
                        ? <div style={{ display:'flex', flexDirection:'column', gap:2 }}>{v.items.map((it:any)=><span key={it.id} style={{fontSize:12}}>{it.produit?.nom} ×{it.quantite}</span>)}</div>
                        : <span>{v.produit?.nom||'—'} ×{v.quantite}</span>}
                    </td>
                    <td style={T.td}>
                      {v.client_nom ? (
                        <div>
                          <p style={{ fontSize:13, fontWeight:500, color:'#0d1b3e', margin:0 }}>{v.client_nom}</p>
                          {v.client_telephone && <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>{v.client_telephone}</p>}
                          {v.client_quartier && <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>{v.client_quartier}</p>}
                        </div>
                      ) : <span style={{ color:'#8a96b0', fontSize:12 }}>—</span>}
                    </td>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{Number(v.montant_total).toLocaleString('fr-FR')}</td>
                    <td style={T.td}>{v.zone_livraison||'—'}</td>
                    <td style={T.td}>
                      <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span>
                      {v.statut === 'annulee' && v.motif_annulation && (
                        <p style={{ fontSize:11, color:'#e53e3e', margin:'4px 0 0', fontStyle:'italic', maxWidth:160 }}>
                          Motif : {v.motif_annulation}
                        </p>
                      )}
                    </td>
                    <td style={T.td}>
                      {v.livraison ? (
                        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10,
                          background:v.livraison.statut==='terminee'?'#dcfce7':v.livraison.statut==='en_cours'?'#dbeafe':'#fef9c3',
                          color:v.livraison.statut==='terminee'?'#166534':v.livraison.statut==='en_cours'?'#1e40af':'#854d0e', whiteSpace:'nowrap' }}>
                          🚚 {v.livraison.livreur ? `${v.livraison.livreur.prenom||v.livraison.livreur.name||''}` : 'En attente'}
                        </span>
                      ) : <span style={{ color:'#8a96b0', fontSize:11 }}>—</span>}
                    </td>
                    <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{v.date_vente}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cartes mobile */}
        <div className="urs-cards-mobile">
          {mesVentes.length === 0 ? (
            <p style={{ padding:'40px 18px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>
              Cliquez sur "Nouvelle vente" pour commencer
            </p>
          ) : mesVentes.map((v:any) => {
            const sc = STATUT[v.statut]||{label:v.statut,bg:'#f1f5f9',color:'#475569'};
            return (
              <div key={v.id} style={{ padding:'14px 16px', borderBottom:'1px solid #f0f4fb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                  <span style={{ fontWeight:700, color:'#1465BB', fontSize:14 }}>#{v.id}</span>
                  <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                    <span style={{ color:'#8a96b0', flexShrink:0 }}>Produit(s)</span>
                    <div style={{ textAlign:'right' }}>
                      {v.items?.length > 0
                        ? v.items.map((it:any)=><div key={it.id} style={{fontSize:12, color:'#4a5578'}}>{it.produit?.nom} ×{it.quantite}</div>)
                        : <span style={{ color:'#4a5578' }}>{v.produit?.nom||'—'} ×{v.quantite}</span>}
                    </div>
                  </div>
                  {v.client_nom && (
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
                      <span style={{ color:'#8a96b0' }}>Client</span>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:13, fontWeight:500, color:'#0d1b3e', margin:0 }}>{v.client_nom}</p>
                        {v.client_telephone && <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>{v.client_telephone}</p>}
                      </div>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#8a96b0' }}>Total</span>
                    <span style={{ fontWeight:700, color:'#1465BB' }}>{Number(v.montant_total).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#8a96b0' }}>Zone</span>
                    <span style={{ color:'#4a5578' }}>{v.zone_livraison||'—'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#8a96b0' }}>Date</span>
                    <span style={{ color:'#4a5578' }}>{v.date_vente}</span>
                  </div>
                  {v.livraison && (
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ color:'#8a96b0' }}>Livraison</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10,
                        background:v.livraison.statut==='terminee'?'#dcfce7':v.livraison.statut==='livree_attente_validation'?'#ede9fe':v.livraison.statut==='en_cours'?'#dbeafe':'#fef9c3',
                        color:v.livraison.statut==='terminee'?'#166534':v.livraison.statut==='livree_attente_validation'?'#5b21b6':v.livraison.statut==='en_cours'?'#1e40af':'#854d0e' }}>
                        🚚 {v.livraison.livreur ? `${v.livraison.livreur.prenom||v.livraison.livreur.name||''} ${v.livraison.livreur.nom||''}`.trim() : 'En attente d\'un livreur'}
                      </span>
                    </div>
                  )}
                  {v.statut === 'annulee' && v.motif_annulation && (
                    <p style={{ fontSize:11, color:'#e53e3e', margin:0, fontStyle:'italic' }}>Motif : {v.motif_annulation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal panier + infos client */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}><ShoppingCart size={16}/>&nbsp; Nouvelle vente</h3>
              <button onClick={()=>setModal(false)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>

              {/* Infos client */}
              <div style={{ background:'#f4f7fd', borderRadius:10, padding:'14px', border:'1px solid #dde5f4' }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'.5px' }}>
                  <User size={12} style={{marginRight:5, verticalAlign:'middle'}}/> Infos client (optionnel)
                </p>
                <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div>
                    <label style={T.lbl}>Nom client</label>
                    <input value={clientNom} onChange={e=>setClientNom(e.target.value)} placeholder="Ex: Kofi Mensah" style={T.inp}/>
                  </div>
                  <div>
                    <label style={T.lbl}>Téléphone</label>
                    <input value={clientTel} onChange={e=>setClientTel(e.target.value)} placeholder="90 00 00 00" style={T.inp}/>
                  </div>
                  <div style={{ gridColumn:'1/-1' }}>
                    <label style={T.lbl}>Quartier / Adresse</label>
                    <input value={clientQuartier} onChange={e=>setClientQuartier(e.target.value)} placeholder="Ex: Zogona, secteur 15" style={T.inp}/>
                  </div>
                </div>
              </div>

              {/* Sélection produit */}
              <div>
                <label style={T.lbl}>Ajouter un produit
                  <span style={{ fontWeight:400, color:'#8a96b0', marginLeft:6, fontSize:11 }}>
                    ({produits.filter((p:any)=>p.quantite_stock>0).length} en stock)
                  </span>
                </label>
                <select onChange={e=>{ if(e.target.value){ addToCart(e.target.value); e.target.value=''; }}} style={T.inp} value="">
                  <option value="" disabled>— Sélectionner un produit —</option>
                  {produits.map((p:any) => (
                    <option key={p.id} value={String(p.id)} disabled={p.quantite_stock===0}>
                      {p.nom} {p.unite?`(${p.unite})`:''} — {Number(p.prix_unitaire).toLocaleString('fr-FR')} FCFA
                      {p.quantite_stock===0?' — RUPTURE':` — stock: ${p.quantite_stock}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Panier */}
              {panier.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <label style={T.lbl}>Panier — {panier.length} produit{panier.length>1?'s':''}</label>
                  {panier.map(item => (
                    <div key={item.produit_id} style={{ background:'#f8faff', borderRadius:10, padding:'12px 14px', border:'1px solid #dde5f4' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:8 }}>
                        <div style={{ minWidth:0, flex:1 }}>
                          <span style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', wordBreak:'break-word' }}>{item.nom}</span>
                          <div style={{ display:'flex', gap:10, marginTop:2, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, color:'#8a96b0' }}>Plancher: {item.prix_unitaire.toLocaleString('fr-FR')} FCFA</span>
                            {item.prix_gros && (
                              <span style={{ fontSize:11, color:'#7c3aed', fontWeight:600 }}>
                                Prix gros: {Number(item.prix_gros).toLocaleString('fr-FR')} FCFA
                              </span>
                            )}
                          </div>
                        </div>
                        <button onClick={()=>removeItem(item.produit_id)}
                          style={{ background:'#fee2e2', border:'none', borderRadius:6, width:24, height:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Trash2 size={11} color="#e53e3e"/>
                        </button>
                      </div>
                      <div className="cart-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                        <div>
                          <label style={{ ...T.lbl, fontSize:10 }}>Quantité</label>
                          <input type="number" min={1} value={item.quantite}
                            onChange={e=>updateItem(item.produit_id,'quantite',Math.max(1,+e.target.value))}
                            style={{ ...T.inp, padding:'6px 8px', fontSize:13 }}/>
                        </div>
                        <div>
                          <label style={{ ...T.lbl, fontSize:10 }}>Prix vente (FCFA)</label>
                          <input type="number" min={0} value={item.prix_vendeur}
                            onChange={e=>updateItem(item.produit_id,'prix_vendeur',+e.target.value)}
                            style={{ ...T.inp, padding:'6px 8px', fontSize:13, borderColor:item.prix_vendeur<item.prix_unitaire?'#e53e3e':'#dde5f4' }}/>
                          {item.prix_vendeur < item.prix_unitaire && (
                            <p style={{ fontSize:10, color:'#e53e3e', margin:'2px 0 0' }}>Min: {item.prix_unitaire.toLocaleString('fr-FR')}</p>
                          )}
                        </div>
                        <div>
                          <label style={{ ...T.lbl, fontSize:10 }}>Remise (FCFA)</label>
                          <input type="number" min={0} value={item.remise}
                            onChange={e=>updateItem(item.produit_id,'remise',+e.target.value)}
                            style={{ ...T.inp, padding:'6px 8px', fontSize:13 }}/>
                        </div>
                      </div>
                      <div style={{ textAlign:'right', fontSize:12, color:'#1465BB', fontWeight:700, marginTop:6 }}>
                        Sous-total : {((item.prix_vendeur*item.quantite)-item.remise).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  ))}
                  <div style={{ background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:14, color:'rgba(255,255,255,0.8)' }}>Total panier</span>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:'#d0a83a' }}>{totalPanier.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              )}

              {/* Zone & Date */}
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={T.lbl}>Zone de livraison</label>
                  <ZoneSelect value={zone} onChange={setZone} style={T.inp}/>
                </div>
                <div>
                  <label style={T.lbl}>Date de vente</label>
                  <input type="date" value={dateVente} onChange={e=>setDateVente(e.target.value)} style={T.inp}/>
                </div>
              </div>

              <div>
                <label style={T.lbl}>Notes (optionnel)</label>
                <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Ex: Livraison urgente…" style={T.inp}/>
              </div>

              {/* Position vendeur — optionnel, aide le livreur à trouver le point de récupération */}
              <div style={{ background:'#f0f4ff', borderRadius:10, padding:'12px 14px', border:'1px solid #dde5f4' }}>
                <p style={{ fontSize:12, fontWeight:600, color:'#4a5578', margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'.5px' }}>
                  📍 Position du point de vente (optionnel)
                </p>
                {vendeurPos ? (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <span style={{ fontSize:12, color:'#0a9e6e', fontWeight:600 }}>
                      ✓ Position partagée ({vendeurPos.lat.toFixed(4)}, {vendeurPos.lng.toFixed(4)})
                    </span>
                    <button type="button" onClick={()=>setVendeurPos(null)}
                      style={{ fontSize:11, color:'#e53e3e', background:'#fee2e2', border:'none', borderRadius:6, padding:'3px 10px', cursor:'pointer' }}>
                      Retirer
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={()=>{
                    if (!navigator.geolocation) { return; }
                    navigator.geolocation.getCurrentPosition(
                      pos => setVendeurPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                      () => {}
                    );
                  }} style={{ fontSize:12, color:'#1465BB', background:'white', border:'1.5px solid #1465BB', borderRadius:8, padding:'6px 14px', cursor:'pointer' }}>
                    Partager ma position actuelle
                  </button>
                )}
                <p style={{ fontSize:11, color:'#8a96b0', margin:'6px 0 0' }}>
                  Le livreur pourra voir où venir récupérer la commande.
                </p>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={T.btnCancel}>Annuler</button>
                <button onClick={handleSubmit} disabled={saving||panier.length===0}
                  style={{ ...T.btnPrimary, opacity:saving||panier.length===0?0.5:1 }}>
                  {saving ? 'Envoi…' : `Soumettre (${panier.length} produit${panier.length>1?'s':''})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media(max-width:768px){
          .stats-4{grid-template-columns:repeat(2,1fr)!important;}
          .cart-grid{grid-template-columns:1fr 1fr!important;}
        }
        @media(max-width:480px){
          .stats-4{grid-template-columns:1fr 1fr!important; gap:10px!important;}
          .cart-grid{grid-template-columns:1fr!important; gap:10px!important;}
        }
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  statCard:{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  btnCancel:{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0, display:'flex', alignItems:'center' } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
