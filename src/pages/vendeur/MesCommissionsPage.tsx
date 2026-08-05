import { useState, useEffect, type CSSProperties } from 'react';
import { TrendingUp, RefreshCw, Package } from 'lucide-react';
import { commissionsService } from '../../services/api';
import toast from 'react-hot-toast';

export default function MesCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats,       setStats]       = useState<any>(null);
  const [loading,     setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([commissionsService.getAll(), commissionsService.stats()]);
      setCommissions(c.data || []);
      setStats(s.data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Mes Commissions</h1>
          <p style={T.sub}>Gains générés par vos ventes</p>
        </div>
        <button onClick={load} style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer' }}>
          <RefreshCw size={14} color="#4a5578"/>
        </button>
      </div>

      {/* Solde total */}
      {stats && (
        <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:16, padding:'24px 28px', marginBottom:20, color:'white' }}>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'.5px' }}>
            <TrendingUp size={13} style={{ verticalAlign:'middle', marginRight:5 }}/>Solde commissions
          </p>
          <p style={{ fontFamily:'Playfair Display,serif', fontSize:36, fontWeight:700, color:'#d0a83a', margin:0 }}>
            {Number(stats.solde_disponible ?? stats.total_global ?? 0).toLocaleString('fr-FR')} FCFA
          </p>
          <div style={{ display:'flex', gap:24, marginTop:14, flexWrap:'wrap' }}>
            <div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', margin:'0 0 2px' }}>Total reçu</p>
              <p style={{ fontSize:16, fontWeight:600, color:'white', margin:0 }}>{Number(stats.total_paye ?? 0).toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div>
              <p style={{ fontSize:11, color:'rgba(255,255,255,0.6)', margin:'0 0 2px' }}>Nb commissions</p>
              <p style={{ fontSize:16, fontWeight:600, color:'white', margin:0 }}>{stats.nb_commissions ?? commissions.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:600, color:'#0d1b3e', margin:'0 0 14px' }}>Historique</h2>

      {loading ? (
        <p style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>Chargement…</p>
      ) : commissions.length === 0 ? (
        <div style={{ ...T.card, textAlign:'center', padding:'50px' }}>
          <Package size={40} color="#dde5f4" style={{ marginBottom:12 }}/>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:18, color:'#8a96b0', margin:0 }}>Aucune commission pour le moment</p>
          <p style={{ fontSize:13, color:'#8a96b0', marginTop:6 }}>Vos commissions apparaîtront ici dès qu'une vente est enregistrée</p>
        </div>
      ) : (
        <div style={{ ...T.card, padding:0, overflow:'hidden' }}>
          {commissions.map((c:any) => {
            const isPaye = c.statut === 'payee';
            const dateStr = new Date(c.created_at).toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
            return (
              <div key={c.id} style={{ padding:'16px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:isPaye?'#dcfce7':'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Package size={18} color={isPaye?'#0a9e6e':'#1465BB'}/>
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:'#0d1b3e', margin:0 }}>{c.produit?.nom || '—'}</p>
                    <p style={{ fontSize:12, color:'#4a5578', margin:'2px 0 0' }}>Vente #{c.vente_id}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>{dateStr}</p>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#0a9e6e', margin:0 }}>
                    +{Number(c.montant_commission).toLocaleString('fr-FR')} FCFA
                  </p>
                  <span style={{
                    fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, display:'inline-block', marginTop:4,
                    background:isPaye?'#dcfce7':c.statut==='validee'?'#dbeafe':'#fef9c3',
                    color:isPaye?'#166534':c.statut==='validee'?'#1e40af':'#854d0e',
                  }}>
                    {isPaye ? 'Payée ✓' : c.statut === 'validee' ? 'Créditée' : 'En attente'}
                  </span>
                  {/* Afficher si la commission a été modifiée */}
                  {c.montant_initial && Number(c.montant_initial) !== Number(c.montant_commission) && (
                    <div style={{ marginTop:6, background:'#fff7ed', borderRadius:7, padding:'6px 10px', border:'1px solid #fed7aa', fontSize:11 }}>
                      <p style={{ color:'#c2410c', fontWeight:600, margin:'0 0 2px' }}>⚠️ Modifiée par l'administration</p>
                      <p style={{ color:'#92400e', margin:0 }}>
                        Montant initial : <s>{Number(c.montant_initial).toLocaleString('fr-FR')} FCFA</s>
                      </p>
                      {c.motif_modification && <p style={{ color:'#b45309', margin:'2px 0 0' }}>Motif : {c.motif_modification}</p>}
                    </div>
                  )}
                </div>
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
  card:{ background:'white', borderRadius:14, border:'1px solid #dde5f4' } as CSSProperties,
};
