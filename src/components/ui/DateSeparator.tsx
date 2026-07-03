import type { CSSProperties } from 'react';
import { Calendar } from 'lucide-react';

interface Props {
  date: string; // YYYY-MM-DD ou date_vente
  count?: number;
  totalMontant?: number;
}

// Formate une date en français lisible : "Aujourd'hui", "Hier", "Lundi 29 juin"
export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Aujourd'hui";
  if (sameDay(d, yesterday)) return 'Hier';

  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

// Groupe un tableau par date (champ dateKey)
export function grouperParDate<T extends Record<string, any>>(
  items: T[],
  dateKey: string
): { date: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const raw = item[dateKey] || item['created_at']?.split('T')[0] || '';
    const key = raw.slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // plus récent en premier
    .map(([date, items]) => ({ date, label: formatDateLabel(date), items }));
}

export default function DateSeparator({ date, count, totalMontant }: Props) {
  const label = formatDateLabel(date);
  const isToday = label === "Aujourd'hui";
  const isYesterday = label === 'Hier';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      background: isToday ? 'linear-gradient(90deg,#003785,#1465BB)' : isYesterday ? '#f0f4ff' : '#f4f7fd',
      borderBottom: '1px solid #dde5f4',
      position: 'sticky' as CSSProperties['position'],
      top: 0,
      zIndex: 10,
    }}>
      <Calendar size={13} color={isToday ? 'rgba(255,255,255,0.8)' : '#1465BB'}/>
      <span style={{
        fontSize: 13,
        fontWeight: 700,
        color: isToday ? 'white' : '#0d1b3e',
        fontFamily: 'Playfair Display,serif',
        flex: 1,
      }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{
          fontSize: 11,
          color: isToday ? 'rgba(255,255,255,0.7)' : '#8a96b0',
        }}>
          {count} {count > 1 ? 'entrées' : 'entrée'}
          {totalMontant ? ` · ${totalMontant.toLocaleString('fr-FR')} FCFA` : ''}
        </span>
      )}
    </div>
  );
}
