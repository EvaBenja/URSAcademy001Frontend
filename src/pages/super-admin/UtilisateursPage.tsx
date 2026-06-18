import { useState, useEffect, type CSSProperties } from 'react';
import { Plus, Edit2, Trash2, X, Search, CheckCircle, XCircle } from 'lucide-react';
import { utilisateursService } from '../../services/api';
import toast from 'react-hot-toast';

type Role = 'super_admin' | 'gestionnaire' | 'coordinateur' | 'vendeur' | 'livreur';

const ROLE_CONFIG: Record<string, { label:string; color:string; bg:string }> = {
  super_admin:  { label:'Super Admin',  color:'#003785', bg:'#e0f0ff' },
  gestionnaire: { label:'Gestionnaire', color:'#0a9e6e', bg:'#dcfce7' },
  coordinateur: { label:'Coordinateur', color:'#d0a83a', bg:'#fdf3d7' },
  vendeur:      { label:'Vendeur',      color:'#7c3aed', bg:'#ede9fe' },
  livreur:      { label:'Livreur',      color:'#0891b2', bg:'#cffafe' },
};

const EMPTY_FORM = { prenom:'', nom:'', name:'', email:'', telephone:'', role_id:'5', statut:'actif', password: '' };

export default function UtilisateursPage() {
  const [users,        setUsers]        = useState<any[]>([]);
  const [roles,        setRoles]        = useState<any[]>([]);
  const [modal,        setModal]        = useState<'nouveau'|'edition'|null>(null);
  const [editing,      setEditing]      = useState<any>(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('tous');
  const [deleteConfirm,setDeleteConfirm]= useState<number|null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        utilisateursService.getAll(),
        utilisateursService.roles(),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (e) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const roleNom = typeof u.role === 'string' ? u.role : u.role?.nom || '';
    const matchRole = roleFilter === 'tous' || roleNom === roleFilter;
    const matchSearch = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setModal('nouveau'); };
  const openEdit = (u: any) => {
    const roleNom = typeof u.role === 'string' ? u.role : u.role?.nom || '';
    const roleObj = roles.find(r => r.nom === roleNom);
    setEditing(u);
    setForm({ prenom: u.prenom||'', nom: u.nom||'', name: u.name||'', email: u.email, telephone: u.telephone||'', role_id: String(roleObj?.id || 5), statut: u.statut||'actif', password: '' });
    setModal('edition');
  };

  const handleSave = async () => {
    if (!form.prenom.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name:      `${form.prenom} ${form.nom}`,
        prenom:    form.prenom,
        nom:       form.nom,
        email:     form.email,
        telephone: form.telephone,
        role_id:   Number(form.role_id),
        statut:    form.statut,
      };
      if (form.password) payload.password = form.password;
      if (modal === 'edition' && editing) {
        await utilisateursService.update(editing.id, payload);
        toast.success('Utilisateur modifié');
      } else {
        if (!form.password) { toast.error('Mot de passe requis'); setSaving(false); return; }
        await utilisateursService.create(payload);
        toast.success('Utilisateur créé');
      }
      setModal(null);
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await utilisateursService.delete(id);
      toast.success('Utilisateur supprimé');
      setDeleteConfirm(null);
      loadData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRoleNom = (u: any) => typeof u.role === 'string' ? u.role : u.role?.nom || '';

  const inp = { width:'100%', padding:'9px 12px', border:'1.5px solid #dde5f4', borderRadius:8, fontSize:14, outline:'none', color:'#0d1b3e', background:'white', boxSizing:'border-box' as const } as CSSProperties;
  const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#4a5578', marginBottom:5 } as CSSProperties;

  if (loading) return (
    <div style={{ textAlign:'center', padding:'60px', color:'#8a96b0', fontFamily:'Cormorant Garamond,serif', fontSize:18 }}>
      Chargement des utilisateurs…
    </div>
  );

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* Header */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:26, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={T.h1}>Gestion des Utilisateurs</h1>
          <p style={T.sub}>Gérez les accès et les rôles de votre équipe</p>
        </div>
        <button onClick={openNew} style={T.btnPrimary}><Plus size={15}/> Nouvel utilisateur</button>
      </div>

      {/* Stats */}
      <div className="stats-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        {[
          { label:'Total',      val:users.length,                                         color:'#1465BB', bg:'#e0f0ff' },
          { label:'Actifs',     val:users.filter(u=>u.statut==='actif').length,            color:'#0a9e6e', bg:'#dcfce7' },
          { label:'Livreurs',   val:users.filter(u=>getRoleNom(u)==='livreur').length,     color:'#0891b2', bg:'#cffafe' },
          { label:'Vendeurs',   val:users.filter(u=>getRoleNom(u)==='vendeur').length,     color:'#7c3aed', bg:'#ede9fe' },
        ].map(({label,val,color,bg}) => (
          <div key={label} style={T.statCard}>
            <p style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:11, color:'#8a96b0', marginTop:4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #dde5f4' }}>
        {/* Toolbar */}
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #f0f4fb', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ position:'relative', minWidth:220, flex:1 }}>
            <Search size={13} color="#8a96b0" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom, email…"
              style={{ width:'100%', padding:'8px 12px 8px 30px', border:'1.5px solid #dde5f4', borderRadius:7, fontSize:13, outline:'none', background:'#f4f7fd', color:'#0d1b3e' }}/>
          </div>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
            style={{ padding:'8px 12px', border:'1.5px solid #dde5f4', borderRadius:7, fontSize:13, outline:'none', background:'#f4f7fd', color:'#0d1b3e' }}>
            <option value="tous">Tous les rôles</option>
            {roles.map(r => <option key={r.id} value={r.nom}>{ROLE_CONFIG[r.nom]?.label || r.nom}</option>)}
          </select>
          <span style={{ marginLeft:'auto', fontSize:12, color:'#8a96b0' }}>{filtered.length} utilisateur{filtered.length>1?'s':''}</span>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table className="urs-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
            <thead>
              <tr>{['Utilisateur','Email','Téléphone','Rôle','Statut','Actions'].map(h=>(
                <th key={h} style={T.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:'40px', textAlign:'center', fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#8a96b0' }}>Aucun utilisateur trouvé</td></tr>
              ) : filtered.map(u => {
                const roleNom = getRoleNom(u);
                const rc = ROLE_CONFIG[roleNom] || { label:roleNom, color:'#475569', bg:'#f1f5f9' };
                return (
                  <tr key={u.id} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#f6f9ff'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='white'}>
                    <td style={T.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${rc.color},${rc.color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', flexShrink:0 }}>
                          {(u.prenom||u.name||'?')[0]}{(u.nom||'')[0]}
                        </div>
                        <div>
                          <p style={{ fontSize:14, fontWeight:600, color:'#0d1b3e' }}>{u.prenom} {u.nom}</p>
                          <p style={{ fontSize:11, color:'#8a96b0' }}>ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...T.td, fontSize:13, color:'#4a5578' }}>{u.email}</td>
                    <td style={{ ...T.td, fontSize:13, color:'#4a5578' }}>{u.telephone||'—'}</td>
                    <td style={T.td}><span style={{ background:rc.bg, color:rc.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>{rc.label}</span></td>
                    <td style={T.td}>
                      <span style={{ display:'flex', alignItems:'center', gap:5, background:u.statut==='actif'?'#dcfce7':'#f1f5f9', color:u.statut==='actif'?'#166534':'#475569', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600, width:'fit-content' }}>
                        {u.statut==='actif' ? <CheckCircle size={11}/> : <XCircle size={11}/>}
                        {u.statut==='actif'?'Actif':'Inactif'}
                      </span>
                    </td>
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

      {/* Modal créer/éditer */}
      {modal && (
        <div onClick={()=>setModal(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={T.modalBox}>
            <div style={T.modalHeader}>
              <h3 style={T.modalTitle}>{modal==='nouveau'?'Nouvel utilisateur':'Modifier l\'utilisateur'}</h3>
              <button onClick={()=>setModal(null)} style={T.modalClose}><X size={15}/></button>
            </div>
            <div style={{ padding:22, display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={lbl}>Prénom</label><input value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} placeholder="Ex: Jean" style={inp}/></div>
                <div><label style={lbl}>Nom</label><input value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Kossi" style={inp}/></div>
              </div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ex@urs.com" style={inp}/></div>
              <div><label style={lbl}>Téléphone</label><input value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))} placeholder="90 00 00 00" style={inp}/></div>
              <div><label style={lbl}>{modal==='edition'?'Nouveau mot de passe (laisser vide pour ne pas changer)':'Mot de passe *'}</label>
                <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" style={inp}/></div>
              <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Rôle</label>
                  <select value={form.role_id} onChange={e=>setForm(f=>({...f,role_id:e.target.value}))} style={inp}>
                    {roles.map(r => <option key={r.id} value={String(r.id)}>{ROLE_CONFIG[r.nom]?.label || r.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Statut</label>
                  <select value={form.statut} onChange={e=>setForm(f=>({...f,statut:e.target.value}))} style={inp}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button onClick={()=>setModal(null)} style={T.btnCancel}>Annuler</button>
                <button onClick={handleSave} disabled={saving || !form.prenom.trim() || !form.email.trim()}
                  style={{ ...T.btnPrimary, opacity: saving || !form.prenom.trim() || !form.email.trim() ? 0.5 : 1 }}>
                  {saving ? 'Enregistrement…' : modal==='nouveau'?'Créer':'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteConfirm !== null && (
        <div onClick={()=>setDeleteConfirm(null)} style={T.overlay}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:14, width:'100%', maxWidth:380, padding:28, textAlign:'center', margin:'0 16px' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Trash2 size={24} color="#e53e3e"/>
            </div>
            <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:19, fontWeight:600, color:'#0d1b3e', marginBottom:8 }}>Supprimer cet utilisateur ?</h3>
            <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:15, color:'#4a5578', marginBottom:22 }}>Cette action est irréversible.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setDeleteConfirm(null)} style={{ ...T.btnCancel, flex:1 }}>Annuler</button>
              <button onClick={()=>handleDelete(deleteConfirm)} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(90deg,#e53e3e,#991b1b)', color:'white', border:'none', fontWeight:600, cursor:'pointer', fontSize:14 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .stats-grid-4 { grid-template-columns: repeat(2,1fr) !important; }
          .page-header { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}

const T = {
  h1:        { fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color:'#0d1b3e', margin:0 } as CSSProperties,
  sub:       { fontFamily:'Cormorant Garamond,serif', fontSize:16, color:'#4a5578', marginTop:4 } as CSSProperties,
  statCard:  { background:'white', borderRadius:12, border:'1px solid #dde5f4', padding:'1.1rem 1.3rem' } as CSSProperties,
  th:        { fontSize:11, fontWeight:600, letterSpacing:'.8px', textTransform:'uppercase' as const, color:'#8a96b0', padding:'11px 14px', background:'#f4f7fd', borderBottom:'1px solid #dde5f4', textAlign:'left' as const, whiteSpace:'nowrap' as const },
  td:        { padding:'11px 14px', fontSize:13, borderBottom:'1px solid #f0f4fb', verticalAlign:'middle' as const } as CSSProperties,
  iconBtn:   { width:28, height:28, borderRadius:6, border:'1.5px solid #dde5f4', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' } as CSSProperties,
  btnPrimary:{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'linear-gradient(90deg,#1465BB,#003785)', color:'white', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' } as CSSProperties,
  btnCancel: { padding:'9px 18px', borderRadius:8, border:'1.5px solid #dde5f4', background:'white', fontSize:14, cursor:'pointer', color:'#4a5578' } as CSSProperties,
  overlay:   { position:'fixed' as const, inset:0, zIndex:200, background:'rgba(13,27,62,0.45)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(3px)', padding:'16px' } as CSSProperties,
  modalBox:  { background:'white', borderRadius:14, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' as const, boxShadow:'0 20px 60px rgba(0,55,133,0.2)' } as CSSProperties,
  modalHeader:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', background:'linear-gradient(90deg,#003785,#1465BB)' } as CSSProperties,
  modalTitle: { fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600, color:'white', margin:0 } as CSSProperties,
  modalClose: { background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' } as CSSProperties,
};