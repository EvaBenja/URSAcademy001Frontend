import { Calendar } from 'lucide-react';

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return "Aujourd'hui";
  if (same(d, yesterday)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

interface Props {
  label: string;
  count?: number;
  total?: number;
}

export default function DateSeparator({ label, count, total }: Props) {
  const isToday = label === "Aujourd'hui";
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px',
      background: isToday ? 'linear-gradient(90deg,#003785,#1465BB)' : '#f0f4ff',
      borderBottom: '2px solid #dde5f4',
    }}>
      <Calendar size={13} color={isToday ? 'rgba(255,255,255,0.8)' : '#1465BB'} />
      <span style={{
        fontSize: 13, fontWeight: 700, flex: 1,
        fontFamily: 'Playfair Display,serif',
        color: isToday ? 'white' : '#0d1b3e',
      }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 11, color: isToday ? 'rgba(255,255,255,0.65)' : '#8a96b0' }}>
          {count} entrée{count > 1 ? 's' : ''}
          {total ? ` · ${total.toLocaleString('fr-FR')} FCFA` : ''}
        </span>
      )}
    </div>
  );
}
