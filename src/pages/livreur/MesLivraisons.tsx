import { useState, type CSSProperties } from 'react';
import {
  CheckCircle, XCircle, Package, MapPin, Clock,
  X, AlertTriangle, Truck, Plus, Minus, Send, ClipboardList,
} from 'lucide-react';
import {
  useStore,
  accepterLivraison, rejeterLivraison,
  marquerLivree, marquerNonLivree,
  soumettreDemandesLivreur,
} from '../../store/ventesStore';
import { useAuth } from '../../context/AuthContext';

const STATUT_LIVRAISON = {
  en_attente:      { label:'En attente',    bg:'#fef9c3', color:'#854d0e' },
  validee:         { label:'Validée',       bg:'#dbeafe', color:'#1e40af' },
  notif_livreur:   { label:'À confirmer',   bg:'#fdf3d7', color:'#d0a83a' },
  rejetee_livreur: { label:'Rejeté',        bg:'#fee2e2', color:'#991b1b' },
  en_livraison:    { label:'En livraison',  bg:'#e0f0ff', color:'#1465BB' },
  livree:          { label:'Livrée ✓',      bg:'#dcfce7', color:'#166534' },
  non_livree:      { label:'Non livrée',    bg:'#fee2e2', color:'#991b1b' },
  refusee:         { label:'Refusée',       bg:'#f1f5f9', color:'#475569' },
} as const;

const STATUT_DEMANDE = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e' },
  approuvee:  { label:'Approuvée ✓', bg:'#dcfce7', color:'#166534' },
  refusee:    { label:'Refusée',     bg:'#fee2e2', color:'#991b1b' },
} as const;

