import { Link } from 'react-router-dom';
import {
  Package, TrendingUp, Truck, Users,
  FolderOpen, BarChart2, Shield, Zap, ArrowRight, Star,
} from 'lucide-react';

const MODULES = [
  { Icon: Package,    label: 'Produits',             desc: 'Gérez votre inventaire et vos stocks',             color: '#1465BB', bg: '#e0f0ff', features: ['Ajouter / modifier produits', 'Suivi des stocks', 'Catégories & prix', 'Alertes de stock'] },
  { Icon: TrendingUp, label: 'Ventes',                desc: "Suivez les ventes et le chiffre d'affaires",       color: '#0a9e6e', bg: '#dcfce7', features: ['Enregistrer les ventes', 'Historique des ventes', 'Rapports quotidiens', 'Performance vendeurs'] },
  { Icon: Truck,      label: 'Livraisons',            desc: 'Suivez et gérez toutes les livraisons',            color: '#d0a83a', bg: '#fdf3d7', features: ['Assignations de livraisons', 'Suivi en temps réel', 'Zones de livraison', 'Historique livraisons'] },
  { Icon: Users,      label: 'Demandes livreurs',     desc: 'Gérez les demandes de produits des livreurs',      color: '#7c3aed', bg: '#ede9fe', features: ['Demandes en attente', 'Validation / modification', 'Historique des demandes', 'Suivi des statuts'] },
  { Icon: FolderOpen, label: 'Dossiers journaliers',  desc: 'Consultez les dossiers journaliers des livreurs',  color: '#0891b2', bg: '#cffafe', features: ['Produits attribués', 'Montant carburant', 'Clôtures journalières', 'Rapports détaillés'] },
  { Icon: BarChart2,  label: 'Rapports & Analyses',   desc: 'Analysez les performances de votre activité',     color: '#003785', bg: '#e0f0ff', features: ['Rapports personnalisés', 'Analyses détaillées', 'Graphiques & statistiques', 'Exports de données'] },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#f0f4fb', minHeight: '100vh' }}>

      {/* ── Navbar ── */}
      <nav className="lp-navbar" style={{
        background: 'white', borderBottom: '1px solid #dde5f4',
        padding: '0 48px', height: 66,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,55,133,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #1465BB, #003785)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(20,101,187,0.35)',
          }}>
            <Truck size={18} color="white" />
          </div>
          <div>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 21, color: '#003785' }}>URS</span>
            <span style={{ fontSize: 11, color: '#8a96b0', display: 'block', lineHeight: 1, marginTop: -2 }}>Gestion Produits & Livraison</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid #dde5f4', color: '#0d1b3e', fontSize: 14, fontWeight: 500 }}>
            Connexion
          </Link>
          <Link to="/register" style={{
            padding: '9px 22px', borderRadius: 8,
            background: 'linear-gradient(90deg, #1465BB, #003785)', color: 'white',
            fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 3px 12px rgba(20,101,187,0.35)',
          }}>
            Inscription <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero" style={{
        background: 'linear-gradient(145deg, #003785 0%, #0d1b3e 50%, #003785 100%)',
        padding: '90px 48px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(33,150,243,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: 80,  width: 260, height: 260, borderRadius: '50%', background: 'rgba(208,168,58,0.1)',  pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 40,   left: -60,  width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',  pointerEvents: 'none' }} />

        <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(208,168,58,0.15)', border: '1px solid rgba(208,168,58,0.3)',
            borderRadius: 20, padding: '6px 18px', marginBottom: 24,
          }}>
            
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#d0a83a' }}>
              Bienvenue sur URS
            </span>
          </div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 700, color: 'white', lineHeight: 1.12, marginBottom: 22 }}>
            La plateforme complète pour gérer vos{' '}
            <span style={{ color: '#2196F3' }}>produits</span> et{' '}
            <span style={{ background: 'linear-gradient(90deg, #d0a83a, #ae8f1e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              livraisons
            </span>
          </h1>

          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            URS centralise la gestion des stocks, des ventes et des livraisons pour améliorer la performance et la traçabilité de votre entreprise.
          </p>

          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', marginBottom: 44, flexWrap: 'wrap' }}>
            {[

            ].map(({ Icon, text, c }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${c}22`, border: `1px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={c} />
                </div>
                {text}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: 'linear-gradient(90deg, #2196F3, #1465BB)',
              color: 'white', padding: '13px 34px', borderRadius: 10, fontSize: 15, fontWeight: 500,
              boxShadow: '0 4px 18px rgba(33,150,243,0.4)',
            }}>
              Accéder à mon espace <ArrowRight size={16} />
            </Link>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              background: 'rgba(208,168,58,0.15)', color: '#d0a83a',
              padding: '13px 34px', borderRadius: 10, fontSize: 15, fontWeight: 500,
              border: '1px solid rgba(208,168,58,0.3)',
            }}>
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="lp-statsbar" style={{ background: 'white', borderBottom: '1px solid #dde5f4', padding: '22px 48px', display: 'flex', justifyContent: 'center', gap: 72, flexWrap: 'wrap' }}>
        {[
       
        ].map(({ v, u, l, c }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: c }}>{v}</span>
              <span style={{ fontSize: 12, color: '#8a96b0', fontWeight: 500 }}>{u}</span>
            </div>
            <p style={{ fontSize: 12, color: '#4a5578', marginTop: 2 }}>{l}</p>
          </div>
        ))}
      </div>

      {/* ── Modules ── */}
      <section className="lp-modules" style={{ padding: '70px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 34, fontWeight: 600, color: '#0d1b3e', marginBottom: 12 }}>
            Choisissez votre espace
          </h2>
          <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg, #2196F3, #d0a83a)', borderRadius: 2, margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#4a5578' }}>
            Accédez à votre espace de travail selon votre rôle et vos responsabilités
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {MODULES.map(({ Icon, label, desc, color, bg, features }) => (
            <div
              key={label}
              style={{ background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1.6rem', transition: 'all .2s', cursor: 'pointer' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 28px rgba(0,55,133,0.12)'; el.style.transform = 'translateY(-3px)'; el.style.borderColor = color; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'none'; el.style.transform = 'none'; el.style.borderColor = '#dde5f4'; }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, border: `1px solid ${color}22` }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: '#0d1b3e', marginBottom: 6 }}>{label}</h3>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#4a5578', marginBottom: 16, lineHeight: 1.55 }}>{desc}</p>
              <ul style={{ listStyle: 'none', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#4a5578' }}>
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}33` }}>
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 0', borderRadius: 8, border: `1.5px solid ${color}`, color, fontSize: 13, fontWeight: 500 }}>
                Accéder <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer" style={{ background: 'linear-gradient(135deg, #003785, #0d1b3e)', padding: '28px 48px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <Shield size={14} color="#d0a83a" />
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>
            <strong style={{ color: 'white' }}>Sécurisé. Fiable. Performant.</strong>
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2024 URS — La solution complète pour votre gestion</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .lp-navbar  { padding: 0 20px !important; }
          .lp-hero    { padding: 56px 20px 50px !important; }
          .lp-statsbar{ padding: 18px 20px !important; gap: 32px !important; }
          .lp-modules { padding: 44px 20px !important; }
          .lp-footer  { padding: 22px 20px !important; }
        }
        @media (max-width: 480px) {
          .lp-navbar span[style*="display: block"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}