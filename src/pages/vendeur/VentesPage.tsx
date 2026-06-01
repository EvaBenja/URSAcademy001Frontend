import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, X, Trophy, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { ventesService, produitsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUT_CONFIG: Record<string, { label:string; bg:string; color:string }> = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e' },
  validee:    { label:'Validée',     bg:'#dbeafe', color:'#1e40af' },
  annulee:    { label:'Annulée',     bg:'#f1f5f9', color:'#475569' },
};

const ZONES = ['Adidogomé','Agoe','Baguida','Lomé centre','Hédzranawoe','Avedji'];

export default function VendeurVentesPage() {
  const { user } = useAuth();
  const [ventes,   setVentes]   = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [classement, setClassement] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ produit_id:'', quantite:1, prix_vendeur:0, remise:0, zone:ZONES[0], notes:'', date_vente: new Date().toISOString().split('T')[0] });
  const [errPrix,  setErrPrix]  = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [ventesRes, produitsRes, classRes] = await Promise.all([
        ventesService.getAll(),
        produitsService.getAll(),
        ventesService.classement(),
      ]);
      setVentes(ventesRes.data);
      setProduits(produitsRes.data);
      setClassement(classRes.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const mesVentes = ventes.filter(v => v.caissiere_id === user?.id);
  const produitSel = produits.find((p: any) => String(p.id) === String(form.produit_id));
  const prixFinal = Math.max(0, (form.prix_vendeur || 0) - form.remise);
  const montantTotal = prixFinal * form.quantite;

  const handleChangeProduit = (id: string) => {
    const p = produits.find((x: any) => String(x.id) === id);
    setForm(f => ({ ...f, produit_id: id, prix_vendeur: p ? p.prix_unitaire : 0 }));
    setErrPrix('');
  };

  const handleSubmit = async () => {
    if (!form.produit_id) { toast.error('Sélectionnez un produit'); return; }
    if (produitSel && form.prix_vendeur < produitSel.prix_unitaire) {
      setErrPrix(`Prix minimum : ${new Intl.NumberFormat('fr-FR').format(produitSel.prix_unitaire)} FCFA`);
      return;
    }
    setSaving(true);
    try {
      await ventesService.create({
        produit_id:    Number(form.produit_id),
        quantite:      form.quantite,
        date_vente:    form.date_vente,
        prix_vendeur:  form.prix_vendeur,
        remise:        form.remise,
        zone_livraison:form.zone,
        notes:         form.notes,
      });
      toast.success('Vente enregistrée !');
      setModal(false);
      setForm({ produit_id:'', quantite:1, prix_vendeur:0, remise:0, zone:ZONES[0], notes:'', date_vente: new Date().toISOString().split('T')[0] });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la vente');
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</div>;

  const myRank = classement.findIndex((c: any) => c.caissiere_id === user?.id) + 1;
  const myScore = classement.find((c: any) => c.caissiere_id === user?.id);

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Ventes</h1>
          <p style={T.sub}>Gérez vos ventes et suivez vos performances</p>
        </div>
        <button onClick={()=>setModal(true)} style={T.btnPrimary}><Plus size={15}/> Nouvelle vente</button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:"CA aujourd'hui",  val: myScore ? new Intl.NumberFormat('fr-FR').format(myScore.total)+' FCFA' : '0 FCFA', color:'#1465BB', bg:'#e0f0ff' },
          { label:'Nb ventes auj.',  val: myScore?.nombre_ventes || 0,                                                       color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Total toutes',    val: mesVentes.length,                                                                   color:'#7c3aed', bg:'#ede9fe' },
          { label:'Mon rang',        val: myRank > 0 ? `#${myRank}` : '—',                                                   color:'#d0a83a', bg:'#fdf3d7' },
        ].map(({label,val,color,bg}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', marginTop:5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Classement */}
      {classement.length > 0 && (
        <div style={{ ...T.card, marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <Trophy size={18} color="#d0a83a"/>
            <h2 style={T.cardTitle}>Classement du jour</h2>
            {myRank > 0 && <span style={{ marginLeft:'auto', background:'#e0f0ff', color:'#1465BB', fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>Votre rang : #{myRank}</span>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {classement.map((c: any, i: number) => {
              const isMe = c.caissiere_id === user?.id;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:isMe?'linear-gradient(90deg,#e0f0ff,#f0f4fb)':'#f8faff', border:isMe?'1.5px solid #1465BB':'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:16, width:28, textAlign:'center' }}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                  </span>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:14, fontWeight:isMe?700:500, color:'#0d1b3e' }}>{c.vendeur} {isMe && '(vous)'}</p>
                    <p style={{ fontSize:12, color:'#8a96b0' }}>{c.nombre_ventes} vente{c.nombre_ventes>1?'s':''}</p>
                  </div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:isMe?'#1465BB':'#0d1b3e' }}>
                    {new Intl.NumberFormat('fr-FR').format(c.total)} FCFA
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mes ventes */}
      <div style={T.card}>
        <h2 style={{ ...T.cardTitle, marginBottom:18 }}>Toutes mes ventes ({mesVentes.length})</h2>
        {mesVentes.length === 0 ? (
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0', textAlign:'center', padding:'40px 0' }}>Aucune vente enregistrée</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>{['Réf.','Produit','Qté','Prix réf.','Mon prix','Total','Zone','Statut','Date'].map(h=>(
                  <th key={h} style={T.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {mesVentes.map((v: any) => {
                  const sc = STATUT_CONFIG[v.statut] || { label:v.statut, bg:'#f1f5f9', color:'#475569' };
                  return (
                    <tr key={v.id} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{v.id}</td>
                      <td style={{ ...T.td, fontWeight:500 }}>{v.produit?.nom || '—'}</td>
                      <td style={{ ...T.td, textAlign:'center' }}>{v.quantite}</td>
                      <td style={{ ...T.td, color:'#8a96b0' }}>{new Intl.NumberFormat('fr-FR').format(v.prix_unitaire)}</td>
                      <td style={{ ...T.td, fontWeight:600 }}>{new Intl.NumberFormat('fr-FR').format(v.prix_vendeur||v.prix_unitaire)}</td>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{new Intl.NumberFormat('fr-FR').format(v.montant_total)} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                      <td style={T.td}>{v.zone_livraison||'—'}</td>
                      <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span></td>
                      <td style={{ ...T.td, whiteSpace:'nowrap', color:'#8a96b0', fontSize:12 }}>{v.date_vente}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nouvelle vente */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Enregistrer une vente</h3>
              <button onClick={()=>setModal(false)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={T.lbl}>Produit *</label>
                <select value={form.produit_id} onChange={e=>handleChangeProduit(e.target.value)} style={T.inp} required>
                  <option value="">Choisir un produit…</option>
                  {produits.map((p: any) => (
                    <option key={p.id} value={String(p.id)} disabled={p.quantite_stock===0}>
                      {p.nom} — {new Intl.NumberFormat('fr-FR').format(p.prix_unitaire)} FCFA (stock: {p.quantite_stock})
                    </option>
                  ))}
                </select>
              </div>

              {produitSel && (
                <div style={{ background:'#f4f7fd', borderRadius:8, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #dde5f4' }}>
                  <span style={{ fontSize:13, color:'#4a5578' }}>Prix de référence (plancher)</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#003785' }}>
                    {new Intl.NumberFormat('fr-FR').format(produitSel.prix_unitaire)} FCFA
                  </span>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={T.lbl}>Quantité</label>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <button type="button" onClick={()=>setForm(f=>({...f,quantite:Math.max(1,f.quantite-1)}))} style={T.qteBtn}><Minus size={13}/></button>
                    <input type="number" min={1} value={form.quantite} onChange={e=>setForm(f=>({...f,quantite:Math.max(1,+e.target.value)}))} style={{ ...T.inp, textAlign:'center', width:60 }}/>
                    <button type="button" onClick={()=>setForm(f=>({...f,quantite:f.quantite+1}))} style={T.qteBtn}><Plus size={13}/></button>
                  </div>
                </div>
                <div>
                  <label style={T.lbl}>Zone livraison</label>
                  <select value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} style={T.inp}>
                    {ZONES.map(z=><option key={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={T.lbl}>Mon prix de vente (FCFA)</label>
                  <input type="number" min={0} value={form.prix_vendeur} onChange={e=>{setForm(f=>({...f,prix_vendeur:+e.target.value}));setErrPrix('');}} style={{ ...T.inp, borderColor:errPrix?'#e53e3e':undefined }}/>
                  {errPrix && <p style={{ fontSize:11, color:'#e53e3e', marginTop:4 }}>{errPrix}</p>}
                </div>
                <div>
                  <label style={T.lbl}>Remise (FCFA)</label>
                  <input type="number" min={0} value={form.remise} onChange={e=>setForm(f=>({...f,remise:+e.target.value}))} style={T.inp}/>
                </div>
              </div>

              <div>
                <label style={T.lbl}>Date de vente</label>
                <input type="date" value={form.date_vente} onChange={e=>setForm(f=>({...f,date_vente:e.target.value}))} style={T.inp}/>
              </div>

              {produitSel && form.prix_vendeur > 0 && (
                <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Prix final (après remise)</span>
                    <span style={{ fontSize:14, fontWeight:700, color:'white' }}>{new Intl.NumberFormat('fr-FR').format(prixFinal)} FCFA</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Total ({form.quantite} unité{form.quantite>1?'s':''})</span>
                    <span style={{ fontSize:16, fontWeight:700, color:'#d0a83a' }}>{new Intl.NumberFormat('fr-FR').format(montantTotal)} FCFA</span>
                  </div>
                </div>
              )}

              <div>
                <label style={T.lbl}>Notes (optionnel)</label>
                <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Ex: Client fidèle…" style={T.inp}/>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={T.btnCancel}>Annuler</button>
                <button onClick={handleSubmit} disabled={saving || !form.produit_id}
                  style={{ ...T.btnPrimary, opacity:saving||!form.produit_id?0.5:1 }}>
                  {saving ? 'Enregistrement…' : 'Soumettre la vente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .stats-4 { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}

const T = {
  h1:        { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:       { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:      { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  statCard:  { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  th:        { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:        { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  lbl:       { display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:       { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  btnCancel: { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578' } as CSSProperties,
  overlay:   { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:  { background:'white', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
  qteBtn:    { width:32, height:32, borderRadius:7, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#1465BB', flexShrink:0 } as CSSProperties,
};