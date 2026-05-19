import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role, ROLE_LABELS, ROLE_COLORS } from '../../types';
import { useStore } from '../../store/ventesStore';
import {
  LayoutDashboard, Package, TrendingUp, Truck,
  Users, FolderOpen, BarChart2, MapPin,
  LogOut, ChevronRight, Settings, Trophy,
  CheckSquare, Bell, ClipboardList,
} from 'lucide-react';

const NAV: Record<Role, { label:string; to:string; Icon:React.ElementType; badge?:string }[]> = {
  super_admin: [
    { label:'Tableau de bord',      to:'/dashboard',                      Icon:LayoutDashboard },
    { label:'Produits',             to:'/dashboard/produits',             Icon:Package         },
    { label:'Ventes',               to:'/dashboard/ventes',               Icon:TrendingUp      },
    { label:'Suivi livraisons',     to:'/dashboard/suivi-livraisons',     Icon:MapPin          },
    { label:'Demandes livreurs',    to:'/dashboard/demandes-livreurs',    Icon:Users           },
    { label:'Dossiers journaliers', to:'/dashboard/dossiers-journaliers', Icon:FolderOpen      },
    { label:'Rapports & Analyses',  to:'/dashboard/rapports',             Icon:BarChart2       },
    { label:'Utilisateurs',         to:'/dashboard/utilisateurs',         Icon:Users           },
    { label:'Paramètres',           to:'/dashboard/parametres',           Icon:Settings        },
  ],
  gestionnaire: [
    { label:'Tableau de bord',      to:'/gestionnaire/dashboard',         Icon:LayoutDashboard },
    { label:'Stocks & Produits',    to:'/gestionnaire/produits',          Icon:Package         },
    { label:'Validation ventes',    to:'/gestionnaire/ventes',            Icon:CheckSquare     },
    { label:'Classement vendeurs',  to:'/gestionnaire/classement',        Icon:Trophy          },
    { label:'Livraisons',           to:'/gestionnaire/livraisons',        Icon:Truck           },
    { label:'Rapports',             to:'/gestionnaire/rapports',          Icon:BarChart2       },
  ],
  coordinateur: [
    { label:'Livraisons',           to:'/coordinateur/livraisons',        Icon:Truck           },
    { label:'Positions livreurs',   to:'/coordinateur/positions',         Icon:MapPin          },
    { label:'Demandes livraison',   to:'/coordinateur/demandes',          Icon:ClipboardList   },
  ],
  vendeur: [
    { label:'Produits',             to:'/vendeur/produits',               Icon:Package         },
    { label:'Mes ventes',           to:'/vendeur/ventes',                 Icon:TrendingUp      },
  ],
  livreur: [
    { label:'Mes livraisons',       to:'/livreur/livraisons',             Icon:Truck           },
    { label:'Historique',           to:'/livreur/historique',             Icon:FolderOpen      },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { notifsNonLues, ventes } = useStore();

  if (!user) return null;

  const items     = NAV[user.role] || [];
  const roleColor = ROLE_COLORS[user.role as Role] || '#1465BB';
  const initials  = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`;

  // Badges dynamiques
  const enAttenteCount = ventes.filter(v => v.statut === 'en_attente').length;
  const alertesCount   = notifsNonLues;

  const getBadge = (to: string) => {
    if (to.includes('ventes') && (user.role === 'gestionnaire')) return enAttenteCount > 0 ? enAttenteCount : null;
    if (to.includes('suivi') || to.includes('livraisons')) return alertesCount > 0 ? alertesCount : null;
    return null;
  };

  return (
    <aside style={{
      width:240, minHeight:'100vh',
      background:'linear-gradient(180deg,#003785 0%,#0d1b3e 100%)',
      display:'flex', flexDirection:'column',
      position:'fixed', left:0, top:0, bottom:0, zIndex:50,
      boxShadow:'4px 0 20px rgba(0,55,133,0.25)',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:2 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:`linear-gradient(135deg,${roleColor},${roleColor}bb)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 3px 10px ${roleColor}55`, flexShrink:0 }}>
            <Truck size={17} color="white"/>
          </div>
          <span style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:'white', letterSpacing:'-0.5px' }}>URS</span>
        </div>
        <p style={{ fontFamily:'Cormorant Garamond,serif', fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:'0.5px', paddingLeft:46 }}>
          Gestion Produits & Livraison
        </p>
      </div>

      {/* ── User info ── */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', flexShrink:0, background:`linear-gradient(135deg,${roleColor},${roleColor}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'white', border:'2px solid rgba(255,255,255,0.15)' }}>
          {initials}
        </div>
        <div style={{ overflow:'hidden', flex:1 }}>
          <p style={{ fontSize:13, fontWeight:500, color:'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {user.prenom} {user.nom}
          </p>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', color:roleColor }}>
            {ROLE_LABELS[user.role as Role]}
          </span>
        </div>
        {/* Cloche notifs */}
        {alertesCount > 0 && (
          <div style={{ position:'relative', flexShrink:0 }}>
            <Bell size={15} color="rgba(255,255,255,0.5)"/>
            <span style={{ position:'absolute', top:-5, right:-5, width:15, height:15, borderRadius:'50%', background:'#e53e3e', border:'1.5px solid #0d1b3e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'white' }}>
              {alertesCount > 9 ? '9+' : alertesCount}
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,0.22)', padding:'4px 8px 10px' }}>
          Navigation
        </p>
        {items.map(({ label, to, Icon }) => {
          const badge = getBadge(to);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard' || to.endsWith('dashboard')}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 13px', borderRadius:8, marginBottom:2,
                fontSize:13.5, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,0.45)',
                background: isActive ? `linear-gradient(90deg,${roleColor},${roleColor}cc)` : 'transparent',
                textDecoration:'none', transition:'all .15s',
                boxShadow: isActive ? `0 3px 10px ${roleColor}44` : 'none',
              })}
            >
              <Icon size={16}/>
              <span style={{ flex:1 }}>{label}</span>
              {badge ? (
                <span style={{ background:'#e53e3e', color:'white', fontSize:10, fontWeight:700, borderRadius:'50%', minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : (
                <ChevronRight size={12} style={{ opacity:.4 }}/>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={logout}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 13px', borderRadius:8, fontSize:13.5, color:'rgba(255,255,255,0.4)', background:'none', border:'none', cursor:'pointer', width:'100%', transition:'all .15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(239,68,68,0.15)'; el.style.color='#fca5a5'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='rgba(255,255,255,0.4)'; }}
        >
          <LogOut size={16}/>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}