import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, CheckCircle, Banknote, TrendingUp, Edit2, X } from 'lucide-react';
import { commissionsService } from '../../services/api';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e' },
  validee:    { label:'Validée',     bg:'#dbeafe', color:'#1e40af' },
  payee:      { label:'Payée ✓',     bg:'#dcfce7', color:'#166534' },
};

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats,       setStats]       = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [editModal,   setEditModal]   = useState<any>(null);
  const [editMontant, setEditMontant] = useState('');
  const [editMotif,   setEditMotif]   = useState('');
  const [filter,      setFilter]      = useState('tous');
  const [query,       setQuery]       = useState('');
  const [pageNum,     setPageNum]     = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([commissionsService.getAll(), commissionsService.stats()]);
      setCommissions(c.data || []);
      setStats(s.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  const doAction = async (action: ()=>Promise<any>, msg: string) => {
    setSaving(true);
    try { await action(); toast.success(msg); load(); }
    catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const doModifier = async () => {
    if (!editModal) return;
    const m = parseFloat(editMontant);
    if (isNaN(m) || m < 0) { toast.error('Montant invalide'); return; }
    if (!editMotif.trim() || editMotif.trim().length < 5) { toast.error('Justification requise (min 5 caractères)'); return; }
    setSaving(true);
    try {
      await commissionsService.modifier(editModal.id, m, editMotif.trim());
      toast.success('Commission modifiée ✓');
      setEditModal(null); setEditMontant(''); setEditMotif('');
      load();
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const filtered = commissions.filter(c => {
    const matchF = filter === 'tous' || c.statut === filter;
    if (!query.trim()) return matchF;
    const q = query.toLowerCase();
    const nom = `${c.user?.prenom||c.user?.name||''} ${c.user?.nom||''}`.toLowerCase();
    const prod = (c.produit?.nom||'').toLowerCase();
    return matchF && (nom.includes(q) || prod.includes(q) || String(c.montant_commission).includes(q));
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((pageNum-1)*PAGE_SIZE, pageNum*PAGE_SIZE);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Commissions</h1>
          <p style={T.sub}>Marges et commissions par vendeur</p>
        </div>
        <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
          {[
            { label:'Total commissions', val:`${Number(stats.total_global).toLocaleString('fr-FR')} FCFA`,      color:'#1465BB' },
            { label:'En attente',        val:`${Number(stats.total_en_attente).toLocaleString('fr-FR')} FCFA`,  color:'#d0a83a' },
            { label:'Total payé',        val:`${Number(stats.total_paye).toLocaleString('fr-FR')} FCFA`,        color:'#0a9e6e' },
          ].map(({label,val,color}) => (
            <div key={label} style={T.card}>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats par vendeur */}
      {stats?.par_vendeur?.length > 0 && (
        <div style={{ ...T.card, marginBottom:22 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', textTransform:'uppercase', letterSpacing:'.5px', margin:'0 0 12px' }}>
            <TrendingUp size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>Classement vendeurs
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {stats.par_vendeur.sort((a:any,b:any)=>b.total_commissions-a.total_commissions).map((v:any) => (
              <div key={v.vendeur} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#f8faff', borderRadius:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{v.vendeur}</span>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'#0a9e6e' }}>{Number(v.total_commissions).toLocaleString('fr-FR')} FCFA</span>
                  <span style={{ fontSize:11, color:'#8a96b0', marginLeft:8 }}>{v.nb_ventes} vente{v.nb_ventes>1?'s':''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[{s:'tous',label:'Toutes'},{s:'en_attente',label:'En attente'},{s:'validee',label:'Validées'},{s:'payee',label:'Payées'}].map(({s,label}) => (
          <button key={s} onClick={()=>{setFilter(s);setPageNum(1);}}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <SearchBar value={query} onChange={q=>{setQuery(q);setPageNum(1);}} placeholder="Rechercher par vendeur, produit…" count={commissions.length} filtered={filtered.length} style={{ marginBottom:14 }}/>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : paginated.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'40px' }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune commission</p>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflow:'hidden' }}>
          {paginated.map((c:any) => {
            const s = STATUT[c.statut] || { label:c.statut, bg:'#f1f5f9', color:'#475569' };
            const nomV = `${c.user?.prenom||c.user?.name||''} ${c.user?.nom||''}`.trim();
            return (
              <div key={c.id} style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{nomV}</p>
                    {c.produit && <p style={{ fontSize:12, color:'#4a5578', margin:'2px 0 0' }}>📦 {c.produit.nom}</p>}
                    {c.vente && <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>Vente #{c.vente.id} · {new Date(c.created_at).toLocaleDateString('fr-FR')}</p>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#0a9e6e', margin:0 }}>
                      {Number(c.montant_commission).toLocaleString('fr-FR')} FCFA
                    </p>
                    <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, display:'inline-block', marginTop:4 }}>
                      {s.label}
                    </span>
                  </div>
                </div>
                {(c.statut === 'en_attente' || c.statut === 'validee') && (
                  <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                    <button onClick={()=>{setEditModal(c);setEditMontant(String(c.montant_commission));setEditMotif('');}}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:7, background:'#fef9c3', color:'#854d0e', border:'none', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                      <Edit2 size={12}/> Modifier
                    </button>
                    {c.statut === 'en_attente' && (
                      <button onClick={()=>doAction(()=>commissionsService.valider(c.id),'Commission validée')} disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, background:'#dbeafe', color:'#1e40af', border:'none', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                        <CheckCircle size={12}/> Valider
                      </button>
                    )}
                    {c.statut === 'validee' && (
                      <button onClick={()=>doAction(()=>commissionsService.payer(c.id),'Commission payée ✓')} disabled={saving}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:7, background:'#dcfce7', color:'#166534', border:'none', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                        <Banknote size={12}/> Marquer payée
                      </button>
                    )}
                  </div>
                )}
                {/* Affichage modification si présente */}
                {c.montant_initial && Number(c.montant_initial) !== Number(c.montant_commission) && (
                  <div style={{ marginTop:8, background:'#fff7ed', borderRadius:8, padding:'8px 12px', border:'1px solid #fed7aa', fontSize:12 }}>
                    <p style={{ color:'#c2410c', fontWeight:600, margin:'0 0 2px' }}>⚠️ Commission modifiée</p>
                    <p style={{ color:'#7c3c0f', margin:0 }}>
                      Ancien montant : <s>{Number(c.montant_initial).toLocaleString('fr-FR')} FCFA</s>
                      {c.motif_modification && <span style={{ display:'block', marginTop:2, color:'#92400e' }}>Motif : {c.motif_modification}</span>}
                      {c.modifie_le && <span style={{ display:'block', color:'#b45309', marginTop:1 }}>Le {new Date(c.modifie_le).toLocaleDateString('fr-FR', {day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          <Pagination page={pageNum} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={p=>{setPageNum(p);window.scrollTo(0,0)}}/>

      {/* Modal modification commission */}
      {editModal && (
        <div onClick={()=>setEditModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:440, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', background:'linear-gradient(90deg,#d97706,#b45309)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'white', margin:0 }}>
                <Edit2 size={15} style={{ verticalAlign:'middle', marginRight:6 }}/>Modifier la commission
              </h3>
              <button onClick={()=>setEditModal(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#f8faff', borderRadius:8, padding:'10px 14px', fontSize:13 }}>
                <p style={{ margin:0, color:'#4a5578' }}>
                  Vendeur : <strong>{`${editModal.user?.prenom||editModal.user?.name||''} ${editModal.user?.nom||''}`.trim()}</strong>
                </p>
                <p style={{ margin:'4px 0 0', color:'#4a5578' }}>
                  Produit : <strong>{editModal.produit?.nom || '—'}</strong>
                </p>
                <p style={{ margin:'4px 0 0', color:'#4a5578' }}>
                  Montant actuel : <strong style={{ color:'#0a9e6e' }}>{Number(editModal.montant_commission).toLocaleString('fr-FR')} FCFA</strong>
                </p>
              </div>

              <div>
                <label style={T2.lbl}>Nouveau montant (FCFA) *</label>
                <input type="number" min={0} value={editMontant} onChange={e=>setEditMontant(e.target.value)}
                  placeholder="0" style={T2.inp}/>
                <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>Mettre 0 pour annuler la commission</p>
              </div>

              <div>
                <label style={T2.lbl}>Justification obligatoire *</label>
                <select value={editMotif} onChange={e=>setEditMotif(e.target.value)} style={T2.inp}>
                  <option value="">— Choisir un motif —</option>
                  <option value="Vente validée par erreur">Vente validée par erreur</option>
                  <option value="Annulation de la commande">Annulation de la commande</option>
                  <option value="Bon de réduction ou remise exceptionnelle">Bon de réduction ou remise exceptionnelle</option>
                  <option value="Correction administrative">Correction administrative</option>
                  <option value="Autre">Autre</option>
                </select>
                {editMotif === 'Autre' && (
                  <input value={editMotif} onChange={e=>setEditMotif(e.target.value)}
                    placeholder="Précisez le motif…" style={{ ...T2.inp, marginTop:8 }}/>
                )}
              </div>

              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setEditModal(null)} style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={doModifier} disabled={saving}
                  style={{ padding:'9px 20px', borderRadius:8, background:'linear-gradient(90deg,#d97706,#b45309)', color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving?0.6:1 }}>
                  {saving ? 'Modification…' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}

const T = {
  h1:  { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub: { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};

const T2 = {
  lbl: { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:4 } as CSSProperties,
  inp: { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
};
