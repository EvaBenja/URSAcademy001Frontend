interface Props {
  title: string;
  subtitle: string;
}

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#0d1b3e', marginBottom: 6, lineHeight: 1.1 }}>{title}</h1>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 15, color: '#4a5578', maxWidth: 760 }}>{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
