import { useState, type CSSProperties } from 'react';
import { MapPin, AlertTriangle, RefreshCw, X, XCircle, CheckCircle, Truck, User } from 'lucide-react';
import { useStore, reassignerLivreur, type StatutVente } from '../../store/ventesStore';

const STATUT_CONFIG: Record<StatutVente,{label:string;bg:string;color:string}> = {
  en_attente:      {label:'En attente',    bg:'#fef9c3',color:'#854d0e'},
  validee:         {label:'Validée',       bg:'#dbeafe',color:'#1e40af'},
  notif_livreur:   {label:'Notif.livreur', bg:'#e0f0ff',color:'#1465BB'},
  rejetee_livreur: {label:'Rejet livreur', bg:'#fee2e2',color:'#991b1b'},
  en_livraison:    {label:'En livraison',  bg:'#fdf3d7',color:'#854d0e'},
  livree:          {label:'Livrée ✓',      bg:'#dcfce7',color:'#166534'},
  non_livree:      {label:'Non livrée',    bg:'#fee2e2',color:'#991b1b'},
  refusee:         {label:'Refusée',       bg:'#f1f5f9',color:'#475569'},
};

const STATUT_LIVREUR = {
  disponible: {label:'Disponible', bg:'#dcfce7', color:'#166534'},
  en_course:  {label:'En course',  bg:'#fdf3d7', color:'#854d0e'},
  hors_ligne: {label:'Hors ligne', bg:'#f1f5f9', color:'#475569'},
};

