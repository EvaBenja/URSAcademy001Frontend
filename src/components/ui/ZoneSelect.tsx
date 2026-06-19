import { useState, useEffect, type CSSProperties } from 'react';
import { QUARTIERS_OUAGA } from '../../data/quartiersOuaga';

const AUTRE = '__autre__';

interface ZoneSelectProps {
  value: string;
  onChange: (val: string) => void;
  style?: CSSProperties;
}

// Sélecteur de quartier : liste des quartiers de Ouagadougou + option
// "Autre" qui bascule sur un champ de saisie libre si le quartier n'y figure pas.
export default function ZoneSelect({ value, onChange, style }: ZoneSelectProps) {
  const estDansListe = QUARTIERS_OUAGA.includes(value);
  const [modeLibre, setModeLibre] = useState(!estDansListe && value !== '');

  // Resynchronise le mode si la valeur est changée depuis l'extérieur
  // (ex: reset du formulaire après soumission vers une valeur de la liste).
  useEffect(() => {
    if (estDansListe && modeLibre) setModeLibre(false);
  }, [value, estDansListe, modeLibre]);

  if (modeLibre) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Saisir le quartier…"
          style={{ ...style, flex: 1 }}
          autoFocus
        />
        <button
          type="button"
          onClick={() => { setModeLibre(false); onChange(QUARTIERS_OUAGA[0]); }}
          style={{ padding: '0 10px', borderRadius: 8, border: '1.5px solid #dde5f4', background: 'white', cursor: 'pointer', fontSize: 12, color: '#4a5578', whiteSpace: 'nowrap' }}
        >
          Liste
        </button>
      </div>
    );
  }

  return (
    <select
      value={estDansListe ? value : ''}
      onChange={e => {
        if (e.target.value === AUTRE) { setModeLibre(true); onChange(''); }
        else onChange(e.target.value);
      }}
      style={style}
    >
      {!estDansListe && <option value="" disabled>— Sélectionner un quartier —</option>}
      {QUARTIERS_OUAGA.map(q => <option key={q} value={q}>{q}</option>)}
      <option value={AUTRE}>Autre (saisir le quartier…)</option>
    </select>
  );
}
