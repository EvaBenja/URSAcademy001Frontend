import { useState, type CSSProperties } from 'react';
import { Plus, Edit2, Trash2, X, Search, Shield, User, Phone, Mail, CheckCircle, XCircle } from 'lucide-react';

type Role = 'super_admin' | 'gestionnaire' | 'coordinateur' | 'vendeur' | 'livreur';
type Statut = 'actif' | 'inactif';

interface Utilisateur {
  id:        number;
  prenom:    string;
  nom:       string;
  email:     string;
  telephone: string;
  role:      Role;
  statut:    Statut;
  zone?:     string;
  dateCreation: string;
}

const ROLE_CONFIG: Record<Role,{label:string;color:string;bg:string}> = {
  super_admin:  { label:'Super Admin',   color:'#003785', bg:'#e0f0ff' },
  gestionnaire: { label:'Gestionnaire',  color:'#0a9e6e', bg:'#dcfce7' },
  coordinateur: { label:'Coordinateur',  color:'#d0a83a', bg:'#fdf3d7' },
  vendeur:      { label:'Vendeur',       color:'#7c3aed', bg:'#ede9fe' },
  livreur:      { label:'Livreur',       color:'#0891b2', bg:'#cffafe' },
};

const ZONES = ['Adidogomé','Agoe','Baguida','Lomé centre','Hédzranawoe','Avedji'];

const INIT: Utilisateur[] = [
  { id:1,  prenom:'Jean',    nom:'Admin',   email:'admin@urs.com',          telephone:'90 00 00 01', role:'super_admin',  statut:'actif',   dateCreation:'01 Jan 2024' },
  { id:2,  prenom:'Koffi',   nom:'Dossou',  email:'gestionnaire@urs.com',   telephone:'90 00 00 02', role:'gestionnaire', statut:'actif',   dateCreation:'05 Jan 2024' },
  { id:3,  prenom:'Abdou',   nom:'M.',      email:'coordinateur@urs.com',   telephone:'90 00 00 03', role:'coordinateur', statut:'actif',   dateCreation:'10 Jan 2024' },
  { id:4,  prenom:'Abdoulaye',nom:'Sow',    email:'vendeur@urs.com',        telephone:'90 00 00 04', role:'vendeur',      statut:'actif',   dateCreation:'12 Jan 2024' },
  { id:5,  prenom:'Mariam',  nom:'Fall',    email:'vendeur2@urs.com',       telephone:'90 00 00 05', role:'vendeur',      statut:'actif',   dateCreation:'15 Jan 2024' },
  { id:6,  prenom:'Fabio',   nom:'K.',      email:'vendeur3@urs.com',       telephone:'90 00 00 06', role:'vendeur',      statut:'inactif', dateCreation:'20 Jan 2024' },
  { id:7,  prenom:'Jean',    nom:'Kossi',   email:'livreur@urs.com',        telephone:'90 11 22 33', role:'livreur',      statut:'actif',   zone:'Adidogomé',   dateCreation:'01 Fév 2024' },
  { id:8,  prenom:'Koffi',   nom:'Dossou',  email:'livreur2@urs.com',       telephone:'90 22 33 44', role:'livreur',      statut:'actif',   zone:'Agoe',        dateCreation:'01 Fév 2024' },
  { id:9,  prenom:'Abdou',   nom:'Mané',    email:'livreur3@urs.com',       telephone:'90 33 44 55', role:'livreur',      statut:'actif',   zone:'Baguida',     dateCreation:'01 Fév 2024' },
  { id:10, prenom:'Salifou', nom:'A.',      email:'livreur4@urs.com',       telephone:'90 44 55 66', role:'livreur',      statut:'inactif', zone:'Lomé centre', dateCreation:'01 Fév 2024' },
  { id:11, prenom:'Mariam',  nom:'L.',      email:'livreur5@urs.com',       telephone:'90 55 66 77', role:'livreur',      statut:'actif',   zone:'Hédzranawoe', dateCreation:'01 Fév 2024' },
  { id:12, prenom:'Fabio',   nom:'Koffi',   email:'livreur6@urs.com',       telephone:'90 66 77 88', role:'livreur',      statut:'actif',   zone:'Avedji',      dateCreation:'01 Fév 2024' },
];

type ModalType = 'nouveau' | 'edition' | null;
const EMPTY_FORM = { prenom:'', nom:'', email:'', telephone:'', role:'vendeur' as Role, statut:'actif' as Statut, zone:'' };

