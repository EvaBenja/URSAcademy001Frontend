
import { useState, type CSSProperties } from 'react';
import { FolderOpen, CheckCircle, Clock, X, Eye, Printer, AlertTriangle, User } from 'lucide-react';
import { useStore } from '../../store/ventesStore';

interface Dossier {
  id:        string;
  livreurId: string;
  livreurNom:string;
  zone:      string;
  date:      string;
  attribues: number;
  vendus:    number;
  retournes: number;
  montant:   number;
  carburant: number;
  statut:    'en_cours' | 'cloture';
}

const INIT_DOSSIERS: Dossier[] = [
  { id:'D001', livreurId:'L1', livreurNom:'Jean Kossi',   zone:'Adidogomé',  date:'14 Mai 2024', attribues:25, vendus:20, retournes:5,  montant:96000, carburant:5000, statut:'en_cours'  },
  { id:'D002', livreurId:'L2', livreurNom:'Koffi Dossou', zone:'Agoe',        date:'14 Mai 2024', attribues:18, vendus:18, retournes:0,  montant:72000, carburant:5000, statut:'en_cours'  },
  { id:'D003', livreurId:'L3', livreurNom:'Abdou M.',     zone:'Baguida',     date:'14 Mai 2024', attribues:22, vendus:15, retournes:7,  montant:58500, carburant:5000, statut:'en_cours'  },
  { id:'D004', livreurId:'L4', livreurNom:'Salifou A.',   zone:'Lomé centre', date:'13 Mai 2024', attribues:30, vendus:28, retournes:2,  montant:112000,carburant:5000, statut:'cloture'   },
  { id:'D005', livreurId:'L5', livreurNom:'Mariam L.',    zone:'Hédzranawoe', date:'13 Mai 2024', attribues:20, vendus:19, retournes:1,  montant:76000, carburant:5000, statut:'cloture'   },
  { id:'D006', livreurId:'L6', livreurNom:'Fabio K.',     zone:'Avedji',      date:'13 Mai 2024', attribues:15, vendus:12, retournes:3,  montant:48000, carburant:5000, statut:'cloture'   },
];

