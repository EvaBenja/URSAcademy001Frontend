import { useState, useEffect, type CSSProperties } from 'react';
import { RefreshCw, Copy, Check, Edit2, X, Store, TrendingUp } from 'lucide-react';
import { boutiqueVendeurService } from '../../services/api';
import toast from 'react-hot-toast';

export default function MaBoutiquePage() {
  const [lien,    setLien]    = useState<any>(null);
  const [stats,   setStats]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [nom,     setNom]     = useState('');
  const [desc,    setDesc]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([boutiqueVendeurService.monLien(), boutiqueVendeurService.stats()]);
      setLien(l.data); setStats(s.data);
      setNom(l.data.nom_boutique || '');
      setDesc(l.data.description_boutique || '');
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const copyLink = () => {
    const link = lien?.lien || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => { setCopied(true); toast.success('Lien copié !'); setTimeout(()=>setCopied(false),2000); });
    } else {
      const el = document.createElement('textarea'); el.value = link;
      document.body.appendChild(el); el.select(); document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true); toast.success('Lien copié !'); setTimeout(()=>setCopied(false),2000);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await boutiqueVendeurService.update(nom, desc);
      toast.success('Boutique mise à jour ✓');
      setModal(false); load();
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Ma Boutique</h1>
          <p style={T.sub}>Votre vitrine en ligne personnelle</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
            <RefreshCw size={14} color="#4a5578"/>
          </button>
          <button onClick={()=>setModal(true)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <Edit2 size={13}/> Modifier
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : (
        <>
          {/* Info boutique */}
          <div style={{ ...T.card, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Store size={24} color="white"/>
              </div>
              <div>
                <p style={{ fontSize:18, fontWeight:700, color:'#0d1b3e', margin:0 }}>{lien?.nom_boutique || 'Ma Boutique'}</p>
                {lien?.description_boutique && <p style={{ fontSize:13, color:'#4a5578', margin:'3px 0 0' }}>{lien.description_boutique}</p>}
              </div>
            </div>

            {/* Lien à partager */}
            <div style={{ background:'#f0fdf4', borderRadius:10, padding:'12px 14px', border:'1px solid #86efac' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'.5px', margin:'0 0 8px' }}>
                🔗 Votre lien boutique
              </p>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <code style={{ fontSize:12, color:'#0d1b3e', background:'white', padding:'6px 10px', borderRadius:7, border:'1px solid #dde5f4', flex:1, wordBreak:'break-all', minWidth:0 }}>
                  {lien?.lien}
                </code>
                <button onClick={copyLink}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:8, background:copied?'#0a9e6e':'#1465BB', color:'white', border:'none', cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0 }}>
                  {copied ? <><Check size={13}/> Copié</> : <><Copy size={13}/> Copier</>}
                </button>
              </div>
              <p style={{ fontSize:11, color:'#166534', margin:'6px 0 0' }}>
                Partagez ce lien avec vos clients — ils peuvent commander sans créer de compte.
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ ...T.card }}>
              <p style={{ fontSize:12, fontWeight:700, color:'#4a5578', textTransform:'uppercase', letterSpacing:'.5px', margin:'0 0 14px', display:'flex', alignItems:'center', gap:5 }}>
                <TrendingUp size={13}/>Statistiques boutique
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { label:'Commandes',     val:stats.nb_commandes,                                          color:'#1465BB' },
                  { label:'CA Total',      val:`${Number(stats.ca_total).toLocaleString('fr-FR')} FCFA`,    color:'#0a9e6e' },
                  { label:"CA aujourd'hui",val:`${Number(stats.ca_aujourd_hui).toLocaleString('fr-FR')} FCFA`, color:'#d0a83a' },
                ].map(({label,val,color})=>(
                  <div key={label} style={{ background:'#f8faff', borderRadius:10, padding:'12px', textAlign:'center' }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color, margin:0 }}>{val}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div onClick={()=>setModal(false)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420, overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', background:'linear-gradient(90deg,#003785,#1465BB)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, color:'white', margin:0 }}>Modifier ma boutique</h3>
              <button onClick={()=>setModal(false)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer', color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14}/></button>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={T2.lbl}>Nom de la boutique</label><input value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex: Boutique Mode Ouaga" style={T2.inp}/></div>
              <div>
                <label style={T2.lbl}>Description</label>
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Décrivez votre boutique…" style={{ ...T2.inp, resize:'none' as const }}/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={()=>setModal(false)} style={{ padding:'9px 16px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', color:'#4a5578' }}>Annuler</button>
                <button onClick={save} disabled={saving} style={{ padding:'9px 20px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontWeight:600, opacity:saving?0.6:1 }}>
                  {saving?'…':'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  h1:     { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:    { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:   { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.2rem' } as CSSProperties,
  overlay:{ position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:16 } as CSSProperties,
};
const T2 = {
  lbl: { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:4 } as CSSProperties,
  inp: { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
};
