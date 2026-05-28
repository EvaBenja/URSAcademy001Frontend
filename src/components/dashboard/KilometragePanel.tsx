import { useEffect, useState } from 'react';
import { Navigation } from 'lucide-react';
import { getKmTousLivreurs, subscribeGPS } from '../../store/gpsStore';
import type { Livreur } from '../../store/ventesStore';

const STATUT_COLOR: Record<string, string> = {
  disponible: '#0a9e6e',
  en_course: '#1465BB',
  hors_ligne: '#94a3b8',
};

interface Props {
  livreurs: Livreur[];
}

export default function KilometragePanel({ livreurs }: Props) {
  const [kmData, setKmData] = useState<Record<string, number>>({});
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setKmData(getKmTousLivreurs());

    const unsub = subscribeGPS(() => {
      setKmData(getKmTousLivreurs());
      forceUpdate((n) => n + 1);
    });

    return unsub;
  }, []);

  const totalKm = Object.values(kmData).reduce((s, k) => s + k, 0);
  const actifs = livreurs.filter((l) => l.statut === 'en_course');

  const livreurKm = livreurs
    .map((l) => ({ ...l, km: kmData[l.id] || 0 }))
    .sort((a, b) => b.km - a.km);

  const maxKm = Math.max(...livreurKm.map((l) => l.km), 1);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 14,
        border: '1px solid #dde5f4',
        padding: '1.4rem',
        boxShadow: '0 2px 10px rgba(0,55,133,0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              background: '#e0f0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Navigation size={18} color="#1465BB" />
          </div>

          <div>
            <h2
              style={{
                fontFamily: 'Playfair Display,serif',
                fontSize: 16,
                fontWeight: 600,
                color: '#0d1b3e',
                margin: 0,
              }}
            >
              Kilométrage du jour
            </h2>
            <p style={{ fontSize: 11, color: '#8a96b0', marginTop: 1 }}>
              Basé sur la géolocalisation GPS active
            </p>
          </div>
        </div>

        {/* 🔥 ERREUR CORRIGÉE ICI */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'Playfair Display,serif',
                fontSize: 20,
                fontWeight: 700,
                color: '#1465BB',
                lineHeight: 1,
              }}
            >
              {totalKm.toFixed(1)}
            </p>
            <p style={{ fontSize: 10, color: '#8a96b0', marginTop: 2 }}>
              km total
            </p>
          </div>

          <div style={{ textAlign: 'center', marginLeft: 16 }}>
            <p
              style={{
                fontFamily: 'Playfair Display,serif',
                fontSize: 20,
                fontWeight: 700,
                color: '#0a9e6e',
                lineHeight: 1,
              }}
            >
              {actifs.length}
            </p>
            <p style={{ fontSize: 10, color: '#8a96b0', marginTop: 2 }}>
              GPS actifs
            </p>
          </div>
        </div>
      </div>

      {/* Liste livreurs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {livreurKm.map((l) => {
          const pct = maxKm > 0 ? (l.km / maxKm) * 100 : 0;
          const isActif = l.statut === 'en_course';

          return (
            <div
              key={l.id}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: isActif ? '#f0f9ff' : '#f8faff',
                border: `1px solid ${
                  isActif ? '#bfdbfe' : '#f0f4fb'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg,${
                      STATUT_COLOR[l.statut] || '#999'
                    },${STATUT_COLOR[l.statut] || '#999'}99)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  {l.nom?.[0] || '?'}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#0d1b3e',
                        margin: 0,
                      }}
                    >
                      {l.nom}
                    </p>

                    {isActif && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#dcfce7',
                          borderRadius: 10,
                          padding: '1px 7px',
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#0a9e6e',
                            animation: 'pulse 1.5s infinite',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#166534',
                          }}
                        >
                          GPS actif
                        </span>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 11, color: '#8a96b0', margin: 0 }}>
                    {l.zone}
                  </p>
                </div>

                {/* Km */}
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: 'Playfair Display,serif',
                      fontSize: 16,
                      fontWeight: 700,
                      color: isActif ? '#1465BB' : '#64748b',
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {l.km.toFixed(2)}{' '}
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: 'DM Sans,sans-serif',
                        fontWeight: 400,
                      }}
                    >
                      km
                    </span>
                  </p>

                  {isActif && l.position && (
                    <p style={{ fontSize: 10, color: '#8a96b0', marginTop: 1 }}>
                      📍 {l.position.lat.toFixed(4)},{' '}
                      {l.position.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Barre progression */}
              <div
                style={{
                  background: '#e8f0ff',
                  borderRadius: 20,
                  height: 5,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: isActif
                      ? 'linear-gradient(90deg,#2196F3,#1465BB)'
                      : '#cbd5e1',
                    borderRadius: 20,
                    transition: 'width .5s ease',
                  }}
                />
              </div>
            </div>
          );
        })}

        {livreurKm.length > 0 &&
          livreurKm.every((l) => l.km === 0) && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f4f7fd',
                borderRadius: 10,
              }}
            >
              <Navigation
                size={28}
                color="#dde5f4"
                style={{ marginBottom: 8 }}
              />
              <p
                style={{
                  fontFamily: 'Cormorant Garamond,serif',
                  fontSize: 15,
                  color: '#8a96b0',
                }}
              >
                Aucun livreur n'a encore activé son GPS aujourd'hui
              </p>
            </div>
          )}
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 1 }
          50% { opacity: .35 }
        }
      `}</style>
    </div>
  );
}