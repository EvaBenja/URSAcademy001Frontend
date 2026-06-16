import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { Truck, MapPin, Clock, Eye, X, Play, CheckCircle, XCircle, RefreshCw, User, Phone, Bell } from 'lucide-react';
import { livraisonsService, geoService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'Disponible — à prendre !', bg:'#dbeafe', color:'#1e40af'},
  validee:    {label:'Assignée — à confirmer',   bg:'#dbeafe', color:'#1e40af'},
  en_cours:   {label:'En livraison',             bg:'#dcfce7', color:'#166534'},
  rejetee:    {label:'Rejetée',                  bg:'#fee2e2', color:'#991b1b'},
  terminee:   {label:'Terminée',                 bg:'#f1f5f9', color:'#475569'},
};

const MOTIFS_REJET = [
  'Panne véhicule',
  'Rupture de stock',
  'Manque de carburant',
  'Zone inaccessible',
  'Indisponible / urgence personnelle',
  'Client introuvable',
  'Autre (préciser ci-dessous)',
];

export default function MesCoursesPage() {
  const { user }      = useAuth();
  const [livraisons,  setLivraisons]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState<any>(null);
  const [rejetModal,  setRejetModal]  = useState<any>(null);
  const [motifCat,    setMotifCat]    = useState(MOTIFS_REJET[0]);
  const [motifLibre,  setMotifLibre]  = useState('');
  const [saving,      setSaving]      = useState(false);
  const [onglet,      setOnglet]      = useState<'dispo'|'miennes'>('dispo');
  const [gpsActif,    setGpsActif]    = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const knownDispoIds = useRef<Set<number>>(new Set());
  const firstLoad      = useRef(true);

  const load = useCallback(async (silent = false) => {
    try {
      const res = await livraisonsService.getAll();
      const data = res.data || [];
      setLivraisons(data);
      setLastRefresh(new Date());

      const dispoIds = new Set<number>(
        data.filter((l:any) => !l.livreur_id && ['en_attente','validee'].includes(l.statut))
            .map((l:any) => l.id)
      );
      if (!firstLoad.current) {
        const nouvelles = [...dispoIds].filter(id => !knownDispoIds.current.has(id));
        if (nouvelles.length > 0) {
          toast.success(
            `🔔 ${nouvelles.length} nouvelle${nouvelles.length>1?'s':''} course${nouvelles.length>1?'s':''} disponible${nouvelles.length>1?'s':''} !`,
            { duration: 6000 }
          );
        }
      }
      knownDispoIds.current = dispoIds;
      firstLoad.current = false;
    } catch { if (!silent) toast.error('Erreur chargement courses'); }
    finally { setLoading(false); }
  }, []);

  const activerGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(
      pos => geoService.updatePosition(pos.coords.latitude, pos.coords.longitude)
        .then(() => setGpsActif(true)).catch(() => {}),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
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
      toast.success('Course prise ! Vous êtes en route 🚗');
      setDetail(null);
      setOnglet('miennes');
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Course déjà prise par un autre livreur'); }
    finally { setSaving(false); }
  };

  const openRejetModal = (livraison: any) => {
    setMotifCat(MOTIFS_REJET[0]);
    setMotifLibre('');
    setRejetModal(livraison);
  };

  const doRejeter = async () => {
    if (!rejetModal) return;
    const motifFinal = motifCat === 'Autre (préciser ci-dessous)'
      ? motifLibre.trim()
      : (motifLibre.trim() ? `${motifCat} — ${motifLibre.trim()}` : motifCat);

    if (!motifFinal) { toast.error('Veuillez préciser le motif'); return; }

    setSaving(true);
    try {
      await livraisonsService.rejeter(rejetModal.id, motifFinal, motifCat);
      toast.success('Course rejetée — coordinateur alerté');
      setRejetModal(null); setMotifLibre(''); setDetail(null); load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doTerminer = async (id: number) => {
    setSaving(true);
    try {
      await livraisonsService.updateStatut(id, 'terminee');
      toast.success('Course terminée ! Bien joué 👍');
      setDetail(null); load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const dispos     = livraisons.filter(l => !l.livreur_id && ['en_attente','validee'].includes(l.statut));
  const miennes    = livraisons.filter(l => Number(l.livreur_id) === Number(user?.id));
  const aConfirmer = miennes.filter(l => l.statut === 'validee').length;
  const enCours    = miennes.filter(l => l.statut === 'en_cours').length;

  const liste = onglet === 'dispo' ? dispos : miennes;

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Courses</h1>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
              Courses disponibles et vos courses en cours
            </p>
            {gpsActif
              ? <span style={{ fontSize:11, color:'#0a9e6e', background:'#dcfce7', padding:'3px 10px', borderRadius:20 }}>📍 GPS actif</span>
              : <button onClick={activerGPS} style={{ fontSize:11, color:'#d0a83a', background:'#fdf3d7', padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer' }}>📍 Activer GPS</button>}
          </div>
        </div>
        <button onClick={()=>load(false)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578' }}>
          <RefreshCw size={13}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {dispos.length > 0 && (
        <div style={{ background:'linear-gradient(90deg,#1e40af,#1d4ed8)', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Bell size={22} color="white"/>
            <span className="dot-pulse" style={{ position:'absolute', top:-3, right:-3, width:9, height:9, borderRadius:'50%', background:'#facc15', boxShadow:'0 0 0 2px #1d4ed8' }}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'white', margin:0 }}>
              {dispos.length} course{dispos.length>1?'s':''} disponible{dispos.length>1?'s':''} — soyez le premier !
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', margin:0 }}>Appuyez sur "Prendre la course" pour l'accepter</p>
          </div>
          <button onClick={()=>setOnglet('dispo')}
            style={{ padding:'8px 14px', borderRadius:8, background:'white', border:'none', color:'#1e40af', fontWeight:700, cursor:'pointer', fontSize:13, flexShrink:0 }}>
            Voir →
          </button>
        </div>
      )}

      {aConfirmer > 0 && (
        <div style={{ background:'linear-gradient(90deg,#7c3aed,#5b21b6)', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:12 }}>
          <Bell size={22} color="white" style={{flexShrink:0}}/>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'white', margin:0 }}>
              {aConfirmer} course{aConfirmer>1?'s':''} vous {aConfirmer>1?'ont':'a'} été assignée{aConfirmer>1?'s':''} par le coordinateur
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', margin:0 }}>Confirmez ou refusez avec un motif dans "Mes courses"</p>
          </div>
          <button onClick={()=>setOnglet('miennes')}
            style={{ padding:'8px 14px', borderRadius:8, background:'white', border:'none', color:'#5b21b6', fontWeight:700, cursor:'pointer', fontSize:13, flexShrink:0 }}>
            Voir →
          </button>
        </div>
      )}

      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          {label:'Disponibles', val:dispos.length,  color:'#3b82f6'},
          {label:'Mes courses', val:miennes.length,  color:'#1465BB'},
          {label:'En cours',    val:enCours,         color:'#0a9e6e'},
          {label:'Terminées',   val:miennes.filter(l=>l.statut==='terminee').length, color:'#7c3aed'},
        ].map(({label,val,color}) => (
          <div key={label} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1rem' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:16, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4', width:'fit-content' }}>
        <button onClick={()=>setOnglet('dispo')}
          style={{ padding:'8px 20px', borderRadius:7, border:'none', background:onglet==='dispo'?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:onglet==='dispo'?'white':'#4a5578', fontSize:13, fontWeight:onglet==='dispo'?600:400, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Bell size={14}/> Disponibles
          {dispos.length > 0 && <span className="badge-pulse" style={{ background:'#e53e3e', color:'white', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{dispos.length}</span>}
        </button>
        <button onClick={()=>setOnglet('miennes')}
          style={{ padding:'8px 20px', borderRadius:7, border:'none', background:onglet==='miennes'?'linear-gradient(90deg,#1465BB,#003785)':'transparent', color:onglet==='miennes'?'white':'#4a5578', fontSize:13, fontWeight:onglet==='miennes'?600:400, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Truck size={14}/> Mes courses
          {(enCours + aConfirmer) > 0 && <span style={{ background:'#0a9e6e', color:'white', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{enCours + aConfirmer}</span>}
        </button>
      </div>

      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:14 }}>
        {liste.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center', gridColumn:'1/-1' }}>
            <Truck size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>
              {onglet==='dispo' ? 'Aucune course disponible pour le moment' : 'Aucune course assignée'}
            </p>
          </div>
        ) : liste.map((l:any) => {
          const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
          const isDisponible = !l.livreur_id;
          const isAssigneeParCoord = Number(l.livreur_id) === Number(user?.id) && l.statut === 'validee';
          const client_nom      = l.client_nom      || l.vente?.client_nom;
          const client_tel      = l.client_telephone || l.vente?.client_telephone;
          const client_quartier = l.client_quartier  || l.vente?.client_quartier;
          return (
            <div key={l.id} className={isDisponible || isAssigneeParCoord ? 'card-highlight' : ''} style={{ background:'white', borderRadius:14,
              border:`1.5px solid ${isDisponible||isAssigneeParCoord?'#3b82f6':l.statut==='en_cours'?'#0a9e6e':'#dde5f4'}`,
              padding:18,
              boxShadow:isDisponible||isAssigneeParCoord?'0 4px 14px rgba(59,130,246,0.15)':l.statut==='en_cours'?'0 4px 14px rgba(10,158,110,0.15)':'0 2px 8px rgba(0,55,133,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems:'flex-start' }}>
                <div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>Course #{l.id}</span>
                  {l.vente_id && <span style={{ marginLeft:8, fontSize:10, background:'#dcfce7', color:'#166534', padding:'2px 7px', borderRadius:10 }}>Vente #{l.vente_id}</span>}
                  {isAssigneeParCoord && <span style={{ marginLeft:8, fontSize:10, background:'#ede9fe', color:'#5b21b6', padding:'2px 7px', borderRadius:10 }}>Assignée par coordinateur</span>}
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{sc.label}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                {l.zone_livraison && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}><MapPin size={12} color="#1465BB"/> {l.zone_livraison}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#8a96b0' }}><Clock size={11} color="#d0a83a"/> {l.date_livraison||'—'}</div>
                {client_nom && (
                  <div style={{ background:isDisponible?'#eff6ff':'#f0f4ff', borderRadius:8, padding:'8px 10px', marginTop:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#0d1b3e' }}><User size={12} color="#1465BB"/> {client_nom}</div>
                    {client_tel && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#1465BB', marginTop:2 }}><Phone size={11}/> {client_tel}</div>}
                    {client_quartier && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#8a96b0', marginTop:2 }}><MapPin size={11}/> {client_quartier}</div>}
                  </div>
                )}
                {l.motif_rejet && <p style={{ fontSize:12, color:'#e53e3e', margin:0 }}>⚠ {l.motif_rejet}</p>}
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>setDetail(l)}
                  style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Eye size={12}/> Détail
                </button>
                {isDisponible && (
                  <button onClick={()=>doAccepter(l.id)} disabled={saving}
                    style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#1e40af,#1d4ed8)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <Play size={12}/> Prendre la course
                  </button>
                )}
                {isAssigneeParCoord && (
                  <>
                    <button onClick={()=>openRejetModal(l)}
                      style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <XCircle size={12}/> Refuser
                    </button>
                    <button onClick={()=>doAccepter(l.id)} disabled={saving}
                      style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <CheckCircle size={12}/> Accepter
                    </button>
                  </>
                )}
                {!isDisponible && l.statut==='en_cours' && (
                  <>
                    <button onClick={()=>openRejetModal(l)}
                      style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <XCircle size={12}/> Rejeter
                    </button>
                    <button onClick={()=>doTerminer(l.id)} disabled={saving}
                      style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <CheckCircle size={12}/> Terminée
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Course #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {(detail.client_nom||detail.vente?.client_nom) && (
                <div style={{ background:'#e0f0ff', borderRadius:10, padding:'14px', border:'1px solid #93c5fd' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#1e40af', textTransform:'uppercase', margin:'0 0 8px' }}>📦 Infos client</p>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{detail.client_nom||detail.vente?.client_nom}</p>
                  {(detail.client_telephone||detail.vente?.client_telephone) && <p style={{ fontSize:13, color:'#1465BB', margin:'4px 0 0', display:'flex', alignItems:'center', gap:5 }}><Phone size={12}/>{detail.client_telephone||detail.vente?.client_telephone}</p>}
                  {(detail.client_quartier||detail.vente?.client_quartier) && <p style={{ fontSize:13, color:'#4a5578', margin:'2px 0 0', display:'flex', alignItems:'center', gap:5 }}><MapPin size={12}/>{detail.client_quartier||detail.vente?.client_quartier}</p>}
                </div>
              )}
              {[
                ['Zone',         detail.zone_livraison||'—'],
                ['Date',         detail.date_livraison||'—'],
                ['Statut',       STATUT[detail.statut]?.label||detail.statut],
                ['Vente liée',   detail.vente_id ? `#${detail.vente_id}` : '—'],
                ['Gestionnaire', detail.gestionnaire ? `${detail.gestionnaire.prenom||detail.gestionnaire.name||''} ${detail.gestionnaire.nom||''}`.trim() : '—'],
                ['Motif rejet',  detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
                {!detail.livreur_id && (
                  <button onClick={()=>doAccepter(detail.id)} disabled={saving}
                    style={{ width:'100%', padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#1e40af,#1d4ed8)', color:'white', border:'none', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Play size={15}/>{saving?'…':'Prendre cette course'}
                  </button>
                )}
                {Number(detail.livreur_id)===Number(user?.id) && detail.statut==='validee' && (
                  <>
                    <button onClick={()=>{openRejetModal(detail);setDetail(null);}} style={{ flex:1, padding:'10px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', minWidth:100 }}>Refuser</button>
                    <button onClick={()=>doAccepter(detail.id)} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>
                      {saving?'…':'✓ Accepter'}
                    </button>
                  </>
                )}
                {Number(detail.livreur_id)===Number(user?.id) && detail.statut==='en_cours' && (
                  <>
                    <button onClick={()=>{openRejetModal(detail);setDetail(null);}} style={{ flex:1, padding:'10px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', minWidth:100 }}>Rejeter</button>
                    <button onClick={()=>doTerminer(detail.id)} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>
                      {saving?'…':'✓ Marquer terminée'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejetModal && (
        <div onClick={()=>setRejetModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:440, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Rejeter la course #{rejetModal.id}</h3>
              <button onClick={()=>setRejetModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
                Le coordinateur sera alerté et pourra réassigner cette course.
              </p>
              <div>
                <label style={T.lbl}>Motif du rejet *</label>
                <select value={motifCat} onChange={e=>setMotifCat(e.target.value)} style={T.inp}>
                  {MOTIFS_REJET.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={T.lbl}>
                  Précision {motifCat==='Autre (préciser ci-dessous)' ? '* (obligatoire)' : '(optionnel)'}
                </label>
                <textarea value={motifLibre} onChange={e=>setMotifLibre(e.target.value)}
                  placeholder="Ajoutez un détail si nécessaire…" rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRejetModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={doRejeter} disabled={saving || (motifCat==='Autre (préciser ci-dessous)' && !motifLibre.trim())}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', opacity:saving || (motifCat==='Autre (préciser ci-dessous)' && !motifLibre.trim()) ?0.5:1 }}>
                  {saving?'…':'Confirmer le rejet'}
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
        @keyframes pulseDot { 0%{transform:scale(1);opacity:1;} 50%{transform:scale(1.6);opacity:.5;} 100%{transform:scale(1);opacity:1;} }
        .dot-pulse { animation: pulseDot 1.4s ease-in-out infinite; }
        @keyframes badgePulse { 0%{box-shadow:0 0 0 0 rgba(229,62,62,.6);} 70%{box-shadow:0 0 0 6px rgba(229,62,62,0);} 100%{box-shadow:0 0 0 0 rgba(229,62,62,0);} }
        .badge-pulse { animation: badgePulse 1.6s infinite; }
        @keyframes cardGlow { 0%{box-shadow:0 4px 14px rgba(59,130,246,0.15);} 50%{box-shadow:0 4px 22px rgba(59,130,246,0.35);} 100%{box-shadow:0 4px 14px rgba(59,130,246,0.15);} }
        .card-highlight { animation: cardGlow 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
