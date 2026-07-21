import { useState, useEffect, type CSSProperties } from 'react';
import { CheckCircle, XCircle, Banknote, RefreshCw, X, Clock } from 'lucide-react';
import { retraitsService } from '../../services/api';
import CopyPhone from '../../components/ui/CopyPhone';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e' },
  approuve:   { label:'Approuvé',    bg:'#dbeafe', color:'#1e40af' },
  paye:       { label:'Payé',        bg:'#dcfce7', color:'#166534' },
  refuse:     { label:'Refusé',      bg:'#fee2e2', color:'#991b1b' },
};

export default function GestionRetraitsPage() {
  const [retraits,  setRetraits]  = useState<any[]>([]);
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('tous');
  const [query,     setQuery]     = useState('');
  const [pageNum,   setPageNum]   = useState(1);
  const [refusModal,setRefusModal]= useState<any>(null);
  const [motif,     setMotif]     = useState('');
  const PAGE_SIZE = 20;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([retraitsService.getAll(), retraitsService.stats()]);
      setRetraits(r.data || []);
      setStats(s.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const filtered = retraits.filter(r => {
    const matchF = filter === 'tous' || r.statut === filter;
    if (!query.trim()) return matchF;
    const q = query.toLowerCase();
    const nom = `${r.user?.prenom||r.user?.name||''} ${r.user?.nom||''}`.toLowerCase();
    return matchF && (nom.includes(q) || (r.numero_orange||'').includes(q) || String(r.montant).includes(q));
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((pageNum-1)*PAGE_SIZE, pageNum*PAGE_SIZE);

  const doAction = async (action: ()=>Promise<any>, msg: string) => {
    setSaving(true);
    try { await action(); toast.success(msg); setRefusModal(null); load(); }
    catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Gestion des Retraits</h1>
          <p style={T.sub}>Demandes de virement Orange Money des vendeurs</p>
        </div>
        <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          {[
            { label:'Total demandes', val:stats.total_demandes,                              color:'#1465BB' },
            { label:'En attente',     val:stats.en_attente,                                  color:'#d0a83a' },
            { label:'Total approuvé', val:`${Number(stats.total_approuve).toLocaleString('fr-FR')} FCFA`, color:'#3b82f6' },
            { label:'Total payé',     val:`${Number(stats.total_paye).toLocaleString('fr-FR')} FCFA`,     color:'#0a9e6e' },
          ].map(({label,val,color})=>(
            <div key={label} style={T.card}>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[{s:'tous',label:'Tous'},{s:'en_attente',label:'En attente'},{s:'approuve',label:'Approuvés'},{s:'paye',label:'Payés'},{s:'refuse',label:'Refusés'}].map(({s,label})=>(
          <button key={s} onClick={()=>{setFilter(s);setPageNum(1);}}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {label}
            {s==='en_attente' && stats?.en_attente > 0 && <span style={{ marginLeft:5, background:'#e53e3e', color:'white', borderRadius:10, padding:'0 6px', fontSize:10, fontWeight:700 }}>{stats.en_attente}</span>}
          </button>
        ))}
      </div>

      <SearchBar value={query} onChange={q=>{setQuery(q);setPageNum(1);}} placeholder="Rechercher par vendeur, numéro, montant…" count={retraits.length} filtered={filtered.length} style={{ marginBottom:14 }}/>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : paginated.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'40px' }}>
          <Banknote size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune demande</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {paginated.map((r:any) => {
            const s = STATUT[r.statut] || { label:r.statut, bg:'#f1f5f9', color:'#475569' };
            const nomVendeur = `${r.user?.prenom||r.user?.name||''} ${r.user?.nom||''}`.trim();
            return (
              <div key={r.id} style={{ ...T.card, padding:0, overflow:'hidden' }}>
                <div style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                  {/* Infos vendeur + montant */}
                  <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:16, flexShrink:0 }}>
                      {(nomVendeur[0]||'?')}
                    </div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{nomVendeur}</p>
                      <div style={{ marginTop:3 }}><CopyPhone tel={r.numero_orange} style={{ fontSize:12 }}/></div>
                      {r.notes && <p style={{ fontSize:12, color:'#8a96b0', margin:'3px 0 0', fontStyle:'italic' }}>{r.notes}</p>}
                      <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>
                        <Clock size={10} style={{ verticalAlign:'middle', marginRight:3 }}/>
                        {new Date(r.created_at).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Montant + statut */}
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:'#0d1b3e', margin:0 }}>
                      {Number(r.montant).toLocaleString('fr-FR')} FCFA
                    </p>
                    <span style={{ background:s.bg, color:s.color, fontSize:12, fontWeight:600, padding:'3px 12px', borderRadius:20, display:'inline-block', marginTop:4 }}>
                      {s.label}
                    </span>
                    {r.motif_refus && <p style={{ fontSize:11, color:'#e53e3e', margin:'4px 0 0', maxWidth:180 }}>Motif : {r.motif_refus}</p>}
                  </div>
                </div>

                {/* Actions */}
                {r.statut === 'en_attente' && (
                  <div style={{ padding:'10px 18px', background:'#f8faff', borderTop:'1px solid #f0f4fb', display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button onClick={()=>doAction(()=>retraitsService.approuver(r.id), 'Retrait approuvé')} disabled={saving}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:7, background:'#dbeafe', color:'#1e40af', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, opacity:saving?0.6:1 }}>
                      <CheckCircle size={13}/> Approuver
                    </button>
                    <button onClick={()=>{setRefusModal(r);setMotif('');}} disabled={saving}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:7, background:'#fee2e2', color:'#991b1b', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, opacity:saving?0.6:1 }}>
                      <XCircle size={13}/> Refuser
                    </button>
                  </div>
                )}
                {r.statut === 'approuve' && (
                  <div style={{ padding:'10px 18px', background:'#f0fdf4', borderTop:'1px solid #f0f4fb', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <p style={{ fontSize:12, color:'#166534', margin:0 }}>✓ Approuvé — en attente de virement</p>
                    <button onClick={()=>doAction(()=>retraitsService.payer(r.id), '✓ Marqué comme payé')} disabled={saving}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 16px', borderRadius:7, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, opacity:saving?0.6:1 }}>
                      <Banknote size={13}/> Marquer comme payé
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <Pagination page={pageNum} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={p=>{setPageNum(p);window.scrollTo(0,0)}}/>
        </div>
      )}

      {/* Modal refus */}
      {refusModal && (
        <div onClick={()=>setRefusModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:400, padding:20 }}>
            <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'#0d1b3e', margin:'0 0 14px' }}>Motif du refus</h3>
            <textarea value={motif} onChange={e=>setMotif(e.target.value)} rows={3}
              placeholder="Ex: Solde insuffisant, numéro incorrect…"
              style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:13, outline:'none', resize:'none', boxSizing:'border-box' }}/>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:14 }}>
              <button onClick={()=>setRefusModal(null)} style={{ padding:'8px 16px', borderRadius:7, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
              <button onClick={()=>{
                if (!motif.trim()) { toast.error('Motif requis'); return; }
                doAction(()=>retraitsService.refuser(refusModal.id, motif), 'Retrait refusé');
              }} disabled={saving}
                style={{ padding:'8px 16px', borderRadius:7, background:'#e53e3e', color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving?0.6:1 }}>
                Confirmer le refus
              </button>
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
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  overlay: { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};