export default function LivreurPage() {
  const { user } = useAuth();
  const {
    mesLivraisons, mesDemandesLivreur,
    produits, mesNotifs, livreurs,
  } = useStore();

  const livreurId  = (user as any)?.livreurId || 'L1';
  const livreurNom = user ? `${user.prenom} ${user.nom}` : 'Livreur';
  const livreur    = livreurs.find(l => l.id === livreurId);

  const mesV  = mesLivraisons(livreurId);
  const mesD  = mesDemandesLivreur(livreurId);
  const mesN  = mesNotifs('livreur', livreurId);
  const nonLues = mesN.filter(n => !n.lu).length;

  const [tab,           setTab]           = useState<'livraisons'|'demandes'|'nouvelle_demande'>('livraisons');
  const [subTab,        setSubTab]        = useState<'a_confirmer'|'en_cours'|'historique'>('a_confirmer');
  const [rejetModal,    setRejetModal]    = useState<string|null>(null);
  const [motifRejet,    setMotifRejet]    = useState('');
  const [nonLivreModal, setNonLivreModal] = useState<string|null>(null);
  const [motifNL,       setMotifNL]       = useState('');

  // ── Nouvelle demande
  const [lignes, setLignes] = useState<{ produitRef:string; produitNom:string; qte:number; prixRef:number }[]>([]);
  const [zone,   setZone]   = useState(livreur?.zone || '');
  const [note,   setNote]   = useState('');

  const aConfirmer = mesV.filter(v => v.statut === 'notif_livreur');
  const enCours    = mesV.filter(v => v.statut === 'en_livraison');
  const historique = mesV.filter(v => ['livree','non_livree','rejetee_livreur','refusee'].includes(v.statut));

  const montantDemande = lignes.reduce((s,l) => s + l.prixRef * l.qte, 0);

  const addLigne = (ref: string) => {
    const p = produits.find(x => x.ref === ref);
    if (!p || lignes.find(l => l.produitRef === ref)) return;
    setLignes(prev => [...prev, { produitRef:p.ref, produitNom:p.nom, qte:1, prixRef:p.prixRef }]);
  };

  const updateQte = (ref: string, qte: number) => {
    if (qte <= 0) { setLignes(prev => prev.filter(l => l.produitRef !== ref)); return; }
    setLignes(prev => prev.map(l => l.produitRef===ref ? {...l,qte} : l));
  };

  const soumettreDemande = () => {
    if (lignes.length === 0) return;
    soumettreDemandesLivreur({
      livreurId, livreurNom, zone,
      produits:    lignes,
      montantTotal:montantDemande,
      note,
      date: new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}),
    });
    setLignes([]); setNote('');
    setTab('demandes');
  };

  const doRejeter = () => {
    if (!rejetModal || !motifRejet.trim()) return;
    rejeterLivraison(rejetModal, motifRejet);
    setRejetModal(null); setMotifRejet('');
  };

  const doNonLivree = () => {
    if (!nonLivreModal || !motifNL.trim()) return;
    marquerNonLivree(nonLivreModal, motifNL);
    setNonLivreModal(null); setMotifNL('');
  };

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Espace Livreur</h1>
          <p style={T.sub}>
            {livreur ? `Zone : ${livreur.zone} · Statut : ${livreur.statut==='disponible'?'✅ Disponible':livreur.statut==='en_course'?'🚚 En course':'⚫ Hors ligne'}` : 'Gérez vos livraisons'}
          </p>
        </div>
        {nonLues > 0 && (
          <div style={{ background:'#fdf3d7', border:'1px solid #fcd34d', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={15} color="#d0a83a"/>
            <span style={{ fontSize:13, fontWeight:600, color:'#854d0e' }}>{nonLues} notification{nonLues>1?'s':''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'À confirmer',     val:aConfirmer.length,                             color:'#d0a83a', bg:'#fdf3d7' },
          { label:'En cours',        val:enCours.length,                                color:'#1465BB', bg:'#e0f0ff' },
          { label:'Livrées',         val:mesV.filter(v=>v.statut==='livree').length,    color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Mes demandes',    val:mesD.length,                                   color:'#7c3aed', bg:'#ede9fe' },
        ].map(({label,val,color,bg}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', marginTop:5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs principaux */}
      <div style={{ display:'flex', gap:4, marginBottom:18, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4', width:'fit-content' }}>
        {([
          ['livraisons',       `🚚 Livraisons${aConfirmer.length>0?` (${aConfirmer.length})`:''}`],
          ['demandes',         `📋 Mes demandes (${mesD.length})`],
          ['nouvelle_demande', '➕ Nouvelle demande'],
        ] as const).map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', background:tab===id?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:tab===id?'white':'#4a5578', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB : LIVRAISONS
      ══════════════════════════════════════ */}
      {tab === 'livraisons' && (
        <>
          {/* Sous-tabs */}
          <div style={{ display:'flex', gap:4, marginBottom:16 }}>
            {([
              ['a_confirmer', `À confirmer (${aConfirmer.length})`],
              ['en_cours',    `En cours (${enCours.length})`],
              ['historique',  `Historique (${historique.length})`],
            ] as const).map(([id,label]) => (
              <button key={id} onClick={()=>setSubTab(id)}
                style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${subTab===id?'#1465BB':'#dde5f4'}`, background:subTab===id?'#e0f0ff':'white', color:subTab===id?'#1465BB':'#4a5578', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>

          {/* À confirmer */}
          {subTab === 'a_confirmer' && (
            <div>
              {aConfirmer.length === 0 ? (
                <EmptyState icon={<CheckCircle size={40} color="#dde5f4"/>} text="Aucune livraison en attente de confirmation"/>
              ) : aConfirmer.map(v => (
                <div key={v.id} style={{ ...T.card, marginBottom:16, border:'2px solid #fcd34d' }}>
                  {/* En-tête */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#d0a83a,#ae8f1e)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Package size={20} color="white"/>
                      </div>
                      <div>
                        <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e' }}>{v.ref}</p>
                        <p style={{ fontSize:13, color:'#4a5578' }}>{v.produitNom} · {v.qte} unité{v.qte>1?'s':''}</p>
                      </div>
                    </div>
                    <span style={{ background:'#fdf3d7', color:'#854d0e', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>⏳ En attente de votre réponse</span>
                  </div>

                  {/* Infos */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                    {[
                      { label:'Zone',              val:v.zone,            Icon:MapPin  },
                      { label:'Vendeur',            val:v.vendeurNom,      Icon:Package },
                      { label:'Heure de demande',  val:v.date,            Icon:Clock   },
                    ].map(({label,val,Icon}) => (
                      <div key={label} style={{ background:'#f4f7fd', borderRadius:9, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
                        <Icon size={14} color="#1465BB"/>
                        <div>
                          <p style={{ fontSize:10, color:'#8a96b0', marginBottom:2 }}>{label}</p>
                          <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Prix */}
                  <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'13px 16px', marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Prix vendeur / unité</span>
                      <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#d0a83a' }}>{v.prixFinal.toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Total à encaisser</span>
                      <span style={{ fontSize:20, fontWeight:700, color:'white' }}>{v.montantTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  {v.note && (
                    <div style={{ background:'#f4f7fd', borderRadius:8, padding:'8px 12px', marginBottom:14, fontSize:13, color:'#4a5578' }}>
                      📝 {v.note}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:12 }}>
                    <button onClick={()=>{setRejetModal(v.id);setMotifRejet('');}}
                      style={{ flex:1, padding:'12px', borderRadius:9, background:'#fee2e2', color:'#991b1b', border:'1.5px solid #fecaca', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <XCircle size={16}/> Rejeter
                    </button>
                    <button onClick={()=>accepterLivraison(v.id)}
                      style={{ flex:2, padding:'12px', borderRadius:9, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 3px 10px rgba(10,158,110,0.3)' }}>
                      <CheckCircle size={16}/> Accepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* En cours */}
          {subTab === 'en_cours' && (
            <div>
              {enCours.length === 0 ? (
                <EmptyState icon={<Truck size={40} color="#dde5f4"/>} text="Aucune livraison en cours"/>
              ) : enCours.map(v => (
                <div key={v.id} style={{ ...T.card, marginBottom:16, border:'2px solid #1465BB' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Truck size={20} color="white"/>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e' }}>{v.ref}</p>
                      <p style={{ fontSize:13, color:'#4a5578' }}>{v.produitNom} · {v.zone}</p>
                    </div>
                    <span style={{ background:'#e0f0ff', color:'#1465BB', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>🚚 En route</span>
                  </div>

                  <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'13px 16px', marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Montant à encaisser</span>
                      <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:'#d0a83a' }}>{v.montantTotal.toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Prix unitaire · {v.qte} unité{v.qte>1?'s':''}</span>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>{v.prixFinal.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={()=>{setNonLivreModal(v.id);setMotifNL('');}}
                      style={{ flex:1, padding:'11px', borderRadius:8, background:'#fff5f5', color:'#991b1b', border:'1.5px solid #fecaca', fontWeight:500, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <AlertTriangle size={14}/> Problème
                    </button>
                    <button onClick={()=>marquerLivree(v.id)}
                      style={{ flex:2, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 3px 10px rgba(10,158,110,0.3)' }}>
                      <CheckCircle size={16}/> Confirmer livraison
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historique */}
          {subTab === 'historique' && (
            <div style={T.card}>
              {historique.length === 0 ? (
                <EmptyState icon={<ClipboardList size={40} color="#dde5f4"/>} text="Aucune livraison terminée"/>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
                    <thead>
                      <tr>{['Réf.','Produit','Zone','Montant','Statut','Motif','Date'].map(h=><th key={h} style={T.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {historique.map(v => {
                        const sc = STATUT_LIVRAISON[v.statut as keyof typeof STATUT_LIVRAISON];
                        return (
                          <tr key={v.id}
                            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                            <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.ref}</td>
                            <td style={T.td}>{v.produitNom}</td>
                            <td style={T.td}>{v.zone}</td>
                            <td style={{ ...T.td, fontWeight:700 }}>{v.montantTotal.toLocaleString()} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                            <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span></td>
                            <td style={{ ...T.td, fontSize:12, color:'#e53e3e', maxWidth:150 }}>{v.motifRejet||'—'}</td>
                            <td style={{ ...T.td, color:'#8a96b0', whiteSpace:'nowrap' }}>{v.date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          TAB : MES DEMANDES
      ══════════════════════════════════════ */}
      {tab === 'demandes' && (
        <div>
          {mesD.length === 0 ? (
            <EmptyState icon={<ClipboardList size={40} color="#dde5f4"/>} text="Aucune demande soumise"/>
          ) : mesD.map(d => {
            const sc = STATUT_DEMANDE[d.statut];
            return (
              <div key={d.id} style={{ ...T.card, marginBottom:14, border:`1.5px solid ${d.statut==='en_attente'?'#fcd34d':d.statut==='approuvee'?'#bbf7d0':'#fecaca'}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                  <div>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e' }}>{d.ref}</p>
                    <p style={{ fontSize:12, color:'#8a96b0', marginTop:2 }}>{d.date} · Zone : {d.zone}</p>
                  </div>
                  <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>{sc.label}</span>
                </div>
                {/* Produits */}
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
                  {d.produits.map(p => (
                    <div key={p.produitRef} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#f4f7fd', borderRadius:7 }}>
                      <span style={{ fontSize:13, color:'#0d1b3e', fontWeight:500 }}>{p.produitNom}</span>
                      <div style={{ display:'flex', gap:16 }}>
                        <span style={{ fontSize:12, color:'#8a96b0' }}>×{p.qte}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:'#1465BB' }}>{(p.prixRef*p.qte).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'#4a5578' }}>Total</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#1465BB' }}>{d.montantTotal.toLocaleString()} FCFA</span>
                </div>
                {d.statut==='refusee' && d.motifRefus && (
                  <div style={{ background:'#fee2e2', borderRadius:8, padding:'8px 12px', marginTop:10, fontSize:12, color:'#991b1b' }}>
                    Motif de refus : {d.motifRefus}
                  </div>
                )}
                {d.statut==='approuvee' && (
                  <div style={{ background:'#dcfce7', borderRadius:8, padding:'8px 12px', marginTop:10, fontSize:12, color:'#166534', fontWeight:500 }}>
                    ✅ Approuvée — Vous pouvez récupérer vos produits
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB : NOUVELLE DEMANDE
      ══════════════════════════════════════ */}
      {tab === 'nouvelle_demande' && (
        <div style={{ maxWidth:600 }}>
          <div style={T.card}>
            <h2 style={{ ...T.cardTitle, marginBottom:20 }}>Commander des produits</h2>

            {/* Zone */}
            <div style={{ marginBottom:16 }}>
              <label style={T.lbl}>Zone de livraison</label>
              <input value={zone} onChange={e=>setZone(e.target.value)} placeholder="Ex: Adidogomé"
                style={T.inp}/>
            </div>

            {/* Sélecteur produits */}
            <div style={{ marginBottom:16 }}>
              <label style={T.lbl}>Ajouter un produit</label>
              <select onChange={e=>{if(e.target.value)addLigne(e.target.value);e.target.value='';}}
                style={T.inp} defaultValue="">
                <option value="">Choisir un produit à ajouter…</option>
                {produits.filter(p=>!lignes.find(l=>l.produitRef===p.ref)&&p.stock>0).map(p => (
                  <option key={p.ref} value={p.ref}>{p.nom} — Stock: {p.stock} · {p.prixRef.toLocaleString()} FCFA</option>
                ))}
              </select>
            </div>

            {/* Lignes de commande */}
            {lignes.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <label style={T.lbl}>Produits sélectionnés</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {lignes.map(l => {
                    const p = produits.find(x=>x.ref===l.produitRef);
                    return (
                      <div key={l.produitRef} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f4f7fd', borderRadius:9, border:'1px solid #dde5f4' }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{l.produitNom}</p>
                          <p style={{ fontSize:11, color:'#8a96b0' }}>{l.prixRef.toLocaleString()} FCFA / u · max {p?.stock||0}</p>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <button onClick={()=>updateQte(l.produitRef, l.qte-1)} style={T.qteBtn}><Minus size={12}/></button>
                          <span style={{ width:32, textAlign:'center', fontSize:14, fontWeight:700, color:'#0d1b3e' }}>{l.qte}</span>
                          <button onClick={()=>updateQte(l.produitRef, Math.min(l.qte+1, p?.stock||999))} style={T.qteBtn}><Plus size={12}/></button>
                        </div>
                        <p style={{ fontSize:13, fontWeight:700, color:'#1465BB', minWidth:80, textAlign:'right' }}>{(l.prixRef*l.qte).toLocaleString()} FCFA</p>
                        <button onClick={()=>setLignes(prev=>prev.filter(x=>x.produitRef!==l.produitRef))}
                          style={{ width:26, height:26, borderRadius:6, border:'1.5px solid #fecaca', background:'#fff5f5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#e53e3e' }}>
                          <X size={12}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total */}
            {lignes.length > 0 && (
              <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'13px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>{lignes.length} produit{lignes.length>1?'s':', '} · {lignes.reduce((s,l)=>s+l.qte,0)} unités</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#d0a83a' }}>{montantDemande.toLocaleString()} FCFA</span>
                </div>
              </div>
            )}

            {/* Note */}
            <div style={{ marginBottom:20 }}>
              <label style={T.lbl}>Note (optionnel)</label>
              <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex: Commande hebdomadaire, urgente…" style={T.inp}/>
            </div>

            <button onClick={soumettreDemande} disabled={lignes.length===0||!zone.trim()}
              style={{ width:'100%', padding:'13px', borderRadius:9, background:lignes.length>0&&zone.trim()?'linear-gradient(90deg,#1465BB,#003785)':'#94a3b8', color:'white', border:'none', fontWeight:600, cursor:lignes.length>0&&zone.trim()?'pointer':'not-allowed', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:lignes.length>0&&zone.trim()?'0 4px 14px rgba(20,101,187,0.3)':'none', fontFamily:'DM Sans,sans-serif' }}>
              <Send size={16}/> Soumettre la demande au gestionnaire
            </button>
          </div>
        </div>
      )}

      {/* Modal rejet livraison */}
      {rejetModal && (
        <ModalSimple title="Motif du rejet" onClose={()=>setRejetModal(null)}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', marginBottom:14 }}>
            Indiquez pourquoi vous ne pouvez pas effectuer cette livraison. Le coordinateur sera alerté.
          </p>
          <textarea value={motifRejet} onChange={e=>setMotifRejet(e.target.value)}
            placeholder="Ex: Véhicule en panne, zone inaccessible…" rows={3}
            style={{ ...T.inp, resize:'vertical' as const, marginBottom:14 }}/>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setRejetModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
            <button onClick={doRejeter} disabled={!motifRejet.trim()}
              style={{ flex:1, padding:'10px', borderRadius:8, background:motifRejet.trim()?'linear-gradient(90deg,#e53e3e,#991b1b)':'#94a3b8', color:'white', border:'none', fontWeight:600, cursor:motifRejet.trim()?'pointer':'not-allowed', fontSize:14 }}>
              Confirmer le rejet
            </button>
          </div>
        </ModalSimple>
      )}

      {/* Modal non livrée */}
      {nonLivreModal && (
        <ModalSimple title="Problème de livraison" onClose={()=>setNonLivreModal(null)} headerBg="linear-gradient(90deg,#854d0e,#d0a83a)">
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', marginBottom:14 }}>
            Décrivez le problème. Le coordinateur sera immédiatement alerté.
          </p>
          <textarea value={motifNL} onChange={e=>setMotifNL(e.target.value)}
            placeholder="Ex: Client absent, adresse introuvable, refus de réception…" rows={3}
            style={{ ...T.inp, resize:'vertical' as const, marginBottom:14 }}/>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setNonLivreModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
            <button onClick={doNonLivree} disabled={!motifNL.trim()}
              style={{ flex:1, padding:'10px', borderRadius:8, background:motifNL.trim()?'linear-gradient(90deg,#d0a83a,#ae8f1e)':'#94a3b8', color:'white', border:'none', fontWeight:600, cursor:motifNL.trim()?'pointer':'not-allowed', fontSize:14 }}>
              Signaler
            </button>
          </div>
        </ModalSimple>
      )}
    </div>
  );
}

// ── Helpers ──
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'48px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' }}>
      <div style={{ marginBottom:12 }}>{icon}</div>
      <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>{text}</p>
    </div>
  );
}

function ModalSimple({ title, onClose, headerBg='linear-gradient(90deg,#003785,#1465BB)', children }: { title:string; onClose:()=>void; headerBg?:string; children:React.ReactNode }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:headerBg }}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}><X size={15}/></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Styles ──
const T = {
  h1:        { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:       { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:      { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  statCard:  { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:        { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:        { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  lbl:       { display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:6 } as CSSProperties,
  inp:       { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const, fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  btnCancel: { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  qteBtn:    { width:28, height:28, borderRadius:7, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#1465BB', flexShrink:0 } as CSSProperties,
};