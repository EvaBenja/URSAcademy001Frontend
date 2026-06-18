import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 1, label: 'Gestionnaire' },
  { value: 2, label: 'Coordinateur' },
  { value: 3, label: 'Vendeur' },
  { value: 4, label: 'Livreur' },
];

type FormState = { 
  nom: string; 
  prenom: string; 
  email: string; 
  telephone: string; 
  role_id: number; 
  password: string; 
  password_confirmation: string 
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ 
    nom: '', 
    prenom: '', 
    email: '', 
    telephone: '', 
    role_id: 3, 
    password: '', 
    password_confirmation: '' 
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: name === 'role_id' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) { 
      toast.error('Les mots de passe ne correspondent pas'); 
      return; 
    }
    setLoading(true);
    try {
      await authService.register(form);
      toast.success('Compte créé avec succès !');
      navigate('/login');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Erreur lors de la création');
    } finally { // Correction ici : "finally" avec deux 'l'
      setLoading(false); 
    }
  };

  const inp = { border: '1.5px solid #dde5f4', borderRadius: 8, fontSize: 14, outline: 'none', color: '#0d1b3e', width: '100%' };

  return (
    <div className="reg-outer" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4fb', padding: '2rem' }}>
      <div className="reg-card" style={{ width: '100%', maxWidth: 540, background: 'white', borderRadius: 16, border: '1px solid #dde5f4', padding: '2.5rem', boxShadow: '0 4px 24px rgba(0,55,133,0.08)' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #1465BB, #003785)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 3px 12px rgba(20,101,187,0.3)' }}>
            <Truck size={22} color="white" />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600, color: '#0d1b3e', marginBottom: 6 }}>Créer un compte</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Prénom + Nom */}
          <div className="reg-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([['prenom', 'Prénom'], ['nom', 'Nom']] as [string, string][]).map(([name, label]) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} color="#8a96b0" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                  <input name={name} value={form[name as keyof FormState]} onChange={handleChange} placeholder={label} required style={{ ...inp, padding: '9px 13px 9px 34px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} color="#8a96b0" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="vous@exemple.com" required style={{ ...inp, padding: '9px 13px 9px 34px' }} />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Téléphone</label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} color="#8a96b0" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
              <input name="telephone" value={form.telephone} onChange={handleChange} placeholder="00 00 00 00" required style={{ ...inp, padding: '9px 13px 9px 34px' }} />
            </div>
          </div>

          {/* Rôle */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Rôle</label>
            <select name="role_id" value={form.role_id} onChange={handleChange} style={{ ...inp, padding: '9px 13px' }}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Password x2 */}
          <div className="reg-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([['password', 'Mot de passe'], ['password_confirmation', 'Confirmer']] as [string, string][]).map(([name, label]) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#8a96b0" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                  <input name={name} type={showPass ? 'text' : 'password'} value={form[name as keyof FormState]} onChange={handleChange} placeholder="••••••••" required style={{ ...inp, padding: '9px 36px 9px 34px' }} />
                  {name === 'password' && (
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a96b0' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#94a3b8' : 'linear-gradient(90deg, #1465BB, #003785)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 14px rgba(20,101,187,0.3)', marginTop: 4 }}>
            {loading ? 'Création en cours…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#4a5578', marginTop: 22 }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#1465BB', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .reg-outer { padding: 1rem !important; }
          .reg-card  { padding: 1.5rem !important; }
          .reg-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}