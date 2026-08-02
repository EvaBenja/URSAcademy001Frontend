import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, X, Clock, CheckCircle, XCircle, Banknote, RefreshCw } from 'lucide-react';
import { retraitsService, commissionsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string;Icon:any}> = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e', Icon:Clock        },
  approuve:   { label:'Approuvé',    bg:'#dbeafe', color:'#1e40af', Icon:CheckCircle  },
  paye:       { label:'Payé ✓',      bg:'#dcfce7', color:'#166534', Icon:CheckCircle  },
  refuse:     { label:'Refusé',      bg:'#fee2e2', color:'#991b1b', Icon:XCircle      },
};

export default function RetraitPage() {
  const { user } = useAuth();
  const [retraits,  setRetraits]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [montant,   setMontant]   = useState('');
  const [numero,    setNumero]    = useState('');
  const [notes,     setNotes]     = useState('');

  const [commissions, setCommissions] = useState<any>(null);

  useEffect(() => {
    load();
    // Charger aussi le solde commissions
    commissionsService.stats().then(r => setCommissions(r.data)).catch(()=>{});
  }, []);

  const soldeDisponible = commissions?.solde_disponible ?? 0;

  const load = async () => {
    setLoading(true);
    try { const r = await retraitsService.getAll(); setRetraits(r.data || []); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    const m = parseFloat(montant);
    if (!m || m < 500) { toast.error('Montant minimum : 500 FCFA'); return; }
    if (!numero.trim()) { toast.error('Numéro Orange Money requis'); return; }
    setSaving(true);
    try {
      await retraitsService.create({ montant: m, numero_orange: numero, notes });
      toast.success('Demande envoyée ✓');
      setModal(false); setMontant(''); setNumero(''); setNotes('');
      load();
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const totalPaye     = retraits.filter(r=>r.statut==='paye').reduce((s,r)=>s+Number(r.montant),0);
  const totalAttente  = retraits.filter(r=>r.statut==='en_attente').reduce((s,r)=>s+Number(r.montant),0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Retraits</h1>
          <p style={T.sub}>Demandez un virement Orange Money</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
            <RefreshCw size={14} color="#4a5578"/>
          </button>
          <button onClick={()=>setModal(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <Plus size={15}/> Nouvelle demande
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Solde commissions',  val:`${Number(soldeDisponible).toLocaleString('fr-FR')} FCFA`,  color:'#0a9e6e' },
          { label:'Total reçu',         val:`${totalPaye.toLocaleString('fr-FR')} FCFA`,                color:'#1465BB' },
          { label:'En attente',         val:`${totalAttente.toLocaleString('fr-FR')} FCFA`,             color:'#d0a83a' },
        ].map(({label,val,color})=>(
          <div key={label} style={T.card}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
        {loading ? (
          <p style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
        ) : retraits.length === 0 ? (
          <div style={{ padding:'50px', textAlign:'center' }}>
            <Banknote size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune demande de retrait</p>
            <button onClick={()=>setModal(true)} style={{ marginTop:12, padding:'10px 20px', borderRadius:8, background:'#1465BB', color:'white', border:'none', cursor:'pointer', fontWeight:600 }}>
              Faire une demande
            </button>
          </div>
        ) : retraits.map((r:any) => {
          const s = STATUT[r.statut] || { label:r.statut, bg:'#f1f5f9', color:'#475569', Icon:Clock };
          return (
            <div key={r.id} style={{ padding:'16px 18px', borderBottom:'1px solid #f0f4fb' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#0d1b3e', margin:0 }}>
                    {Number(r.montant).toLocaleString('fr-FR')} FCFA
                  </p>
                  <p style={{ fontSize:13, color:'#4a5578', margin:'3px 0 0' }}>📱 {r.numero_orange}</p>
                  {r.notes && <p style={{ fontSize:12, color:'#8a96b0', margin:'2px 0 0', fontStyle:'italic' }}>{r.notes}</p>}
                  {r.motif_refus && <p style={{ fontSize:12, color:'#e53e3e', margin:'4px 0 0' }}>Motif : {r.motif_refus}</p>}
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ background:s.bg, color:s.color, fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20, display:'inline-block' }}>
                    {s.label}
                  </span>
                  <p style={{ fontSize:11, color:'#8a96b0', margin:'5px 0 0' }}>
                    {new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                  </p>
                  {r.traite_le && (
                    <p style={{ fontSize:11, color:'#0a9e6e', margin:'2px 0 0' }}>
                      Traité le {new Date(r.traite_le).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal demande */}
      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:440 }}>
            <div style={{ padding:'16px 20px', background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:'14px 14px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'white', margin:0 }}>Demande de retrait</h3>
              <button onClick={()=>setModal(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={T.lbl}>Montant (FCFA) *</label>
                <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="Ex: 10000" min={500} max={soldeDisponible} style={T.inp}/>
                <p style={{ fontSize:11, color:'#0a9e6e', margin:'3px 0 0' }}>
                  Solde disponible : <strong>{Number(soldeDisponible).toLocaleString('fr-FR')} FCFA</strong>
                </p>
              </div>
              <div>
                <label style={T.lbl}>Numéro Orange Money *</label>
                <input value={numero} onChange={e=>setNumero(e.target.value)} placeholder="Ex: 07 00 00 00" style={T.inp}/>
              </div>
              <div>
                <label style={T.lbl}>Notes (optionnel)</label>
                <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Précision si nécessaire…" style={T.inp}/>
              </div>
              <div style={{ background:'#fffbeb', borderRadius:8, padding:'10px 14px', border:'1px solid #fde68a' }}>
                <p style={{ fontSize:12, color:'#854d0e', margin:0 }}>
                  ⚠️ Les retraits sont traités manuellement par l'administration dans un délai de 24–48h ouvrées.
                </p>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={{ padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={submit} disabled={saving}
                  style={{ padding:'9px 20px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving?0.6:1 }}>
                  {saving ? 'Envoi…' : 'Envoyer la demande'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  h1:  { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub: { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.2rem' } as CSSProperties,
  lbl: { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:5 } as CSSProperties,
  inp: { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
  overlay: { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};
