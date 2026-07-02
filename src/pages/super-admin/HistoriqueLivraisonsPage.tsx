import { useState, useEffect, type CSSProperties } from 'react';
import { MapPin, Eye, X, Calendar, RefreshCw } from 'lucide-react';
import { livraisonsService, storageUrl } from '../../services/api';
import Pagination from '../../components/ui/Pagination';
import SearchBar from '../../components/ui/SearchBar';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  terminee:  {label:'Terminée',  bg:'#dcfce7', color:'#166534'},
  rejetee:   {label:'Rejetée',   bg:'#fee2e2', color:'#991b1b'},
  annulee:   {label:'Annulée',   bg:'#f1f5f9', color:'#475569'},
};

export default function HistoriqueLivraisonsPage() {
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [detail,     setDetail]     = useState<any>(null);
  const [query,      setQuery]      = useState('');
  const [filtre,     setFiltre]     = useState('tous');
  const [pageNum,    setPageNum]    = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await livraisonsService.getAll();
      const data = (res.data || []).filter((l:any) =>
        ['terminee','rejetee','annulee'].includes(l.statut)
      );
      setLivraisons(data);
    } catch { toast.error('Erreur chargement historique'); }
    finally { setLoading(false); }
  };

  const filtered = livraisons.filter((l:any) => {
    const matchFiltre = filtre === 'tous' || l.statut === filtre;
    if (!query.trim()) return matchFiltre;
    const q = query.toLowerCase();
    const nomLiv = `${l.livreur?.prenom||l.livreur?.name||''} ${l.livreur?.nom||''}`.toLowerCase();
    const nomVend = `${l.vente?.caissiere?.prenom||''} ${l.vente?.caissiere?.nom||''}`.toLowerCase();
    return matchFiltre && (
      nomLiv.includes(q) || nomVend.includes(q) ||
      (l.zone_livraison||'').toLowerCase().includes(q) ||
      (l.client_nom||'').toLowerCase().includes(q) ||
      String(l.id).includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((pageNum-1)*PAGE_SIZE, pageNum*PAGE_SIZE);

  const terminees = livraisons.filter(l=>l.statut==='terminee').length;
  const rejetees  = livraisons.filter(l=>l.statut==='rejetee').length;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Historique des Livraisons</h1>
          <p style={T.sub}>Livraisons terminées, rejetées — archivées pour référence</p>
        </div>
        <button onClick={load} style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total archivées',   val:livraisons.length, color:'#1465BB'},
          {label:'Terminées',         val:terminees,         color:'#0a9e6e'},
          {label:'Rejetées/Annulées', val:rejetees,          color:'#e53e3e'},
        ].map(({label,val,color})=>(
          <div key={label} style={T.card}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[{s:'tous',label:'Toutes'},{s:'terminee',label:'Terminées'},{s:'rejetee',label:'Rejetées'}].map(({s,label})=>(
          <button key={s} onClick={()=>{setFiltre(s);setPageNum(1);}}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filtre===s?'#1465BB':'#dde5f4'}`, background:filtre===s?'#1465BB':'white', color:filtre===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <SearchBar value={query} onChange={q=>{setQuery(q);setPageNum(1);}} placeholder="Rechercher par livreur, vendeur, client, zone…" count={livraisons.length} filtered={filtered.length} style={{ marginBottom:14 }}/>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : (
        <>
          {/* Table desktop */}
          <div className="urs-table-desktop" style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>{['#','Zone','Livreur','Vendeur','Client','Statut','Date',''].map(h=>(
                  <th key={h} style={T.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif' }}>Aucune livraison archivée</td></tr>
                ) : paginated.map((l:any) => {
                  const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
                  const nomL = l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : '—';
                  const nomV = l.vente?.caissiere ? `${l.vente.caissiere.prenom||l.vente.caissiere.name||''} ${l.vente.caissiere.nom||''}`.trim() : '—';
                  return (
                    <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background='#f6f9ff'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                      <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>#{l.id}</td>
                      <td style={T.td}><span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11} color="#1465BB"/>{l.zone_livraison||'—'}</span></td>
                      <td style={{ ...T.td, fontSize:12 }}>{nomL}</td>
                      <td style={{ ...T.td, fontSize:12 }}>{nomV}</td>
                      <td style={{ ...T.td, fontSize:12 }}>{l.client_nom||l.vente?.client_nom||'—'}</td>
                      <td style={T.td}><span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{sc.label}</span></td>
                      <td style={{ ...T.td, fontSize:12, color:'#8a96b0', whiteSpace:'nowrap' }}>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                      <td style={T.td}>
                        <button onClick={()=>setDetail(l)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cartes mobile */}
          <div className="urs-cards-mobile" style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4' }}>
            {paginated.length === 0 ? (
              <p style={{ padding:'40px', textAlign:'center', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif' }}>Aucune livraison archivée</p>
            ) : paginated.map((l:any) => {
              const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569'};
              const nomL = l.livreur ? `${l.livreur.prenom||l.livreur.name||''} ${l.livreur.nom||''}`.trim() : '—';
              return (
                <div key={l.id} style={{ padding:'12px 16px', borderBottom:'1px solid #f0f4fb' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontWeight:700, color:'#1465BB' }}>#{l.id}</span>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{sc.label}</span>
                      <button onClick={()=>setDetail(l)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'#4a5578', display:'flex', flexDirection:'column', gap:3 }}>
                    <span><MapPin size={10} color="#1465BB" style={{verticalAlign:'middle', marginRight:3}}/>{l.zone_livraison||'—'}</span>
                    <span>🚚 {nomL}</span>
                    {(l.client_nom||l.vente?.client_nom) && <span>👤 {l.client_nom||l.vente?.client_nom}</span>}
                    <span style={{ color:'#8a96b0' }}>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination page={pageNum} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onChange={p=>{setPageNum(p);window.scrollTo(0,0)}}/>

          {/* Modal détail */}
          {detail && (
            <div onClick={()=>setDetail(null)} style={T.overlay}>
              <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:500 }}>
                <div style={T.modalHeader}>
                  <h3 style={T.modalTitle}>Livraison #{detail.id}</h3>
                  <button onClick={()=>setDetail(null)} style={T.modalClose}><X size={15}/></button>
                </div>
                <div style={{ padding:20, display:'flex', flexDirection:'column', gap:10 }}>
                  {[
                    ['Statut',   STATUT[detail.statut]?.label||detail.statut],
                    ['Zone',     detail.zone_livraison||'—'],
                    ['Livreur',  detail.livreur ? `${detail.livreur.prenom||detail.livreur.name||''} ${detail.livreur.nom||''}`.trim() : '—'],
                    ['Vendeur',  detail.vente?.caissiere ? `${detail.vente.caissiere.prenom||detail.vente.caissiere.name||''} ${detail.vente.caissiere.nom||''}`.trim() : '—'],
                    ['Client',   detail.client_nom||detail.vente?.client_nom||'—'],
                    ['Téléphone',detail.client_telephone||detail.vente?.client_telephone||'—'],
                    ['Quartier', detail.client_quartier||detail.vente?.client_quartier||'—'],
                    ['Date',     detail.date_livraison||new Date(detail.created_at).toLocaleDateString('fr-FR')],
                    ['Motif rejet', detail.motif_rejet||'—'],
                    ['Notes',    detail.notes||'—'],
                  ].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f0f4fb' }}>
                      <span style={{ fontSize:12, color:'#8a96b0' }}>{l}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                    </div>
                  ))}
                  {detail.photo_recu && (
                    <div style={{ marginTop:8 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', margin:'0 0 6px' }}>📸 Photo du reçu</p>
                      <a href={storageUrl(detail.photo_recu)!} target="_blank" rel="noopener noreferrer">
                        <img src={storageUrl(detail.photo_recu)!} alt="Reçu" style={{ width:'100%', maxHeight:250, objectFit:'contain', borderRadius:8, border:'1px solid #dde5f4' }}/>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  th:{ fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:{ padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:{ width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'linear-gradient(90deg,#003785,#1465BB)', position:'sticky' as const, top:0 } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};
