import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4fb', overflowX: 'hidden' }}>
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(13,27,62,0.4)', backdropFilter: 'blur(2px)',
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{ flex: 1, minWidth: 0, padding: '24px', background: '#f0f4fb', overflowX: 'hidden' }} className="page-main">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .page-main { padding: 16px !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}