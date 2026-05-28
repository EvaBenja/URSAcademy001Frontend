interface StatItem {
  label: string;
  value: string;
  detail: string;
  color: string;
  bg: string;
}

export default function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
      {items.map(({ label, value, detail, color, bg }) => (
        <div key={label} style={{ background: 'white', borderRadius: 14, border: '1px solid #dde5f4', padding: '1.3rem', minHeight: 120, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8a96b0', marginBottom: 12 }}>{label}</p>
            <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: '#0d1b3e', margin: 0 }}>{value}</p>
          </div>
          <span style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 600, color, background: bg, padding: '6px 11px', borderRadius: 999 }}>{detail}</span>
        </div>
      ))}
    </div>
  );
}
