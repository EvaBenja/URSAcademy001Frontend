import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, Package, X, TrendingDown } from 'lucide-react';
import { financeService } from '../../services/api';
import toast from 'react-hot-toast';

export default function BudgetStockPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [montant, setMontant] = useState('');
  const [desc,    setDesc]    = useState('');
  const [saving,  setSaving]  = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await financeService.budgetStock(); setData(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deduire = async () => {
    const m = parseFloat(montant);
    if (!m || m <= 0) { toast.error('Montant invalide'); return; }
    if (!desc.trim()) { toast.error('Description requise'); return; }
    if (data && m > data.solde) { toast.error('Solde insuffisant'); return; }
    setSaving(true);
    try {
      await financeService.deduireBudgetStock(m, desc);
      toast.success('Déduction effectuée ✓');
      setModal(false); setMontant(''); setDesc('');
      load();
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Budget Stock</h1>
          <p style={T.sub}>Gestion du budget d'approvisionnement</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
            <RefreshCw size={14} color="#4a5578"/>
          </button>
          <button onClick={()=>setModal(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <TrendingDown size={14}/> Déduire
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : data && (
        <>
          {/* Solde */}
          <div style={{ background:'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius:16, padding:'24px 28px', marginBottom:20 }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>Solde Budget Stock</p>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:36, fontWeight:700, color:'white', margin:0 }}>
              {Number(data.solde).toLocaleString('fr-FR')} FCFA
            </p>
            <div style={{ display:'flex', gap:24, marginTop:14, flexWrap:'wrap' }}>
              <div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', margin:'0 0 2px' }}>Total entrées</p>
                <p style={{ fontSize:15, fontWeight:600, color:'#86efac', margin:0 }}>+{Number(data.entrees).toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', margin:'0 0 2px' }}>Total sorties</p>
                <p style={{ fontSize:15, fontWeight:600, color:'#fca5a5', margin:0 }}>-{Number(data.sorties).toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', textTransform:'uppercase', letterSpacing:'.5px', margin:0 }}>
                <Package size={12} style={{ verticalAlign:'middle', marginRight:5 }}/>Historique des mouvements
              </p>
            </div>
            {(!data.historique || data.historique.length === 0) ? (
              <p style={{ padding:'30px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:16 }}>Aucun mouvement</p>
            ) : data.historique.map((h:any) => (
              <div key={h.id} style={{ padding:'12px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{h.description}</p>
                  <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>
                    {h.traite_par ? `${h.traite_par.prenom||h.traite_par.name} ${h.traite_par.nom||''}` : '—'} · {new Date(h.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </p>
                </div>
                <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:h.type==='credit'?'#0a9e6e':'#e53e3e', flexShrink:0 }}>
                  {h.type==='credit'?'+':'-'}{Number(h.montant).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:400, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', background:'linear-gradient(90deg,#7c3aed,#5b21b6)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'white', margin:0 }}>Déduire du budget stock</h3>
              <button onClick={()=>setModal(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'#f5f3ff', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#5b21b6', fontWeight:600 }}>
                Solde disponible : {Number(data?.solde||0).toLocaleString('fr-FR')} FCFA
              </div>
              <div><label style={T2.lbl}>Montant (FCFA) *</label><input type="number" min={1} value={montant} onChange={e=>setMontant(e.target.value)} placeholder="Ex: 100000" style={T2.inp}/></div>
              <div><label style={T2.lbl}>Description *</label><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ex: Achat stocks produit A" style={T2.inp}/></div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={deduire} disabled={saving} style={{ padding:'9px 20px', borderRadius:8, background:'linear-gradient(90deg,#7c3aed,#5b21b6)', color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving?0.6:1 }}>
                  {saving?'…':'Confirmer'}
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
  h1:     { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:    { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:   { background:'white', borderRadius:14, border:'1px solid #dde5f4' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};
const T2 = {
  lbl: { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:4 } as CSSProperties,
  inp: { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
};
