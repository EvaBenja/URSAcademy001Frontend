import { Search, X } from 'lucide-react';
import type { CSSProperties } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  count?: number;     // total items before filter
  filtered?: number;  // items after filter (to show "X résultats")
  style?: CSSProperties;
}

export default function SearchBar({ value, onChange, placeholder = 'Rechercher…', count, filtered, style }: SearchBarProps) {
  const showCount = count !== undefined && filtered !== undefined;
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', ...style }}>
      <Search size={15} color="#8a96b0" style={{ position:'absolute', left:12, pointerEvents:'none', flexShrink:0 }}/>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width:'100%',
          padding:'9px 36px 9px 36px',
          border:'1.5px solid #dde5f4',
          borderRadius:10,
          fontSize:13,
          color:'#0d1b3e',
          background:'white',
          outline:'none',
          transition:'border-color .15s',
        }}
        onFocus={e => e.target.style.borderColor = '#1465BB'}
        onBlur={e => e.target.style.borderColor = '#dde5f4'}
      />
      {value ? (
        <button onClick={() => onChange('')}
          style={{ position:'absolute', right:10, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:2 }}>
          <X size={14} color="#8a96b0"/>
        </button>
      ) : showCount ? (
        <span style={{ position:'absolute', right:10, fontSize:11, color:'#8a96b0', whiteSpace:'nowrap' }}>
          {filtered === count ? count : `${filtered} / ${count}`}
        </span>
      ) : null}
    </div>
  );
}
