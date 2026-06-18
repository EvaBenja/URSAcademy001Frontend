import { useState, useEffect, type CSSProperties } from 'react';
import { FolderOpen, Lock, Eye, X } from 'lucide-react';
import { dossiersService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  ouvert:   {label:'Ouvert',  bg:'#dbeafe', color:'#1e40af'},
  cloture:  {label:'Clôturé', bg:'#f1f5f9', color:'#475569'},
  en_cours: {label:'En cours',bg:'#fdf3d7', color:'#854d0e'},
};

export default function DossiersJournaliersPage() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [detail,   setDetail]   = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState('tous');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await dossiersService.getAll(); setDossiers(r.data || []); }
    catch { toast.error('Erreur chargement dossiers'); }
    finally { setLoading(false); }
  };

  const doCloturer = async (id: number) => {
    if (!confirm('Clôturer ce dossier ? Action irréversible.')) return;
    setSaving(true);
    try { await dossiersService.cloturer(id); toast.success('Dossier clôturé'); setDetail(null); load(); }
    catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = filter === 'tous' ? dossiers : dossiers.filter(d => d.statut === filter);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Dossiers Journaliers</h1>
        <p style={T.sub}>Récapitulatifs quotidiens des livraisons validées</p>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',   val:dossiers.length,                               color:'#1465BB', s:'tous'   },
          {label:'Ouverts', val:dossiers.filter(d=>d.statut!=='cloture').length, color:'#d0a83a', s:'ouvert' },
          {label:'Clôturés',val:dossiers.filter(d=>d.statut==='cloture').length, color:'#0a9e6e', s:'cloture'},
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="dossiers-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center', gridColumn:'1/-1' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucun dossier — ils apparaissent après validation des demandes livreurs</p>
          </div>
        ) : filtered.map((d:any) => {
          const sc = STATUT[d.statut]||{label:d.statut,bg:'#f1f5f9',color:'#475569'};
          return (
            <div key={d.id} style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:18, boxShadow:'0 2px 8px rgba(0,55,133,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'#e0f0ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FolderOpen size={18} color="#1465BB"/>
                  </div>
                  <div>
                    <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:0 }}>Dossier #{d.id}</p>
                    <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>{d.date ? new Date(d.date).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long'}) : '—'}</p>
                  </div>
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
              </div>
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                <div style={{ background:'#f8faff', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, color:'#8a96b0', margin:'0 0 3px' }}>Livreur</p>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{d.livreur ? `${d.livreur.prenom||d.livreur.name||''} ${d.livreur.nom||''}`.trim() : '—'}</p>
                </div>
                <div style={{ background:'#f8faff', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, color:'#8a96b0', margin:'0 0 3px' }}>Carburant</p>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'#0a9e6e', margin:0 }}>{Number(d.montant_carburant||0).toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setDetail(d)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', fontSize:13, color:'#4a5578', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                  <Eye size={13}/> Détail
                </button>
                {d.statut !== 'cloture' && (
                  <button onClick={()=>doCloturer(d.id)} disabled={saving}
                    style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', cursor:'pointer', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                    <Lock size={13}/> Clôturer
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
              <h3 style={T.modalTitle}>Dossier #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Date',        detail.date ? new Date(detail.date).toLocaleDateString('fr-FR') : '—'],
                ['Livreur',     detail.livreur ? `${detail.livreur.prenom||detail.livreur.name||''} ${detail.livreur.nom||''}`.trim() : '—'],
                ['Gestionnaire',detail.gestionnaire ? `${detail.gestionnaire.prenom||detail.gestionnaire.name||''} ${detail.gestionnaire.nom||''}`.trim() : '—'],
                ['Carburant',   `${Number(detail.montant_carburant||0).toLocaleString('fr-FR')} FCFA`],
                ['Statut',      STATUT[detail.statut]?.label||detail.statut],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v}</span>
                </div>
              ))}
              {detail.statut !== 'cloture' && (
                <button onClick={()=>doCloturer(detail.id)} disabled={saving}
                  style={{ marginTop:10, width:'100%', padding:'12px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Lock size={15}/>{saving?'Clôture…':'Clôturer ce dossier'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-3{grid-template-columns:1fr 1fr!important;} .dossiers-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:440, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
