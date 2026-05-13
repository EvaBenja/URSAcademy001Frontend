import { ReactNode, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: number | string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  actions?: (row: T) => ReactNode;
  toolbar?: ReactNode;
  emptyText?: string;
}

// Couleurs thématiques pour une cohérence globale
const THEME = {
  primary: '#1465BB',
  border: '#E2E8F0',
  bgHeader: '#F8FAFC',
  textMain: '#1E293B',
  textMuted: '#64748B',
  bgInput: '#F1F5F9'
};

export default function Table<T extends Record<string, unknown>>({
  data, columns, searchKeys = [], pageSize = 10, actions, toolbar, emptyText = 'Aucune donnée trouvée',
}: Props<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = data.filter(row =>
    searchKeys.length === 0 || searchKeys.some(k =>
      String(row[k] ?? '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${THEME.border}`, 
      overflow: 'hidden' 
    }}>

      {/* Toolbar - Plus aérée */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: `1px solid ${THEME.border}`, 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        background: 'white'
      }}>
        {searchKeys.length > 0 && (
          <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
            <Search size={16} color={THEME.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher dans la liste..."
              style={{ 
                width: '100%', 
                padding: '10px 12px 10px 38px', 
                border: `1px solid ${THEME.border}`, 
                borderRadius: '8px', 
                fontSize: '14px', 
                outline: 'none', 
                background: THEME.bgInput, 
                color: THEME.textMain,
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = THEME.primary;
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = `0 0 0 3px ${THEME.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.background = THEME.bgInput;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {toolbar}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: THEME.textMuted, fontWeight: 500 }}>
          {filtered.length} élément{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={{ 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  color: THEME.textMuted, 
                  padding: '12px 20px', 
                  background: THEME.bgHeader, 
                  borderBottom: `1px solid ${THEME.border}`, 
                  textAlign: 'left', 
                  width: c.width 
                }}>
                  {c.label}
                </th>
              ))}
              {actions && <th style={{ background: THEME.bgHeader, borderBottom: `1px solid ${THEME.border}`, padding: '12px 20px', width: '80px' }}></th>}
            </tr>
          </thead>
          <tbody style={{ verticalAlign: 'middle' }}>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: '60px 20px', textAlign: 'center', color: THEME.textMuted }}>
                  <Inbox size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '15px' }}>{emptyText}</p>
                </td>
              </tr>
            ) : paginated.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}`, transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F1F7FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: '14px 20px', fontSize: '14px', color: THEME.textMain }}>
                    {c.render ? c.render(row) : <span style={{ opacity: row[c.key] ? 1 : 0.4 }}>{String(row[c.key] ?? '—')}</span>}
                  </td>
                ))}
                {actions && (
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - Design plus compact et moderne */}
      {totalPages > 1 && (
        <div style={{ 
          padding: '12px 20px', 
          background: THEME.bgHeader,
          borderTop: `1px solid ${THEME.border}`, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ fontSize: '13px', color: THEME.textMuted }}>
            Affichage de la page <strong>{page}</strong> sur <strong>{totalPages}</strong>
          </span>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <PaginationButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </PaginationButton>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (n > totalPages || n < 1) return null;
              return (
                <PaginationButton 
                  key={n} 
                  active={n === page} 
                  onClick={() => setPage(n)}
                >
                  {n}
                </PaginationButton>
              );
            })}

            <PaginationButton onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

// Sous-composant pour les boutons de pagination
function PaginationButton({ children, onClick, disabled, active }: { children: React.ReactNode, onClick: () => void, disabled?: boolean, active?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{ 
        minWidth: '32px', 
        height: '32px', 
        padding: '0 6px',
        borderRadius: '6px', 
        border: `1px solid ${active ? THEME.primary : THEME.border}`, 
        background: active ? THEME.primary : 'white', 
        color: active ? 'white' : (disabled ? '#CBD5E1' : THEME.textMain), 
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active) e.currentTarget.style.background = THEME.bgInput;
      }}
      onMouseLeave={(e) => {
        if (!disabled && !active) e.currentTarget.style.background = 'white';
      }}
    >
      {children}
    </button>
  );
}