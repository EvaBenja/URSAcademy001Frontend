import { useState, useEffect, type CSSProperties } from 'react';
import { Calendar, TrendingUp, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import CopyPhone from '../../components/ui/CopyPhone';
import DateSeparator, { formatDateLabel } from '../../components/ui/DateSeparator';
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
  const [jours,     setJours]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<Record<string,boolean>>({});
  const [openJours, setOpenJours] = useState<Record<string,boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/comptabilite/journal');
      const data = res.data.jours || [];
      setJours(data);
      // Ouvrir le premier jour (le plus récent) par défaut
      if (data.length > 0) {
        setOpenJours({ [data[0].date]: true });
      }
    } catch { toast.error('Erreur chargement comptabilité'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleJour = (date: string) => setOpenJours(prev => ({ ...prev, [date]: !prev[date] }));
  const toggleVend = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const totalCA    = jours.reduce((s,j) => s + j.ca_reel, 0);
  const totalVentes = jours.reduce((s,j) => s + j.nb_ventes, 0);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Journal Comptable</h1>
          <p style={T.sub}>Toutes les journées — CA réel par vendeur</p>
        </div>
        <button onClick={load} style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Totaux globaux */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'CA Total réel',   val:`${totalCA.toLocaleString('fr-FR')} FCFA`,    color:'#0a9e6e' },
          { label:'Jours enregistrés', val:jours.length,                                color:'#1465BB' },
          { label:'Total ventes',    val:totalVentes,                                   color:'#d0a83a' },
        ].map(({label,val,color}) => (
          <div key={label} style={T.card}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, margin:0 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Chargement…</p>
      ) : jours.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'40px' }}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0' }}>Aucune donnée enregistrée</p>
        </div>
      ) : jours.map((jour: any) => {
        const isOpen = !!openJours[jour.date];
        const label  = formatDateLabel(jour.date);
        const isToday = label === "Aujourd'hui";

        return (
          <div key={jour.date} style={{ marginBottom:16 }}>
            {/* Header jour — cliquable */}
            <div onClick={()=>toggleJour(jour.date)}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px',
                background: isToday ? 'linear-gradient(90deg,#003785,#1465BB)' : '#f4f7fd',
                borderRadius: isOpen ? '12px 12px 0 0' : 12,
                border:`1.5px solid ${isToday?'#1465BB':'#dde5f4'}`,
                cursor:'pointer', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Calendar size={16} color={isToday?'white':'#1465BB'}/>
                <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:isToday?'white':'#0d1b3e' }}>
                  {label}
                  {isToday && <span style={{ fontSize:11, background:'rgba(255,255,255,0.2)', borderRadius:10, padding:'1px 8px', marginLeft:8, fontFamily:'DM Sans,sans-serif', fontWeight:400 }}>Aujourd'hui</span>}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:15, fontWeight:700, color:isToday?'#d0a83a':'#0a9e6e', margin:0 }}>{jour.ca_reel.toLocaleString('fr-FR')} FCFA</p>
                  <p style={{ fontSize:11, color:isToday?'rgba(255,255,255,0.7)':'#8a96b0', margin:0 }}>{jour.nb_ventes} vente{jour.nb_ventes>1?'s':''}</p>
                </div>
                {isOpen ? <ChevronUp size={16} color={isToday?'white':'#4a5578'}/> : <ChevronDown size={16} color={isToday?'white':'#4a5578'}/>}
              </div>
            </div>

            {/* Contenu du jour */}
            {isOpen && (
              <div style={{ border:'1.5px solid #dde5f4', borderTop:'none', borderRadius:'0 0 12px 12px', overflow:'hidden', background:'white' }}>
                {jour.par_vendeur.map((vendeur: any, vi: number) => {
                  const vKey = `${jour.date}-${vi}`;
                  const isVOpen = !!expanded[vKey];
                  return (
                    <div key={vKey} style={{ borderBottom:'1px solid #f0f4fb' }}>
                      {/* Header vendeur */}
                      <div onClick={()=>toggleVend(vKey)}
                        style={{ padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background:isVOpen?'#f8faff':'white', flexWrap:'wrap', gap:8 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:13, flexShrink:0 }}>
                            {vendeur.vendeur[0]||'?'}
                          </div>
                          <div>
                            <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{vendeur.vendeur}</p>
                            {vendeur.telephone && vendeur.telephone !== '—' && (
                              <div onClick={e=>e.stopPropagation()}>
                                <CopyPhone tel={vendeur.telephone} style={{ fontSize:11 }}/>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                          <div style={{ textAlign:'right' }}>
                            <p style={{ fontSize:16, fontWeight:700, color:'#0a9e6e', margin:0 }}>{vendeur.ca_reel.toLocaleString('fr-FR')} FCFA</p>
                            <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>{vendeur.nb_ventes} vente{vendeur.nb_ventes>1?'s':''}</p>
                          </div>
                          {isVOpen ? <ChevronUp size={14} color="#4a5578"/> : <ChevronDown size={14} color="#4a5578"/>}
                        </div>
                      </div>

                      {/* Ventes du vendeur */}
                      {isVOpen && vendeur.ventes.map((vente: any) => {
                        const sl = STATUT_LIV[vente.statut_liv] || { label:vente.statut_liv, color:'#475569' };
                        const isTerminee = vente.statut_liv === 'terminee';
                        return (
                          <div key={vente.id} style={{ padding:'10px 18px 10px 58px', borderTop:'1px solid #f8faff', background:isTerminee?'#f0fdf4':'white' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <span style={{ fontSize:12, color:'#8a96b0' }}>{vente.heure}</span>
                                <span style={{ fontSize:11, fontWeight:600, color:sl.color, background:sl.color+'15', padding:'1px 7px', borderRadius:20 }}>{sl.label}</span>
                              </div>
                              <span style={{ fontWeight:700, color:isTerminee?'#166534':'#0d1b3e', fontSize:14 }}>
                                {vente.montant.toLocaleString('fr-FR')} FCFA
                              </span>
                            </div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                              {vente.produits.map((p: any, k: number) => (
                                <div key={k} style={{ background:'#f4f7fd', borderRadius:7, padding:'3px 9px', fontSize:11 }}>
                                  <span style={{ fontWeight:600, color:'#0d1b3e' }}>{p.nom}</span>
                                  {p.couleur && <span style={{ color:'#4a5578', marginLeft:3, border:'1px solid #dde5f4', borderRadius:4, padding:'0 3px', fontSize:9 }}>{p.couleur}</span>}
                                  <span style={{ color:'#8a96b0', marginLeft:4 }}>×{p.quantite}</span>
                                  {p.remise > 0 && <span style={{ color:'#e53e3e', marginLeft:4 }}>−{p.remise.toLocaleString('fr-FR')}</span>}
                                  <span style={{ color:'#0a9e6e', fontWeight:700, marginLeft:4 }}>{p.sous_total.toLocaleString('fr-FR')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Récap vendeur */}
                      {isVOpen && (
                        <div style={{ padding:'10px 18px', background:'#f8faff', borderTop:'1px solid #f0f4fb', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                          <span style={{ fontSize:12, color:'#4a5578' }}>{vendeur.nb_ventes} vente{vendeur.nb_ventes>1?'s':''} · Remises : {vendeur.total_remises.toLocaleString('fr-FR')} FCFA</span>
                          <span style={{ fontSize:13, color:'#0a9e6e', fontWeight:700 }}>CA réel : {vendeur.ca_reel.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Total du jour */}
                <div style={{ padding:'12px 18px', background:'#f4f7fd', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                  <span style={{ fontSize:13, color:'#4a5578' }}>{jour.nb_ventes} vente{jour.nb_ventes>1?'s':''} · {jour.par_vendeur.length} vendeur{jour.par_vendeur.length>1?'s':''}</span>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#0a9e6e' }}>
                    Total : {jour.ca_reel.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const T = {
  h1:  { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub: { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
};