export default function UtilisateursPage() {
  const [users,       setUsers]       = useState<Utilisateur[]>(INIT);
  const [modal,       setModal]       = useState<ModalType>(null);
  const [editing,     setEditing]     = useState<Utilisateur|null>(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState<'tous'|Role>('tous');
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);

  const filtered = users.filter(u =>
    (roleFilter === 'tous' || u.role === roleFilter) &&
    (`${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total:       users.length,
    actifs:      users.filter(u=>u.statut==='actif').length,
    livreurs:    users.filter(u=>u.role==='livreur').length,
    vendeurs:    users.filter(u=>u.role==='vendeur').length,
  };

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setModal('nouveau'); };
  const openEdit = (u: Utilisateur) => {
    setEditing(u);
    setForm({ prenom:u.prenom, nom:u.nom, email:u.email, telephone:u.telephone, role:u.role, statut:u.statut, zone:u.zone||'' });
    setModal('edition');
  };

  const handleSave = () => {
    if (!form.prenom.trim() || !form.email.trim()) return;
    if (modal === 'edition' && editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...form } : u));
    } else {
      const now = new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
      setUsers(prev => [...prev, { ...form, id:Date.now(), dateCreation:now }]);
    }
    setModal(null);
  };

  const handleDelete = (id: number) => { setUsers(prev=>prev.filter(u=>u.id!==id)); setDeleteConfirm(null); };

  const toggleStatut = (id: number) => {
    setUsers(prev => prev.map(u => u.id===id ? {...u, statut:u.statut==='actif'?'inactif':'actif'} : u));
  };

  const inp  = { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties;
  const lbl  = { display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties;

  return (
    <div style={{ padding:28, background:'#f0f4fb', minHeight:'100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26 }}>
        <div>
          <h1 style={T.h1}>Gestion des Utilisateurs</h1>
          <p style={T.sub}>Gérez les accès et les rôles de votre équipe</p>
        </div>
        <button onClick={openNew} style={T.btnPrimary}>
          <Plus size={15}/> Nouvel utilisateur
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Total utilisateurs', val:stats.total,   color:'#1465BB', bg:'#e0f0ff' },
          { label:'Actifs',             val:stats.actifs,  color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Livreurs',           val:stats.livreurs,color:'#0891b2', bg:'#cffafe' },
          { label:'Vendeurs',           val:stats.vendeurs,color:'#7c3aed', bg:'#ede9fe' },
        ].map(({label,val,color,bg}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4', boxShadow:'0 2px 10px rgba(0,55,133,0.05)' }}>

        {/* Toolbar */}
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', minWidth:260 }}>
            <Search size={13} color="#8a96b0" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, email…"
              style={{ width:'100%', padding:'8px 12px 8px 30px', border:'1.5px solid #dde5f4', borderRadius:7, fontSize:13, outline:'none', background:'#f4f7fd', color:'#0d1b3e' }}/>
          </div>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value as any)}
            style={{ padding:'8px 12px', border:'1.5px solid #dde5f4', borderRadius:7, fontSize:13, outline:'none', background:'#f4f7fd', color:'#0d1b3e' }}>
            <option value="tous">Tous les rôles</option>
            {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
          <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0' }}>{filtered.length} utilisateur{filtered.length>1?'s':''}</span>
        </div>

        {/* Table body */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>
                {['Utilisateur','Email','Téléphone','Rôle','Zone','Statut','Depuis','Actions'].map(h => (
                  <th key={h} style={T.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Aucun utilisateur trouvé</td></tr>
              ) : filtered.map(u => {
                const rc = ROLE_CONFIG[u.role];
                return (
                  <tr key={u.id}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                    <td style={T.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${rc.color},${rc.color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>
                          {u.prenom[0]}{u.nom[0]}
                        </div>
                        <div>
                          <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{u.prenom} {u.nom}</p>
                          <p style={{ fontSize:11, color:'#8a96b0' }}>ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...T.td, fontSize:13, color:'#4a5578' }}>{u.email}</td>
                    <td style={{ ...T.td, fontSize:13, color:'#4a5578' }}>{u.telephone}</td>
                    <td style={T.td}>
                      <span style={{ background:rc.bg, color:rc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                        {rc.label}
                      </span>
                    </td>
                    <td style={{ ...T.td, fontSize:13, color:'#4a5578' }}>{u.zone||'—'}</td>
                    <td style={T.td}>
                      <button onClick={()=>toggleStatut(u.id)}
                        style={{ display:'flex', alignItems:'center', gap:5, background:u.statut==='actif'?'#dcfce7':'#f1f5f9', color:u.statut==='actif'?'#166534':'#475569', border:'none', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        {u.statut==='actif' ? <CheckCircle size={11}/> : <XCircle size={11}/>}
                        {u.statut==='actif'?'Actif':'Inactif'}
                      </button>
                    </td>
                    <td style={{ ...T.td, color:'#8a96b0', whiteSpace:'nowrap', fontSize:12 }}>{u.dateCreation}</td>
                    <td style={T.td}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={()=>openEdit(u)} style={{ ...T.iconBtn, color:'#1465BB' }}><Edit2 size={13}/></button>
                        <button onClick={()=>setDeleteConfirm(u.id)} style={{ ...T.iconBtn, color:'#e53e3e', borderColor:'#fecaca', background:'#fff5f5' }}><Trash2 size={13}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nouveau / edition */}
      {modal && (
        <div onClick={()=>setModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>{modal==='nouveau'?'Nouvel utilisateur':'Modifier l\'utilisateur'}</h3>
              <button onClick={()=>setModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Prénom</label><input value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} placeholder="Ex: Jean" style={inp}/></div>
                <div><label style={lbl}>Nom</label><input value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Kossi" style={inp}/></div>
              </div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ex@urs.com" style={inp}/></div>
              <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="90 00 00 00" style={inp}/></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Rôle</label>
                  <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value as Role}))} style={inp}>
                    {(Object.entries(ROLE_CONFIG) as [Role,{label:string}][]).map(([r,{label}]) => (
                      <option key={r} value={r}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Statut</label>
                  <select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value as Statut}))} style={inp}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
              {form.role === 'livreur' && (
                <div>
                  <label style={lbl}>Zone de livraison</label>
                  <select value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))} style={inp}>
                    <option value="">Choisir une zone…</option>
                    {ZONES.map(z=><option key={z}>{z}</option>)}
                  </select>
                </div>
              )}
              {modal === 'nouveau' && (
                <div style={{ background:'#f4f7fd', borderRadius:9, padding:'10px 14px', border:'1px solid #dde5f4' }}>
                  <p style={{ fontSize:12, color:'#4a5578', fontWeight:500 }}>
                    🔑 Mot de passe temporaire : <strong style={{ color:'#1465BB' }}>urs2024</strong> — l'utilisateur devra le changer à la première connexion.
                  </p>
                </div>
              )}
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button onClick={()=>setModal(null)} style={T.btnCancel}>Annuler</button>
                <button onClick={handleSave}
                  disabled={!form.prenom.trim()||!form.email.trim()}
                  style={{ ...T.btnPrimary, opacity:!form.prenom.trim()||!form.email.trim()?0.5:1 }}>
                  {modal==='nouveau'?'Créer l\'utilisateur':'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm suppression */}
      {deleteConfirm !== null && (
        <div onClick={()=>setDeleteConfirm(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:380, padding:28, textAlign:'center', boxShadow:'0 20px 60px rgba(0,55,133,0.2)' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={24} color="#e53e3e"/>
            </div>
            <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:19, fontWeight:600, color:'#0d1b3e', marginBottom:8 }}>Supprimer cet utilisateur ?</h3>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', marginBottom:22 }}>
              Cette action est irréversible. L'utilisateur perdra tout accès à la plateforme.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
              <button onClick={()=>handleDelete(deleteConfirm)}
                style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const T = {
  h1:         { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:        { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  statCard:   { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem', boxShadow:'0 2px 8px rgba(0,55,133,0.04)' } as CSSProperties,
  th:         { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:         { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:    { width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  btnPrimary: { display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'DM Sans,sans-serif', boxShadow:'0 3px 10px rgba(20,101,187,0.3)' } as CSSProperties,
  btnCancel:  { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578', fontFamily:'DM Sans,sans-serif' } as CSSProperties,
  overlay:    { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)' } as CSSProperties,
  modalBox:   { background:'white', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' as const, boxShadow:'0 20px 60px rgba(0,55,133,0.2)', border:'1px solid #dde5f4', overflow:'hidden' as const } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};