import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { Truck, MapPin, Clock, Eye, X, Play, CheckCircle, XCircle, RefreshCw, User } from 'lucide-react';
import { livraisonsService, geoService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente validation', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée — à accepter',  bg:'#dbeafe', color:'#1e40af'},
  en_cours:   {label:'En cours',              bg:'#dcfce7', color:'#166534'},
  rejetee:    {label:'Rejetée',               bg:'#fee2e2', color:'#991b1b'},
  terminee:   {label:'Terminée',              bg:'#f1f5f9', color:'#475569'},
};

export default function MesLivraisonsPage() {
  const { user }     = useAuth();
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [detail,     setDetail]     = useState<any>(null);
  const [rejetModal, setRejetModal] = useState<any>(null);
  const [motif,      setMotif]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [filter,     setFilter]     = useState('tous');
  const [gpsActif,   setGpsActif]   = useState(false);
  const [lastRefresh,setLastRefresh]= useState(new Date());

  const load = useCallback(async (silent = false) => {
    try {
      const res = await livraisonsService.getAll();
      // Filtrer les livraisons où ce livreur est assigné
      const miennes = (res.data || []).filter(
        (l:any) => Number(l.livreur_id) === Number(user?.id)
      );
      setLivraisons(miennes);
      setLastRefresh(new Date());
    } catch {
      if (!silent) toast.error('Erreur chargement livraisons');
    } finally { setLoading(false); }
  }, [user?.id]);

  const activerGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(
      pos => {
        geoService.updatePosition(pos.coords.latitude, pos.coords.longitude)
          .then(() => setGpsActif(true))
          .catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    load();
    activerGPS();
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [load, activerGPS]);

  const doAccepter = async (id: number) => {
    setSaving(true);
    try {
      await livraisonsService.accepter(id);
      toast.success('Livraison acceptée — vous êtes en route !');
      setDetail(null);
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doRejeter = async () => {
    if (!rejetModal || !motif.trim()) { toast.error('Le motif est obligatoire'); return; }
    setSaving(true);
    try {
      await livraisonsService.rejeter(rejetModal.id, motif);
      toast.success('Livraison rejetée — coordinateur alerté');
      setRejetModal(null); setMotif(''); setDetail(null);
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doTerminer = async (id: number) => {
    setSaving(true);
    try {
      await livraisonsService.updateStatut(id, 'terminee');
      toast.success('Livraison marquée terminée !');
      setDetail(null);
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'tous'
    ? livraisons
    : livraisons.filter(l => l.statut === filter);

  const validees  = livraisons.filter(l => l.statut === 'validee').length;
  const enCours   = livraisons.filter(l => l.statut === 'en_cours').length;
  const terminees = livraisons.filter(l => l.statut === 'terminee').length;

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement de vos livraisons…
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Livraisons</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
              Livraisons assignées par le gestionnaire
            </p>
            {gpsActif
              ? <span style={{ fontSize:11, color:'#0a9e6e', background:'#dcfce7', padding:'3px 10px', borderRadius:20 }}>📍 GPS actif</span>
              : <button onClick={activerGPS} style={{ fontSize:11, color:'#d0a83a', background:'#fdf3d7', padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer' }}>📍 Activer GPS</button>
            }
          </div>
        </div>
        <button onClick={()=>load(false)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578' }}>
          <RefreshCw size={13}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Alerte livraisons à accepter */}
      {validees > 0 && (
        <div style={{ background:'linear-gradient(90deg,#1e40af,#1d4ed8)', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Truck size={18} color="white"/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'white', margin:0 }}>
              {validees} livraison{validees>1?'s':''} en attente de votre acceptation !
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', margin:0 }}>Cliquez sur "Accepter" pour démarrer</p>
          </div>
          <button onClick={()=>setFilter('validee')} style={{ padding:'8px 14px', borderRadius:8, background:'white', border:'none', color:'#1e40af', fontWeight:700, cursor:'pointer', fontSize:13, flexShrink:0 }}>
            Voir →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',              val:livraisons.length, color:'#1465BB', s:'tous'     },
          {label:'À accepter',         val:validees,          color:'#3b82f6', s:'validee'  },
          {label:'En cours',           val:enCours,           color:'#0a9e6e', s:'en_cours' },
          {label:'Terminées',          val:terminees,         color:'#7c3aed', s:'terminee' },
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1rem', cursor:'pointer', transition:'all .15s' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','validee','en_cours','rejetee','terminee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer', fontWeight:filter===s?600:400 }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0', alignSelf:'center' }}>
          {filtered.length} livraison{filtered.length>1?'s':''}
        </span>
      </div>

      {/* Cards */}
      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center', gridColumn:'1/-1' }}>
            <Truck size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0', margin:0 }}>
              {filter==='validee' ? 'Aucune livraison à accepter pour le moment' : 'Aucune livraison'}
            </p>
          </div>
        ) : filtered.map((l:any) => {
          const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
          return (
            <div key={l.id} style={{ background:'white', borderRadius:14, border:`1.5px solid ${l.statut==='validee'?'#3b82f6':'#dde5f4'}`, padding:18, boxShadow:l.statut==='validee'?'0 4px 14px rgba(59,130,246,0.15)':'0 2px 8px rgba(0,55,133,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems:'flex-start' }}>
                <div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>Livraison #{l.id}</span>
                  {l.statut === 'validee' && (
                    <span style={{ marginLeft:8, fontSize:10, background:'#3b82f6', color:'white', padding:'2px 8px', borderRadius:10, fontWeight:700 }}>ACTION REQUISE</span>
                  )}
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{sc.label}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                {l.zone_livraison && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}>
                    <MapPin size={12} color="#1465BB"/> {l.zone_livraison}
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}>
                  <Clock size={12} color="#d0a83a"/>
                  Date : {l.date_livraison || new Date(l.created_at).toLocaleDateString('fr-FR')}
                </div>
                {l.gestionnaire && (
                  <div style={{ fontSize:12, color:'#8a96b0' }}>
                    Gestionnaire : {l.gestionnaire.prenom||l.gestionnaire.name} {l.gestionnaire.nom||''}
                  </div>
                )}
                {l.notes && <p style={{ fontSize:12, color:'#8a96b0', fontStyle:'italic', margin:0 }}>"{l.notes}"</p>}
                {l.motif_rejet && <p style={{ fontSize:12, color:'#e53e3e', margin:0, fontWeight:500 }}>⚠ {l.motif_rejet}</p>}
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>setDetail(l)}
                  style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Eye size={12}/> Détail
                </button>
                {l.statut === 'validee' && (
                  <>
                    <button onClick={()=>doAccepter(l.id)} disabled={saving}
                      style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <Play size={12}/> Accepter
                    </button>
                    <button onClick={()=>{setRejetModal(l);setMotif('');}}
                      style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <XCircle size={12}/> Refuser
                    </button>
                  </>
                )}
                {l.statut === 'en_cours' && (
                  <button onClick={()=>doTerminer(l.id)} disabled={saving}
                    style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <CheckCircle size={12}/> Marquer terminée
                  </button>
                )}
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
              <h3 style={T.modalTitle}>Livraison #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Zone',          detail.zone_livraison||'—'],
                ['Client',        detail.vente?.client_nom||'—'],
                ['Tél. client',   detail.vente?.client_telephone||'—'],
                ['Quartier',      detail.vente?.client_quartier||detail.zone_livraison||'—'],
                ['Date livraison',detail.date_livraison||'—'],
                ['Statut',        STATUT[detail.statut]?.label||detail.statut],
                ['Gestionnaire',  detail.gestionnaire ? `${detail.gestionnaire.prenom||detail.gestionnaire.name||''} ${detail.gestionnaire.nom||''}`.trim() : '—'],
                ['Notes',         detail.notes||'—'],
                ['Motif rejet',   detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
                {detail.statut === 'validee' && (
                  <>
                    <button onClick={()=>{setRejetModal(detail);setDetail(null);setMotif('');}}
                      style={{ flex:1, padding:'11px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', minWidth:100 }}>
                      Refuser
                    </button>
                    <button onClick={()=>doAccepter(detail.id)} disabled={saving}
                      style={{ flex:2, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:700, cursor:'pointer', minWidth:120 }}>
                      {saving ? '…' : '✓ Accepter la livraison'}
                    </button>
                  </>
                )}
                {detail.statut === 'en_cours' && (
                  <button onClick={()=>doTerminer(detail.id)} disabled={saving}
                    style={{ width:'100%', padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>
                    {saving ? '…' : '✓ Marquer comme terminée'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal rejet */}
      {rejetModal && (
        <div onClick={()=>setRejetModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Refuser livraison #{rejetModal.id}</h3>
              <button onClick={()=>setRejetModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
                Le coordinateur sera alerté et pourra réassigner la livraison.
              </p>
              <div>
                <label style={T.lbl}>Motif du refus * (obligatoire)</label>
                <textarea value={motif} onChange={e=>setMotif(e.target.value)}
                  placeholder="Ex: Zone inaccessible, panne véhicule, urgence personnelle…"
                  rows={4}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRejetModal(null)}
                  style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578', fontSize:14 }}>
                  Annuler
                </button>
                <button onClick={doRejeter} disabled={saving||!motif.trim()}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, opacity:saving||!motif.trim()?0.5:1 }}>
                  {saving ? 'Refus…' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:768px){
          .stats-4   { grid-template-columns: repeat(2,1fr) !important; }
          .cards-grid{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
