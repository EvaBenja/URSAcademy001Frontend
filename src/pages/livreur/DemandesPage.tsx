import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, X, Clock, MapPin } from 'lucide-react';
import { demandesService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Validée',    bg:'#dcfce7', color:'#166534'},
  rejetee:    {label:'Rejetée',    bg:'#fee2e2', color:'#991b1b'},
  en_cours:   {label:'En cours',   bg:'#dbeafe', color:'#1e40af'},
  terminee:   {label:'Terminée',   bg:'#f1f5f9', color:'#475569'},
};
const ZONES = ['Adidogomé','Agoe','Baguida','Lomé centre','Hédzranawoe','Avedji','Tokoin','Djidjolé'];

export default function LivreurDemandesPage() {
  const [demandes, setDemandes] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({
    date_livraison: new Date().toISOString().split('T')[0],
    zone_livraison: ZONES[0],
    notes: '',
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await demandesService.getAll(); setDemandes(r.data || []); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const doCreate = async () => {
    if (!form.date_livraison) { toast.error('Date obligatoire'); return; }
    setSaving(true);
    try {
      await demandesService.create({
        date_livraison: form.date_livraison,
        zone_livraison: form.zone_livraison,
        notes:          form.notes,
      });
      toast.success('Demande envoyée au gestionnaire !');
      setModal(false);
      setForm({ date_livraison: new Date().toISOString().split('T')[0], zone_livraison: ZONES[0], notes: '' });
      load();
    } catch (e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Demandes de Livraison</h1>
          <p style={T.sub}>Soumettez vos disponibilités au gestionnaire</p>
        </div>
        <button onClick={()=>setModal(true)} style={T.btnPrimary}><Plus size={15}/> Nouvelle demande</button>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'En attente', val:demandes.filter(d=>d.statut==='en_attente').length, color:'#d0a83a'},
          {label:'Validées',   val:demandes.filter(d=>d.statut==='validee').length,    color:'#0a9e6e'},
          {label:'Rejetées',   val:demandes.filter(d=>d.statut==='rejetee').length,    color:'#e53e3e'},
        ].map(({label,val,color}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {demandes.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center' }}>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0', marginBottom:16 }}>Aucune demande soumise</p>
            <button onClick={()=>setModal(true)} style={{ ...T.btnPrimary, margin:'0 auto', display:'flex' }}><Plus size={15}/> Ma première demande</button>
          </div>
        ) : demandes.map((d:any) => {
          const sc = STATUT[d.statut]||{label:d.statut,bg:'#f1f5f9',color:'#475569'};
          return (
            <div key={d.id} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'linear-gradient(135deg,#003785,#1465BB)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:14, flexShrink:0 }}>
                #{d.id}
              </div>
              <div style={{ flex:1, minWidth:150 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                  {d.zone_livraison && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:14, fontWeight:600, color:'#0d1b3e' }}><MapPin size={13} color="#1465BB"/>{d.zone_livraison}</span>}
                </div>
                <div style={{ display:'flex', gap:12, fontSize:12, color:'#8a96b0', flexWrap:'wrap' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/> {d.date_livraison||'—'}</span>
                  {d.notes && <span>"{d.notes}"</span>}
                </div>
                {d.motif_rejet && <p style={{ fontSize:12, color:'#e53e3e', margin:'4px 0 0', fontStyle:'italic' }}>Motif : {d.motif_rejet}</p>}
              </div>
              <span style={{ background:sc.bg, color:sc.color, fontSize:12, fontWeight:600, padding:'5px 14px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0 }}>{sc.label}</span>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Nouvelle demande</h3>
              <button onClick={()=>setModal(false)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={T.lbl}>Date de disponibilité *</label>
                <input type="date" value={form.date_livraison} onChange={e=>setForm(f=>({...f,date_livraison:e.target.value}))} style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>Zone souhaitée</label>
                <select value={form.zone_livraison} onChange={e=>setForm(f=>({...f,zone_livraison:e.target.value}))} style={T.inp}>
                  {ZONES.map(z=><option key={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label style={T.lbl}>Notes (optionnel)</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Ex: Disponible dès 8h, véhicule 4x4…" rows={3}
                  style={{ ...T.inp, resize:'none' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={T.btnCancel}>Annuler</button>
                <button onClick={doCreate} disabled={saving||!form.date_livraison}
                  style={{ ...T.btnPrimary, opacity:saving||!form.date_livraison?0.5:1 }}>
                  {saving?'Envoi…':'Envoyer la demande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-3{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  statCard:{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  btnCancel:{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578' } as CSSProperties,
  lbl:{ display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties,
  inp:{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:440, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
