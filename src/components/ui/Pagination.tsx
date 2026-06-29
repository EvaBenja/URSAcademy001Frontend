import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const debut = (page - 1) * pageSize + 1;
  const fin   = Math.min(page * pageSize, total);

  // Pages à afficher : toujours 1, toujours last, et les 2 autour de la page courante
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 4px', flexWrap:'wrap', gap:10 }}>
      <span style={{ fontSize:12, color:'#8a96b0' }}>
        {debut}–{fin} sur <strong style={{ color:'#0d1b3e' }}>{total}</strong>
      </span>
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        <button onClick={()=>onChange(page-1)} disabled={page===1} style={btn(page===1)}>
          <ChevronLeft size={14}/>
        </button>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} style={{ padding:'0 4px', color:'#8a96b0', fontSize:13 }}>…</span>
            : <button key={p} onClick={()=>onChange(p as number)}
                style={btn(false, p === page)}>
                {p}
              </button>
        )}
        <button onClick={()=>onChange(page+1)} disabled={page===totalPages} style={btn(page===totalPages)}>
          <ChevronRight size={14}/>
        </button>
      </div>
    </div>
  );
}

const btn = (disabled: boolean, active = false): CSSProperties => ({
  minWidth: 32, height: 32, borderRadius: 8, border: `1.5px solid ${active?'#1465BB':'#dde5f4'}`,
  background: active ? '#1465BB' : disabled ? '#f4f7fd' : 'white',
  color: active ? 'white' : disabled ? '#c0c8d8' : '#4a5578',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 13, fontWeight: active ? 700 : 400,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all .15s',
});
