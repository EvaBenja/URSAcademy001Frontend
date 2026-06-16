import { useState, useEffect, type CSSProperties } from 'react';
import { MapPin, Eye, X, Navigation, XCircle } from 'lucide-react';
import { livraisonsService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e'},
  validee:    {label:'Assignée — attente accord livreur', bg:'#dbeafe', color:'#1e40af'},
  en_cours:   {label:'Acceptée par le livreur', bg:'#dcfce7', color:'#166634'},
  rejetee:    {label:'Rejetée',    bg:'#fee2e2', color:'#991b1b'},
  terminee:   {label:'Terminée',   bg:'#f1f5f9', color:'#475569'},
};

export default function CoordLivraisonsPage() {
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [detail,     setDetail]     = useState<any>(null);
  const [filter,     setFilter]     = useState('tous');

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 12000);
    return () => clearInterval(t);
  }, []);

  const load = async (silent = false) => {
    try { const r = await livraisonsService.getAll(); setLivraisons(r.data || []); }
    catch { if (!silent) toast.error('Erreur chargement livraisons'); }
    finally { setLoading(false); }
  };

  // Assigner sans GPS coordinateur — le backend choisit le livreur
  // avec GPS actif le plus proche de la zone de livraison
  const doAssignerGPS = async (livraison: any) => {
    toast.loading('Recherche du livreur disponible…', { id: `gps-${livraison.id}` });
    try {
      const res = await livraisonsService.assigner(livraison.id, {
        latitude:  0,
        longitude: 0,
      });
      toast.success(
        `Livreur assigné : ${res.data.livreur || 'OK'}${res.data.distance ? ` (${res.data.distance})` : ''}`,
        { id: `gps-${livraison.id}` }
      );
      load();
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Aucun livreur disponible', { id: `gps-${livraison.id}` });
    }
  };

  const filtered = filter === 'tous' ? livraisons : livraisons.filter(l => l.statut === filter);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Coordination des Livraisons</h1>
        <p style={T.sub}>Assignez les livreurs les plus proches via GPS automatique</p>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',      val:livraisons.length,                                   color:'#1465BB', s:'tous'     },
          {label:'En attente', val:livraisons.filter(l=>l.statut==='en_attente').length, color:'#d0a83a', s:'en_attente'},
          {label:'En cours',   val:livraisons.filter(l=>l.statut==='en_cours').length,   color:'#0a9e6e', s:'en_cours' },
          {label:'Rejetées',   val:livraisons.filter(l=>l.statut==='rejetee').length,    color:'#e53e3e', s:'rejetee'  },
        ].map(({label,val,color,s}) => (
          <div key={s} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','en_attente','validee','en_cours','rejetee','terminee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>{['#','Zone','Livreur assigné','Statut','Date','Action'].map(h=>(
              <th key={h} style={T.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif' }}>Aucune livraison</td></tr>
            ) : filtered.map((l:any) => {
              const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
              const nomL = l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : null;
              return (
                <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{l.id}</td>
                  <td style={T.td}><span style={{ display:'flex', alignItems:'center', gap:5 }}><MapPin size={12} color="#1465BB"/>{l.zone_livraison||'—'}</span></td>
                  <td style={T.td}>
                    {nomL ? (
                      <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#0891b2,#0e7490)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:10, fontWeight:700, flexShrink:0 }}>
                          {nomL[0]}
                        </div>
                        {nomL}
                      </span>
                    ) : (
                      <button onClick={()=>doAssignerGPS(l)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:7, border:'1.5px dashed #1465BB', background:'#e0f0ff', color:'#1465BB', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                        <Navigation size={12}/> Assigner GPS
                      </button>
                    )}
                  </td>
                  <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{sc.label}</span></td>
                  <td style={{ ...T.td, color:'#8a96b0', fontSize:12, whiteSpace:'nowrap' }}>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={T.td}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>setDetail(l)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                      {l.statut === 'rejetee' && (
                        <button onClick={()=>doAssignerGPS(l)} style={{ ...T.iconBtn, color:'#7c3aed', borderColor:'#ddd6fe', background:'#f5f3ff', width:'auto', padding:'0 10px', fontSize:11 }}>
                          <Navigation size={11}/> Réassigner
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>Livraison #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['Zone',         detail.zone_livraison||'—'],
                ['Client',       detail.client_nom||detail.vente?.client_nom||'—'],
                ['Téléphone',    detail.client_telephone||detail.vente?.client_telephone||'—'],
                ['Quartier',     detail.client_quartier||detail.vente?.client_quartier||'—'],
                ['Vente liée',   detail.vente_id ? `#${detail.vente_id}` : '—'],
                ['Livreur',     detail.livreur ? `${detail.livreur.prenom||detail.livreur.name||''} ${detail.livreur.nom||''}`.trim() : 'Non assigné'],
                ['Tél. livreur',detail.livreur?.telephone||'—'],
                ['Gestionnaire',detail.gestionnaire ? `${detail.gestionnaire.prenom||detail.gestionnaire.name||''} ${detail.gestionnaire.nom||''}`.trim() : '—'],
                ['Statut',      STATUT[detail.statut]?.label||detail.statut],
                ['Date livr.',  detail.date_livraison||'—'],
                ['Notes',       detail.notes||'—'],
                ['Motif rejet', detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
              {!detail.livreur && (
                <button onClick={()=>{doAssignerGPS(detail);setDetail(null);}}
                  style={{ marginTop:10, padding:'11px', borderRadius:8, border:'none', background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Navigation size={15}/> Assigner livreur (GPS auto)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:{ width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:440, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
