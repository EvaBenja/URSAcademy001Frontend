import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Eye, X, Clock, MapPin, Package, RefreshCw, Lock } from 'lucide-react';
import { demandesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dcfce7', color:'#166534'},
  rejetee:    {label:'Rejetée',    bg:'#fee2e2', color:'#991b1b'},
  terminee:   {label:'Terminée',   bg:'#f1f5f9', color:'#475569'},
};

interface ProduitStatut { id: number; statut: 'livre'|'non_livre'; }

export default function DemandesLivreursPage() {
  const [demandes,     setDemandes]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [detail,       setDetail]       = useState<any>(null);
  const [validerModal, setValiderModal] = useState<any>(null);
  const [cloturerModal,setCloturerModal]= useState<any>(null);
  const [refusModal,   setRefusModal]   = useState<any>(null);
  const [motif,        setMotif]        = useState('');
  const [carburant,    setCarburant]    = useState(0);
  const [produitsStatuts, setProduitsStatuts] = useState<ProduitStatut[]>([]);
  const [notesCloture, setNotesCloture] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [filter,       setFilter]       = useState('en_attente');
  const [lastRefresh,  setLastRefresh]  = useState(new Date());

  const load = useCallback(async (silent = false) => {
    try {
      const r = await demandesService.getAll();
      setDemandes(r.data || []);
      setLastRefresh(new Date());
    } catch (e: any) {
      if (e?.response?.status === 403) {
        // Pas autorisé — pas de message répété
        if (!silent) toast.error('Accès non autorisé pour ce rôle');
      } else if (!silent) {
        toast.error('Erreur chargement demandes');
      }
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, [load]);

  // Initialiser les statuts produits quand on ouvre modal clôture
  const openCloture = (d: any) => {
    const statuts: ProduitStatut[] = (d.produits || []).map((lp: any) => ({
      id: lp.id,
      statut: 'livre' as const,
    }));
    setProduitsStatuts(statuts);
    setNotesCloture('');
    setCloturerModal(d);
  };

  const toggleStatutProduit = (id: number) => {
    setProduitsStatuts(prev =>
      prev.map(p => p.id === id
        ? { ...p, statut: p.statut === 'livre' ? 'non_livre' : 'livre' }
        : p
      )
    );
  };

  const doValider = async () => {
    if (!validerModal) return;
    setSaving(true);
    try {
      await demandesService.valider(validerModal.id, { montant_carburant: carburant });
      toast.success('Demande validée ✓ — dossier journalier créé');
      setValiderModal(null);
      setCarburant(0);
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doRefuser = async () => {
    if (!refusModal || !motif.trim()) { toast.error('Motif obligatoire'); return; }
    setSaving(true);
    try {
      await demandesService.refuser(refusModal.id, motif);
      toast.success('Demande refusée');
      setRefusModal(null); setMotif('');
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doCloturer = async () => {
    if (!cloturerModal) return;
    setSaving(true);
    try {
      await (demandesService as any).cloturer(cloturerModal.id, {
        produits_statuts: produitsStatuts,
        notes_cloture:    notesCloture,
      });
      toast.success('Livraison clôturée avec succès !');
      setCloturerModal(null);
      setDetail(null);
      load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered  = filter === 'tous' ? demandes : demandes.filter(d => d.statut === filter);
  const enAttente = demandes.filter(d => d.statut === 'en_attente').length;

  if (loading) return (
    <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement…
    </p>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Demandes des Livreurs</h1>
          <p style={T.sub}>Validez, refusez ou clôturez les demandes avec le statut de chaque produit</p>
        </div>
        <button onClick={()=>load(false)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578' }}>
          <RefreshCw size={13}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'En attente', val:enAttente,                                      color:'#d0a83a', s:'en_attente'},
          {label:'Validées',   val:demandes.filter(d=>d.statut==='validee').length, color:'#0a9e6e', s:'validee'  },
          {label:'Rejetées',   val:demandes.filter(d=>d.statut==='rejetee').length, color:'#e53e3e', s:'rejetee'  },
          {label:'Terminées',  val:demandes.filter(d=>d.statut==='terminee').length,color:'#7c3aed', s:'terminee' },
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer', transition:'all .15s' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','en_attente','validee','rejetee','terminee']).map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer', fontWeight:filter===s?600:400 }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
            {s==='en_attente' && enAttente > 0 && (
              <span style={{ marginLeft:6, background:'#d0a83a', color:'white', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>
                {enAttente}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center', gridColumn:'1/-1' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>
              {filter==='en_attente' ? '✓ Aucune demande en attente' : 'Aucune demande'}
            </p>
          </div>
        ) : filtered.map((d:any) => {
          const sc = STATUT[d.statut]||{label:d.statut,bg:'#f1f5f9',color:'#475569'};
          const livreur = d.livreur;
          const hasProduits = d.produits && d.produits.length > 0;
          return (
            <div key={d.id} style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:18, boxShadow:'0 2px 8px rgba(0,55,133,0.04)' }}>
              {/* Livreur + statut */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0, flex:1 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:13, fontWeight:700, flexShrink:0 }}>
                    {(livreur?.prenom||livreur?.name||'?')[0]}
                  </div>
                  <div style={{ minWidth:0, overflow:'hidden' }}>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {livreur ? `${livreur.prenom||livreur.name||''} ${livreur.nom||''}`.trim() : `Livreur #${d.livreur_id}`}
                    </p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>Demande #{d.id}</p>
                  </div>
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>
                  {sc.label}
                </span>
              </div>

              {/* Infos */}
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                {d.zone_livraison && (
                  <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}>
                    <MapPin size={12} color="#1465BB"/> {d.zone_livraison}
                  </span>
                )}
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#8a96b0' }}>
                  <Clock size={11} color="#d0a83a"/> {d.date_livraison||new Date(d.created_at).toLocaleDateString('fr-FR')}
                </span>
                {/* Produits en badges */}
                {hasProduits && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                    <Package size={11} color="#1465BB" style={{marginTop:2}}/>
                    {d.produits.map((lp:any) => (
                      <span key={lp.id} style={{ background:'#e0f0ff', color:'#1465BB', fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:10 }}>
                        {lp.produit?.nom} ×{lp.quantite}
                      </span>
                    ))}
                  </div>
                )}
                {d.motif_rejet && (
                  <p style={{ fontSize:12, color:'#e53e3e', margin:0, fontStyle:'italic' }}>Motif : {d.motif_rejet}</p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                <button onClick={()=>setDetail(d)}
                  style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Eye size={12}/> Détail
                </button>
                {d.statut === 'en_attente' && (
                  <>
                    <button onClick={()=>{setValiderModal(d);setCarburant(0);}}
                      style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <CheckCircle size={12}/> Valider
                    </button>
                    <button onClick={()=>{setRefusModal(d);setMotif('');}}
                      style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <XCircle size={12}/> Refuser
                    </button>
                  </>
                )}
                {d.statut === 'validee' && (
                  <button onClick={()=>openCloture(d)}
                    style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    <Lock size={12}/> Clôturer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal DÉTAIL ── */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Demande #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Livreur',      `${detail.livreur?.prenom||detail.livreur?.name||''} ${detail.livreur?.nom||''}`.trim()||'—'],
                ['Téléphone',    detail.livreur?.telephone||'—'],
                ['Zone',         detail.zone_livraison||'—'],
                ['Date livr.',   detail.date_livraison||'—'],
                ['Statut',       STATUT[detail.statut]?.label||detail.statut],
                ['Notes',        detail.notes||'—'],
                ['Motif rejet',  detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}

              {/* Produits de la demande */}
              {detail.produits && detail.produits.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>
                    <Package size={12} style={{marginRight:5, verticalAlign:'middle'}}/>
                    Produits à livrer ({detail.produits.length})
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {detail.produits.map((lp:any) => (
                      <div key={lp.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#f8faff', borderRadius:8, border:'1px solid #dde5f4' }}>
                        <span style={{ fontSize:13, fontWeight:500, color:'#0d1b3e' }}>{lp.produit?.nom}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:12, color:'#8a96b0' }}>×{lp.quantite}</span>
                          {lp.statut && lp.statut !== 'en_attente' && (
                            <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10, background:lp.statut==='livre'?'#dcfce7':'#fee2e2', color:lp.statut==='livre'?'#166534':'#991b1b' }}>
                              {lp.statut==='livre'?'✓ Livré':'✗ Non livré'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
                {detail.statut === 'en_attente' && (
                  <>
                    <button onClick={()=>{setRefusModal(detail);setDetail(null);setMotif('');}}
                      style={{ flex:1, padding:'10px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer', minWidth:90 }}>
                      Refuser
                    </button>
                    <button onClick={()=>{setValiderModal(detail);setDetail(null);setCarburant(0);}}
                      style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', minWidth:90 }}>
                      Valider
                    </button>
                  </>
                )}
                {detail.statut === 'validee' && (
                  <button onClick={()=>{openCloture(detail);setDetail(null);}}
                    style={{ width:'100%', padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', border:'none', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Lock size={15}/> Clôturer cette livraison
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal VALIDER ── */}
      {validerModal && (
        <div onClick={()=>setValiderModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Valider demande #{validerModal.id}</h3>
              <button onClick={()=>setValiderModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#f4f7fd', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#4a5578' }}>
                Livreur : <strong>{validerModal.livreur?.prenom||validerModal.livreur?.name} {validerModal.livreur?.nom||''}</strong><br/>
                Zone : <strong>{validerModal.zone_livraison||'—'}</strong> · Date : <strong>{validerModal.date_livraison}</strong>
              </div>
              <div>
                <label style={T.lbl}>Montant carburant alloué (FCFA) — optionnel</label>
                <input type="number" min={0} value={carburant}
                  onChange={e=>setCarburant(+e.target.value)}
                  style={T.inp} placeholder="0"/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setValiderModal(null)} style={T.btnCancel}>Annuler</button>
                <button onClick={doValider} disabled={saving}
                  style={{ padding:'10px 20px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>
                  {saving ? '…' : '✓ Valider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal CLÔTURER ── */}
      {cloturerModal && (
        <div onClick={()=>setCloturerModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:520 }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>
                <Lock size={15} style={{marginRight:8}}/> Clôturer demande #{cloturerModal.id}
              </h3>
              <button onClick={()=>setCloturerModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#f4f7fd', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#4a5578' }}>
                Livreur : <strong>{cloturerModal.livreur?.prenom||cloturerModal.livreur?.name} {cloturerModal.livreur?.nom||''}</strong><br/>
                Zone : <strong>{cloturerModal.zone_livraison||'—'}</strong> · Date : <strong>{cloturerModal.date_livraison}</strong>
              </div>

              {/* Produits avec cases à cocher livré/non livré */}
              {cloturerModal.produits && cloturerModal.produits.length > 0 ? (
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#0d1b3e', marginBottom:10 }}>
                    <Package size={13} style={{marginRight:6, verticalAlign:'middle'}}/>
                    Statut de livraison des produits
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {cloturerModal.produits.map((lp:any) => {
                      const ps = produitsStatuts.find(p => p.id === lp.id);
                      const isLivre = ps?.statut === 'livre';
                      return (
                        <div key={lp.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${isLivre?'#0a9e6e':'#e53e3e'}`, background:isLivre?'#f0fdf4':'#fff5f5', transition:'all .2s' }}>
                          <div>
                            <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0 }}>{lp.produit?.nom}</p>
                            <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>Quantité : {lp.quantite}</p>
                          </div>
                          {/* Toggle livré / non livré */}
                          <div style={{ display:'flex', gap:6 }}>
                            <button
                              onClick={()=>{ const ps2 = produitsStatuts.find(p=>p.id===lp.id); if(ps2?.statut!=='livre') toggleStatutProduit(lp.id); }}
                              style={{ padding:'6px 12px', borderRadius:8, border:`1.5px solid ${isLivre?'#0a9e6e':'#dde5f4'}`, background:isLivre?'#0a9e6e':'white', color:isLivre?'white':'#4a5578', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, transition:'all .2s' }}>
                              <CheckCircle size={12}/> Livré
                            </button>
                            <button
                              onClick={()=>{ const ps2 = produitsStatuts.find(p=>p.id===lp.id); if(ps2?.statut!=='non_livre') toggleStatutProduit(lp.id); }}
                              style={{ padding:'6px 12px', borderRadius:8, border:`1.5px solid ${!isLivre?'#e53e3e':'#dde5f4'}`, background:!isLivre?'#e53e3e':'white', color:!isLivre?'white':'#4a5578', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:4, transition:'all .2s' }}>
                              <XCircle size={12}/> Non livré
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Résumé */}
                  <div style={{ display:'flex', gap:10, marginTop:10 }}>
                    <div style={{ flex:1, background:'#dcfce7', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                      <p style={{ fontSize:18, fontWeight:700, color:'#166534', margin:0 }}>
                        {produitsStatuts.filter(p=>p.statut==='livre').length}
                      </p>
                      <p style={{ fontSize:11, color:'#166534', margin:0 }}>Livrés</p>
                    </div>
                    <div style={{ flex:1, background:'#fee2e2', borderRadius:8, padding:'8px 12px', textAlign:'center' }}>
                      <p style={{ fontSize:18, fontWeight:700, color:'#991b1b', margin:0 }}>
                        {produitsStatuts.filter(p=>p.statut==='non_livre').length}
                      </p>
                      <p style={{ fontSize:11, color:'#991b1b', margin:0 }}>Non livrés</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background:'#f8faff', borderRadius:8, padding:'14px', textAlign:'center', fontSize:13, color:'#8a96b0' }}>
                  Aucun produit spécifié dans cette demande
                </div>
              )}

              {/* Notes de clôture */}
              <div>
                <label style={T.lbl}>Notes de clôture (optionnel)</label>
                <textarea value={notesCloture} onChange={e=>setNotesCloture(e.target.value)}
                  placeholder="Ex: Tous les produits livrés sans incident…" rows={3}
                  style={{ ...T.inp, resize:'none' as const }}/>
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setCloturerModal(null)} style={T.btnCancel}>Annuler</button>
                <button onClick={doCloturer} disabled={saving}
                  style={{ padding:'10px 20px', borderRadius:8, background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', border:'none', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity:saving?0.6:1 }}>
                  <Lock size={14}/>{saving ? 'Clôture…' : 'Confirmer la clôture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal REFUSER ── */}
      {refusModal && (
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Refuser demande #{refusModal.id}</h3>
              <button onClick={()=>setRefusModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={T.lbl}>Motif du refus * (obligatoire)</label>
                <textarea value={motif} onChange={e=>setMotif(e.target.value)}
                  placeholder="Expliquez pourquoi la demande est refusée…" rows={3}
                  style={{ ...T.inp, resize:'none' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRefusModal(null)} style={{ flex:1, ...T.btnCancel }}>Annuler</button>
                <button onClick={doRefuser} disabled={saving||!motif.trim()}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', opacity:saving||!motif.trim()?0.5:1 }}>
                  {saving ? '…' : '✗ Confirmer'}
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
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  btnCancel:{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0, display:'flex', alignItems:'center' } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
