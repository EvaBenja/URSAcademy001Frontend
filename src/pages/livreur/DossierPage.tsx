import { useState, useEffect, type CSSProperties } from 'react';
import { FolderOpen, Clock, Fuel } from 'lucide-react';
import { dossiersService } from '../../services/api';
import toast from 'react-hot-toast';

const STATUT: Record<string,{label:string;bg:string;color:string}> = {
  ouvert:  {label:'Ouvert',   bg:'#dbeafe', color:'#1e40af'},
  cloture: {label:'Clôturé',  bg:'#f1f5f9', color:'#475569'},
};

export default function LivreurDossierPage() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Backend filtre maintenant par livreur_id si rôle = livreur
    dossiersService.getAll()
      .then(r => setDossiers(r.data || []))
      .catch(() => toast.error('Erreur chargement dossiers'))
      .finally(() => setLoading(false));
  }, []);

  const totalCarburant = dossiers.reduce((s, d) => s + Number(d.montant_carburant || 0), 0);
  const ouverts = dossiers.filter(d => d.statut === 'ouvert').length;

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement des dossiers…
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={T.h1}>Mes Dossiers Journaliers</h1>
        <p style={T.sub}>Récapitulatif de vos journées de livraison validées par le gestionnaire</p>
      </div>

      {/* Stats */}
      <div className="stats-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
        {[
          {label:'Total dossiers', val:dossiers.length,                            color:'#1465BB'},
          {label:'En cours',       val:ouverts,                                    color:'#d0a83a'},
          {label:'Carburant reçu', val:totalCarburant.toLocaleString('fr-FR')+' FCFA', color:'#0a9e6e'},
        ].map(({label,val,color}) => (
          <div key={label} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' }}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color, margin:0, wordBreak:'break-all' }}>{val}</p>
            <p style={{ fontSize:12, color:'#8a96b0', margin:'4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {dossiers.length === 0 ? (
          <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', padding:40, textAlign:'center' }}>
            <FolderOpen size={36} color="#dde5f4" style={{ marginBottom:12 }}/>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:17, color:'#8a96b0', margin:0 }}>
              Aucun dossier journalier
            </p>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:14, color:'#8a96b0', marginTop:8 }}>
              Les dossiers apparaissent après validation de vos demandes par le gestionnaire
            </p>
          </div>
        ) : dossiers.map((d:any) => {
          const sc = STATUT[d.statut]||{label:d.statut, bg:'#f1f5f9', color:'#475569'};
          const gestionnaire = d.livraison?.gestionnaire || d.gestionnaire;
          const nomGest = gestionnaire
            ? `${gestionnaire.prenom||gestionnaire.name||''} ${gestionnaire.nom||''}`.trim()
            : '—';
          return (
            <div key={d.id} style={{ background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:18, transition:'all .2s' }}
              onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='0 4px 14px rgba(0,55,133,0.08)'; }}
              onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.boxShadow='none'; }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:'#e0f0ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FolderOpen size={18} color="#1465BB"/>
                  </div>
                  <div>
                    <p style={{ fontSize:15, fontWeight:700, color:'#0d1b3e', margin:0 }}>Dossier #{d.id}</p>
                    <p style={{ fontSize:12, color:'#8a96b0', margin:0, display:'flex', alignItems:'center', gap:4 }}>
                      <Clock size={11}/>
                      {d.date
                        ? new Date(d.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
                        : '—'}
                    </p>
                  </div>
                </div>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20 }}>{sc.label}</span>
              </div>

              {/* Infos */}
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'#f8faff', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                    <Fuel size={12} color="#0a9e6e"/>
                    <p style={{ fontSize:11, color:'#8a96b0', margin:0 }}>Carburant alloué</p>
                  </div>
                  <p style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'#0a9e6e', margin:0 }}>
                    {Number(d.montant_carburant||0).toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div style={{ background:'#f8faff', borderRadius:8, padding:'10px 12px' }}>
                  <p style={{ fontSize:11, color:'#8a96b0', margin:'0 0 3px' }}>Validé par</p>
                  <p style={{ fontSize:13, fontWeight:600, color:'#0d1b3e', margin:0 }}>{nomGest}</p>
                  {d.livraison?.zone_livraison && (
                    <p style={{ fontSize:11, color:'#8a96b0', margin:'2px 0 0' }}>Zone : {d.livraison.zone_livraison}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@media(max-width:768px){.stats-3{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  );
}
const T = {
  h1:{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:{ fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
};
