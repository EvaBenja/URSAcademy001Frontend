import { useState, type CSSProperties } from 'react';
import {
  CheckCircle, XCircle, Package, MapPin, Clock,
  X, AlertTriangle, Truck, Plus, Minus, Send, ClipboardList, Navigation,
  Navigation2, WifiOff, Calendar, BadgeCheck, Search,
} from 'lucide-react';
import {
  useStore, accepterLivraison, rejeterLivraison,
  marquerLivree, marquerNonLivree, soumettreDemandesLivreur,
} from '../../store/ventesStore';
import { useAuth } from '../../context/AuthContext';
import GPSWidget from '../../components/ui/GPSWidget';

// ─── Types & constantes ────────────────────────────────────────────────
const STATUT_LIV = {
  en_attente:      { label:'En attente',   bg:'#fef9c3', color:'#854d0e' },
  validee:         { label:'Validée',      bg:'#dbeafe', color:'#1e40af' },
  notif_livreur:   { label:'À confirmer',  bg:'#fdf3d7', color:'#d0a83a' },
  rejetee_livreur: { label:'Rejeté',       bg:'#fee2e2', color:'#991b1b' },
  en_livraison:    { label:'En livraison', bg:'#e0f0ff', color:'#1465BB' },
  livree:          { label:'Livrée ✓',     bg:'#dcfce7', color:'#166534' },
  non_livree:      { label:'Non livrée',   bg:'#fee2e2', color:'#991b1b' },
  refusee:         { label:'Refusée',      bg:'#f1f5f9', color:'#475569' },
} as const;

const STATUT_DEM = {
  en_attente: { label:'En attente',  bg:'#fef9c3', color:'#854d0e' },
  approuvee:  { label:'Approuvée ✓', bg:'#dcfce7', color:'#166534' },
  refusee:    { label:'Refusée',     bg:'#fee2e2', color:'#991b1b' },
} as const;

type Tab    = 'livraisons' | 'demandes' | 'nouvelle_demande' | 'gps';
type SubTab = 'a_confirmer' | 'en_cours' | 'historique';

