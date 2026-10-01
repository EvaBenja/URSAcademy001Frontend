import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { financeService } from '../../services/api';
import toast from 'react-hot-toast';

export default function BeneficesPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');

  const load = async (p = periode) => {
    setLoading(true);
    try { const r = await financeService.benefices(p); setData(r.data); }
    catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const changePeriode = (p: string) => { setPeriode(p); load(p); };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Bénéfices</h1>
          <p style={T.sub}>Vue d'ensemble des bénéfices nets</p>
        </div>
        <button onClick={()=>load()} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Filtres période */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[{p:'jour',label:"Aujourd'hui"},{p:'semaine',label:'Cette semaine'},{p:'mois',label:'Ce mois'}].map(({p,label})=>(
          <button key={p} onClick={()=>changePeriode(p)}
            style={{ padding:'7px 16px', borderRadius:20, border:`1.5px solid ${periode===p?'#0a9e6e':'#dde5f4'}`, background:periode===p?'#0a9e6e':'white', color:periode===p?'white':'#4a5578', fontSize:12, cursor:'pointer', fontWeight:periode===p?600:400 }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : data && (
        <>
          {/* Total */}
          <div style={{ background:'linear-gradient(135deg,#0a9e6e,#065f46)', borderRadius:16, padding:'24px 28px', marginBottom:20 }}>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>Bénéfice net total</p>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:36, fontWeight:700, color:'white', margin:0 }}>
              {Number(data.total).toLocaleString('fr-FR')} FCFA
            </p>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:'8px 0 0' }}>{data.nb_ventes} vente{data.nb_ventes>1?'s':''} terminées</p>
          </div>

          {/* Par jour */}
          {data.par_jour?.length > 0 && (
            <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb' }}>
                <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', textTransform:'uppercase', letterSpacing:'.5px', margin:0 }}>
                  <TrendingUp size={12} style={{ verticalAlign:'middle', marginRight:5 }}/>Détail par jour
                </p>
              </div>
              {data.par_jour.map((j:any) => (
                <div key={j.date} style={{ padding:'12px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>
                      {new Date(j.date).toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'long'})}
                    </p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>{j.nb} vente{j.nb>1?'s':''}</p>
                  </div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#0a9e6e' }}>
                    {Number(j.total).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              ))}
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
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4' } as CSSProperties,
};
