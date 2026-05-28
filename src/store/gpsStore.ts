type Callback = () => void;

let callbacks: Callback[] = [];

// stockage des kilomètres par livreur (id → km)
let kmData: Record<string, number> = {};

export function getKmTousLivreurs() {
  return kmData;
}

export function subscribeGPS(cb: Callback) {
  callbacks.push(cb);

  // unsubscribe
  return () => {
    callbacks = callbacks.filter((c) => c !== cb);
  };
}

// 🔥 fonction pour simuler / mettre à jour le GPS
export function updateKm(id: string, km: number) {
  kmData[id] = km;
  callbacks.forEach((cb) => cb());
}