export default function CoordinateurLivraisonsPage() {
  const { ventes, livreurs, notifs, mesNotifs } = useStore();
  const [reassignModal, setReassignModal] = useState<string|null>(null);
  const [livreurChoisi, setLivreurChoisi] = useState('');

  const mesN         = mesNotifs('coordinateur');
  const nonLues      = mesN.filter(n=>!n.lu).length;
  const alertes      = ventes.filter(v=>['rejetee_livreur','non_livree'].includes(v.statut));
  const sanLivreur   = ventes.filter(v=>v.statut==='validee'&&!v.livreurId);
  const enAttente    = ventes.filter(v=>v.statut==='notif_livreur');
  const enLivraison  = ventes.filter(v=>v.statut==='en_livraison');
  const libreursDisp = livreurs.filter(l=>l.statut==='disponible');

  const doReassign = () => {
    if (!reassignModal||!livreurChoisi) return;
    reassignerLivreur(reassignModal, livreurChoisi);
    setReassignModal(null); setLivreurChoisi('');
  };

  return (
    <div style={{padding:28,background:'#f0f4fb',minHeight:'100vh'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:26}}>
        <div>
          <h1 style={T.h1}>Coordination des Livraisons</h1>
          <p style={T.sub}>Gérez les assignations et suivez les alertes en temps réel</p>
        </div>
        {nonLues>0&&(
          <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
            <AlertTriangle size={16} color="#e53e3e"/>
            <span style={{fontSize:13,fontWeight:600,color:'#991b1b'}}>{nonLues} alerte{nonLues>1?'s':''} non lue{nonLues>1?'s':''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Alertes actives',        val:alertes.length,    color:'#e53e3e',bg:'#fee2e2'},
          {label:'Sans livreur',           val:sanLivreur.length, color:'#d0a83a',bg:'#fdf3d7'},
          {label:'Notif. envoyées',        val:enAttente.length,  color:'#1465BB',bg:'#e0f0ff'},
          {label:'En livraison',           val:enLivraison.length,color:'#0a9e6e',bg:'#dcfce7'},
        ].map(({label,val,color,bg})=>(
          <div key={label} style={{...T.statCard}}>
            <p style={{fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color,lineHeight:1}}>{val}</p>
            <p style={{fontSize:12,color:'#8a96b0',marginTop:4}}>{label}</p>
          </div>
        ))}
      </div>

      {/* Alertes prioritaires */}
      {(alertes.length>0||sanLivreur.length>0)&&(
        <div style={{...T.card,marginBottom:20,border:'1.5px solid #fecaca'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <AlertTriangle size={18} color="#e53e3e"/>
            <h2 style={{...T.cardTitle,color:'#991b1b'}}>Actions requises</h2>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {alertes.map(v=>(
              <div key={v.id} style={{display:'flex',alignItems:'center',gap:12,background:'#fff5f5',borderRadius:9,padding:'11px 14px',border:'1px solid #fecaca'}}>
                <AlertTriangle size={15} color="#e53e3e" style={{flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600,color:'#0d1b3e'}}>{v.ref} — {v.produitNom} — {v.zone}</p>
                  <p style={{fontSize:12,color:'#e53e3e',marginTop:2,display:'flex',alignItems:'center',gap:6}}>
                    {v.statut==='rejetee_livreur' ? (
                      <>
                        <XCircle size={14} color="#e53e3e"/>
                        Rejeté par {v.livreurNom} : "{v.motifRejet}"
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} color="#e53e3e"/>
                        Non livrée
                      </>
                    )}
                  </p>
                </div>
                <button onClick={()=>{setReassignModal(v.id);setLivreurChoisi('');}}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,background:'linear-gradient(90deg,#1465BB,#003785)',color:'white',border:'none',fontSize:12,fontWeight:500,cursor:'pointer'}}>
                  <RefreshCw size={12}/> Réassigner
                </button>
              </div>
            ))}
            {sanLivreur.map(v=>(
              <div key={v.id} style={{display:'flex',alignItems:'center',gap:12,background:'#fffbeb',borderRadius:9,padding:'11px 14px',border:'1px solid #fcd34d'}}>
                <AlertTriangle size={15} color="#d0a83a" style={{flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600,color:'#0d1b3e'}}>{v.ref} — {v.produitNom} — Zone : {v.zone}</p>
                  <p style={{fontSize:12,color:'#d0a83a',marginTop:2,display:'inline-flex',alignItems:'center',gap:6}}>
                    <AlertTriangle size={14} color="#d0a83a"/>
                    Aucun livreur disponible en zone {v.zone}
                  </p>
                </div>
                <button onClick={()=>{setReassignModal(v.id);setLivreurChoisi('');}}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,background:'linear-gradient(90deg,#d0a83a,#ae8f1e)',color:'white',border:'none',fontSize:12,fontWeight:500,cursor:'pointer'}}>
                  <User size={12}/> Assigner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Livreurs */}
      <div style={{...T.card,marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <MapPin size={18} color="#1465BB"/>
          <h2 style={T.cardTitle}>État des livreurs</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          {livreurs.map(l=>{
            const sc = STATUT_LIVREUR[l.statut];
            const venteEnCours = ventes.find(v=>v.livreurId===l.id&&v.statut==='en_livraison');
            return (
              <div key={l.id} style={{borderRadius:10,border:'1px solid #dde5f4',padding:'12px 14px',background:l.statut==='disponible'?'white':'#fffbf0'}}>
                <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#1465BB,#003785)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white',flexShrink:0}}>
                    {l.nom[0]}
                  </div>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:'#0d1b3e'}}>{l.nom}</p>
                    <p style={{fontSize:11,color:'#8a96b0'}}>{l.zone}</p>
                  </div>
                  <span style={{marginLeft:'auto',background:sc.bg,color:sc.color,fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10}}>{sc.label}</span>
                </div>
                {venteEnCours&&(
                  <p style={{fontSize:11,color:'#1465BB',background:'#e0f0ff',borderRadius:6,padding:'4px 8px',display:'inline-flex',alignItems:'center',gap:6}}>
                    <Truck size={14} color="#1465BB"/>
                    {venteEnCours.ref} — {venteEnCours.zone}
                  </p>
                )}
                <p style={{fontSize:11,color:'#8a96b0',marginTop:4,display:'inline-flex',alignItems:'center',gap:6}}>
                  <MapPin size={14} color="#8a96b0"/>
                  {l.position.lat.toFixed(4)}, {l.position.lng.toFixed(4)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toutes les livraisons */}
      <div style={T.card}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <h2 style={T.cardTitle}>Toutes les livraisons</h2>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
            <thead>
              <tr>
                {['Réf.','Vendeur','Produit','Zone','Livreur','Total','Statut','Motif rejet','Màj'].map(h=>(
                  <th key={h} style={T.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventes.map(v=>{
                const sc=STATUT_CONFIG[v.statut];
                return (
                  <tr key={v.id}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                    <td style={{...T.td,fontWeight:700,color:'#1465BB'}}>{v.ref}</td>
                    <td style={T.td}>{v.vendeurNom}</td>
                    <td style={T.td}>{v.produitNom}</td>
                    <td style={T.td}>{v.zone}</td>
                    <td style={T.td}>
                      {v.livreurNom ? (
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:24,height:24,borderRadius:'50%',background:'#e0f0ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#1465BB'}}>
                            {v.livreurNom[0]}
                          </div>
                          {v.livreurNom}
                        </div>
                      ):<span style={{color:'#8a96b0',fontStyle:'italic'}}>Non assigné</span>}
                    </td>
                    <td style={{...T.td,fontWeight:700,color:'#1465BB'}}>{v.montantTotal.toLocaleString()} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                    <td style={T.td}>
                      <span style={{background:sc.bg,color:sc.color,fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,whiteSpace:'nowrap'}}>{sc.label}</span>
                    </td>
                    <td style={{...T.td,maxWidth:180}}>
                      {v.motifRejet ? <span style={{fontSize:12,color:'#e53e3e'}}>{v.motifRejet}</span> : <span style={{color:'#c0cce0'}}>—</span>}
                    </td>
                    <td style={{...T.td,color:'#8a96b0',whiteSpace:'nowrap'}}>{v.updatedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal réassignation */}
      {reassignModal&&(
        <div onClick={()=>setReassignModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{...T.modalBox,maxWidth:420}}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Réassigner un livreur</h3>
              <button onClick={()=>setReassignModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
              <p style={{color:'#4a5578',fontFamily:'Cormorant Garamond,serif',fontSize:15}}>
                Choisissez un livreur disponible pour cette livraison :
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {livreurs.filter(l=>l.statut==='disponible').map(l=>(
                  <button key={l.id} onClick={()=>setLivreurChoisi(l.id)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:9,border:`1.5px solid ${livreurChoisi===l.id?'#1465BB':'#dde5f4'}`,background:livreurChoisi===l.id?'#e0f0ff':'white',cursor:'pointer',textAlign:'left'}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#1465BB,#003785)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white',flexShrink:0}}>
                      {l.nom[0]}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,fontWeight:600,color:'#0d1b3e'}}>{l.nom}</p>
                      <p style={{fontSize:11,color:'#8a96b0'}}>Zone : {l.zone} · {l.telephone}</p>
                    </div>
                    {livreurChoisi===l.id&&<CheckCircle size={16} color="#1465BB"/>}
                  </button>
                ))}
                {libreursDisp.length===0&&(
                  <p style={{textAlign:'center',color:'#e53e3e',fontSize:13,padding:'16px 0',display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    <AlertTriangle size={14} color="#e53e3e"/>
                    Aucun livreur disponible pour le moment
                  </p>
                )}
              </div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button onClick={()=>setReassignModal(null)} style={{...T.btnCancel,flex:1}}>Annuler</button>
                <button onClick={doReassign} disabled={!livreurChoisi}
                  style={{flex:1,padding:'10px',borderRadius:8,background:livreurChoisi?'linear-gradient(90deg,#1465BB,#003785)':'#94a3b8',color:'white',border:'none',fontWeight:600,cursor:livreurChoisi?'pointer':'not-allowed',fontSize:14}}>
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
  h1:         {fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:'#0d1b3e',margin:0} as CSSProperties,
  sub:        {fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'#4a5578',marginTop:4} as CSSProperties,
  card:       {background:'white',borderRadius:14,border:'1px solid #dde5f4',padding:'1.4rem',boxShadow:'0 2px 10px rgba(0,55,133,0.05)'} as CSSProperties,
  cardTitle:  {fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'#0d1b3e',margin:0} as CSSProperties,
  statCard:   {background:'white',borderRadius:12,border:'1px solid #dde5f4',padding:'1.1rem 1.3rem',boxShadow:'0 2px 8px rgba(0,55,133,0.04)'} as CSSProperties,
  th:         {fontSize:11,fontWeight:600,letterSpacing:'.8px',textTransform:'uppercase' as const,color:'#8a96b0',padding:'11px 14px',background:'#f4f7fd',borderBottom:'1px solid #dde5f4',textAlign:'left' as const,whiteSpace:'nowrap' as const},
  td:         {padding:'11px 14px',fontSize:13,borderBottom:'1px solid #f0f4fb',verticalAlign:'middle' as const} as CSSProperties,
  btnCancel:  {padding:'9px 18px',borderRadius:8,border:'1.5px solid #dde5f4',background:'white',fontSize:14,cursor:'pointer',color:'#4a5578',fontFamily:'DM Sans,sans-serif'} as CSSProperties,
  overlay:    {position:'fixed' as const,inset:0,zIndex:200,background:'rgba(13,27,62,0.45)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'},
  modalBox:   {background:'white',borderRadius:14,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto' as const,boxShadow:'0 20px 60px rgba(0,55,133,0.2)',border:'1px solid #dde5f4'},
  modalHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(90deg,#003785,#1465BB)',position:'sticky' as const,top:0},
  modalTitle: {fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'white',margin:0} as CSSProperties,
  modalClose: {background:'rgba(255,255,255,0.15)',border:'none',borderRadius:7,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white'} as CSSProperties,
};