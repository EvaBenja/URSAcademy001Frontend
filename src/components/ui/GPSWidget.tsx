import { useEffect } from "react";
import { updateKm } from "../../store/gpsStore";

export default function GPSWidget() {
  useEffect(() => {
    const interval = setInterval(() => {
      // simulation GPS
      updateKm("1", Math.random() * 10);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 10, background: "#f1f5f9", borderRadius: 8 }}>
      📍 GPS en cours...
    </div>
  );
}