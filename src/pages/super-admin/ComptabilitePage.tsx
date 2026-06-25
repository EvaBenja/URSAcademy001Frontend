import { useState, useEffect, type CSSProperties } from 'react';
import { Calendar, TrendingUp, TrendingDown, Package, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import CopyPhone from '../../components/ui/CopyPhone';
import toast from 'react-hot-toast';

const STATUT_LIV: Record<string,{label:string;color:string}> = {
  en_attente:                { label:'En attente livreur', color:'#854d0e' },
  validee:                   { label:'Livreur assigné',    color:'#1e40af' },
  en_cours:                  { label:'En livraison',       color:'#166534' },
  livree_attente_validation: { label:'Livré — à valider',  color:'#5b21b6' },
  terminee:                  { label:'✓ Terminée',         color:'#166534' },
  rejetee:                   { label:'Rejetée',            color:'#991b1b' },
  sans_livraison:            { label:'Sans livraison',     color:'#475569' },
};

export default function ComptabilitePage() {
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [data,      setData]      = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<Record<number,boolean>>({});

  const load = async (d = date) => {
    setLoading(true);
    try {
      const res = await api.get(`/comptabilite/journalier?date=${d}`);
      setData(res.data);
    } catch { toast.error('Erreur chargement comptabilité'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [date]);

  const toggle = (i: number) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Comptabilité Journalière</h1>
          <p style={T.sub}>Détail des ventes par vendeur — CA réel (livraisons terminées)</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:13, color:'#0d1b3e' }}/>
          <button onClick={()=>load()} style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
            <RefreshCw size={14} color="#4a5578"/>
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Chargement…</p>
      ) : !data ? null : (
        <>
          {/* KPI du jour */}
          <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
            {[
              { label:'CA Réel du jour',    val:`${Number(data.ca_reel).toLocaleString('fr-FR')} FCFA`,    color:'#1465BB', icon:'✅' },
              { label:'CA en cours',         val:`${Number(data.ca_en_cours).toLocaleString('fr-FR')} FCFA`, color:'#d0a83a', icon:'🔄' },
              { label:'Ventes soumises',     val:data.nb_ventes,    color:'#0a9e6e', icon:'📦' },
              { label:'Ventes annulées',     val:data.nb_annulees,  color:'#e53e3e', icon:'❌' },
            ].map(({label,val,color,icon}) => (
              <div key={label} style={T.card}>
                <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{icon} {val}</p>
                <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
              </div>
            ))}
          </div>

          {data.par_vendeur.length === 0 ? (
            <div style={{ ...T.card, textAlign:'center', padding:'40px' }}>
              <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>
                Aucune vente enregistrée pour le {new Date(date).toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})}
              </p>
            </div>
          ) : data.par_vendeur.map((vendeur: any, i: number) => (
            <div key={i} style={{ ...T.card, padding:0, overflow:'hidden', marginBottom:14 }}>
              {/* Header vendeur */}
              <div style={{ padding:'14px 18px', background:'linear-gradient(90deg,#003785,#1465BB)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, cursor:'pointer' }}
                onClick={()=>toggle(i)}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:15, flexShrink:0 }}>
                    {vendeur.vendeur[0]||'?'}
                  </div>
                  <div>
                    <p style={{ fontSize:15, fontWeight:700, color:'white', margin:0 }}>{vendeur.vendeur}</p>
                    {vendeur.telephone && vendeur.telephone !== '—' && (
                      <div onClick={e=>e.stopPropagation()}>
                        <CopyPhone tel={vendeur.telephone} style={{ background:'rgba(255,255,255,0.15)', color:'white', fontSize:11 }}/>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:18, fontWeight:700, color:'#d0a83a', margin:0 }}>{Number(vendeur.ca_reel).toLocaleString('fr-FR')} FCFA</p>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.7)', margin:0 }}>CA réel · {vendeur.nb_ventes} vente{vendeur.nb_ventes>1?'s':''}</p>
                    {vendeur.total_remises > 0 && <p style={{ fontSize:11, color:'#fca5a5', margin:0 }}>−{Number(vendeur.total_remises).toLocaleString('fr-FR')} remises</p>}
                  </div>
                  {expanded[i] ? <ChevronUp size={18} color="white"/> : <ChevronDown size={18} color="white"/>}
                </div>
              </div>

              {/* Détail des ventes */}
              {expanded[i] && (
                <div>
                  {vendeur.ventes.map((vente: any, j: number) => {
                    const sl = STATUT_LIV[vente.statut_liv] || { label: vente.statut_liv, color:'#475569' };
                    const isTerminee = vente.statut_liv === 'terminee';
                    return (
                      <div key={j} style={{ padding:'12px 18px', borderBottom:'1px solid #f0f4fb', background: isTerminee?'#f0fdf4':j%2===0?'white':'#fafbff' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                          <div>
                            <span style={{ fontWeight:700, color:'#1465BB', fontSize:13 }}>Vente #{vente.id}</span>
                            <span style={{ fontSize:12, color:'#8a96b0', marginLeft:8 }}>{vente.heure}</span>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, fontWeight:600, color:sl.color }}>{sl.label}</span>
                            <span style={{ fontWeight:700, color: isTerminee?'#166534':'#0d1b3e', fontSize:14 }}>
                              {Number(vente.montant).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>
                        {/* Produits */}
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {vente.produits.map((p: any, k: number) => (
                            <div key={k} style={{ background:'#dbeafe', borderRadius:8, padding:'4px 10px', fontSize:11 }}>
                              <span style={{ fontWeight:600, color:'#1e40af' }}>{p.nom}</span>
                              {p.couleur && <span style={{ background:'white', color:'#1465BB', borderRadius:4, padding:'0 4px', marginLeft:4, fontSize:9, fontWeight:700 }}>{p.couleur}</span>}
                              <span style={{ color:'#4a5578', marginLeft:4 }}>×{p.quantite} @ {Number(p.prix).toLocaleString('fr-FR')}</span>
                              {p.remise > 0 && <span style={{ color:'#e53e3e', marginLeft:4 }}>−{Number(p.remise).toLocaleString('fr-FR')}</span>}
                              <span style={{ color:'#1465BB', fontWeight:700, marginLeft:4 }}>= {Number(p.sous_total).toLocaleString('fr-FR')}</span>
                            </div>
                          ))}
                        </div>
                        {vente.total_remises > 0 && (
                          <p style={{ fontSize:11, color:'#e53e3e', margin:'5px 0 0' }}>Remise totale : −{Number(vente.total_remises).toLocaleString('fr-FR')} FCFA</p>
                        )}
                      </div>
                    );
                  })}
                  {/* Récap vendeur */}
                  <div style={{ padding:'12px 18px', background:'#f0f4ff', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                    <span style={{ fontSize:13, color:'#4a5578' }}>{vendeur.nb_ventes} vente{vendeur.nb_ventes>1?'s':''} · Remises : {Number(vendeur.total_remises).toLocaleString('fr-FR')} FCFA</span>
                    <div style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:13, color:'#d0a83a', fontWeight:600 }}>En cours : {Number(vendeur.ca_soumis - vendeur.ca_reel).toLocaleString('fr-FR')} FCFA</span>
                      <span style={{ fontSize:13, color:'#0a9e6e', fontWeight:700 }}>CA réel : {Number(vendeur.ca_reel).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Total global */}
          {data.par_vendeur.length > 0 && (
            <div style={{ ...T.card, background:'linear-gradient(90deg,#0d1b3e,#1465BB)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', margin:0 }}>Total journée — {new Date(date).toLocaleDateString('fr-FR', {weekday:'long',day:'numeric',month:'long'})}</p>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:28, fontWeight:700, color:'#d0a83a', margin:'4px 0 0' }}>{Number(data.ca_reel).toLocaleString('fr-FR')} FCFA</p>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:'3px 0 0' }}>CA réel · {data.nb_ventes} ventes soumises</p>
                </div>
                {data.ca_en_cours > 0 && (
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:0 }}>En attente de clôture</p>
                    <p style={{ fontSize:20, fontWeight:700, color:'#fbbf24', margin:'4px 0 0' }}>{Number(data.ca_en_cours).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const T = {
  h1:  { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub: { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
};
