import { useState, useEffect, type CSSProperties } from 'react';
import { Award, MapPin, Truck, Trophy, Bell, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStore, toutMarquerLu, marquerNotifLue } from '../../store/ventesStore';

const STATUT_LIVREUR = {
  disponible: {label:'Disponible',bg:'#dcfce7',color:'#166534'},
  en_course:  {label:'En course', bg:'#fdf3d7',color:'#854d0e'},
  hors_ligne: {label:'Hors ligne',bg:'#f1f5f9',color:'#475569'},
};

export default function SuiviLivraisonsPage() {
  const { ventes, livreurs, notifs, classementVendeurs, notifsNonLues } = useStore();
  const [tab, setTab] = useState<'carte'|'classement'|'notifs'>('carte');
  const [tick, setTick] = useState(0);

  // Re-render toutes les 5s pour simuler le mouvement GPS
  useEffect(() => { const t = setInterval(()=>setTick(n=>n+1), 5000); return ()=>clearInterval(t); }, []);

  const classement   = classementVendeurs();
  const enLivraison  = ventes.filter(v=>v.statut==='en_livraison');
  const enAttente    = ventes.filter(v=>v.statut==='en_attente').length;
  const alertesStock = notifs.filter(n=>n.type==='rupture'&&!n.lu).length;

  return (
    <div style={{padding:28,background:'#f0f4fb',minHeight:'100vh'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:26}}>
        <div>
          <h1 style={T.h1}>Suivi en temps réel</h1>
          <p style={T.sub}>Carte des livreurs, classement vendeurs et notifications</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {notifsNonLues>0&&(
            <div style={{background:'#fee2e2',border:'1px solid #fecaca',borderRadius:10,padding:'8px 14px',display:'flex',alignItems:'center',gap:7}}>
              <Bell size={14} color="#e53e3e"/>
              <span style={{fontSize:13,fontWeight:600,color:'#991b1b'}}>{notifsNonLues} alerte{notifsNonLues>1?'s':''}</span>
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',gap:6,background:'#dcfce7',border:'1px solid #bbf7d0',borderRadius:10,padding:'8px 14px'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:'#0a9e6e',animation:'pulse 1.5s infinite'}}/>
            <span style={{fontSize:12,fontWeight:600,color:'#166534'}}>Temps réel</span>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      </div>

      {/* Stats globales */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:22}}>
        {[
          {label:'Ventes en attente',  val:enAttente,                                  color:'#d0a83a',bg:'#fdf3d7'},
          {label:'En livraison',       val:enLivraison.length,                         color:'#1465BB',bg:'#e0f0ff'},
          {label:'Livreurs actifs',    val:livreurs.filter(l=>l.statut==='en_course').length, color:'#0a9e6e',bg:'#dcfce7'},
          {label:'Livrées aujourd\'hui',val:ventes.filter(v=>v.statut==='livree').length,color:'#7c3aed',bg:'#ede9fe'},
          {label:'Alertes stock',      val:alertesStock,                               color:'#e53e3e',bg:'#fee2e2'},
        ].map(({label,val,color,bg})=>(
          <div key={label} style={T.statCard}>
            <p style={{fontFamily:'Playfair Display,serif',fontSize:22,fontWeight:700,color,lineHeight:1}}>{val}</p>
            <p style={{fontSize:11,color:'#8a96b0',marginTop:4}}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:18,background:'white',borderRadius:10,padding:4,border:'1px solid #dde5f4',width:'fit-content'}}>
        {([['carte','Carte GPS',MapPin],['classement','Classement',Trophy],['notifs','Notifications',Bell]] as const).map(([id,label,Icon])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'8px 20px',borderRadius:8,border:'none',background:tab===id?'linear-gradient(90deg,#1465BB,#003785)':'transparent',color:tab===id?'white':'#4a5578',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:8}}>
            <Icon size={14} color={tab===id?'white':'#4a5578'}/>
            {label}
            {id==='notifs'&&notifsNonLues>0&&<span style={{background:'#e53e3e',color:'white',fontSize:10,fontWeight:700,borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>{notifsNonLues}</span>}
          </button>
        ))}
      </div>

      {/* ── CARTE GPS ── */}
      {tab==='carte'&&(
        <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16}}>
          {/* Carte simulée */}
          <div style={{background:'linear-gradient(135deg,#e0f4fb,#e8f0ff)',borderRadius:14,border:'1px solid #dde5f4',position:'relative',overflow:'hidden',minHeight:480}}>
            <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,rgba(0,55,133,0.04) 0px,transparent 1px,transparent 30px),repeating-linear-gradient(90deg,rgba(0,55,133,0.04) 0px,transparent 1px,transparent 30px)'}}/>
            {/* Pins livreurs */}
            {livreurs.map((l,i)=>{
              const sc = STATUT_LIVREUR[l.statut];
              const x  = 10 + ((l.position.lng - 1.19) / 0.12) * 80;
              const y  = 10 + ((6.21 - l.position.lat) / 0.09) * 80;
              const venteRef = ventes.find(v=>v.livreurId===l.id&&v.statut==='en_livraison')?.ref;
              return (
                <div key={l.id} style={{position:'absolute',left:`${Math.max(5,Math.min(90,x))}%`,top:`${Math.max(5,Math.min(90,y))}%`,transform:'translate(-50%,-50%)',zIndex:10}}>
                  <div style={{position:'relative'}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:l.statut==='en_course'?'linear-gradient(135deg,#1465BB,#003785)':l.statut==='disponible'?'#0a9e6e':'#94a3b8',border:'3px solid white',boxShadow:'0 3px 10px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white',cursor:'pointer'}}>
                      {l.nom[0]}
                    </div>
                    <div style={{position:'absolute',bottom:-28,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.75)',color:'white',fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4,whiteSpace:'nowrap'}}>
                      {l.nom} {venteRef?`· ${venteRef}`:''}
                    </div>
                    {l.statut==='en_course'&&<div style={{position:'absolute',top:-3,right:-3,width:10,height:10,borderRadius:'50%',background:'#d0a83a',border:'2px solid white'}}/>}
                  </div>
                </div>
              );
            })}
            {/* Légende */}
            <div style={{position:'absolute',bottom:14,left:14,background:'rgba(255,255,255,0.9)',borderRadius:10,padding:'10px 14px',border:'1px solid #dde5f4'}}>
              <p style={{fontSize:11,fontWeight:700,color:'#4a5578',marginBottom:6}}>LÉGENDE</p>
              {[['#1465BB','En course'],['#0a9e6e','Disponible'],['#94a3b8','Hors ligne']].map(([c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:c}}/>
                  <span style={{fontSize:11,color:'#4a5578'}}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{position:'absolute',top:14,left:14,background:'rgba(255,255,255,0.9)',borderRadius:8,padding:'6px 12px'}}>
              <p style={{fontSize:11,color:'#4a5578',fontWeight:600,display:'inline-flex',alignItems:'center',gap:6}}>
                <MapPin size={14} color="#4a5578"/>
                Zone de Lomé — Simulation GPS
              </p>
            </div>
          </div>

          {/* Panel livreurs */}
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div style={{...T.card,padding:'1rem'}}>
              <h3 style={{...T.cardTitle,fontSize:15,marginBottom:12}}>Livreurs ({livreurs.length})</h3>
              {livreurs.map(l=>{
                const sc = STATUT_LIVREUR[l.statut];
                const vente = ventes.find(v=>v.livreurId===l.id&&v.statut==='en_livraison');
                return (
                  <div key={l.id} style={{padding:'10px',borderRadius:9,border:'1px solid #f0f4fb',marginBottom:8,background:'white'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:vente?6:0}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#1465BB,#003785)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'white',flexShrink:0}}>{l.nom[0]}</div>
                      <div style={{flex:1}}>
                        <p style={{fontSize:13,fontWeight:600,color:'#0d1b3e'}}>{l.nom}</p>
                        <p style={{fontSize:11,color:'#8a96b0'}}>{l.zone}</p>
                      </div>
                      <span style={{background:sc.bg,color:sc.color,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:8}}>{sc.label}</span>
                    </div>
                    {vente&&(
                      <p style={{fontSize:11,color:'#1465BB',background:'#e0f0ff',borderRadius:5,padding:'3px 8px',display:'inline-flex',alignItems:'center',gap:6}}>
                        <Truck size={14} color="#1465BB"/>
                        {vente.ref} · {vente.produitNom}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CLASSEMENT ── */}
      {tab==='classement'&&(
        <div style={{...T.card,maxWidth:700}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
            <Trophy size={18} color="#d0a83a"/>
            <h2 style={T.cardTitle}>Classement vendeurs — Aujourd'hui</h2>
          </div>
          {classement.length===0?(
            <p style={{fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'#8a96b0',textAlign:'center',padding:'30px 0'}}>Aucune vente aujourd'hui</p>
          ):classement.map((c,i)=>{
            const medals = [
              <Award key="gold" size={18} color="#cfa100"/>,
              <Award key="silver" size={18} color="#9ca3af"/>,
              <Award key="bronze" size={18} color="#a16207"/>,
            ];
            const pct    = classement[0].total>0?(c.total/classement[0].total)*100:0;
            return (
              <div key={c.vendeurId} style={{marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:5}}>
                  <span style={{fontSize:20,width:28}}>{medals[i]||`#${i+1}`}</span>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#1465BB,#003785)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'white'}}>{c.nom[0]}</div>
                  <div style={{flex:1}}>
                    <p style={{fontSize:14,fontWeight:600,color:'#0d1b3e'}}>{c.nom}</p>
                    <p style={{fontSize:12,color:'#8a96b0'}}>{c.nb} vente{c.nb>1?'s':''} · {c.livrees} livrée{c.livrees>1?'s':''}</p>
                  </div>
                  <span style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:700,color:'#1465BB'}}>{c.total.toLocaleString()} FCFA</span>
                </div>
                <div style={{background:'#f0f4fb',borderRadius:10,height:6,overflow:'hidden',marginLeft:40}}>
                  <div style={{height:'100%',width:`${pct}%`,background:i===0?'linear-gradient(90deg,#d0a83a,#ae8f1e)':i===1?'linear-gradient(90deg,#94a3b8,#64748b)':'linear-gradient(90deg,#cd7c2a,#92400e)',borderRadius:10,transition:'width .5s ease'}}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab==='notifs'&&(
        <div style={{...T.card,maxWidth:700}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <Bell size={18} color="#1465BB"/>
            <h2 style={T.cardTitle}>Centre de notifications</h2>
            {notifsNonLues>0&&(
              <button onClick={toutMarquerLu} style={{marginLeft:'auto',padding:'6px 14px',borderRadius:7,border:'1.5px solid #dde5f4',background:'white',fontSize:12,cursor:'pointer',color:'#1465BB',fontFamily:'DM Sans,sans-serif'}}>
                Tout marquer lu
              </button>
            )}
          </div>
          {notifs.length===0?(
            <p style={{fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'#8a96b0',textAlign:'center',padding:'30px 0'}}>Aucune notification</p>
          ):notifs.map(n=>{
            const config = {
              rupture:       {Icon:AlertTriangle, color:'#e53e3e', bg:'#fee2e2'},
              en_attente:    {Icon:RefreshCw,     color:'#d0a83a', bg:'#fdf3d7'},
              non_livre:     {Icon:AlertTriangle, color:'#e53e3e', bg:'#fee2e2'},
              rejet_livreur: {Icon:AlertTriangle, color:'#e53e3e', bg:'#fee2e2'},
              pas_livreur:   {Icon:AlertTriangle, color:'#d0a83a', bg:'#fdf3d7'},
              info:          {Icon:CheckCircle,   color:'#0a9e6e', bg:'#dcfce7'},
            }[n.type]||{Icon:Bell,color:'#1465BB',bg:'#e0f0ff'};
            const Icon = config.Icon;
            return (
              <div key={n.id} onClick={()=>marquerNotifLue(n.id)}
                style={{display:'flex',alignItems:'flex-start',gap:12,padding:'11px 14px',borderRadius:10,marginBottom:8,background:n.lu?'#f8faff':config.bg,border:`1px solid ${n.lu?'#f0f4fb':config.color+'33'}`,cursor:'pointer',opacity:n.lu?0.65:1,transition:'all .15s'}}>
                <div style={{width:34,height:34,borderRadius:9,background:n.lu?'#f0f4fb':config.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1px solid ${config.color}33`}}>
                  <Icon size={15} color={config.color}/>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:n.lu?400:600,color:'#0d1b3e',lineHeight:1.4}}>{n.message}</p>
                  <p style={{fontSize:11,color:'#8a96b0',marginTop:3}}>{n.date}</p>
                </div>
                {!n.lu&&<div style={{width:8,height:8,borderRadius:'50%',background:config.color,flexShrink:0,marginTop:4}}/>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const T = {
  h1:        {fontFamily:'Playfair Display,serif',fontSize:24,fontWeight:700,color:'#0d1b3e',margin:0} as CSSProperties,
  sub:       {fontFamily:'Cormorant Garamond,serif',fontSize:16,color:'#4a5578',marginTop:4} as CSSProperties,
  card:      {background:'white',borderRadius:14,border:'1px solid #dde5f4',padding:'1.4rem',boxShadow:'0 2px 10px rgba(0,55,133,0.05)'} as CSSProperties,
  cardTitle: {fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,color:'#0d1b3e',margin:0} as CSSProperties,
  statCard:  {background:'white',borderRadius:12,border:'1px solid #dde5f4',padding:'1.1rem 1.3rem',boxShadow:'0 2px 8px rgba(0,55,133,0.04)'} as CSSProperties,
};