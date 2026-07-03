import { type ReactNode, type CSSProperties } from 'react';

interface AccordionCardProps {
  id: number;
  collapsed: boolean;
  onToggle: () => void;
  // Résumé compact (mode replié)
  summaryLeft: ReactNode;
  summaryRight: ReactNode;
  // Contenu complet (mode ouvert)
  children: ReactNode;
  style?: CSSProperties;
}

export default function AccordionCard({
  id, collapsed, onToggle,
  summaryLeft, summaryRight,
  children, style,
}: AccordionCardProps) {
  if (collapsed) {
    return (
      <div
        key={id}
        onClick={onToggle}
        style={{
          borderBottom: '1px solid #f0f4fb',
          cursor: 'pointer',
          ...style,
        }}
      >
        <div style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {summaryLeft}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {summaryRight}
            <span style={{ color: '#8a96b0', fontSize: 14 }}>▼</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={id} style={{ borderBottom: '1px solid #f0f4fb', ...style }}>
      {children}
    </div>
  );
}
