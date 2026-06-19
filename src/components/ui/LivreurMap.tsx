import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Centre de Ouagadougou (Place des Nations Unies, repère central)
export const OUAGA_CENTER: [number, number] = [12.3714, -1.5197];
export const OUAGA_RADIUS_KM = 35;

// Formule Haversine — distance en km entre deux points GPS
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isHorsZone(lat: number, lng: number): boolean {
  return distanceKm(OUAGA_CENTER[0], OUAGA_CENTER[1], lat, lng) > OUAGA_RADIUS_KM;
}

export interface LivreurPoint {
  id: number | string;
  nom: string;
  latitude: number;
  longitude: number;
  sousLabel?: string;   // ex: "2 livraisons en cours"
  couleur?: string;     // couleur du marqueur
  selected?: boolean;
}

interface LivreurMapProps {
  points: LivreurPoint[];
  height?: number | string;
  onSelect?: (id: number | string) => void;
  selectedId?: number | string | null;
}

const DEFAULT_COLOR = '#1465BB';

function buildIcon(color: string, label: string, selected: boolean) {
  const size = selected ? 34 : 28;
  return L.divIcon({
    className: 'urs-livreur-marker',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
        background:${color};transform:rotate(-45deg);
        border:3px solid ${selected ? '#0d1b3e' : 'white'};
        box-shadow:0 3px 10px ${color}88;
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:800;">${label}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

export default function LivreurMap({ points, height = 340, onSelect, selectedId }: LivreurMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Init carte une seule fois
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, {
      center: OUAGA_CENTER,
      zoom: 12,
      scrollWheelZoom: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Met à jour les marqueurs à chaque changement de points
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    const visiblesIds = new Set(points.map(p => String(p.id)));

    // Retire les marqueurs obsolètes
    Object.keys(markersRef.current).forEach(id => {
      if (!visiblesIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Ajoute / met à jour les marqueurs actuels
    points.forEach(p => {
      const key = String(p.id);
      const color = p.couleur || DEFAULT_COLOR;
      const initiale = (p.nom || '?').trim()[0]?.toUpperCase() || '?';
      const icon = buildIcon(color, initiale, !!p.selected || selectedId === p.id);

      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng([p.latitude, p.longitude]);
        markersRef.current[key].setIcon(icon);
      } else {
        const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(map);
        marker.on('click', () => onSelect?.(p.id));
        markersRef.current[key] = marker;
      }

      markersRef.current[key].bindPopup(
        `<strong>${p.nom}</strong>${p.sousLabel ? `<br/><span style="color:#4a5578;font-size:12px">${p.sousLabel}</span>` : ''}`
      );
    });
  }, [points, selectedId, onSelect]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #dde5f4' }}
    />
  );
}
