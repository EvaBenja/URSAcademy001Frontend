import { useState, useMemo } from 'react';

// Hook de recherche générique — filtre un tableau sur plusieurs champs
// Utilisation :
//   const { query, setQuery, filtered } = useSearch(items, ['nom','email','telephone'])
export function useSearch<T extends Record<string, any>>(
  items: T[],
  fields: string[]
): { query: string; setQuery: (q: string) => void; filtered: T[] } {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return items.filter(item =>
      fields.some(field => {
        // Supporte les champs imbriqués : "role.nom", "caissiere.prenom"
        const val = field.split('.').reduce((obj, key) => obj?.[key], item as any);
        if (val == null) return false;
        return String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      })
    );
  }, [items, fields, query]);

  return { query, setQuery, filtered };
}
