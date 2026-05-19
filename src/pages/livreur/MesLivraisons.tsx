
import { useState, type CSSProperties } from 'react';
import { Bell, CheckCircle, ClipboardList, Truck, Package, MapPin, Phone, Clock, X, AlertTriangle, XCircle } from 'lucide-react';
import { useStore, accepterLivraison, rejeterLivraison, marquerLivree, marquerNonLivree } from '../../store/ventesStore';
import { useAuth } from '../../context/AuthContext';

const STATUT_CONFIG = {
  en_attente:      { label:'En attente',    bg:'#fef9c3', color:'#854d0e' },
  validee:         { label:'Validée',       bg:'#dbeafe', color:'#1e40af' },
  notif_livreur:   { label:'À confirmer',   bg:'#fdf3d7', color:'#d0a83a' },
  rejetee_livreur: { label:'Rejeté',        bg:'#fee2e2', color:'#991b1b' },
  en_livraison:    { label:'En livraison',  bg:'#e0f0ff', color:'#1465BB' },
  livree:          { label:'Livrée ✓',      bg:'#dcfce7', color:'#166534' },
  non_livree:      { label:'Non livrée',    bg:'#fee2e2', color:'#991b1b' },
  refusee:         { label:'Refusée',       bg:'#f1f5f9', color:'#475569' },
};

