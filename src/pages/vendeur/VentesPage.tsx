import { useState, type CSSProperties } from 'react';
import { Award, Plus, X, Trophy, Clock, CheckCircle, Truck, XCircle, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { useStore, soumettreVente, type StatutVente } from '../../store/ventesStore';
import { useAuth } from '../../context/AuthContext';

const STATUT_CONFIG: Record<StatutVente, { label:string; bg:string; color:string }> = {
  en_attente:      { label:'En attente',     bg:'#fef9c3', color:'#854d0e' },
  validee:         { label:'Validée',        bg:'#dbeafe', color:'#1e40af' },
  notif_livreur:   { label:'Notif. livreur', bg:'#e0f0ff', color:'#1465BB' },
  rejetee_livreur: { label:'Rejet livreur',  bg:'#fee2e2', color:'#991b1b' },
  en_livraison:    { label:'En livraison',   bg:'#fdf3d7', color:'#854d0e' },
  livree:          { label:'Livrée ✓',       bg:'#dcfce7', color:'#166534' },
  non_livree:      { label:'Non livrée',     bg:'#fee2e2', color:'#991b1b' },
  refusee:         { label:'Refusée',        bg:'#f1f5f9', color:'#475569' },
};

const ZONES = ['Adidogomé','Agoe','Baguida','Lomé centre','Hédzranawoe','Avedji'];

export default function VendeurVentesPage() {
  const { user } = useAuth();
  const { ventes, produits, classementVendeurs, mesVentes } = useStore();

  const vendeurId  = user?.id ? String(user.id) : 'vendeur';
  const vendeurNom = user ? `${user.prenom} ${user.nom}` : 'Vendeur';

  const mesV       = mesVentes(vendeurId);
  const classement = classementVendeurs();
  const monRang    = classement.findIndex(c => c.vendeurId === vendeurId) + 1;
  const monScore   = classement.find(c => c.vendeurId === vendeurId);

  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({
    produitRef:'', qte:1, prixVente:0, remise:0, zone: ZONES[0], note:'',
  });
  const [errPrix, setErrPrix] = useState('');

  const produitSelectionne = produits.find(p => p.ref === form.produitRef);

  const handleChangeProduit = (ref: string) => {
    const p = produits.find(x => x.ref === ref);
    setForm(f => ({ ...f, produitRef:ref, prixVente: p ? p.prixRef : 0 }));
    setErrPrix('');
  };

  const prixFinal    = Math.max(0, form.prixVente - form.remise);
  const montantTotal = prixFinal * form.qte;
  const marge        = produitSelectionne ? prixFinal - produitSelectionne.prixRef : 0;

  const handleSubmit = () => {
    if (!form.produitRef) return;
    if (!produitSelectionne) return;
    if (form.prixVente < produitSelectionne.prixRef) {
      setErrPrix(`Prix minimum : ${produitSelectionne.prixRef.toLocaleString()} FCFA`);
      return;
    }
    soumettreVente({
      vendeurId, vendeurNom,
      produitRef:  produitSelectionne.ref,
      produitNom:  produitSelectionne.nom,
      qte:         form.qte,
      prixRef:     produitSelectionne.prixRef,
      prixVente:   form.prixVente,
      remise:      form.remise,
      zone:        form.zone,
      note:        form.note,
    });
    setModal(false);
    setForm({ produitRef:'', qte:1, prixVente:0, remise:0, zone:ZONES[0], note:'' });
    setErrPrix('');
  };

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Mes Ventes</h1>
          <p style={T.sub}>Gérez vos ventes et suivez vos performances du jour</p>
        </div>
        <button onClick={()=>setModal(true)} style={T.btnPrimary}>
          <Plus size={15}/> Nouvelle vente
        </button>
      </div>

      {/* Stats personnelles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'CA aujourd\'hui',   val: monScore ? monScore.total.toLocaleString()+' FCFA' : '0 FCFA', color:'#1465BB', bg:'#e0f0ff' },
          { label:'Ventes du jour',    val: monScore?.nb || 0,                                              color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Ventes livrées',    val: monScore?.livrees || 0,                                         color:'#d0a83a', bg:'#fdf3d7' },
          { label:'Total ventes',      val: mesV.length,                                                    color:'#7c3aed', bg:'#ede9fe' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', marginTop:5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Classement du jour */}
      <div style={{ ...T.card, marginBottom:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <Trophy size={18} color="#d0a83a"/>
          <h2 style={T.cardTitle}>Classement vendeurs — Aujourd'hui</h2>
          {monRang > 0 && (
            <span style={{ marginLeft:'auto', background:'#e0f0ff', color:'#1465BB', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>
              Votre rang : #{monRang}
            </span>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {classement.length === 0 ? (
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#8a96b0', textAlign:'center', padding:'20px 0' }}>
              Aucune vente enregistrée aujourd'hui
            </p>
          ) : classement.map((c, i) => {
            const isMe = c.vendeurId === vendeurId;
            const medals = [
              <Award key="gold" size={18} color="#cfa100"/>,
              <Award key="silver" size={18} color="#9ca3af"/>,
              <Award key="bronze" size={18} color="#a16207"/>,
            ];
            return (
              <div key={c.vendeurId} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background: isMe ? 'linear-gradient(90deg,#e0f0ff,#f0f4fb)' : '#f8faff', border: isMe ? '1.5px solid #1465BB' : '1px solid #f0f4fb' }}>
                <span style={{ fontSize:18, width:28 }}>{medals[i] || `#${i+1}`}</span>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white' }}>
                  {c.nom[0]}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:14, fontWeight: isMe ? 700 : 500, color:'#0d1b3e' }}>{c.nom} {isMe && '(vous)'}</p>
                  <p style={{ fontSize:12, color:'#8a96b0' }}>{c.nb} vente{c.nb>1?'s':''} · {c.livrees} livrée{c.livrees>1?'s':''}</p>
                </div>
                <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color: isMe ? '#1465BB' : '#0d1b3e' }}>
                  {c.total.toLocaleString()} FCFA
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste de mes ventes */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
          <h2 style={T.cardTitle}>Toutes mes ventes</h2>
          <span style={{ marginLeft:'auto', background:'#f4f7fd', color:'#4a5578', fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>
            {mesV.length} vente{mesV.length>1?'s':''}
          </span>
        </div>
        {mesV.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune vente enregistrée</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>
                  {['Réf.','Produit','Qté','Prix réf.','Mon prix','Remise','Prix final','Total','Zone','Statut','Date'].map(h => (
                    <th key={h} style={T.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mesV.map(v => {
                  const sc = STATUT_CONFIG[v.statut];
                  return (
                    <tr key={v.id}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.ref}</td>
                      <td style={{ ...T.td, fontWeight:500 }}>{v.produitNom}</td>
                      <td style={{ ...T.td, textAlign:'center' }}>{v.qte}</td>
                      <td style={{ ...T.td, color:'#8a96b0' }}>{v.prixRef.toLocaleString()}</td>
                      <td style={{ ...T.td, fontWeight:600 }}>{v.prixVente.toLocaleString()}</td>
                      <td style={{ ...T.td, color: v.remise>0?'#d0a83a':'#8a96b0' }}>
                        {v.remise>0 ? `-${v.remise.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ ...T.td, fontWeight:700, color:'#0a9e6e' }}>{v.prixFinal.toLocaleString()}</td>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.montantTotal.toLocaleString()} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                      <td style={T.td}>{v.zone}</td>
                      <td style={T.td}>
                        <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ ...T.td, whiteSpace:'nowrap', color:'#8a96b0' }}>{v.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL Nouvelle vente */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Enregistrer une vente</h3>
              <button onClick={()=>setModal(false)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>

              {/* Produit */}
              <div>
                <label style={T.lbl}>Produit</label>
                <select value={form.produitRef} onChange={e=>handleChangeProduit(e.target.value)} style={T.inp} required>
                  <option value="">Choisir un produit…</option>
                  {produits.map(p => (
                    <option key={p.ref} value={p.ref} disabled={p.stock===0}>
                      {p.nom} — {p.poids} (stock: {p.stock}) | Réf: {p.prixRef.toLocaleString()} FCFA
                    </option>
                  ))}
                </select>
              </div>

              {/* Prix ref affiché */}
              {produitSelectionne && (
                <div style={{ background:'#f4f7fd', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #dde5f4' }}>
                  <span style={{ fontSize:13, color:'#4a5578', fontWeight:500 }}>Prix de référence (plancher)</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#003785' }}>
                    {produitSelectionne.prixRef.toLocaleString()} FCFA
                  </span>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {/* Qté */}
                <div>
                  <label style={T.lbl}>Quantité</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button type="button" onClick={()=>setForm(f=>({...f,qte:Math.max(1,f.qte-1)}))} style={T.qteBtn}><Minus size={13}/></button>
                    <input type="number" min={1} max={produitSelectionne?.stock||999} value={form.qte} onChange={e=>setForm(f=>({...f,qte:Math.max(1,+e.target.value)}))} style={{...T.inp, textAlign:'center', width:60}}/>
                    <button type="button" onClick={()=>setForm(f=>({...f,qte:f.qte+1}))} style={T.qteBtn}><Plus size={13}/></button>
                  </div>
                </div>
                {/* Zone */}
                <div>
                  <label style={T.lbl}>Zone de livraison</label>
                  <select value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} style={T.inp}>
                    {ZONES.map(z=><option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {/* Mon prix */}
                <div>
                  <label style={T.lbl}>Mon prix de vente (FCFA)</label>
                  <input type="number" min={produitSelectionne?.prixRef||0} value={form.prixVente}
                    onChange={e=>{setForm(f=>({...f,prixVente:+e.target.value}));setErrPrix('');}}
                    style={{...T.inp, borderColor: errPrix?'#e53e3e':undefined}}/>
                  {errPrix && <p style={{ fontSize:11, color:'#e53e3e', marginTop:4 }}>{errPrix}</p>}
                </div>
                {/* Remise */}
                <div>
                  <label style={T.lbl}>Remise accordée (FCFA)</label>
                  <input type="number" min={0} max={form.prixVente} value={form.remise}
                    onChange={e=>setForm(f=>({...f,remise:Math.min(+e.target.value,f.prixVente)}))} style={T.inp}/>
                </div>
              </div>

              {/* Récapitulatif */}
              {produitSelectionne && form.prixVente > 0 && (
                <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'14px 16px' }}>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:8, fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' }}>Récapitulatif</p>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Prix final (après remise)</span>
                    <span style={{ fontSize:14, fontWeight:700, color:'white' }}>{prixFinal.toLocaleString()} FCFA</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Total ({form.qte} unité{form.qte>1?'s':''})</span>
                    <span style={{ fontSize:16, fontWeight:700, color:'#d0a83a' }}>{montantTotal.toLocaleString()} FCFA</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Marge / unité</span>
                    <span style={{ fontSize:13, fontWeight:600, color: marge>=0?'#34d399':'#fca5a5', display:'flex', alignItems:'center', gap:4 }}>
                      {marge>=0 ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                      {Math.abs(marge).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label style={T.lbl}>Note (optionnel)</label>
                <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Ex: Client fidèle, paiement mobile…" style={T.inp}/>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button onClick={()=>setModal(false)} style={T.btnCancel}>Annuler</button>
                <button onClick={handleSubmit}
                  disabled={!form.produitRef || form.prixVente < (produitSelectionne?.prixRef||0)}
                  style={{...T.btnPrimary, opacity: !form.produitRef||form.prixVente<(produitSelectionne?.prixRef||0)?0.5:1}}>
                  Soumettre la vente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const T = {
  h1:          { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:         { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:        { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle:   { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  statCard:    { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:          { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:          { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const },
  lbl:         { display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:         { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' } as CSSProperties,
  btnPrimary:  { display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 3px 10px rgba(20,101,187,0.3)' } as CSSProperties,
  btnCancel:   { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  overlay:     { position:'fixed', inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' } as CSSProperties,
  modalBox:    { background:'white', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,55,133,0.2)', border:'1px solid #dde5f4' } as CSSProperties,
  modalHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky', top:0 } as CSSProperties,
  modalTitle:  { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:  { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
  qteBtn:      { width:32, height:32, borderRadius:7, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#1465BB', flexShrink:0 } as CSSProperties,
};