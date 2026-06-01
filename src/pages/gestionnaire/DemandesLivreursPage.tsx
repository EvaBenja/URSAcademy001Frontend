import { useState, useEffect, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Eye, X, Clock, User, MapPin } from 'lucide-react';
import { demandesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT_CONFIG: Record<string, { label:string; bg:string; color:string }> = {
  en_attente: { label:'En attente', bg:'#fef9c3', color:'#854d0e' },
  validee:    { label:'Validée',    bg:'#dcfce7', color:'#166534' },
  refusee:    { label:'Refusée',    bg:'#fee2e2', color:'#991b1b' },
};

export default function DemandesLivreursPage() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [detail,   setDetail]   = useState<any>(null);
  const [refusModal, setRefusModal] = useState<number|null>(null);
  const [motif,    setMotif]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState('en_attente');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await demandesService.getAll(); setDemandes(r.data); }
    catch { toast.error('Erreur chargement demandes'); }
    finally { setLoading(false); }
  };

  const doValider = async (id: number, data: object = {}) => {
    setSaving(true);
    try { await demandesService.valider(id, data); toast.success('Demande validée'); setDetail(null); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doRefuser = async () => {
    if (!refusModal) return;
    setSaving(true);
    try { await demandesService.refuser(refusModal, motif); toast.success('Demande refusée'); setRefusModal(null); setMotif(''); load(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'tous' ? demandes : demandes.filter(d => d.statut === filter);
  const enAttente = demandes.filter(d => d.statut === 'en_attente').length;

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Demandes des Livreurs</h1>
        <p style={T.sub}>Validez ou refusez les demandes de livraison soumises</p>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'En attente', val:enAttente, color:'#d0a83a', bg:'#fdf3d7', s:'en_attente' },
          { label:'Validées',   val:demandes.filter(d=>d.statut==='validee').length,  color:'#0a9e6e', bg:'#dcfce7', s:'validee' },
          { label:'Refusées',   val:demandes.filter(d=>d.statut==='refusee').length,  color:'#e53e3e', bg:'#fee2e2', s:'refusee' },
        ].map(({label,val,color,bg,s})=>(
          <div key={s} style={{ ...T.statCard, cursor:'pointer', border:`1.5px solid ${filter===s?color:'#dde5f4'}` }} onClick={()=>setFilter(s)}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','en_attente','validee','refusee']).map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT_CONFIG[s]?.label||s}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="cards-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.length===0 ? (
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0', padding:'30px 0' }}>Aucune demande</p>
        ) : filtered.map((d:any) => {
          const sc = STATUT_CONFIG[d.statut] || { label:d.statut, bg:'#f1f5f9', color:'#475569' };
          return (
            <div key={d.id} style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:18, boxShadow:'0 2px 8px rgba(0,55,133,0.05)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:14, fontWeight:700 }}>
                    {(d.livreur?.prenom||d.livreur?.name||'?')[0]}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e', margin:0 }}>{d.livreur?.prenom} {d.livreur?.nom}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>Livreur #{d.livreur_id}</p>
                  </div>
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'#4a5578' }}>
                  <MapPin size={13} color="#1465BB"/> {d.zone_livraison || 'Zone non précisée'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, color:'#4a5578' }}>
                  <Clock size={13} color="#d0a83a"/> {new Date(d.created_at).toLocaleDateString('fr-FR')}
                </div>
                {d.motif && <p style={{ fontSize:12, color:'#8a96b0', fontStyle:'italic', margin:0 }}>"{d.motif}"</p>}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setDetail(d)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <Eye size={13}/> Détail
                </button>
                {d.statut==='en_attente' && (
                  <>
                    <button onClick={()=>doValider(d.id)} disabled={saving} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      <CheckCircle size={13}/> Valider
                    </button>
                    <button onClick={()=>{setRefusModal(d.id);setMotif('');}} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      <XCircle size={13}/> Refuser
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Demande #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Livreur', `${detail.livreur?.prenom||''} ${detail.livreur?.nom||''}`],
                ['Téléphone', detail.livreur?.telephone||'—'],
                ['Zone', detail.zone_livraison||'—'],
                ['Statut', STATUT_CONFIG[detail.statut]?.label||detail.statut],
                ['Date', new Date(detail.created_at).toLocaleDateString('fr-FR')],
                ['Motif', detail.motif||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v}</span>
                </div>
              ))}
              {detail.statut==='en_attente' && (
                <div style={{ display:'flex', gap:10, marginTop:10 }}>
                  <button onClick={()=>{setRefusModal(detail.id);setDetail(null);}} style={{ flex:1, padding:'10px', borderRadius:8, background:'#fee2e2', color:'#991b1b', border:'none', fontWeight:600, cursor:'pointer' }}>Refuser</button>
                  <button onClick={()=>doValider(detail.id)} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer' }}>Valider</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal refus */}
      {refusModal !== null && (
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, padding:0, overflow:'hidden' }}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Refuser la demande</h3>
              <button onClick={()=>setRefusModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={T.lbl}>Motif du refus (optionnel)</label>
                <textarea value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Expliquez pourquoi…" rows={3}
                  style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', resize:'none', boxSizing:'border-box' }}/>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setRefusModal(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={doRefuser} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer' }}>
                  {saving ? 'Refus…' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-3{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  statCard:{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
};