import { useState, useEffect, type CSSProperties } from 'react';
import { Save, RefreshCw, Settings, Truck } from 'lucide-react';
import { configurationService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ParametresPage() {
  const [configs,  setConfigs]  = useState<Record<string,string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState<string|null>(null);
  const [prixLivraison,  setPrixLivraison]  = useState('');
  const [prixExpedition, setPrixExpedition] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await configurationService.getAll();
      const data = res.data || {};
      setConfigs(data);
      setPrixLivraison(data.prix_livraison || '');
      setPrixExpedition(data.prix_expedition || '');
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async (cle: string, valeur: string, label: string) => {
    if (!valeur.trim()) { toast.error('Valeur requise'); return; }
    setSaving(cle);
    try {
      await configurationService.update(cle, valeur);
      toast.success(label + ' mis à jour');
      setConfigs(prev => ({ ...prev, [cle]: valeur }));
    } catch(e:any) { toast.error(e.response?.data?.message || 'Erreur'); }
    finally { setSaving(null); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Paramètres</h1>
          <p style={T.sub}>Configuration générale de la plateforme</p>
        </div>
        <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div style={T.section}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f0f4fb' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}><Truck size={18} color="#1465BB"/></div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:0 }}>Prix livraison standard</p>
                <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>Tarif unique appliqué à toutes les livraisons</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200 }}>
                <label style={T.lbl}>Prix (FCFA)</label>
                <input type="number" min={0} value={prixLivraison} onChange={e=>setPrixLivraison(e.target.value)} placeholder="Ex: 1000" style={T.inp}/>
                {configs.prix_livraison && <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>Actuel : {Number(configs.prix_livraison).toLocaleString('fr-FR')} FCFA</p>}
              </div>
              <button onClick={()=>save('prix_livraison', prixLivraison, 'Prix livraison')} disabled={saving==='prix_livraison'}
                style={{ ...T.btnSave, opacity:saving==='prix_livraison'?0.6:1 }}>
                <Save size={13}/>{saving==='prix_livraison'?'Enregistrement…':'Enregistrer'}
              </button>
            </div>
          </div>

          <div style={T.section}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:12, borderBottom:'1px solid #f0f4fb' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#fef9c3', display:'flex', alignItems:'center', justifyContent:'center' }}><Truck size={18} color="#d0a83a"/></div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:0 }}>Prix expédition</p>
                <p style={{ fontSize:12, color:'#8a96b0', margin:0 }}>Tarif pour les livraisons hors zone</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:200 }}>
                <label style={T.lbl}>Prix (FCFA)</label>
                <input type="number" min={0} value={prixExpedition} onChange={e=>setPrixExpedition(e.target.value)} placeholder="Ex: 2000" style={T.inp}/>
                {configs.prix_expedition && <p style={{ fontSize:11, color:'#8a96b0', margin:'3px 0 0' }}>Actuel : {Number(configs.prix_expedition).toLocaleString('fr-FR')} FCFA</p>}
              </div>
              <button onClick={()=>save('prix_expedition', prixExpedition, 'Prix expédition')} disabled={saving==='prix_expedition'}
                style={{ ...T.btnSave, opacity:saving==='prix_expedition'?0.6:1 }}>
                <Save size={13}/>{saving==='prix_expedition'?'Enregistrement…':'Enregistrer'}
              </button>
            </div>
          </div>

          {Object.keys(configs).filter(k=>!['prix_livraison','prix_expedition'].includes(k)).length > 0 && (
            <div style={T.section}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, paddingBottom:12, borderBottom:'1px solid #f0f4fb' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center' }}><Settings size={18} color="#7c3aed"/></div>
                <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:0 }}>Autres paramètres</p>
              </div>
              {Object.entries(configs).filter(([k])=>!['prix_livraison','prix_expedition'].includes(k)).map(([cle,valeur]) => (
                <div key={cle} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f8faff' }}>
                  <span style={{ fontSize:13, color:'#4a5578', fontFamily:'monospace' }}>{cle}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{valeur}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const T = {
  h1:     { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:    { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  section:{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.3rem' } as CSSProperties,
  lbl:    { fontSize:13, fontWeight:600, color:'#4a5578', display:'block', marginBottom:5 } as CSSProperties,
  inp:    { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', boxSizing:'border-box' as const } as CSSProperties,
  btnSave:{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:8, background:'linear-gradient(90deg,#003785,#1465BB)', color:'white', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, whiteSpace:'nowrap' as const } as CSSProperties,
};
