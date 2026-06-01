import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Props {
  title?:       string;
  subtitle?:    string;
  onMenuClick?: () => void;
}

export default function Topbar({ title, subtitle, onMenuClick }: Props) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header style={{
      height: 64, background: 'white',
      borderBottom: '1px solid #dde5f4',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', position: 'sticky', top: 0, zIndex: 40,
      boxShadow: '0 1px 8px rgba(0,55,133,0.06)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Burger mobile */}
        <button
          onClick={onMenuClick}
          className="topbar-burger"
          style={{
            display: 'none', background: 'none', border: '1.5px solid #dde5f4',
            borderRadius: 8, width: 36, height: 36, alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#4a5578', flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>
        <div>
          {title && (
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: '#0d1b3e', lineHeight: 1.2 }}>
              {title}
            </h1>
          )}
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 13, color: '#8a96b0', textTransform: 'capitalize' }}>
            {subtitle || today}
          </p>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Search (hidden on mobile) */}
        <div style={{ position: 'relative' }} className="topbar-search">
          <Search size={14} color="#8a96b0" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Rechercher…"
            style={{
              padding: '7px 14px 7px 30px', border: '1.5px solid #dde5f4',
              borderRadius: 8, fontSize: 13, outline: 'none',
              background: '#f4f7fd', color: '#0d1b3e', width: 200,
            }}
          />
        </div>

        {/* Bell */}
        <button style={{
          position: 'relative', background: 'none',
          border: '1.5px solid #dde5f4', borderRadius: 8,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#4a5578', flexShrink: 0,
        }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 7, height: 7, background: '#d0a83a',
            borderRadius: '50%', border: '1.5px solid white',
          }} />
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderLeft: '1px solid #dde5f4', paddingLeft: 12 }} className="topbar-user">
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1465BB, #003785)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="topbar-user-name">
            <p style={{ fontSize: 13, fontWeight: 500, color: '#0d1b3e', lineHeight: 1.2 }}>
              {user?.prenom} {user?.nom}
            </p>
            <p style={{ fontSize: 11, color: '#8a96b0', lineHeight: 1 }}>{user?.email}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .topbar-burger { display: flex !important; }
          .topbar-search { display: none !important; }
          .topbar-user-name { display: none !important; }
        }
      `}</style>
    </header>
  );
}