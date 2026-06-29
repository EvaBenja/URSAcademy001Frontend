import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { Eye, X, MapPin, Package, RefreshCw, CheckCircle, XCircle, User, Phone, Lock } from 'lucide-react';
import { livraisonsService } from '../../services/api';
import { useNotificationSound } from '../../hooks/useNotificationSound';
import toast from 'react-hot-toast';
import Pagination from '../../components/ui/Pagination';

import SearchBar from '../../components/ui/SearchBar';

const STATUT_CONFIG: Record<string,{label:string;bg:string;color:string}> = {
  en_attente:                 {label:'Disponible',                 bg:'#dbeafe', color:'#1e40af'},
  validee:                    {label:'Assignée — attente accord',  bg:'#dbeafe', color:'#1e40af'},
  en_cours:                   {label:'En livraison',               bg:'#dcfce7', color:'#166534'},
  rejetee:                    {label:'Rejetée par livreur',        bg:'#fee2e2', color:'#991b1b'},
  livree_attente_validation:  {label:'À valider — livreur a coché', bg:'#ede9fe', color:'#5b21b6'},
  terminee:                   {label:'Clôturée',                   bg:'#f1f5f9', color:'#475569'},
};

export default function GestLivraisonsPage() {
  const [livraisons,  setLivraisons]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [detail,      setDetail]      = useState<any>(null);
  const [refusModal,  setRefusModal]  = useState<any>(null);
  const [motif,       setMotif]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [filter,      setFilter]      = useState('livree_attente_validation');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const knownCloIds = useRef<Set<number>>(new Set());
  const firstLoad   = useRef(true);
  const { play }    = useNotificationSound();

  const load = useCallback(async (silent = false) => {
    try {
      const r = await livraisonsService.getAll();
      const data = r.data || [];
      setLivraisons(data);
      setLastRefresh(new Date());

      // Détecter les nouvelles clôtures en attente de validation
      const cloIds = new Set<number>(
        data.filter((l:any) => l.statut === 'livree_attente_validation').map((l:any) => l.id)
      );
      if (!firstLoad.current) {
        const nouvelles = [...cloIds].filter(id => !knownCloIds.current.has(id));
        if (nouvelles.length > 0) {
          play();
          toast.success(
            `📋 ${nouvelles.length} livraison${nouvelles.length>1?'s':''} clôturée${nouvelles.length>1?'s':''} — validation requise`,
            { duration: 8000 }
          );
        }
      }
      knownCloIds.current = cloIds;
      firstLoad.current = false;
    } catch { if (!silent) toast.error('Erreur chargement livraisons'); }
    finally { setLoading(false); }
  }, [play]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, [load]);

  const doValiderCloture = async (id: number) => {
    setSaving(true);
    try {
      await livraisonsService.validerCloture(id);
      toast.success('Clôture validée définitivement ✓');
      setDetail(null); load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doRefuserCloture = async () => {
    if (!refusModal || !motif.trim()) { toast.error('Le motif est obligatoire'); return; }
    setSaving(true);
    try {
      await livraisonsService.refuserCloture(refusModal.id, motif);
      toast.success('Clôture refusée — renvoyée au livreur');
      setRefusModal(null); setMotif(''); setDetail(null); load(true);
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered    = filter === 'tous' ? livraisons : livraisons.filter(l => l.statut === filter);
  const aValider     = livraisons.filter(l => l.statut === 'livree_attente_validation').length;
  const totalPages   = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated    = filtered.slice((pageNum-1)*PAGE_SIZE, pageNum*PAGE_SIZE);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Suivi des Livraisons</h1>
          <p style={T.sub}>Validez la clôture finale après pointage du livreur</p>
        </div>
        <button onClick={()=>load(false)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578' }}>
          <RefreshCw size={13}/> {lastRefresh.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
        </button>
      </div>

      {aValider > 0 && (
        <div style={{ background:'linear-gradient(90deg,#7c3aed,#5b21b6)', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', gap:12 }}>
          <Lock size={20} color="white" style={{flexShrink:0}}/>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'white', margin:0 }}>
              {aValider} course{aValider>1?'s':''} en attente de votre validation finale
            </p>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', margin:0 }}>Le livreur a coché les produits livrés/non livrés</p>
          </div>
          <button onClick={()=>setFilter('livree_attente_validation')} style={{ padding:'8px 14px', borderRadius:8, background:'white', border:'none', color:'#5b21b6', fontWeight:700, cursor:'pointer', fontSize:13, flexShrink:0 }}>
            Voir →
          </button>
        </div>
      )}

      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',       val:livraisons.length, color:'#1465BB', s:'tous'      },
          {label:'En livraison',val:livraisons.filter(l=>l.statut==='en_cours').length, color:'#0a9e6e', s:'en_cours'},
          {label:'À valider',   val:aValider,           color:'#7c3aed', s:'livree_attente_validation'},
          {label:'Clôturées',   val:livraisons.filter(l=>l.statut==='terminee').length, color:'#475569', s:'terminee'},
        ].map(({label,val,color,s})=>(
          <div key={s} style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer' }} onClick={()=>setFilter(s)}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','en_attente','validee','en_cours','livree_attente_validation','rejetee','terminee']).map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT_CONFIG[s]?.label||s}
            {s==='livree_attente_validation' && aValider>0 && (
              <span style={{ marginLeft:6, background:'#5b21b6', color:'white', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{aValider}</span>
            )}
          </button>
        ))}
      </div>

      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:14 }}>
        {filtered.length===0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center', gridColumn:'1/-1' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune livraison</p>
          </div>
        ) : filtered.map((l:any) => {
          const sc = STATUT_CONFIG[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
          const client_nom      = l.client_nom      || l.vente?.client_nom;
          const client_tel      = l.client_telephone || l.vente?.client_telephone;
          const client_quartier = l.client_quartier  || l.vente?.client_quartier;
          return (
            <div key={l.id} style={{ background:'white', borderRadius:14, border:`1.5px solid ${l.statut==='livree_attente_validation'?'#7c3aed':'#dde5f4'}`, padding:18, boxShadow:l.statut==='livree_attente_validation'?'0 4px 14px rgba(124,58,237,0.15)':'0 2px 8px rgba(0,55,133,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, minWidth:0 }}>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>Course #{l.id}</span>
                  {l.vente_id && <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap' }}>Vente #{l.vente_id}</span>}
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{sc.label}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                {l.livreur && <p style={{ fontSize:13, color:'#0d1b3e', margin:0, fontWeight:500 }}>🚚 {l.livreur.prenom||l.livreur.name} {l.livreur.nom||''}</p>}
                {l.zone_livraison && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#4a5578' }}><MapPin size={12} color="#1465BB"/> {l.zone_livraison}</div>}
                {client_nom && (
                  <div style={{ background:'#f0f4ff', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#0d1b3e' }}><User size={12} color="#1465BB"/> {client_nom}</div>
                    {client_tel && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#1465BB', marginTop:2 }}><Phone size={11}/> {client_tel}</div>}
                    {client_quartier && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#8a96b0', marginTop:2 }}><MapPin size={11}/> {client_quartier}</div>}
                  </div>
                )}
                {l.produits?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:2 }}>
                    <Package size={11} color="#1465BB" style={{marginTop:2}}/>
                    {l.produits.map((lp:any) => (
                      <span key={lp.id} style={{ background:lp.statut==='livre'?'#dcfce7':lp.statut==='non_livre'?'#fee2e2':'#e0f0ff', color:lp.statut==='livre'?'#166534':lp.statut==='non_livre'?'#991b1b':'#1465BB', fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:10 }}>
                        {lp.produit?.nom} ×{lp.quantite} {lp.statut==='livre'?'✓':lp.statut==='non_livre'?'✗':''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={()=>setDetail(l)} style={{ flex:1, minWidth:70, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:12, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Eye size={12}/> Détail
                </button>
                {l.statut === 'livree_attente_validation' && (
                  <>
                    <button onClick={()=>{setRefusModal(l);setMotif('');}}
                      style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <XCircle size={12}/> Refuser
                    </button>
                    <button onClick={()=>doValiderCloture(l.id)} disabled={saving}
                      style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                      <CheckCircle size={12}/> Valider clôture
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={pageNum} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={p=>{setPageNum(p);window.scrollTo(0,0)}}/>

      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Course #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Vente liée',  detail.vente_id ? `#${detail.vente_id}` : '—'],
                ['Livreur',     detail.livreur ? `${detail.livreur.prenom||detail.livreur.name||''} ${detail.livreur.nom||''}`.trim() : 'Non assigné'],
                ['Client',      detail.client_nom || detail.vente?.client_nom || '—'],
                ['Téléphone',   detail.client_telephone || detail.vente?.client_telephone || '—'],
                ['Quartier',    detail.client_quartier || detail.vente?.client_quartier || '—'],
                ['Zone',        detail.zone_livraison || '—'],
                ['Statut',      STATUT_CONFIG[detail.statut]?.label || detail.statut],
                ['Notes',       detail.notes || '—'],
                ['Motif rejet', detail.motif_rejet || '—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
              {detail.produits?.length > 0 && (
                <div style={{ marginTop:8 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', textTransform:'uppercase', marginBottom:8 }}>Produits</p>
                  {detail.produits.map((lp:any) => (
                    <div key={lp.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'#f8faff', borderRadius:8, marginBottom:5, gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{lp.produit?.nom} ×{lp.quantite}</span>
                      {lp.statut && lp.statut !== 'en_attente' && (
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10, background:lp.statut==='livre'?'#dcfce7':'#fee2e2', color:lp.statut==='livre'?'#166534':'#991b1b', flexShrink:0, whiteSpace:'nowrap' }}>
                          {lp.statut==='livre'?'✓ Livré':'✗ Non livré'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {detail.statut === 'livree_attente_validation' && (
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button onClick={()=>{setRefusModal(detail);setDetail(null);setMotif('');}} disabled={saving}
                    style={{ flex:1, padding:'11px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer' }}>
                    Refuser
                  </button>
                  <button onClick={()=>doValiderCloture(detail.id)} disabled={saving}
                    style={{ flex:1, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', border:'none', fontWeight:600, cursor:'pointer' }}>
                    {saving ? '…' : 'Valider clôture ✓'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {refusModal && (
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Refuser la clôture #{refusModal.id}</h3>
              <button onClick={()=>setRefusModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', margin:0 }}>
                La course retournera chez le livreur pour correction.
              </p>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 }}>
                  Motif du refus * (obligatoire)
                </label>
                <textarea value={motif} onChange={e=>setMotif(e.target.value)}
                  placeholder="Ex: Pointage incohérent, produit manquant non signalé…"
                  rows={4}
                  style={{ width:'100%', padding:'9px 12px', border:`1.5px solid ${motif.trim()?'#dde5f4':'#fca5a5'}`, borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRefusModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={doRefuserCloture} disabled={saving||!motif.trim()}
                  style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', opacity:saving||!motif.trim()?0.5:1 }}>
                  {saving ? '…' : 'Confirmer le refus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr) !important;} .cards-grid{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:460, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};