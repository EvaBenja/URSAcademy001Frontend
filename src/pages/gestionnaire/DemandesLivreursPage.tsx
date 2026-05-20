import { useState, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Eye, X, Package, Clock, AlertTriangle } from 'lucide-react';
import { useStore, approuverDemande, refuserDemande, type DemandeLivreur } from '../../store/ventesStore';

const STATUT_CONFIG = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e' },
  approuvee:  { label:'Approuvée ✓', bg:'#dcfce7', color:'#166534' },
  refusee:    { label:'Refusée',     bg:'#fee2e2', color:'#991b1b' },
};

export default function DemandesLivreursPage() {
  const { demandes } = useStore();
  const [detail,      setDetail]      = useState<DemandeLivreur|null>(null);
  const [refusModal,  setRefusModal]  = useState<string|null>(null);
  const [motif,       setMotif]       = useState('');
  const [filter,      setFilter]      = useState<'tous'|'en_attente'|'approuvee'|'refusee'>('tous');

  const filtered   = (demandes || []).filter(d => filter==='tous' || d.statut===filter);
  const enAttente  = (demandes || []).filter(d => d.statut==='en_attente').length;
  const approuvees = (demandes || []).filter(d => d.statut==='approuvee').length;
  const refusees   = (demandes || []).filter(d => d.statut==='refusee').length;

  const doApprouver = (id: string) => { approuverDemande(id); setDetail(null); };
  const doRefuser   = () => {
    if (!refusModal) return;
    refuserDemande(refusModal, motif || 'Refusé par le gestionnaire');
    setRefusModal(null); setMotif(''); setDetail(null);
  };

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>
      <div style={{ marginBottom:26 }}>
        <h1 style={T.h1}>Demandes des Livreurs</h1>
        <p style={T.sub}>Approuvez ou refusez les commandes de produits soumises par les livreurs</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'En attente',  val:enAttente,  color:'#d0a83a', bg:'#fdf3d7', Icon:Clock        },
          { label:'Approuvées',  val:approuvees, color:'#0a9e6e', bg:'#dcfce7', Icon:CheckCircle  },
          { label:'Refusées',    val:refusees,   color:'#e53e3e', bg:'#fee2e2', Icon:XCircle      },
        ].map(({label,val,color,bg,Icon}) => (
          <div key={label} style={{ ...T.statCard, display:'flex', alignItems:'center', gap:13 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={18} color={color}/>
            </div>
            <div>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, lineHeight:1 }}>{val}</p>
              <p style={{ fontSize:11, color:'#8a96b0', marginTop:3 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alertes en attente */}
      {enAttente > 0 && (
        <div style={{ background:'#fffbeb', border:'1.5px solid #fcd34d', borderRadius:12, padding:'12px 16px', marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
          <AlertTriangle size={16} color="#d0a83a"/>
          <span style={{ fontSize:13, fontWeight:600, color:'#854d0e' }}>
            {enAttente} demande{enAttente>1?'s':''} en attente de votre validation
          </span>
          <button onClick={()=>setFilter('en_attente')}
            style={{ marginLeft:'auto', padding:'5px 14px', borderRadius:7, border:'1.5px solid #fcd34d', background:'white', fontSize:12, fontWeight:500, cursor:'pointer', color:'#854d0e' }}>
            Voir
          </button>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:4, marginBottom:16 }}>
        {(['tous','en_attente','approuvee','refusee'] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===f?'#1465BB':'#dde5f4'}`, background:filter===f?'#1465BB':'white', color:filter===f?'white':'#4a5578', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
            {f==='tous'?'Toutes':STATUT_CONFIG[f as keyof typeof STATUT_CONFIG]?.label||f}
          </button>
        ))}
      </div>

      {/* Cartes demandes */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ ...T.card, textAlign:'center', padding:'40px', gridColumn:'1/-1' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune demande</p>
          </div>
        ) : filtered.map(d => {
          const sc = STATUT_CONFIG[d.statut];
          return (
            <div key={d.id} style={{ ...T.card, border:`1.5px solid ${d.statut==='en_attente'?'#fcd34d':d.statut==='approuvee'?'#bbf7d0':'#fecaca'}` }}>
              {/* Header carte */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>
                    {d.livreurNom[0]}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{d.livreurNom}</p>
                    <p style={{ fontSize:11, color:'#8a96b0' }}>{d.ref} · {d.zone}</p>
                  </div>
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
              </div>

              {/* Produits */}
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                {d.produits.map(p => (
                  <div key={p.produitRef} style={{ display:'flex', justifyContent:'space-between', padding:'6px 10px', background:'#f4f7fd', borderRadius:7 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Package size={13} color="#1465BB"/>
                      <span style={{ fontSize:13, color:'#0d1b3e', fontWeight:500 }}>{p.produitNom}</span>
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:12, color:'#8a96b0' }}>×{p.qte}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#1465BB' }}>{(p.prixRef*p.qte).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total + date */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderTop:'1px solid #f0f4fb', marginBottom:12 }}>
                <span style={{ fontSize:12, color:'#8a96b0' }}>{d.date}</span>
                <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>{d.montantTotal.toLocaleString()} FCFA</span>
              </div>

              {d.note && <p style={{ fontSize:12, color:'#4a5578', background:'#f4f7fd', borderRadius:7, padding:'6px 10px', marginBottom:12 }}>📝 {d.note}</p>}

              {d.statut==='refusee' && d.motifRefus && (
                <p style={{ fontSize:12, color:'#991b1b', background:'#fee2e2', borderRadius:7, padding:'6px 10px', marginBottom:12 }}>Motif : {d.motifRefus}</p>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setDetail(d)} style={{ ...T.iconBtn, flex:1, color:'#1465BB', gap:6, fontSize:12, fontWeight:500, padding:'7px 0', justifyContent:'center' }}>
                  <Eye size={13}/> Détail
                </button>
                {d.statut==='en_attente' && <>
                  <button onClick={()=>{setRefusModal(d.id);setMotif('');}}
                    style={{ flex:1, padding:'8px', borderRadius:7, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <XCircle size={13}/> Refuser
                  </button>
                  <button onClick={()=>doApprouver(d.id)}
                    style={{ flex:2, padding:'8px', borderRadius:7, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <CheckCircle size={13}/> Approuver
                  </button>
                </>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <div>
                <h3 style={T.modalTitle}>Demande {detail.ref}</h3>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{detail.livreurNom} · {detail.zone} · {detail.date}</p>
              </div>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:18 }}>
                {detail.produits.map(p => (
                  <div key={p.produitRef} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'#f4f7fd', borderRadius:9 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Package size={15} color="#1465BB"/>
                      <span style={{ fontSize:14, fontWeight:500, color:'#0d1b3e' }}>{p.produitNom}</span>
                    </div>
                    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                      <span style={{ fontSize:13, color:'#8a96b0' }}>×{p.qte} · {p.prixRef.toLocaleString()} FCFA</span>
                      <span style={{ fontSize:14, fontWeight:700, color:'#1465BB' }}>{(p.prixRef*p.qte).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:10, padding:'12px 16px', marginBottom:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13 }}>Total demande</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:'#d0a83a' }}>{detail.montantTotal.toLocaleString()} FCFA</span>
                </div>
              </div>
              {detail.statut==='en_attente' && (
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={()=>{setRefusModal(detail.id);setMotif('');setDetail(null);}}
                    style={{ flex:1, padding:'11px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                    Refuser
                  </button>
                  <button onClick={()=>doApprouver(detail.id)}
                    style={{ flex:2, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    <CheckCircle size={15}/> Approuver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal refus */}
      {refusModal && (
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:400 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Motif du refus</h3>
              <button onClick={()=>setRefusModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <textarea value={motif} onChange={e=>setMotif(e.target.value)}
                placeholder="Ex: Stock insuffisant, commande trop importante…" rows={3}
                style={{ width:'100%', padding:'10px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'vertical' as const, fontFamily:'DM Sans,sans-serif' }}/>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRefusModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
                <button onClick={doRefuser}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                  Confirmer
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
  card:       { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.2rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  statCard:   { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  iconBtn:    { display:'flex', alignItems:'center', width:'auto', height:30, borderRadius:7, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' } as CSSProperties,
  btnCancel:  { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  overlay:    { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' } as CSSProperties,
  modalBox:   { background:'white', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' as const, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', border:'1px solid #dde5f4', overflow:'hidden' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};