import toast from 'react-hot-toast';

interface CopyPhoneProps {
  tel: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md';
}

// Numéro de téléphone cliquable : appel direct sur mobile, copie au clic sur desktop
export default function CopyPhone({ tel, style, size = 'sm' }: CopyPhoneProps) {
  if (!tel) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Sur mobile, le lien tel: ouvre le téléphone — on n'empêche pas ça
    // Sur desktop (pas de tel: support), on copie dans le presse-papier
    if (!('ontouchstart' in window)) {
      e.preventDefault();
      navigator.clipboard.writeText(tel).then(() => {
        toast.success(`📋 ${tel} copié !`, { duration: 2000 });
      }).catch(() => {
        toast.error('Impossible de copier');
      });
    }
  };

  return (
    <a
      href={`tel:${tel.replace(/\s/g, '')}`}
      onClick={handleClick}
      style={{
        color: '#1465BB',
        fontWeight: 600,
        fontSize: size === 'sm' ? 12 : 14,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        textDecoration: 'none',
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: 6,
        background: '#e0f0ff',
        ...style,
      }}
      title="Toucher pour appeler — clic droit pour copier"
    >
      📞 {tel}
    </a>
  );
}
