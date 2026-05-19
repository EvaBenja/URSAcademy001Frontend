import { useState, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Clock, Truck, Eye, X, AlertTriangle } from 'lucide-react';
import { useStore, validerVente, refuserVente, type StatutVente } from '../../store/ventesStore';

const STATUT_CONFIG: Record<StatutVente,{label:string;bg:string;color:string}> = {
  en_attente:      {label:'En attente',    bg:'#fef9c3',color:'#854d0e'},
  validee:         {label:'Validée',       bg:'#dbeafe', color:'#1e40af'},
  notif_livreur:   {label:'Notif.livreur', bg:'#e0f0ff', color:'#1465BB'},
  rejetee_livreur: {label:'Rejet livreur', bg:'#fee2e2', color:'#991b1b'},
  en_livraison:    {label:'En livraison',  bg:'#fdf3d7', color:'#854d0e'},
  livree:          {label:'Livrée ✓',      bg:'#dcfce7', color:'#166534'},
  non_livree:      {label:'Non livrée',    bg:'#fee2e2', color:'#991b1b'},
  refusee:         {label:'Refusée',       bg:'#f1f5f9', color:'#475569'},
};

export default function ValidationVentesPage() {
  const { ventes, produits } = useStore();
  const [detail,        setDetail]        = useState<typeof ventes[0]|null>(null);
  const [refusModal,    setRefusModal]    = useState<string|null>(null);
  const [motifRefus,    setMotifRefus]    = useState('');
  const [filterStatut,  setFilterStatut]  = useState<'tous'|StatutVente>('tous');

  const enAttente  = ventes.filter(v => v.statut === 'en_attente').length;
  const enCours    = ventes.filter(v => ['en_livraison','notif_livreur'].includes(v.statut)).length;
  const livrees    = ventes.filter(v => v.statut === 'livree').length;
  const rejets     = ventes.filter(v => v.statut === 'rejetee_livreur').length;

  const filtered = ventes.filter(v => filterStatut === 'tous' || v.statut === filterStatut);

  const doValider = (id: string) => { validerVente(id); setDetail(null); };
  const doRefuser = () => {
    if (!refusModal) return;
    refuserVente(refusModal, motifRefus || 'Refusé par le gestionnaire');
    setRefusModal(null); setMotifRefus('');
  };

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>
      <div style={{ marginBottom:26 }}>
        <h1 style={T.h1}>Validation des Ventes</h1>
        <p style={T.sub}>Validez ou refusez les ventes soumises par les vendeurs</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'En attente',    val:enAttente, color:'#d0a83a', bg:'#fdf3d7', Icon:Clock},
          {label:'En livraison',  val:enCours,   color:'#1465BB', bg:'#e0f0ff', Icon:Truck},
          {label:'Livrées',       val:livrees,   color:'#0a9e6e', bg:'#dcfce7', Icon:CheckCircle},
          {label:'Rejets livreur',val:rejets,    color:'#e53e3e', bg:'#fee2e2', Icon:AlertTriangle},
        ].map(({label,val,color,bg,Icon})=>(
          <div key={label} style={{...T.statCard, cursor: label==='En attente'?'pointer':'default'}}
            onClick={()=>label==='En attente'&&setFilterStatut('en_attente')}>
            <div style={{width:42,height:42,borderRadius:10,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon size={18} color={color}/>
            </div>
            <div>
              <p style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color,lineHeight:1}}>{val}</p>
              <p style={{fontSize:11,color:'#8a96b0',marginTop:4}}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        {(['tous','en_attente','validee','en_livraison','livree','refusee','rejetee_livreur'] as const).map(s=>(
          <button key={s} onClick={()=>setFilterStatut(s)}
            style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${filterStatut===s?'#1465BB':'#dde5f4'}`,background:filterStatut===s?'#1465BB':'white',color:filterStatut===s?'white':'#4a5578',fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
            {s==='tous'?'Toutes':STATUT_CONFIG[s as StatutVente]?.label||s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={T.card}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
            <thead>
              <tr>
                {['Réf.','Vendeur','Produit','Qté','Prix réf.','Prix vendeur','Remise','Prix final','Total','Zone','Statut','Date','Actions'].map(h=>(
                  <th key={h} style={T.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={13} style={{padding:'40px',textAlign:'center',fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'#8a96b0'}}>Aucune vente</td></tr>
              ):filtered.map(v=>{
                const sc  = STATUT_CONFIG[v.statut];
                const dep = v.prixVente - v.prixRef;
                return (
                  <tr key={v.id}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                    <td style={{...T.td,fontWeight:700,color:'#1465BB'}}>{v.ref}</td>
                    <td style={T.td}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#1465BB,#003785)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0}}>
                          {v.vendeurNom[0]}
                        </div>
                        {v.vendeurNom}
                      </div>
                    </td>
                    <td style={{...T.td,fontWeight:500}}>{v.produitNom}</td>
                    <td style={{...T.td,textAlign:'center'}}>{v.qte}</td>
                    <td style={{...T.td,color:'#8a96b0'}}>{v.prixRef.toLocaleString()}</td>
                    <td style={{...T.td,fontWeight:600}}>{v.prixVente.toLocaleString()}</td>
                    <td style={{...T.td,color:v.remise>0?'#d0a83a':'#8a96b0'}}>{v.remise>0?`-${v.remise.toLocaleString()}`:'—'}</td>
                    <td style={{...T.td,fontWeight:700,color:'#0a9e6e'}}>{v.prixFinal.toLocaleString()}</td>
                    <td style={{...T.td,fontWeight:700,color:'#1465BB'}}>{v.montantTotal.toLocaleString()} <span style={{fontSize:10,color:'#8a96b0'}}>FCFA</span></td>
                    <td style={T.td}>{v.zone}</td>
                    <td style={T.td}>
                      <span style={{background:sc.bg,color:sc.color,fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,whiteSpace:'nowrap'}}>{sc.label}</span>
                    </td>
                    <td style={{...T.td,color:'#8a96b0',whiteSpace:'nowrap'}}>{v.date}</td>
                    <td style={T.td}>
                      <div style={{display:'flex',gap:5}}>
                        <button onClick={()=>setDetail(v)} style={{...T.iconBtn,color:'#1465BB'}}><Eye size={13}/></button>
                        {v.statut==='en_attente'&&<>
                          <button onClick={()=>doValider(v.id)} style={{...T.iconBtn,color:'#0a9e6e',borderColor:'#bbf7d0',background:'#f0fdf4'}}><CheckCircle size={13}/></button>
                          <button onClick={()=>{setRefusModal(v.id);setMotifRefus('');}} style={{...T.iconBtn,color:'#e53e3e',borderColor:'#fecaca',background:'#fff5f5'}}><XCircle size={13}/></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail */}
      {detail&&(
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{...T.modalBox,maxWidth:480}}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Détail vente {detail.ref}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{padding:22,display:'flex',flexDirection:'column',gap:10}}>
              {[
                ['Vendeur', detail.vendeurNom],
                ['Produit', `${detail.produitNom} × ${detail.qte}`],
                ['Prix référence', `${detail.prixRef.toLocaleString()} FCFA`],
                ['Prix vendeur', `${detail.prixVente.toLocaleString()} FCFA`],
                ['Remise', detail.remise>0?`${detail.remise.toLocaleString()} FCFA`:'Aucune'],
                ['Prix final', `${detail.prixFinal.toLocaleString()} FCFA`],
                ['Total', `${detail.montantTotal.toLocaleString()} FCFA`],
                ['Zone', detail.zone],
                ['Livreur', detail.livreurNom||'Non assigné'],
                ['Statut', STATUT_CONFIG[detail.statut].label],
                ['Note', detail.note||'—'],
                ['Date', detail.date],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f0f4fb'}}>
                  <span style={{fontSize:13,color:'#8a96b0',fontWeight:500}}>{k}</span>
                  <span style={{fontSize:13,color:'#0d1b3e',fontWeight:600}}>{v}</span>
                </div>
              ))}
              {detail.motifRejet&&(
                <div style={{background:'#fee2e2',borderRadius:8,padding:'10px 14px',marginTop:4}}>
                  <p style={{fontSize:12,fontWeight:600,color:'#991b1b'}}>Motif de rejet : {detail.motifRejet}</p>
                </div>
              )}
              {detail.statut==='en_attente'&&(
                <div style={{display:'flex',gap:10,marginTop:8}}>
                  <button onClick={()=>{setRefusModal(detail.id);setDetail(null);}} style={{flex:1,padding:'10px',borderRadius:8,background:'#fee2e2',color:'#991b1b',border:'none',fontWeight:600,cursor:'pointer',fontSize:13}}>Refuser</button>
                  <button onClick={()=>doValider(detail.id)} style={{flex:1,padding:'10px',borderRadius:8,background:'linear-gradient(90deg,#0a9e6e,#065f46)',color:'white',border:'none',fontWeight:600,cursor:'pointer',fontSize:13}}>✓ Valider</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal refus */}
      {refusModal&&(
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{...T.modalBox,maxWidth:420}}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Motif de refus</h3>
              <button onClick={()=>setRefusModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{padding:22,display:'flex',flexDirection:'column',gap:14}}>
              <label style={T.lbl}>Indiquez le motif du refus</label>
              <textarea value={motifRefus} onChange={e=>setMotifRefus(e.target.value)}
                placeholder="Ex: Prix trop bas, stock insuffisant…"
                rows={4}
                style={{...T.inp,resize:'vertical'}}/>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setRefusModal(null)} style={{...T.btnCancel,flex:1}}>Annuler</button>
                <button onClick={doRefuser} style={{flex:1,padding:'10px',borderRadius:8,background:'linear-gradient(90deg,#e53e3e,#991b1b)',color:'white',border:'none',fontWeight:600,cursor:'pointer',fontSize:14}}>Confirmer le refus</button>
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
  card:       {background:'white',borderRadius:14,border:'1px solid #dde5f4',boxShadow:'0 2px 10px rgba(0,55,133,0.05)'} as CSSProperties,
  statCard:   {background:'white',borderRadius:12,border:'1px solid #dde5f4',padding:'1.1rem 1.3rem',display:'flex',alignItems:'center',gap:13,boxShadow:'0 2px 8px rgba(0,55,133,0.04)'} as CSSProperties,
  th:         {fontSize:11,fontWeight:600,letterSpacing:'.8px',textTransform:'uppercase' as const,color:'#8a96b0',padding:'11px 14px',background:'#f4f7fd',borderBottom:'1px solid #dde5f4',textAlign:'left' as const,whiteSpace:'nowrap' as const},
  td:         {padding:'11px 14px',fontSize:13,borderBottom:'1px solid #f0f4fb',verticalAlign:'middle' as const},
  lbl:        {display:'block',fontSize:12,fontWeight:600,color:'#4a5578',marginBottom:5} as CSSProperties,
  inp:        {width:'100%',padding:'9px 12px',border:'1.5px solid #dde5f4',borderRadius:8,fontSize:14,outline:'none',color:'#0d1b3e',background:'white',boxSizing:'border-box' as const,fontFamily:'DM Sans,sans-serif'} as CSSProperties,
  btnCancel:  {padding:'9px 18px',borderRadius:8,border:'1.5px solid #dde5f4',background:'white',fontSize:14,cursor:'pointer',color:'#4a5578',fontFamily:'DM Sans,sans-serif'} as CSSProperties,
  overlay:    {position:'fixed' as const,inset:0,zIndex:200,background:'rgba(13,27,62,0.45)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'},
  modalBox:   {background:'white',borderRadius:14,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto' as const,boxShadow:'0 20px 60px rgba(0,55,133,0.2)',border:'1px solid #dde5f4'},
  modalHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'linear-gradient(90deg,#003785,#1465BB)',position:'sticky' as const,top:0},
  modalTitle: {fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'white',margin:0} as CSSProperties,
  modalClose: {background:'rgba(255,255,255,0.15)',border:'none',borderRadius:7,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'white'} as CSSProperties,
  iconBtn:    {width:28,height:28,borderRadius:6,border:'1.5px solid #dde5f4',background:'white',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'} as CSSProperties,
};