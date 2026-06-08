import { useState, useEffect, type CSSProperties } from 'react';
import { History, MapPin, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { livraisonsService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string;Icon:any}> = {
  terminee:   {label:'Terminée',    bg:'#dcfce7', color:'#166534', Icon:CheckCircle},
  rejetee:    {label:'Rejetée',     bg:'#fee2e2', color:'#991b1b', Icon:XCircle    },
  en_cours:   {label:'En cours',    bg:'#dbeafe', color:'#1e40af', Icon:Truck      },
  validee:    {label:'Validée',     bg:'#dbeafe', color:'#1e40af', Icon:Truck      },
  en_attente: {label:'En attente',  bg:'#fef9c3', color:'#854d0e', Icon:Clock      },
};

export default function LivreurHistoriquePage() {
  const { user }     = useAuth();
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('tous');

  useEffect(() => {
    livraisonsService.getAll()
      .then(res => {
        const miennes = (res.data || []).filter(
          (l:any) => Number(l.livreur_id) === Number(user?.id)
        );
        setLivraisons(miennes);
      })
      .catch(() => toast.error('Erreur chargement historique'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const terminees = livraisons.filter(l => l.statut === 'terminee').length;
  const rejetees  = livraisons.filter(l => l.statut === 'rejetee').length;
  const taux      = livraisons.filter(l => ['terminee','rejetee'].includes(l.statut)).length > 0
    ? Math.round((terminees / livraisons.filter(l => ['terminee','rejetee'].includes(l.statut)).length) * 100)
    : 0;

  const filtered = filter === 'tous' ? livraisons : livraisons.filter(l => l.statut === filter);

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement de l'historique…
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Historique des livraisons</h1>
        <p style={T.sub}>Retrouvez toutes vos livraisons et vos statistiques</p>
      </div>

      {/* Stats */}
      <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total',        val:livraisons.length, color:'#1465BB', s:'tous'    },
          {label:'Terminées',    val:terminees,          color:'#0a9e6e', s:'terminee'},
          {label:'Rejetées',     val:rejetees,           color:'#e53e3e', s:'rejetee' },
          {label:'Taux succès',  val:`${taux}%`,         color:'#7c3aed', s:'tous'    },
        ].map(({label,val,color,s}) => (
          <div key={label} onClick={()=>setFilter(s)}
            style={{ background:'white', borderRadius:12, border:`1.5px solid ${filter===s&&s!=='tous'?color:'#dde5f4'}`, padding:'1.1rem 1.3rem', cursor:'pointer' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Barre taux */}
      {livraisons.length > 0 && (
        <div style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1rem 1.3rem', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>Taux de réussite</span>
            <span style={{ fontSize:13, fontWeight:700, color:taux>=80?'#0a9e6e':taux>=50?'#d0a83a':'#e53e3e' }}>{taux}%</span>
          </div>
          <div style={{ height:10, background:'#f0f4fb', borderRadius:5, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${taux}%`, background:taux>=80?'linear-gradient(90deg,#0a9e6e,#065f46)':taux>=50?'linear-gradient(90deg,#d0a83a,#b45309)':'linear-gradient(90deg,#e53e3e,#991b1b)', borderRadius:5, transition:'width .8s ease' }}/>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {(['tous','terminee','en_cours','rejetee','validee','en_attente']).map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {s==='tous'?'Toutes':STATUT[s]?.label||s}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center' }}>
            <History size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>Aucune livraison dans l'historique</p>
          </div>
        ) : filtered.map((l:any) => {
          const sc = STATUT[l.statut]||{label:l.statut,bg:'#f1f5f9',color:'#475569',Icon:Truck};
          return (
            <div key={l.id} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ width:44, height:44, borderRadius:10, background:sc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <sc.Icon size={20} color={sc.color}/>
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'#1465BB' }}>Livraison #{l.id}</span>
                  <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{sc.label}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'#8a96b0', flexWrap:'wrap' }}>
                  {l.zone_livraison && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11} color="#1465BB"/>{l.zone_livraison}</span>}
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/>{l.date_livraison||new Date(l.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
                </div>
                {l.motif_rejet && <p style={{ fontSize:12, color:'#e53e3e', margin:'4px 0 0' }}>Motif rejet : {l.motif_rejet}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@media(max-width:768px){.stats-4{grid-template-columns:repeat(2,1fr)!important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
};