export default function LivreurPage() {
  const { user } = useAuth();
  const { ventes, notifs, mesLivraisons, mesNotifs } = useStore();

  const livreurId  = user?.id ? String(user.id) : 'L1';
  const mesV       = mesLivraisons(livreurId);
  const mesN       = mesNotifs('livreur', livreurId);
  const nonLues    = mesN.filter(n => !n.lu).length;

  const [tab,          setTab]          = useState<'notifs'|'en_cours'|'historique'>('notifs');
  const [rejetModal,   setRejetModal]   = useState<string|null>(null);
  const [motif,        setMotif]        = useState('');
  const [nonLivreModal,setNonLivreModal]= useState<string|null>(null);
  const [motifNL,      setMotifNL]      = useState('');

  const aConfirmer  = mesV.filter(v => v.statut === 'notif_livreur');
  const enCours     = mesV.filter(v => v.statut === 'en_livraison');
  const historique  = mesV.filter(v => ['livree','non_livree','rejetee_livreur'].includes(v.statut));

  const doAccepter = (id: string) => { accepterLivraison(id); setTab('en_cours'); };

  const doRejeter = () => {
    if (!rejetModal || !motif.trim()) return;
    rejeterLivraison(rejetModal, motif);
    setRejetModal(null); setMotif('');
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
          <h1 style={T.h1}>Mes Livraisons</h1>
          <p style={T.sub}>Gérez vos livraisons assignées et suivez votre activité</p>
        </div>
        {nonLues > 0 && (
          <div style={{ background:'#fdf3d7', border:'1px solid #fcd34d', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={15} color="#d0a83a"/>
            <span style={{ fontSize:13, fontWeight:600, color:'#854d0e' }}>{nonLues} notification{nonLues>1?'s':''} en attente</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'À confirmer',  val:aConfirmer.length,  color:'#d0a83a', bg:'#fdf3d7' },
          { label:'En cours',     val:enCours.length,     color:'#1465BB', bg:'#e0f0ff' },
          { label:'Livrées',      val:mesV.filter(v=>v.statut==='livree').length,     color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Total',        val:mesV.length,        color:'#7c3aed', bg:'#ede9fe' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', marginTop:5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4', width:'fit-content' }}>
        {([
          ['notifs', 'Notifications', Bell],
          ['en_cours', 'En cours', Truck],
          ['historique', 'Historique', ClipboardList],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', background:tab===id?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:tab===id?'white':'#4a5578', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', display:'inline-flex', alignItems:'center', gap:8 }}>
            <Icon size={16} color={tab===id?'white':'#4a5578'} />
            {label}{id==='notifs'&&nonLues>0?` (${nonLues})`:''}
          </button>
        ))}
      </div>

      {/* ── NOTIFICATIONS / À CONFIRMER ── */}
      {tab === 'notifs' && (
        <div>
          {aConfirmer.length === 0 ? (
            <div style={{ ...T.card, textAlign:'center', padding:'48px' }}>
              <CheckCircle size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune livraison en attente de confirmation</p>
            </div>
          ) : aConfirmer.map(v => (
            <div key={v.id} style={{ ...T.card, marginBottom:16, border:'2px solid #fcd34d' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#d0a83a,#ae8f1e)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Package size={20} color="white"/>
                  </div>
                  <div>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e' }}>{v.ref}</p>
                    <p style={{ fontSize:13, color:'#4a5578' }}>{v.produitNom} · {v.qte} unité{v.qte>1?'s':''}</p>
                  </div>
                </div>
                <span style={{ background:'#fdf3d7', color:'#854d0e', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:6 }}>
                  <Clock size={14} color="#854d0e"/>
                  En attente de votre réponse
                </span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                {[
                  { label:'Zone', val:v.zone, Icon:MapPin },
                  { label:'Montant à percevoir', val:`${v.montantTotal.toLocaleString()} FCFA`, Icon:Package },
                  { label:'Vendeur', val:v.vendeurNom, Icon:Phone },
                ].map(({ label, val, Icon }) => (
                  <div key={label} style={{ background:'#f4f7fd', borderRadius:9, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
                    <Icon size={15} color="#1465BB"/>
                    <div>
                      <p style={{ fontSize:11, color:'#8a96b0', marginBottom:2 }}>{label}</p>
                      <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Détail prix */}
              <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'12px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Prix de vente (fixé par le vendeur)</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#d0a83a' }}>
                    {v.prixFinal.toLocaleString()} FCFA / unité
                  </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Total à encaisser</span>
                  <span style={{ fontSize:20, fontWeight:700, color:'white' }}>{v.montantTotal.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => { setRejetModal(v.id); setMotif(''); }}
                  style={{ flex:1, padding:'12px', borderRadius:9, background:'#fee2e2', color:'#991b1b', border:'1.5px solid #fecaca', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <XCircle size={16}/> Rejeter
                </button>
                <button onClick={() => doAccepter(v.id)}
                  style={{ flex:2, padding:'12px', borderRadius:9, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 3px 10px rgba(10,158,110,0.3)' }}>
                  <CheckCircle size={16}/> Accepter la livraison
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── EN COURS ── */}
      {tab === 'en_cours' && (
        <div>
          {enCours.length === 0 ? (
            <div style={{ ...T.card, textAlign:'center', padding:'48px' }}>
              <Truck size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune livraison en cours</p>
            </div>
          ) : enCours.map(v => (
            <div key={v.id} style={{ ...T.card, marginBottom:16, border:'2px solid #1465BB' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Truck size={20} color="white"/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e' }}>{v.ref}</p>
                  <p style={{ fontSize:13, color:'#4a5578' }}>{v.produitNom} · {v.qte} unité{v.qte>1?'s':''} · {v.zone}</p>
                </div>
                <span style={{ background:'#e0f0ff', color:'#1465BB', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20, display:'inline-flex', alignItems:'center', gap:6 }}>
                  <Truck size={14} color="#1465BB"/>
                  En route
                </span>
              </div>

              <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Montant à encaisser</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:'#d0a83a' }}>{v.montantTotal.toLocaleString()} FCFA</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Prix unitaire</span>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>{v.prixFinal.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => { setNonLivreModal(v.id); setMotifNL(''); }}
                  style={{ flex:1, padding:'11px', borderRadius:8, background:'#fff5f5', color:'#991b1b', border:'1.5px solid #fecaca', fontWeight:500, cursor:'pointer', fontSize:13 }}>
                  Problème de livraison
                </button>
                <button onClick={() => marquerLivree(v.id)}
                  style={{ flex:2, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 3px 10px rgba(10,158,110,0.3)' }}>
                  <CheckCircle size={16}/> Confirmer livraison
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── HISTORIQUE ── */}
      {tab === 'historique' && (
        <div style={T.card}>
          {historique.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px' }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Aucune livraison terminée</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
                <thead>
                  <tr>
                    {['Réf.','Produit','Zone','Montant','Statut','Motif','Date'].map(h => (
                      <th key={h} style={T.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historique.map(v => {
                    const sc = STATUT_CONFIG[v.statut as keyof typeof STATUT_CONFIG];
                    return (
                      <tr key={v.id}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                        <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.ref}</td>
                        <td style={T.td}>{v.produitNom}</td>
                        <td style={T.td}>{v.zone}</td>
                        <td style={{ ...T.td, fontWeight:700 }}>{v.montantTotal.toLocaleString()} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                        <td style={T.td}>
                          <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
                        </td>
                        <td style={{ ...T.td, fontSize:12, color:'#e53e3e', maxWidth:160 }}>{v.motifRejet||'—'}</td>
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
       
      {/* Modal rejet */}
      {rejetModal && (
        <div onClick={()=>setRejetModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Motif du rejet</h3>
              <button onClick={()=>setRejetModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578' }}>
                Indiquez pourquoi vous ne pouvez pas effectuer cette livraison. Le coordinateur sera alerté.
              </p>
              <textarea value={motif} onChange={e=>setMotif(e.target.value)}
                placeholder="Ex: Véhicule en panne, zone inaccessible, urgence personnelle…"
                rows={4}
                style={{ ...T.inp, resize:'vertical' as const }}/>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRejetModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
                <button onClick={doRejeter} disabled={!motif.trim()}
                  style={{ flex:1, padding:'11px', borderRadius:8, background:motif.trim()?'linear-gradient(90deg,#e53e3e,#991b1b)':'#94a3b8', color:'white', border:'none', fontWeight:600, cursor:motif.trim()?'pointer':'not-allowed', fontSize:14 }}>
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal non livrée */}
      {nonLivreModal && (
        <div onClick={()=>setNonLivreModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={{ ...T.modalHeader, background:'linear-gradient(90deg,#854d0e,#d0a83a)' }}>
              <h3 style={T.modalTitle}>Problème de livraison</h3>
              <button onClick={()=>setNonLivreModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578' }}>
                Décrivez le problème rencontré. Le coordinateur sera immédiatement alerté.
              </p>
              <textarea value={motifNL} onChange={e=>setMotifNL(e.target.value)}
                placeholder="Ex: Client absent, adresse introuvable, refus de réception…"
                rows={4}
                style={{ ...T.inp, resize:'vertical' as const }}/>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setNonLivreModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
                <button onClick={doNonLivree} disabled={!motifNL.trim()}
                  style={{ flex:1, padding:'11px', borderRadius:8, background:motifNL.trim()?'linear-gradient(90deg,#d0a83a,#ae8f1e)':'#94a3b8', color:'white', border:'none', fontWeight:600, cursor:motifNL.trim()?'pointer':'not-allowed', fontSize:14 }}>
                  Signaler le problème
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
  h1:         { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:        { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:       { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  statCard:   { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:         { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:         { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  inp:        { width:'100%', padding:'10px 13px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const, fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  btnCancel:  { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  overlay:    { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' } as CSSProperties,
  modalBox:   { background:'white', borderRadius:14, width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', border:'1px solid #dde5f4', overflow:'hidden' } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
