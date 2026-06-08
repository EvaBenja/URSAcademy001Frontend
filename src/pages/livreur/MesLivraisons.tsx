import { useState, useEffect, type CSSProperties } from 'react';
import { Truck, MapPin, Clock, Eye, X, Play, CheckCircle, XCircle } from 'lucide-react';
import { livraisonsService, geoService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af'},
  en_cours:   {label:'En cours',   bg:'#dcfce7', color:'#166634'},
  rejetee:    {label:'Rejetée',    bg:'#fee2e2', color:'#991b1b'},
  terminee:   {label:'Terminée',   bg:'#f1f5f9', color:'#475569'},
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

  useEffect(() => { load(); activerGPS(); }, []);

  const load = async () => {
    try {
      const res = await livraisonsService.getAll();
      setLivraisons((res.data || []).filter((l:any) => Number(l.livreur_id) === Number(user?.id)));
    } catch { toast.error('Erreur chargement livraisons'); }
    finally { setLoading(false); }
  };

  const activerGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => geoService.updatePosition(pos.coords.latitude, pos.coords.longitude)
        .then(() => setGpsActif(true)).catch(() => {}),
      () => {}
    );
  };

  const doAccepter = async (id: number) => {
    setSaving(true);
    try { await livraisonsService.accepter(id); toast.success('Livraison acceptée !'); setDetail(null); load(); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doRejeter = async () => {
    if (!rejetModal || !motif.trim()) { toast.error('Motif obligatoire'); return; }
    setSaving(true);
    try { await livraisonsService.rejeter(rejetModal.id, motif); toast.success('Livraison rejetée — coordinateur alerté'); setRejetModal(null); setMotif(''); setDetail(null); load(); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doTerminer = async (id: number) => {
    setSaving(true);
    try { await livraisonsService.updateStatut(id, 'terminee'); toast.success('Livraison terminée !'); setDetail(null); load(); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'tous' ? livraisons : livraisons.filter(l => l.statut === filter);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h1 style={T.h1}>Mes Livraisons</h1>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', margin:0 }}>
            Gérez les livraisons assignées par le gestionnaire
          </p>
          {gpsActif
            ? <span style={{ fontSize:11, color:'#0a9e6e', background:'#dcfce7', padding:'3px 10px', borderRadius:20 }}>📍 GPS actif</span>
            : <button onClick={activerGPS} style={{ fontSize:11, color:'#d0a83a', background:'#fdf3d7', padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer' }}>📍 Activer GPS</button>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',    val:livraisons.length,                                   color:'#1465BB', s:'tous'     },
          {label:'Validées', val:livraisons.filter(l=>l.statut==='validee').length,   color:'#3b82f6', s:'validee'  },
          {label:'En cours', val:livraisons.filter(l=>l.statut==='en_cours').length,  color:'#0a9e6e', s:'en_cours' },
          {label:'Terminées',val:livraisons.filter(l=>l.statut==='terminee').length,  color:'#7c3aed', s:'terminee' },
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem', cursor:'pointer' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','validee','en_cours','rejetee','terminee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center', gridColumn:'1/-1' }}>
            <Truck size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>
              {filter==='validee' ? 'Aucune livraison validée à accepter' : 'Aucune livraison'}
            </p>
          </div>
        ) : filtered.map((l:any) => {
          const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
          return (
            <div key={l.id} style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:18, boxShadow:'0 2px 8px rgba(0,55,133,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>Livraison #{l.id}</span>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                {l.zone_livraison && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}><MapPin size={12} color="#1465BB"/>{l.zone_livraison}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}><Clock size={12} color="#d0a83a"/> {l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</div>
                {l.notes && <p style={{ fontSize:12, color:'#8a96b0', fontStyle:'italic', margin:0 }}>"{l.notes}"</p>}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>setDetail(l)} style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Eye size={12}/> Détail
                </button>
                {l.statut === 'validee' && (
                  <>
                    <button onClick={()=>doAccepter(l.id)} disabled={saving}
                      style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <Play size={12}/> Accepter
                    </button>
                    <button onClick={()=>{setRejetModal(l);setMotif('');}}
                      style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <XCircle size={12}/> Rejeter
                    </button>
                  </>
                )}
                {l.statut === 'en_cours' && (
                  <button onClick={()=>doTerminer(l.id)} disabled={saving}
                    style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <CheckCircle size={12}/> Terminer
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
                ['Zone',        detail.zone_livraison||'—'],
                ['Date',        detail.date_livraison||'—'],
                ['Statut',      STATUT[detail.statut]?.label||detail.statut],
                ['Gestionnaire',detail.gestionnaire ? `${detail.gestionnaire.prenom||detail.gestionnaire.name||''} ${detail.gestionnaire.nom||''}` : '—'],
                ['Notes',       detail.notes||'—'],
                ['Motif rejet', detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:8, flexWrap:'wrap' }}>
                {detail.statut === 'validee' && (
                  <>
                    <button onClick={()=>{setRejetModal(detail);setDetail(null);setMotif('');}} style={{ flex:1, padding:'10px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', minWidth:100 }}>Rejeter</button>
                    <button onClick={()=>doAccepter(detail.id)} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', minWidth:100 }}>Accepter</button>
                  </>
                )}
                {detail.statut === 'en_cours' && (
                  <button onClick={()=>doTerminer(detail.id)} disabled={saving} style={{ width:'100%', padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontWeight:600, cursor:'pointer' }}>
                    {saving?'…':'Marquer terminée'}
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
              <h3 style={T.modalTitle}>Rejeter #{rejetModal.id}</h3>
              <button onClick={()=>setRejetModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={T.lbl}>Motif du rejet * (le coordinateur sera alerté)</label>
                <textarea value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Ex: Zone inaccessible…" rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRejetModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={doRejeter} disabled={saving||!motif.trim()} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', opacity:saving||!motif.trim()?0.5:1 }}>
                  {saving?'Rejet…':'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr)!important;} .cards-grid{grid-template-columns:1fr!important;}}`}</style>
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
