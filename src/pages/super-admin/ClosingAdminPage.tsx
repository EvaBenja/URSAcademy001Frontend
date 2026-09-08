import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, Package, Phone, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { closingService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  disponible:        { label:'Disponible',      bg:'#dbeafe', color:'#1e40af' },
  prise:             { label:'En cours',        bg:'#fef9c3', color:'#854d0e' },
  a_relancer:        { label:'À relancer',       bg:'#fed7aa', color:'#9a3412' },
  rejetee:           { label:'Rejetée',          bg:'#fee2e2', color:'#991b1b' },
  envoyee_livraison: { label:'En livraison ✓',   bg:'#dcfce7', color:'#166534' },
  livree:            { label:'Livrée ✓',         bg:'#dcfce7', color:'#166534' },
};

export default function ClosingAdminPage() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [stats,     setStats]     = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('tous');
  const [expanded,  setExpanded]  = useState<number|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([closingService.getAll(), closingService.stats()]);
      setCommandes(c.data || []);
      setStats(s.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'tous' ? commandes : commandes.filter(c => c.statut === filter);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Closing Shopify</h1>
          <p style={T.sub}>Suivi de toutes les commandes</p>
        </div>
        <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Disponibles',     val:stats.disponibles,         color:'#1465BB' },
            { label:'En cours',        val:stats.prises,               color:'#d0a83a' },
            { label:'À relancer',      val:stats.a_relancer,           color:'#ea580c' },
            { label:'En livraison',    val:stats.envoyees_livraison,   color:'#0a9e6e' },
            { label:'Rejetées',        val:stats.rejetees,             color:'#991b1b' },
            { label:'Total',           val:stats.total,                color:'#0d1b3e' },
          ].map(({label,val,color})=>(
            <div key={label} style={T.card}>
              <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
              <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        {[
          {s:'tous',label:'Toutes'},
          {s:'disponible',label:'Disponibles'},
          {s:'prise',label:'En cours'},
          {s:'a_relancer',label:'À relancer'},
          {s:'rejetee',label:'Rejetées'},
          {s:'envoyee_livraison',label:'En livraison'},
        ].map(({s,label})=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${filter===s?'#1465BB':'#dde5f4'}`, background:filter===s?'#1465BB':'white', color:filter===s?'white':'#4a5578', fontSize:12, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'40px' }}>
          <Package size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune commande</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((c:any) => {
            const s = STATUT[c.statut] || { label:c.statut, bg:'#f1f5f9', color:'#475569' };
            const isOpen = expanded === c.id;
            const produits = Array.isArray(c.produits) ? c.produits : [];
            return (
              <div key={c.id} style={{ ...T.card, padding:0, overflow:'hidden' }}>
                <div onClick={()=>setExpanded(isOpen?null:c.id)}
                  style={{ padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', cursor:'pointer', gap:12 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#1465BB' }}>#{c.shopify_order_number || c.id}</span>
                      <span style={{ background:s.bg, color:s.color, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20 }}>{s.label}</span>
                      {c.vendeur && <span style={{ fontSize:11, color:'#8a96b0' }}>👤 {`${c.vendeur.prenom||c.vendeur.name||''} ${c.vendeur.nom||''}`.trim()}</span>}
                    </div>
                    <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{c.client_nom||'—'}</p>
                    {c.client_telephone && (
                      <a href={`tel:${c.client_telephone}`} onClick={e=>e.stopPropagation()}
                        style={{ fontSize:12, color:'#1465BB', textDecoration:'none', display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                        <Phone size={11}/>{c.client_telephone}
                      </a>
                    )}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#0a9e6e', margin:0 }}>
                      {Number(c.montant_total).toLocaleString('fr-FR')} {c.devise||'FCFA'}
                    </p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>{new Date(c.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</p>
                    {isOpen ? <ChevronUp size={13} color="#8a96b0"/> : <ChevronDown size={13} color="#8a96b0"/>}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop:'1px solid #f0f4fb' }}>
                    {(c.client_adresse||c.client_ville) && (
                      <div style={{ padding:'8px 16px', background:'#f8faff', fontSize:12, color:'#4a5578', display:'flex', alignItems:'center', gap:5 }}>
                        <MapPin size={12} color="#1465BB"/>
                        {[c.client_adresse, c.client_ville, c.client_pays].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {produits.length > 0 && (
                      <div style={{ padding:'10px 16px' }}>
                        {produits.map((p:any,i:number)=>(
                          <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 8px', background:'#f4f7fd', borderRadius:7, marginBottom:4 }}>
                            <span style={{ color:'#0d1b3e', fontWeight:600 }}>{p.nom} {p.variante?`(${p.variante})`:''} ×{p.quantite}</span>
                            <span style={{ color:'#0a9e6e' }}>{Number(p.prix).toLocaleString('fr-FR')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(c.motif_relance||c.motif_rejet) && (
                      <div style={{ padding:'8px 16px', background:'#fff7ed', borderTop:'1px solid #fed7aa', fontSize:12, color:'#9a3412' }}>
                        {c.motif_relance?`🔄 Relance: ${c.motif_relance}`:`❌ Rejet: ${c.motif_rejet}`}
                      </div>
                    )}
                    {c.vente_id && (
                      <div style={{ padding:'8px 16px', background:'#f0fdf4', borderTop:'1px solid #86efac', fontSize:12, color:'#166534', fontWeight:600 }}>
                        ✅ Vente #{c.vente_id} créée
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const T = {
  h1:  { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub: { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1rem' } as CSSProperties,
};
