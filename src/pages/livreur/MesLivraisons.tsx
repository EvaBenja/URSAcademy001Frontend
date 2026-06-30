import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { Truck, MapPin, Clock, Eye, X, Play, CheckCircle, XCircle, RefreshCw, User, Phone, Bell } from 'lucide-react';
import { livraisonsService, geoService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotificationSound } from '../../hooks/useNotificationSound';
import CopyPhone from '../../components/ui/CopyPhone';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente:                {label:'Disponible — à prendre !',     bg:'#dbeafe', color:'#1e40af'},
  validee:                   {label:'Assignée — à confirmer',       bg:'#dbeafe', color:'#1e40af'},
  en_cours:                  {label:'En livraison',                 bg:'#dcfce7', color:'#166534'},
  rejetee:                   {label:'Rejetée',                      bg:'#fee2e2', color:'#991b1b'},
  livree_attente_validation: {label:'Clôturée — attente gestionnaire', bg:'#ede9fe', color:'#5b21b6'},
  terminee:                  {label:'Terminée',                     bg:'#f1f5f9', color:'#475569'},
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
  const [clotureModal,    setClotureModal]    = useState<any>(null);
  const [produitsStatuts, setProduitsStatuts] = useState<{id:number;statut:'livre'|'non_livre'}[]>([]);
  const [notesCloture,    setNotesCloture]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [onglet,      setOnglet]      = useState<'dispo'|'miennes'>('dispo');
  const [gpsActif,    setGpsActif]    = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const knownDispoIds  = useRef<Set<number>>(new Set());
  const knownAssignIds = useRef<Set<number>>(new Set());
  const firstLoad      = useRef(true);
  const { play }       = useNotificationSound();

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
      // Courses nouvellement assignées à CE livreur (non lues)
      const assignIds = new Set<number>(
        data.filter((l:any) => l.notif_livreur_lu === false && l.statut === 'validee')
            .map((l:any) => l.id)
      );

      if (!firstLoad.current) {
        const nouvelleDispo   = [...dispoIds].filter(id => !knownDispoIds.current.has(id));
        const nouvelleAssign  = [...assignIds].filter(id => !knownAssignIds.current.has(id));

        if (nouvelleDispo.length > 0) {
          play();
          toast.success(
            `🔔 ${nouvelleDispo.length} nouvelle${nouvelleDispo.length>1?'s':''} course${nouvelleDispo.length>1?'s':''} disponible${nouvelleDispo.length>1?'s':''} !`,
            { duration: 6000 }
          );
        }
        if (nouvelleAssign.length > 0) {
          play();
          toast.success(`📦 Course assignée — vous avez une nouvelle livraison !`, { duration: 8000 });
        }
      }
      knownDispoIds.current  = dispoIds;
      knownAssignIds.current = assignIds;
      firstLoad.current = false;
    } catch { if (!silent) toast.error('Erreur chargement courses'); }
    finally { setLoading(false); }
  }, [play]);

  const watchIdRef = useRef<number|null>(null);

  const activerGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par ce navigateur');
      return;
    }
    // Nettoyer un éventuel watcher précédent
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    toast.loading('Activation du GPS…', { id: 'gps-activation' });
    const id = navigator.geolocation.watchPosition(
      pos => {
        geoService.updatePosition(pos.coords.latitude, pos.coords.longitude)
          .then(() => {
            setGpsActif(true);
            toast.success('GPS activé ✓', { id: 'gps-activation', duration: 3000 });
          })
          .catch(() => {});
      },
      err => {
        toast.dismiss('gps-activation');
        if (err.code === 1) {
          toast.error('Permission GPS refusée — autorisez la localisation dans les paramètres de votre navigateur');
        } else if (err.code === 2) {
          toast.error('Position GPS introuvable — vérifiez votre connexion');
        } else {
          toast.error('Erreur GPS — réessayez');
        }
        setGpsActif(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    watchIdRef.current = id;
  }, []);

  const desactiverGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsActif(false);
    toast.success('GPS désactivé');
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

  const openClotureModal = (livraison: any) => {
    const statuts = (livraison.produits || []).map((lp: any) => ({ id: lp.id, statut: 'livre' as const }));
    setProduitsStatuts(statuts);
    setNotesCloture('');
    setClotureModal(livraison);
  };

  const toggleStatutProduit = (id: number, statut: 'livre'|'non_livre') => {
    setProduitsStatuts(prev => prev.map(p => p.id === id ? { ...p, statut } : p));
  };

  const doCloturer = async () => {
    if (!clotureModal) return;
    setSaving(true);
    try {
      await livraisonsService.cloturer(clotureModal.id, {
        produits_statuts: produitsStatuts,
        notes_cloture: notesCloture,
      });
      toast.success('Course clôturée — en attente de validation du gestionnaire');
      setClotureModal(null); setDetail(null); load(true);
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
              ? <button onClick={desactiverGPS} style={{ fontSize:11, color:'#0a9e6e', background:'#dcfce7', padding:'4px 12px', borderRadius:20, border:'1px solid #86efac', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#0a9e6e', display:'inline-block' }}/>
                  GPS actif — toucher pour désactiver
                </button>
              : <button onClick={activerGPS} style={{ fontSize:11, color:'#e53e3e', background:'#fee2e2', padding:'4px 12px', borderRadius:20, border:'1px solid #fecaca', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#e53e3e', display:'inline-block' }}/>
                  GPS désactivé — toucher pour activer
                </button>}
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

      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:14 }}>
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
          // Coordonnées de localisation client (stockées en vendeur_latitude/longitude car le vendeur
          // colle le lien de localisation envoyé PAR le client)
          const client_lat = l.client_latitude || l.vendeur_latitude || l.vente?.vendeur_latitude;
          const client_lng = l.client_longitude || l.vendeur_longitude || l.vente?.vendeur_longitude;
          // Infos vendeur (source de la vente)
          const vendeur = l.vente?.caissiere;
          const nomVendeur = vendeur ? `${vendeur.prenom||vendeur.name||''} ${vendeur.nom||''}`.trim() : null;
          // Produits de la vente
          const produits = l.vente?.items?.length > 0 ? l.vente.items : null;
          const noteUrgence = l.vente?.note_urgence;
          const estExpedition = l.vente?.est_expedition;
          // Nouvelle assignation non lue par le livreur
          const isNouvelle = isAssigneeParCoord && !l.notif_livreur_lu;
          // Total à encaisser (calculé hors JSX pour éviter les IIFE)
          const totalCourse = produits
            ? produits.reduce((s:number,it:any)=>s+Number(it.sous_total||(it.prix_vendeur||it.prix_unitaire)*it.quantite-(it.remise||0)),0)
            : 0;
          return (
            <div key={l.id} className={isDisponible || isAssigneeParCoord ? 'card-highlight' : ''} style={{ background:'white', borderRadius:14,
              border:`1.5px solid ${isDisponible||isAssigneeParCoord?'#3b82f6':l.statut==='en_cours'?'#0a9e6e':'#dde5f4'}`,
              padding:18,
              boxShadow:isDisponible||isAssigneeParCoord?'0 4px 14px rgba(59,130,246,0.15)':l.statut==='en_cours'?'0 4px 14px rgba(10,158,110,0.15)':'0 2px 8px rgba(0,55,133,0.04)' }}>
              {/* Badge notification nouvelle assignation */}
              {isNouvelle && (
                <div onClick={()=>livraisonsService.notifLue(l.id).then(()=>load())}
                  style={{ background:'linear-gradient(90deg,#e53e3e,#c53030)', borderRadius:8, padding:'8px 14px', marginBottom:10, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>🔔</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:'white', margin:0 }}>Nouvelle course assignée !</p>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.8)', margin:0 }}>Toucher pour marquer comme vue</p>
                  </div>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, minWidth:0 }}>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>Course #{l.id}</span>
                  {l.vente_id && <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap' }}>Vente #{l.vente_id}</span>}
                  {isAssigneeParCoord && <span style={{ fontSize:10, background:'#ede9fe', color:'#5b21b6', padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap' }}>Assignée par coordinateur</span>}
                  {estExpedition && <span style={{ fontSize:10, background:'#fef9c3', color:'#854d0e', padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap', fontWeight:700 }}>📦 Expédition</span>}
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{sc.label}</span>
              </div>
              {/* Note d'urgence — affichée en rouge bien visible */}
              {noteUrgence && (
                <div style={{ background:'#fee2e2', border:'1.5px solid #fca5a5', borderRadius:8, padding:'8px 12px', marginBottom:10, display:'flex', alignItems:'flex-start', gap:8 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>🚨</span>
                  <div>
                    <p style={{ fontSize:12, fontWeight:700, color:'#991b1b', margin:0, textTransform:'uppercase', letterSpacing:'.5px' }}>URGENT</p>
                    <p style={{ fontSize:13, color:'#7f1d1d', margin:'2px 0 0' }}>{noteUrgence}</p>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:12 }}>
                {l.zone_livraison && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}><MapPin size={12} color="#1465BB"/> {l.zone_livraison}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#8a96b0' }}><Clock size={11} color="#d0a83a"/> {l.date_livraison||'—'}</div>

                {/* Vendeur source — toutes infos visibles */}
                <div style={{ background:'#f5f3ff', borderRadius:8, padding:'8px 10px', border:'1px solid #ddd6fe' }}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#5b21b6', textTransform:'uppercase', margin:'0 0 5px', letterSpacing:'.5px' }}>👤 Vendeur / Source</p>
                  {nomVendeur
                    ? <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{nomVendeur}</p>
                    : <p style={{ fontSize:12, color:'#8a96b0', margin:0, fontStyle:'italic' }}>Non renseigné</p>}
                  {vendeur?.telephone
                    ? <div style={{ marginTop:4 }}><CopyPhone tel={vendeur.telephone}/></div>
                    : <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>Pas de numéro renseigné</p>}
                </div>

                {/* Produits de la vente */}
                {produits && produits.length > 0 && (
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, color:'#1e40af', textTransform:'uppercase', margin:'0 0 4px', letterSpacing:'.5px' }}>📦 Produits</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {produits.map((it:any) => (
                        <div key={it.id} style={{ background:'#dbeafe', borderRadius:8, padding:'5px 10px', fontSize:11 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4, color:'#1e40af', fontWeight:600 }}>
                            {it.produit?.nom} ×{it.quantite}
                            {it.couleur && <span style={{ background:'white', color:'#1465BB', borderRadius:4, padding:'0 5px', fontSize:9, fontWeight:700 }}>{it.couleur}</span>}
                          </div>
                          <div style={{ color:'#0d1b3e', fontWeight:700, marginTop:2, fontSize:12 }}>
                            À solder : {Number(it.sous_total||(it.prix_vendeur||it.prix_unitaire)*it.quantite-(it.remise||0)).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Total à collecter — mis en évidence */}
                    {totalCourse > 0 && (
                      <div style={{ background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:8, padding:'8px 12px', marginTop:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>💰 Total à encaisser</span>
                        <span style={{ fontSize:16, fontWeight:700, color:'#d0a83a' }}>{totalCourse.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Client */}
                {(client_nom || client_tel || client_quartier) && (
                  <div style={{ background:'#eff6ff', borderRadius:8, padding:'8px 10px', border:'1px solid #bfdbfe' }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#1e40af', textTransform:'uppercase', margin:'0 0 5px', letterSpacing:'.5px' }}>📍 Client</p>
                    {client_nom && <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{client_nom}</p>}
                    {client_tel && <div style={{ marginTop:4 }}><CopyPhone tel={client_tel}/></div>}
                    {client_quartier && <p style={{ fontSize:12, color:'#4a5578', margin:'3px 0 0', display:'flex', alignItems:'center', gap:4 }}><MapPin size={10}/> {client_quartier}</p>}
                    {client_lat && client_lng && (
                      <a href={`https://www.google.com/maps?q=${client_lat},${client_lng}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={e=>e.stopPropagation()}
                        style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:6, background:'#1465BB', color:'white', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                        <MapPin size={12}/> Suivre la localisation
                      </a>
                    )}
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
                    <button onClick={()=>openClotureModal(l)} disabled={saving}
                      style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <CheckCircle size={12}/> Clôturer
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
              {/* Infos vendeur source */}
              {detail.vente?.caissiere && (
                <div style={{ background:'#f5f3ff', borderRadius:10, padding:'12px 14px', border:'1px solid #ddd6fe' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#5b21b6', textTransform:'uppercase', margin:'0 0 6px' }}>👤 Vendeur source</p>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>
                    {`${detail.vente.caissiere.prenom||detail.vente.caissiere.name||''} ${detail.vente.caissiere.nom||''}`.trim()}
                  </p>
                  {detail.vente.caissiere.telephone && <p style={{ fontSize:13, color:'#7c3aed', margin:'3px 0 0' }}>📞 {detail.vente.caissiere.telephone}</p>}
                  {/* Produits de la vente */}
                  {detail.vente?.items?.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
                      {detail.vente.items.map((it:any) => (
                        <div key={it.id} style={{ background:'#dbeafe', borderRadius:8, padding:'6px 12px', fontSize:12 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4, color:'#1e40af', fontWeight:600 }}>
                            {it.produit?.nom} ×{it.quantite}
                            {it.couleur && <span style={{ background:'white', color:'#1465BB', borderRadius:4, padding:'0 5px', fontSize:9, fontWeight:700 }}>{it.couleur}</span>}
                          </div>
                          <div style={{ color:'#0d1b3e', fontWeight:700, marginTop:3, fontSize:14 }}>
                            💰 Client doit : {Number(it.sous_total||(it.prix_vendeur||it.prix_unitaire)*it.quantite-(it.remise||0)).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(detail.client_nom||detail.vente?.client_nom) && (
                <div style={{ background:'#e0f0ff', borderRadius:10, padding:'14px', border:'1px solid #93c5fd' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#1e40af', textTransform:'uppercase', margin:'0 0 8px' }}>📦 Infos client</p>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{detail.client_nom||detail.vente?.client_nom}</p>
                  {(detail.client_telephone||detail.vente?.client_telephone) && <p style={{ fontSize:13, color:'#1465BB', margin:'4px 0 0', display:'flex', alignItems:'center', gap:5 }}><Phone size={12}/>{detail.client_telephone||detail.vente?.client_telephone}</p>}
                  {(detail.client_quartier||detail.vente?.client_quartier) && <p style={{ fontSize:13, color:'#4a5578', margin:'2px 0 0', display:'flex', alignItems:'center', gap:5 }}><MapPin size={12}/>{detail.client_quartier||detail.vente?.client_quartier}</p>}
                  {/* Lien Maps client — les coordonnées sont stockées dans vendeur_latitude/longitude 
                      (le vendeur colle le lien de localisation ENVOYÉ PAR LE CLIENT) */}
                  {(detail.client_latitude || detail.vendeur_latitude || detail.vente?.vendeur_latitude) && (
                    <a href={`https://www.google.com/maps?q=${detail.client_latitude||detail.vendeur_latitude||detail.vente?.vendeur_latitude},${detail.client_longitude||detail.vendeur_longitude||detail.vente?.vendeur_longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:8, background:'#1465BB', color:'white', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:700, textDecoration:'none' }}>
                      <MapPin size={14}/> 📍 Suivre la localisation du client
                    </a>
                  )}
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
                    <button onClick={()=>{openClotureModal(detail);setDetail(null);}} disabled={saving} style={{ flex:2, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:700, cursor:'pointer' }}>
                      Clôturer la course
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {clotureModal && (
        <div onClick={()=>setClotureModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:480 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Clôturer la course #{clotureModal.id}</h3>
              <button onClick={()=>setClotureModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
                Cochez le statut de chaque produit. Le gestionnaire validera ensuite définitivement.
              </p>

              {clotureModal.produits && clotureModal.produits.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {clotureModal.produits.map((lp:any) => {
                    const ps = produitsStatuts.find(p => p.id === lp.id);
                    const isLivre = ps?.statut === 'livre';
                    return (
                      <div key={lp.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${isLivre?'#0a9e6e':'#e53e3e'}`, background:isLivre?'#f0fdf4':'#fff5f5' }}>
                        <div>
                          <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0 }}>{lp.produit?.nom}</p>
                          <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>Quantité : {lp.quantite}</p>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>toggleStatutProduit(lp.id,'livre')}
                            style={{ padding:'6px 12px', borderRadius:8, border:`1.5px solid ${isLivre?'#0a9e6e':'#dde5f4'}`, background:isLivre?'#0a9e6e':'white', color:isLivre?'white':'#4a5578', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                            <CheckCircle size={12}/> Livré
                          </button>
                          <button onClick={()=>toggleStatutProduit(lp.id,'non_livre')}
                            style={{ padding:'6px 12px', borderRadius:8, border:`1.5px solid ${!isLivre?'#e53e3e':'#dde5f4'}`, background:!isLivre?'#e53e3e':'white', color:!isLivre?'white':'#4a5578', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
                            <XCircle size={12}/> Non livré
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display:'flex', gap:10, marginTop:4 }}>
                    <div style={{ flex:1, background:'#dcfce7', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                      <p style={{ fontSize:18, fontWeight:700, color:'#166534', margin:0 }}>{produitsStatuts.filter(p=>p.statut==='livre').length}</p>
                      <p style={{ fontSize:11, color:'#166534', margin:0 }}>Livrés</p>
                    </div>
                    <div style={{ flex:1, background:'#fee2e2', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                      <p style={{ fontSize:18, fontWeight:700, color:'#991b1b', margin:0 }}>{produitsStatuts.filter(p=>p.statut==='non_livre').length}</p>
                      <p style={{ fontSize:11, color:'#991b1b', margin:0 }}>Non livrés</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background:'#f8faff', borderRadius:8, padding:'14px', textAlign:'center', fontSize:13, color:'#8a96b0' }}>
                  Aucun produit détaillé pour cette course
                </div>
              )}

              <div>
                <label style={T.lbl}>Notes de clôture (optionnel)</label>
                <textarea value={notesCloture} onChange={e=>setNotesCloture(e.target.value)}
                  placeholder="Ex: Client absent pour 1 article, remis en stock…" rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setClotureModal(null)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578', fontSize:14 }}>Annuler</button>
                <button onClick={doCloturer} disabled={saving}
                  style={{ padding:'10px 20px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:700, cursor:'pointer', opacity:saving?0.6:1 }}>
                  {saving ? 'Clôture…' : 'Confirmer la clôture'}
                </button>
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
