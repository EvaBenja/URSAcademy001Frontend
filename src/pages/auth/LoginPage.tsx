import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Truck, Lock, Mail, Shield, Zap, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await login(email, password); } catch { /* géré dans AuthContext */ }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f4fb' }}>

      {/* ── Panneau gauche ── */}
      <div style={{
        flex: 1, minWidth: 0,
        background: 'linear-gradient(160deg, #003785 0%, #0d1b3e 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 360, height: 360, borderRadius: '50%', background: 'rgba(33,150,243,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(208,168,58,0.1)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 380 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(33,150,243,0.2)', border: '1px solid rgba(33,150,243,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px',
          }}>
            <Truck size={28} color="#2196F3" />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700, color: 'white', marginBottom: 10, letterSpacing: '-1px' }}>URS</h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 44 }}>
            La plateforme complète pour gérer vos produits et livraisons
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            {[
            //   { Icon: Shield,   text: 'Données protégées et accès contrôlés', c: '#2196F3' },
            //   { Icon: Zap,      text: 'Suivi des livraisons en temps réel',    c: '#d0a83a' },
            //   { Icon: BarChart2,text: 'Rapports & analyses avancées',           c: '#0a9e6e' },
            ].map(({ Icon, text, c }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${c}22`, border: `1px solid ${c}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={c} />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Formulaire ── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '3rem', background: 'white',
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 600, color: '#0d1b3e', marginBottom: 8 }}>
            Connexion
          </h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, color: '#4a5578' }}>
            Bienvenue ! Entrez vos identifiants pour continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Adresse email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="#8a96b0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com" required
                style={{ width: '100%', padding: '10px 14px 10px 38px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 14, outline: 'none', color: '#0d1b3e' }}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Mot de passe</label>
              <a href="#" style={{ fontSize: 12, color: '#1465BB', fontWeight: 500 }}>Mot de passe oublié ?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="#8a96b0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 40px 10px 38px', border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 14, outline: 'none', color: '#0d1b3e' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a96b0', padding: 0 }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={isLoading}
            style={{
              width: '100%', padding: '12px',
              background: isLoading ? '#94a3b8' : 'linear-gradient(90deg, #1465BB, #003785)',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 15, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 4px 14px rgba(20,101,187,0.35)',
              marginTop: 4,
            }}
          >
            {isLoading ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#4a5578', marginTop: 28 }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#1465BB', fontWeight: 600 }}>Créer un compte</Link>
        </p>

        <p style={{ textAlign: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 12, color: '#8a96b0', marginTop: 36 }}>
          © 2024 URS — Tous droits réservés
        </p>
      </div>
    </div>
  );
}