// ─── Utilitaire date ──────────────────────────────────────────────────
function parseDateFR(dateStr: string): string {
  // Convertit "15 jan. 09:30" en "YYYY-MM-DD" pour comparaison
  const mois: Record<string, string> = {
    'jan': '01', 'fév': '02', 'mar': '03', 'avr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'aoû': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'déc': '12',
  };
  const parts = dateStr.trim().split(' ');
  if (parts.length < 2) return '';
  const day = parts[0].padStart(2, '0');
  const monthKey = parts[1].replace('.', '').toLowerCase().substring(0, 3);
  const month = mois[monthKey] || '00';
  const year = new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

function filterByDate<T extends { date: string }>(items: T[], from: string, to: string): T[] {
  if (!from && !to) return items;
  return items.filter(item => {
    const d = parseDateFR(item.date);
    if (!d) return true;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

// ─── Composant principal ───────────────────────────────────────────────
export default function LivreurPage() {
  const { user } = useAuth();
  const { mesLivraisons, mesDemandesLivreur, produits, mesNotifs } = useStore();

  const livreurId  = (user as any)?.livreurId || 'L1';
  const livreurNom = user ? `${user.prenom} ${user.nom}` : 'Livreur';

  const mesV = mesLivraisons(livreurId);
  const mesD = mesDemandesLivreur(livreurId);
  const nonLues = mesNotifs('livreur', livreurId).filter((n: any) => !n.lu).length;

  // ── États navigation
  const [tab,    setTab]    = useState<Tab>('livraisons');
  const [subTab, setSubTab] = useState<SubTab>('a_confirmer');

  // ── États modaux
  const [rejetModal,    setRejetModal]    = useState<string|null>(null);
  const [motifRejet,    setMotifRejet]    = useState('');
  const [nonLivreModal, setNonLivreModal] = useState<string|null>(null);
  const [motifNL,       setMotifNL]       = useState('');

  // ── États formulaire commande
  const [lignes, setLignes] = useState<{produitRef:string;produitNom:string;qte:number;prixRef:number}[]>([]);
  const [zone,   setZone]   = useState('');
  const [note,   setNote]   = useState('');

  // ── GPS toggle local (à connecter à votre store si besoin)
  const [gpsActif, setGpsActif] = useState(false);

  // ── Filtres date — historique livraisons
  const [histDateFrom, setHistDateFrom] = useState('');
  const [histDateTo,   setHistDateTo]   = useState('');

  // ── Filtres date — demandes
  const [demDateFrom, setDemDateFrom] = useState('');
  const [demDateTo,   setDemDateTo]   = useState('');

  // ── Données filtrées
  const aConfirmer = mesV.filter(v => v.statut === 'notif_livreur');
  const enCours    = mesV.filter(v => v.statut === 'en_livraison');
  const historiqueRaw = mesV.filter(v => ['livree','non_livree','rejetee_livreur','refusee'].includes(v.statut));
  const historique    = filterByDate(historiqueRaw, histDateFrom, histDateTo);
  const demandesFiltr = filterByDate(mesD, demDateFrom, demDateTo);

  const montantDemande = lignes.reduce((s, l) => s + l.prixRef * l.qte, 0);

  // ── Actions commande
  const addLigne = (ref: string) => {
    const p = produits.find(x => x.ref === ref);
    if (!p || lignes.find(l => l.produitRef === ref)) return;
    setLignes(prev => [...prev, { produitRef:p.ref, produitNom:p.nom, qte:1, prixRef:p.prixRef }]);
  };
  const updateQte = (ref: string, qte: number) => {
    if (qte <= 0) { setLignes(prev => prev.filter(l => l.produitRef !== ref)); return; }
    setLignes(prev => prev.map(l => l.produitRef === ref ? {...l, qte} : l));
  };
  const soumettreDemande = () => {
    if (!lignes.length || !zone.trim()) return;
    soumettreDemandesLivreur({
      livreurId, livreurNom, zone, produits: lignes,
      montantTotal: montantDemande, note,
      date: new Date().toLocaleDateString('fr-FR', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'}),
    });
    setLignes([]); setNote(''); setTab('demandes');
  };

  const doRejeter    = () => { if (!rejetModal || !motifRejet.trim()) return; rejeterLivraison(rejetModal, motifRejet); setRejetModal(null); setMotifRejet(''); };
  const doNonLivree  = () => { if (!nonLivreModal || !motifNL.trim()) return; marquerNonLivree(nonLivreModal, motifNL); setNonLivreModal(null); setMotifNL(''); };

  const TABS: [Tab, string][] = [
    ['livraisons',       `🚚 Livraisons${aConfirmer.length > 0 ? ` (${aConfirmer.length})` : ''}`],
    ['demandes',         `📋 Demandes (${mesD.length})`],
    ['nouvelle_demande', '➕ Commander'],
    ['gps',              '📍 GPS'],
  ];

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      {/* ══ Header ══ */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Espace Livreur</h1>
          <p style={T.sub}>Gérez vos livraisons et suivez votre activité</p>
        </div>
        <GPSWidget livreurId={livreurId} compact/>
      </div>

      {/* ══ Stats ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'À confirmer', val:aConfirmer.length,                           color:'#d0a83a', bg:'#fdf3d7' },
          { label:'En cours',    val:enCours.length,                              color:'#1465BB', bg:'#e0f0ff' },
          { label:'Livrées',     val:mesV.filter(v => v.statut === 'livree').length, color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Demandes',    val:mesD.length,                                 color:'#7c3aed', bg:'#ede9fe' },
        ].map(({label,val,color,bg}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', marginTop:5 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ══ Tabs ══ */}
      <div style={{ display:'flex', gap:4, marginBottom:18, background:'white', borderRadius:10, padding:4, border:'1px solid #dde5f4', width:'fit-content' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:8, border:'none', background:tab === id ? 'linear-gradient(90deg,#1465BB,#003785)' : 'transparent', color:tab === id ? 'white' : '#4a5578', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB GPS — avec bouton toggle améliore
      ═══════════════════════════════════════════ */}
      {tab === 'gps' && (
        <div style={{ maxWidth:500 }}>

          {/* Bouton GPS toggle principal */}
          <div style={{ ...T.card, marginBottom:16, border:`2px solid ${gpsActif ? '#0a9e6e' : '#dde5f4'}`, transition:'border-color .25s' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 }}>
                  Localisation GPS
                </p>
                <p style={{ fontSize:13, color: gpsActif ? '#0a9e6e' : '#8a96b0', marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
                  {gpsActif
                    ? <><span style={{ width:8, height:8, borderRadius:'50%', background:'#0a9e6e', display:'inline-block', animation:'pulse 1.5s infinite' }}/> Actif — position partagée</>
                    : <><span style={{ width:8, height:8, borderRadius:'50%', background:'#cbd5e1', display:'inline-block' }}/> Inactif — position masquée</>
                  }
                </p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => setGpsActif(v => !v)}
                aria-label={gpsActif ? 'Désactiver le GPS' : 'Activer le GPS'}
                style={{
                  width: 64, height: 34, borderRadius: 34, border: 'none', cursor: 'pointer',
                  background: gpsActif ? 'linear-gradient(90deg,#0a9e6e,#065f46)' : '#cbd5e1',
                  position: 'relative', transition: 'background .25s', flexShrink: 0,
                  boxShadow: gpsActif ? '0 3px 10px rgba(10,158,110,0.35)' : 'none',
                }}>
                <span style={{
                  position: 'absolute', top: 3, left: gpsActif ? 33 : 3, width: 28, height: 28,
                  borderRadius: '50%', background: 'white', transition: 'left .25s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,.18)',
                }}>
                  {gpsActif
                    ? <Navigation size={13} color="#0a9e6e"/>
                    : <WifiOff size={13} color="#94a3b8"/>
                  }
                </span>
              </button>
            </div>

            {/* Bouton d'action explicite en plus du toggle */}
            <button
              onClick={() => setGpsActif(v => !v)}
              style={{
                width: '100%', padding: '12px', borderRadius: 9, border: 'none', fontWeight: 600,
                cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, fontFamily: 'DM Sans,sans-serif',
                background: gpsActif
                  ? 'linear-gradient(90deg,#fee2e2,#fecaca)'
                  : 'linear-gradient(90deg,#0a9e6e,#065f46)',
                color: gpsActif ? '#991b1b' : 'white',
                boxShadow: gpsActif ? 'none' : '0 3px 10px rgba(10,158,110,0.3)',
                transition: 'all .25s',
              }}>
              {gpsActif
                ? <><WifiOff size={15}/> Désactiver ma localisation</>
                : <><Navigation size={15}/> Activer ma localisation</>
              }
            </button>
          </div>

          {/* Widget GPS existant (kilométrage, etc.) */}
          <GPSWidget livreurId={livreurId}/>

          {/* Guide d'utilisation */}
          <div style={{ ...T.card, marginTop:16 }}>
            <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, color:'#0d1b3e', marginBottom:14 }}>ℹ️ Comment ça marche ?</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                ['📍', 'Activez le GPS pour partager votre position en temps réel'],
                ['🗺️', "Le coordinateur et l'admin voient votre position sur la carte"],
                ['📏', 'Le kilométrage est calculé automatiquement tout au long de la journée'],
                ['🔒', 'Désactivez à tout moment pour arrêter le suivi'],
                ['💾', 'Le total km de la journée est sauvegardé même après déconnexion'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 12px', background:'#f4f7fd', borderRadius:8 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
                  <span style={{ fontSize:13, color:'#4a5578', lineHeight:1.4 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB LIVRAISONS
      ═══════════════════════════════════════════ */}
      {tab === 'livraisons' && (
        <>
          <div style={{ display:'flex', gap:4, marginBottom:16 }}>
            {([
              ['a_confirmer', `À confirmer (${aConfirmer.length})`],
              ['en_cours',    `En cours (${enCours.length})`],
              ['historique',  `Historique (${historiqueRaw.length})`],
            ] as [SubTab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setSubTab(id)}
                style={{ padding:'6px 14px', borderRadius:20, border:`1.5px solid ${subTab === id ? '#1465BB' : '#dde5f4'}`, background:subTab === id ? '#e0f0ff' : 'white', color:subTab === id ? '#1465BB' : '#4a5578', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── À confirmer */}
          {subTab === 'a_confirmer' && (
            aConfirmer.length === 0
              ? <Empty icon={<CheckCircle size={40} color="#dde5f4"/>} text="Aucune livraison en attente"/>
              : aConfirmer.map(v => (
                <div key={v.id} style={{ ...T.card, marginBottom:16, border:'2px solid #fcd34d' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#d0a83a,#ae8f1e)', display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={20} color="white"/></div>
                      <div>
                        <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e' }}>{v.ref}</p>
                        <p style={{ fontSize:13, color:'#4a5578' }}>{v.produitNom} · {v.qte} unité{v.qte > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <span style={{ background:'#fdf3d7', color:'#854d0e', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>⏳ En attente</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                    {[{label:'Zone', val:v.zone, Icon:MapPin}, {label:'Vendeur', val:v.vendeurNom, Icon:Package}, {label:'Date', val:v.date, Icon:Clock}].map(({label, val, Icon}) => (
                      <div key={label} style={{ background:'#f4f7fd', borderRadius:8, padding:'9px 11px', display:'flex', alignItems:'center', gap:7 }}>
                        <Icon size={13} color="#1465BB"/>
                        <div><p style={{ fontSize:10, color:'#8a96b0' }}>{label}</p><p style={{ fontSize:12, fontWeight:600, color:'#0d1b3e' }}>{val}</p></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Prix vendeur / unité</span>
                      <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#d0a83a' }}>{v.prixFinal.toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Total à encaisser</span>
                      <span style={{ fontSize:20, fontWeight:700, color:'white' }}>{v.montantTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                  {v.note && <div style={{ background:'#f4f7fd', borderRadius:7, padding:'7px 11px', marginBottom:12, fontSize:12, color:'#4a5578' }}>📝 {v.note}</div>}
                  <div style={{ display:'flex', gap:12 }}>
                    <button onClick={() => { setRejetModal(v.id); setMotifRejet(''); }}
                      style={{ flex:1, padding:'12px', borderRadius:9, background:'#fee2e2', color:'#991b1b', border:'1.5px solid #fecaca', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                      <XCircle size={15}/> Rejeter
                    </button>
                    <button onClick={() => accepterLivraison(v.id)}
                      style={{ flex:2, padding:'12px', borderRadius:9, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 3px 10px rgba(10,158,110,0.3)' }}>
                      <CheckCircle size={15}/> Accepter
                    </button>
                  </div>
                </div>
              ))
          )}

          {/* ── En cours */}
          {subTab === 'en_cours' && (
            enCours.length === 0
              ? <Empty icon={<Truck size={40} color="#dde5f4"/>} text="Aucune livraison en cours"/>
              : enCours.map(v => (
                <div key={v.id} style={{ ...T.card, marginBottom:16, border:'2px solid #1465BB' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:44, height:44, borderRadius:11, background:'linear-gradient(135deg,#1465BB,#003785)', display:'flex', alignItems:'center', justifyContent:'center' }}><Truck size={20} color="white"/></div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e' }}>{v.ref}</p>
                      <p style={{ fontSize:13, color:'#4a5578' }}>{v.produitNom} · {v.zone}</p>
                    </div>
                    <span style={{ background:'#e0f0ff', color:'#1465BB', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>🚚 En route</span>
                  </div>
                  <div style={{ background:'linear-gradient(135deg,#003785,#1465BB)', borderRadius:10, padding:'12px 16px', marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>Montant à encaisser</span>
                      <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:'#d0a83a' }}>{v.montantTotal.toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{v.prixFinal.toLocaleString()} FCFA × {v.qte}</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => { setNonLivreModal(v.id); setMotifNL(''); }}
                      style={{ flex:1, padding:'11px', borderRadius:8, background:'#fff5f5', color:'#991b1b', border:'1.5px solid #fecaca', fontWeight:500, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <AlertTriangle size={13}/> Problème
                    </button>
                    <button onClick={() => marquerLivree(v.id)}
                      style={{ flex:2, padding:'11px', borderRadius:8, background:'linear-gradient(90deg,#0a9e6e,#065f46)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 3px 10px rgba(10,158,110,0.3)' }}>
                      <CheckCircle size={15}/> Confirmer livraison
                    </button>
                  </div>
                </div>
              ))
          )}

          {/* ── Historique avec filtre date */}
          {subTab === 'historique' && (
            <div>
              {/* Barre de filtre date */}
              <DateFilter
                from={histDateFrom} to={histDateTo}
                onFrom={setHistDateFrom} onTo={setHistDateTo}
                count={historique.length} total={historiqueRaw.length}
              />

              <div style={T.card}>
                {historique.length === 0
                  ? <Empty icon={<ClipboardList size={40} color="#dde5f4"/>} text={historiqueRaw.length > 0 ? 'Aucun résultat pour cette période' : 'Aucune livraison terminée'}/>
                  : (
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
                        <thead>
                          <tr>{['Réf.','Produit','Zone','Montant','Statut','Motif','Date'].map(h => <th key={h} style={T.th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {historique.map(v => {
                            const sc = STATUT_LIV[v.statut as keyof typeof STATUT_LIV];
                            return (
                              <tr key={v.id}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f6f9ff'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}>
                                <td style={{ ...T.td, fontWeight:700, color:'#1465BB' }}>{v.ref}</td>
                                <td style={T.td}>{v.produitNom}</td>
                                <td style={T.td}>{v.zone}</td>
                                <td style={{ ...T.td, fontWeight:700 }}>{v.montantTotal.toLocaleString()} <span style={{ fontSize:10, color:'#8a96b0' }}>FCFA</span></td>
                                <td style={T.td}>
                                  <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20 }}>{sc.label}</span>
                                </td>
                                <td style={{ ...T.td, fontSize:12, color:'#e53e3e', maxWidth:140 }}>{v.motifRejet || '—'}</td>
                                <td style={{ ...T.td, color:'#8a96b0', whiteSpace:'nowrap' }}>{v.date}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB DEMANDES — avec filtre date + badge vérifié
      ═══════════════════════════════════════════ */}
      {tab === 'demandes' && (
        <div>
          {/* Filtre date */}
          <DateFilter
            from={demDateFrom} to={demDateTo}
            onFrom={setDemDateFrom} onTo={setDemDateTo}
            count={demandesFiltr.length} total={mesD.length}
          />

          {demandesFiltr.length === 0
            ? <Empty icon={<ClipboardList size={40} color="#dde5f4"/>} text={mesD.length > 0 ? 'Aucun résultat pour cette période' : 'Aucune demande soumise'}/>
            : demandesFiltr.map(d => {
              const sc = STATUT_DEM[d.statut];
              // verificationGestionnaire : tableau des refs de produits cochés par le gestionnaire
              // On suppose que le store expose d.produitsVerifies?: string[]
              const produitsVerifies: string[] = (d as any).produitsVerifies || [];
              const tousVerifies = produitsVerifies.length > 0 && produitsVerifies.length === d.produits.length;

              return (
                <div key={d.id} style={{
                  ...T.card, marginBottom:14,
                  border:`1.5px solid ${d.statut === 'en_attente' ? '#fcd34d' : d.statut === 'approuvee' ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {/* En-tête */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <p style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:600, color:'#0d1b3e', margin:0 }}>{d.ref}</p>
                        {/* Badge vérification gestionnaire */}
                        {tousVerifies && (
                          <span style={{ display:'flex', alignItems:'center', gap:4, background:'#dcfce7', color:'#166534', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, border:'1px solid #bbf7d0' }}>
                            <BadgeCheck size={12}/> Vérifiée par gestionnaire
                          </span>
                        )}
                        {!tousVerifies && produitsVerifies.length > 0 && (
                          <span style={{ display:'flex', alignItems:'center', gap:4, background:'#fef9c3', color:'#854d0e', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, border:'1px solid #fcd34d' }}>
                            <BadgeCheck size={12}/> Vérification partielle ({produitsVerifies.length}/{d.produits.length})
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:12, color:'#8a96b0', marginTop:2 }}>{d.date} · {d.zone}</p>
                    </div>
                    <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, flexShrink:0 }}>{sc.label}</span>
                  </div>

                  {/* Lignes de produits */}
                  {d.produits.map(p => {
                    const estVerifie = produitsVerifies.includes(p.produitRef);
                    return (
                      <div key={p.produitRef} style={{
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                        padding:'7px 10px', background: estVerifie ? '#f0fdf4' : '#f4f7fd',
                        borderRadius:7, marginBottom:5,
                        border: estVerifie ? '1px solid #bbf7d0' : '1px solid transparent',
                        transition: 'all .2s',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          {estVerifie
                            ? <CheckCircle size={14} color="#0a9e6e"/>
                            : <div style={{ width:14, height:14, borderRadius:'50%', border:'1.5px solid #cbd5e1' }}/>
                          }
                          <span style={{ fontSize:13, fontWeight:500, color: estVerifie ? '#166534' : '#0d1b3e' }}>
                            {p.produitNom}
                          </span>
                          {estVerifie && (
                            <span style={{ fontSize:10, fontWeight:700, color:'#0a9e6e', background:'#dcfce7', padding:'1px 6px', borderRadius:10 }}>
                              ✓ livré
                            </span>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:14 }}>
                          <span style={{ fontSize:12, color:'#8a96b0' }}>×{p.qte}</span>
                          <span style={{ fontSize:13, fontWeight:600, color: estVerifie ? '#0a9e6e' : '#1465BB' }}>
                            {(p.prixRef * p.qte).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid #f0f4fb', marginTop:6 }}>
                    <span style={{ fontSize:12, color:'#8a96b0' }}>Total</span>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#1465BB' }}>{d.montantTotal.toLocaleString()} FCFA</span>
                  </div>

                  {/* Messages statut */}
                  {d.statut === 'refusee' && d.motifRefus && (
                    <p style={{ fontSize:12, color:'#991b1b', background:'#fee2e2', borderRadius:7, padding:'6px 10px', marginTop:8 }}>Motif : {d.motifRefus}</p>
                  )}
                  {d.statut === 'approuvee' && (
                    <p style={{ fontSize:12, color:'#166534', background:'#dcfce7', borderRadius:7, padding:'6px 10px', marginTop:8, fontWeight:500 }}>
                      ✅ Approuvée — Récupérez vos produits
                    </p>
                  )}
                  {tousVerifies && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'linear-gradient(90deg,#f0fdf4,#dcfce7)', borderRadius:8, padding:'9px 12px', marginTop:8, border:'1px solid #bbf7d0' }}>
                      <BadgeCheck size={15} color="#0a9e6e"/>
                      <span style={{ fontSize:12, color:'#166534', fontWeight:600 }}>
                        Tous les produits ont été vérifiés par le gestionnaire ce soir.
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}

      {/* ══ TAB NOUVELLE DEMANDE ══ */}
      {tab === 'nouvelle_demande' && (
        <div style={{ maxWidth:560 }}>
          <div style={T.card}>
            <h2 style={{ ...T.cardTitle, marginBottom:18 }}>Commander des produits</h2>
            <div style={{ marginBottom:14 }}>
              <label style={T.lbl}>Zone</label>
              <input value={zone} onChange={e => setZone(e.target.value)} placeholder="Ex: Adidogomé" style={T.inp}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={T.lbl}>Ajouter un produit</label>
              <select onChange={e => { if (e.target.value) addLigne(e.target.value); e.target.value = ''; }} style={T.inp} defaultValue="">
                <option value="">Choisir un produit…</option>
                {produits.filter(p => !lignes.find(l => l.produitRef === p.ref) && p.stock > 0).map(p => (
                  <option key={p.ref} value={p.ref}>{p.nom} — {p.prixRef.toLocaleString()} FCFA (stock: {p.stock})</option>
                ))}
              </select>
            </div>
            {lignes.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <label style={T.lbl}>Produits sélectionnés</label>
                {lignes.map(l => {
                  const p = produits.find(x => x.ref === l.produitRef);
                  return (
                    <div key={l.produitRef} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#f4f7fd', borderRadius:9, border:'1px solid #dde5f4', marginBottom:7 }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>{l.produitNom}</p>
                        <p style={{ fontSize:11, color:'#8a96b0' }}>{l.prixRef.toLocaleString()} FCFA/u</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <button onClick={() => updateQte(l.produitRef, l.qte - 1)} style={T.qteBtn}><Minus size={11}/></button>
                        <span style={{ width:28, textAlign:'center', fontSize:14, fontWeight:700, color:'#0d1b3e' }}>{l.qte}</span>
                        <button onClick={() => updateQte(l.produitRef, Math.min(l.qte + 1, p?.stock || 999))} style={T.qteBtn}><Plus size={11}/></button>
                      </div>
                      <span style={{ fontSize:13, fontWeight:700, color:'#1465BB', minWidth:80, textAlign:'right' }}>{(l.prixRef * l.qte).toLocaleString()} FCFA</span>
                      <button onClick={() => setLignes(prev => prev.filter(x => x.produitRef !== l.produitRef))}
                        style={{ width:24, height:24, borderRadius:6, border:'1.5px solid #fecaca', background:'#fff5f5', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#e53e3e' }}>
                        <X size={11}/>
                      </button>
                    </div>
                  );
                })}
                <div style={{ background:'linear-gradient(90deg,#003785,#1465BB)', borderRadius:9, padding:'11px 14px', marginTop:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.7)' }}>{lignes.reduce((s, l) => s + l.qte, 0)} unités</span>
                    <span style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#d0a83a' }}>{montantDemande.toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>
            )}
            <div style={{ marginBottom:18 }}>
              <label style={T.lbl}>Note (optionnel)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Commande hebdomadaire…" style={T.inp}/>
            </div>
            <button onClick={soumettreDemande} disabled={!lignes.length || !zone.trim()}
              style={{ width:'100%', padding:'13px', borderRadius:9, background:lignes.length && zone.trim() ? 'linear-gradient(90deg,#1465BB,#003785)' : '#94a3b8', color:'white', border:'none', fontWeight:600, cursor:lignes.length && zone.trim() ? 'pointer' : 'not-allowed', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'DM Sans,sans-serif' }}>
              <Send size={15}/> Soumettre au gestionnaire
            </button>
          </div>
        </div>
      )}

      {/* ══ Modals ══ */}
      {rejetModal && (
        <Modal title="Motif du rejet" onClose={() => setRejetModal(null)}>
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:14, color:'#4a5578', marginBottom:12 }}>Indiquez pourquoi vous ne pouvez pas effectuer cette livraison.</p>
          <textarea value={motifRejet} onChange={e => setMotifRejet(e.target.value)} placeholder="Ex: Véhicule en panne…" rows={3} style={{ ...T.inp, resize:'vertical' as const, marginBottom:14 }}/>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setRejetModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
            <button onClick={doRejeter} disabled={!motifRejet.trim()}
              style={{ flex:1, padding:'10px', borderRadius:8, background:motifRejet.trim() ? 'linear-gradient(90deg,#e53e3e,#991b1b)' : '#94a3b8', color:'white', border:'none', fontWeight:600, cursor:motifRejet.trim() ? 'pointer' : 'not-allowed', fontSize:14 }}>
              Confirmer
            </button>
          </div>
        </Modal>
      )}
      {nonLivreModal && (
        <Modal title="Problème de livraison" onClose={() => setNonLivreModal(null)} headerBg="linear-gradient(90deg,#854d0e,#d0a83a)">
          <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:14, color:'#4a5578', marginBottom:12 }}>Décrivez le problème rencontré.</p>
          <textarea value={motifNL} onChange={e => setMotifNL(e.target.value)} placeholder="Ex: Client absent…" rows={3} style={{ ...T.inp, resize:'vertical' as const, marginBottom:14 }}/>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setNonLivreModal(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
            <button onClick={doNonLivree} disabled={!motifNL.trim()}
              style={{ flex:1, padding:'10px', borderRadius:8, background:motifNL.trim() ? 'linear-gradient(90deg,#d0a83a,#ae8f1e)' : '#94a3b8', color:'white', border:'none', fontWeight:600, cursor:motifNL.trim() ? 'pointer' : 'not-allowed', fontSize:14 }}>
              Signaler
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Composant filtre date ─────────────────────────────────────────────
function DateFilter({ from, to, onFrom, onTo, count, total }: {
  from: string; to: string;
  onFrom: (v: string) => void; onTo: (v: string) => void;
  count: number; total: number;
}) {
  const actif = from || to;
  return (
    <div style={{ ...T.card, marginBottom:14, padding:'12px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <Calendar size={15} color="#1465BB"/>
        <span style={{ fontSize:13, fontWeight:600, color:'#0d1b3e' }}>Filtrer par date</span>
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:240 }}>
          <input type="date" value={from} onChange={e => onFrom(e.target.value)}
            style={{ ...T.inp, flex:1, fontSize:13, padding:'6px 10px' }}/>
          <span style={{ fontSize:12, color:'#8a96b0' }}>→</span>
          <input type="date" value={to} onChange={e => onTo(e.target.value)}
            style={{ ...T.inp, flex:1, fontSize:13, padding:'6px 10px' }}/>
        </div>
        {actif && (
          <button onClick={() => { onFrom(''); onTo(''); }}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:7, border:'1.5px solid #fecaca', background:'#fff5f5', color:'#991b1b', fontSize:12, cursor:'pointer', fontWeight:600 }}>
            <X size={12}/> Effacer
          </button>
        )}
      </div>
      {actif && (
        <p style={{ fontSize:12, color:'#8a96b0', marginTop:8, marginBottom:0 }}>
          {count === total
            ? `${total} résultat${total > 1 ? 's' : ''}`
            : `${count} résultat${count > 1 ? 's' : ''} sur ${total}`
          }
        </p>
      )}
    </div>
  );
}

// ─── Composants utilitaires ────────────────────────────────────────────
function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'48px', textAlign:'center', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' }}>
      <div style={{ marginBottom:12 }}>{icon}</div>
      <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0' }}>{text}</p>
    </div>
  );
}

function Modal({ title, onClose, headerBg = 'linear-gradient(90deg,#003785,#1465BB)', children }: {
  title: string; onClose: () => void; headerBg?: string; children: React.ReactNode;
}) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:440, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:headerBg }}>
          <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}><X size={15}/></button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Design tokens ─────────────────────────────────────────────────────
const T = {
  h1:        { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:       { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  card:      { background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:'1.4rem', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' } as CSSProperties,
  cardTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'#0d1b3e', margin:0 } as CSSProperties,
  statCard:  { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:        { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:        { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  lbl:       { display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:6 } as CSSProperties,
  inp:       { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const, fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  btnCancel: { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  qteBtn:    { width:26, height:26, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#1465BB', flexShrink:0 } as CSSProperties,
};