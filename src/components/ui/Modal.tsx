import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  children: ReactNode;
  width?:   number;
}

export default function Modal({ open, onClose, title, children, width = 520 }: Props) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(13,27,62,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 14, width: '100%', maxWidth: width,
          boxShadow: '0 20px 60px rgba(0,55,133,0.2)',
          border: '1px solid #dde5f4', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #f0f4fb',
          background: 'linear-gradient(90deg, #003785, #1465BB)',
        }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600, color: 'white' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 7, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}