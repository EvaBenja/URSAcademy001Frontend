import { useState, useEffect, type CSSProperties } from 'react';
import { History, MapPin, Clock, CheckCircle, XCircle, Truck, User, Phone } from 'lucide-react';
import { livraisonsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Pagination from '../../components/ui/Pagination';

import SearchBar from '../../components/ui/SearchBar';

const STATUT: Record<string,{label:string;bg:string;color:string;Icon:any}> = {
  terminee:   {label:'Terminée',   bg:'#dcfce7', color:'#166534', Icon:CheckCircle},
  rejetee:    {label:'Rejetée',    bg:'#fee2e2', color:'#991b1b', Icon:XCircle    },
  en_cours:   {label:'En cours',   bg:'#dbeafe', color:'#1e40af', Icon:Truck      },
  validee:    {label:'Validée',    bg:'#dbeafe', color:'#1e40af', Icon:Truck      },
  en_attente: {label:'En attente', bg:'#fef9c3', color:'#854d0e', Icon:Clock      },
};

export default function LivreurHistoriquePage() {
  const { user }     = useAuth();
  const [courses,    setCourses]  = useState<any[]>([]);
  const [loading,    setLoading]  = useState(true);
  const [queryH, setQueryH] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const PAGE_SIZE = 15;
  const [filter,     setFilter]   = useState('tous');
  const [detail,     setDetail]   = useState<any>(null);

  useEffect(() => {
    livraisonsService.getAll()
      .then(res => {
        const miennes = (res.data || []).filter(
          (l:any) => Number(l.livreur_id) === Number(user?.id)
        );
        setCourses(miennes);
      })
      .catch(() => toast.error('Erreur chargement historique'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const terminees = courses.filter(c => c.statut === 'terminee').length;
  const rejetees  = courses.filter(c => c.statut === 'rejetee').length;
  const taux      = (terminees + rejetees) > 0
    ? Math.round((terminees / (terminees + rejetees)) * 100) : 0;

  const filteredBase = filter === 'tous' ? courses : courses.filter(c => c.statut === filter);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((pageNum-1)*PAGE_SIZE, pageNum*PAGE_SIZE);

  if (loading) return <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>;

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Mes Courses — Historique</h1>
        <p style={T.sub}>Toutes vos courses passées avec les détails client et vente</p>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',       val:courses.length, color:'#1465BB', s:'tous'    },
          {label:'Terminées',   val:terminees,       color:'#0a9e6e', s:'terminee'},
          {label:'Rejetées',    val:rejetees,        color:'#e53e3e', s:'rejetee' },
          {label:'Taux succès', val:`${taux}%`,      color:'#7c3aed', s:'tous'    },
        ].map(({label,val,color,s}) => (
          <div key={label} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s&&s!=='tous'?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Barre taux succès */}
      {courses.length > 0 && (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1rem 1.3rem', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>Taux de réussite global</span>
            <span style={{ fontSize:13, fontWeight:700, color:taux>=80?'#0a9e6e':taux>=50?'#d0a83a':'#e53e3e' }}>{taux}%</span>
          </div>
          <div style={{ height:10, background:'#f0f4fb', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${taux}%`, background:taux>=80?'linear-gradient(90deg,#0a9e6e,#065f46)':taux>=50?'linear-gradient(90deg,#d0a83a,#b45309)':'linear-gradient(90deg,#e53e3e,#991b1b)', borderRadius:5, transition:'width .8s ease' }}/>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','terminee','en_cours','rejetee']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0', alignSelf:'center' }}>
          {filtered.length} course{filtered.length>1?'s':''}
        </span>
      </div>

      {/* Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {paginated.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center' }}>
            <History size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune course dans l'historique</p>
          </div>
        ) : filtered.map((c:any) => {
          const sc = STATUT[c.statut]||{label:c.statut,bg:'#f1f5f9',color:'#475569',Icon:Truck};
          const client_nom      = c.client_nom      || c.vente?.client_nom;
          const client_tel      = c.client_telephone || c.vente?.client_telephone;
          const client_quartier = c.client_quartier  || c.vente?.client_quartier;
          return (
            <div key={c.id} onClick={()=>setDetail(c)}
              style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:16, cursor:'pointer', transition:'all .15s' }}
              onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 14px rgba(0,55,133,0.08)'; }}
              onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:44, height:44, borderRadius:10, background:sc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <sc.Icon size={20} color={sc.color}/>
                </div>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'#1465BB' }}>Course #{c.id}</span>
                    <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{sc.label}</span>
                    {c.vente_id && <span style={{ background:'#dcfce7', color:'#166534', fontSize:11, padding:'2px 8px', borderRadius:20 }}>Vente #{c.vente_id}</span>}
                  </div>
                  <div style={{ display:'flex', gap:12, fontSize:12, color:'#8a96b0', flexWrap:'wrap', marginBottom: client_nom?6:0 }}>
                    {c.zone_livraison && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11} color="#1465BB"/>{c.zone_livraison}</span>}
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/>{c.date_livraison||new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {/* Infos client */}
                  {client_nom && (
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#0d1b3e', fontWeight:500 }}><User size={11} color="#1465BB"/>{client_nom}</span>
                      {client_tel && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#1465BB' }}><Phone size={11}/>{client_tel}</span>}
                      {client_quartier && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#8a96b0' }}><MapPin size={11}/>{client_quartier}</span>}
                    </div>
                  )}
                  {c.motif_rejet && <p style={{ fontSize:12, color:'#e53e3e', margin:'4px 0 0' }}>Motif : {c.motif_rejet}</p>}
                </div>
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
              <h3 style={T.modalTitle}>Course #{detail.id}</h3>
              <button onClick={()=>setDetail(null)} style={T.modalClose}>✕</button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:10 }}>
              {(detail.client_nom||detail.vente?.client_nom) && (
                <div style={{ background:'#e0f0ff', borderRadius:10, padding:'12px 14px', marginBottom:4 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#1e40af', textTransform:'uppercase', margin:'0 0 6px' }}>Infos client</p>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{detail.client_nom||detail.vente?.client_nom}</p>
                  {(detail.client_telephone||detail.vente?.client_telephone) && <p style={{ fontSize:13, color:'#1465BB', margin:'4px 0 0' }}>📞 {detail.client_telephone||detail.vente?.client_telephone}</p>}
                  {(detail.client_quartier||detail.vente?.client_quartier) && <p style={{ fontSize:13, color:'#4a5578', margin:'2px 0 0' }}>📍 {detail.client_quartier||detail.vente?.client_quartier}</p>}
                </div>
              )}
              {[
                ['Zone',          detail.zone_livraison||'—'],
                ['Date',          detail.date_livraison||'—'],
                ['Statut',        STATUT[detail.statut]?.label||detail.statut],
                ['Vente associée',detail.vente_id ? `#${detail.vente_id}` : '—'],
                ['Montant vente', detail.vente ? `${Number(detail.vente.montant_total||0).toLocaleString('fr-FR')} FCFA` : '—'],
                ['Motif rejet',   detail.motif_rejet||'—'],
              ].map(([l,v])=>(
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f4fb' }}>
                  <span style={{ fontSize:13, color:'#8a96b0' }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', textAlign:'right', maxWidth:'60%' }}>{v}</span>
                </div>
              ))}
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
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:{ background:'white', borderRadius:14, width:'100%', maxWidth:440, maxHeight:'92vh', overflowY:'auto' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle:{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose:{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white', fontSize:16 } as CSSProperties,
};