export default function DossiersJournaliersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>(INIT_DOSSIERS);
  const [detail,   setDetail]   = useState<Dossier|null>(null);
  const [filter,   setFilter]   = useState<'tous'|'en_cours'|'cloture'>('tous');
  const [search,   setSearch]   = useState('');

  const filtered = dossiers.filter(d =>
    (filter === 'tous' || d.statut === filter) &&
    (d.livreurNom.toLowerCase().includes(search.toLowerCase()) || d.zone.toLowerCase().includes(search.toLowerCase()))
  );

  const totalMontant  = dossiers.reduce((s,d) => s+d.montant, 0);
  const totalVendus   = dossiers.reduce((s,d) => s+d.vendus, 0);
  const totalRetours  = dossiers.reduce((s,d) => s+d.retournes, 0);
  const enCours       = dossiers.filter(d=>d.statut==='en_cours').length;

  const cloturer = (id: string) => {
    setDossiers(prev => prev.map(d => d.id===id ? {...d, statut:'cloture'} : d));
    setDetail(null);
  };

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Dossiers Journaliers</h1>
          <p style={T.sub}>Suivi quotidien des activités de chaque livreur</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Dossiers en cours', val:enCours,                          color:'#d0a83a', bg:'#fdf3d7' },
          { label:'Montant total',     val:totalMontant.toLocaleString()+' FCFA', color:'#1465BB', bg:'#e0f0ff' },
          { label:'Total vendus',      val:totalVendus,                      color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Total retours',     val:totalRetours,                     color:'#e53e3e', bg:'#fee2e2' },
        ].map(({label,val,color,bg}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ ...T.card, marginBottom:0, padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', minWidth:240 }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a96b0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Livreur ou zone…"
              style={{ width:'100%', padding:'8px 12px 8px 32px', border:'1.5px solid #dde5f4', borderRadius:7, fontSize:13, outline:'none', background:'#f4f7fd', color:'#0d1b3e' }}/>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {(['tous','en_cours','cloture'] as const).map(f => (
              <button key={f} onClick={()=>setFilter(f)}
                style={{ padding:'7px 14px', borderRadius:7, border:`1.5px solid ${filter===f?'#1465BB':'#dde5f4'}`, background:filter===f?'#1465BB':'white', color:filter===f?'white':'#4a5578', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                {f==='tous'?'Tous':f==='en_cours'?'En cours':'Clôturés'}
              </button>
            ))}
          </div>
          <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0' }}>{filtered.length} dossier{filtered.length>1?'s':''}</span>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>
                {['ID','Livreur','Zone','Date','Attribués','Vendus','Retours','Montant','Carburant','Écart','Statut','Actions'].map(h => (
                  <th key={h} style={T.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={12} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Aucun dossier</td></tr>
              ) : filtered.map(d => {
                const ecart     = d.montant - d.carburant;
                const tauxVente = d.attribues > 0 ? Math.round((d.vendus/d.attribues)*100) : 0;
                return (
                  <tr key={d.id}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                    <td style={{ ...T.td, fontWeight:600, color:'#1465BB', fontSize:12 }}>{d.id}</td>
                    <td style={T.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                          {d.livreurNom[0]}
                        </div>
                        <span style={{ fontSize:13, fontWeight:500, color:'#0d1b3e' }}>{d.livreurNom}</span>
                      </div>
                    </td>
                    <td style={T.td}>{d.zone}</td>
                    <td style={{ ...T.td, color:'#8a96b0', whiteSpace:'nowrap' }}>{d.date}</td>
                    <td style={{ ...T.td, textAlign:'center', fontWeight:600 }}>{d.attribues}</td>
                    <td style={{ ...T.td, textAlign:'center' }}>
                      <span style={{ fontWeight:700, color:'#0a9e6e' }}>{d.vendus}</span>
                      <span style={{ fontSize:11, color:'#8a96b0' }}> ({tauxVente}%)</span>
                    </td>
                    <td style={{ ...T.td, textAlign:'center' }}>
                      <span style={{ fontWeight:700, color:d.retournes>0?'#e53e3e':'#8a96b0' }}>{d.retournes}</span>
                    </td>
                    <td style={{ ...T.td, fontWeight:700, color:'#1465BB', whiteSpace:'nowrap' }}>{d.montant.toLocaleString()} FCFA</td>
                    <td style={{ ...T.td, color:'#d0a83a', whiteSpace:'nowrap' }}>{d.carburant.toLocaleString()} FCFA</td>
                    <td style={{ ...T.td, fontWeight:700, color:ecart>=0?'#0a9e6e':'#e53e3e', whiteSpace:'nowrap' }}>
                      {ecart>=0?'+':''}{ecart.toLocaleString()} FCFA
                    </td>
                    <td style={T.td}>
                      <span style={{ background:d.statut==='en_cours'?'#fdf3d7':'#dcfce7', color:d.statut==='en_cours'?'#854d0e':'#166534', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                        {d.statut==='en_cours'?'En cours':'Clôturé ✓'}
                      </span>
                    </td>
                    <td style={T.td}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={()=>setDetail(d)} style={{ ...T.iconBtn, color:'#1465BB' }}><Eye size={13}/></button>
                        {d.statut==='en_cours' && (
                          <button onClick={()=>cloturer(d.id)} style={{ ...T.iconBtn, color:'#0a9e6e', borderColor:'#bbf7d0', background:'#f0fdf4' }}>
                            <CheckCircle size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détail */}
      {detail && (
        <div onClick={()=>setDetail(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ ...T.modalBox, maxWidth:520 }}>
            <div style={T.modalHeader}>
              <div>
                <h3 style={T.modalTitle}>Dossier {detail.id}</h3>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:2 }}>{detail.livreurNom} · {detail.zone} · {detail.date}</p>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <button style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}>
                  <Printer size={14}/>
                </button>
                <button onClick={()=>setDetail(null)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}>
                  <X size={15}/>
                </button>
              </div>
            </div>
            <div style={{ padding:22 }}>
              {/* Résumé */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
                {[
                  { label:'Produits attribués', val:detail.attribues, color:'#1465BB' },
                  { label:'Produits vendus',    val:detail.vendus,    color:'#0a9e6e' },
                  { label:'Retours',            val:detail.retournes, color:'#e53e3e' },
                  { label:'Taux de vente',      val:`${detail.attribues>0?Math.round((detail.vendus/detail.attribues)*100):0}%`, color:'#7c3aed' },
                ].map(({label,val,color}) => (
                  <div key={label} style={{ background:'#f4f7fd', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                    <p style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color, lineHeight:1 }}>{val}</p>
                    <p style={{ fontSize:11, color:'#8a96b0', marginTop:4 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Financier */}
              <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:12, padding:'16px 18px', marginBottom:18 }}>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:12 }}>Récapitulatif financier</p>
                {[
                  { label:'Montant calculé',    val:detail.montant.toLocaleString()+' FCFA',    color:'white'   },
                  { label:'Montant carburant',  val:'-'+detail.carburant.toLocaleString()+' FCFA', color:'#fca5a5' },
                  { label:'Écart net',          val:(detail.montant-detail.carburant>=0?'+':'')+(detail.montant-detail.carburant).toLocaleString()+' FCFA', color:detail.montant-detail.carburant>=0?'#34d399':'#fca5a5' },
                ].map(({label,val,color}) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{label}</span>
                    <span style={{ fontSize:14, fontWeight:700, color }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={()=>setDetail(null)} style={{ ...T.btnCancel, flex:1 }}>Fermer</button>
                {detail.statut==='en_cours' && (
                  <button onClick={()=>cloturer(detail.id)}
                    style={{ flex:2, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    <CheckCircle size={15}/> Valider la clôture
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  h1:        { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:       { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:      { background:'white', borderRadius:14, border:'1px solid #dde5f4', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  statCard:  { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:        { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:        { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:   { width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  btnCancel: { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  overlay:   { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' } as CSSProperties,
  modalBox:  { background:'white', borderRadius:14, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto' as const, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', border:'1px solid #dde5f4' } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
}; 