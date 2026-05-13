import { useState, useEffect, useCallback } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type StatutVente =
  | 'en_attente'       // Soumise par vendeur, pas encore validée
  | 'validee'          // Validée par gestionnaire+coordinateur, en attente livreur
  | 'notif_livreur'    // Notification envoyée au livreur, en attente de sa réponse
  | 'rejetee_livreur'  // Livreur a rejeté avec motif → alerte coordinateur
  | 'en_livraison'     // Livreur a accepté, en route
  | 'livree'           // Livraison confirmée
  | 'non_livree'       // Problème de livraison
  | 'refusee';         // Refusée par gestionnaire

export type StatutLivreur = 'disponible' | 'en_course' | 'hors_ligne';

export interface Produit {
  ref:       string;
  nom:       string;
  poids:     string;
  categorie: string;
  prixRef:   number;
  stock:     number;
}

export interface Livreur {
  id:       string;
  nom:      string;
  zone:     string;
  statut:   StatutLivreur;
  position: { lat: number; lng: number };
  telephone:string;
}

export interface Vente {
  id:           string;
  ref:          string;
  vendeurId:    string;
  vendeurNom:   string;
  produitRef:   string;
  produitNom:   string;
  qte:          number;
  prixRef:      number;   // Prix plancher gestionnaire
  prixVente:    number;   // Prix vendeur
  remise:       number;   // Remise en FCFA
  prixFinal:    number;   // prixVente - remise
  montantTotal: number;   // prixFinal × qte
  zone:         string;
  livreurId:    string | null;
  livreurNom:   string | null;
  statut:       StatutVente;
  motifRejet:   string;   // Motif rejet livreur
  note:         string;
  date:         string;
  updatedAt:    string;
  position?:    { lat: number; lng: number };
}

export interface Notification {
  id:          string;
  type:        'rupture' | 'en_attente' | 'non_livre' | 'rejet_livreur' | 'pas_livreur' | 'info';
  destinataire:'coordinateur' | 'livreur' | 'admin' | 'tous';
  livreurId?:  string;
  venteId?:    string;
  message:     string;
  date:        string;
  lu:          boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DONNÉES INITIALES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ZONES = ['Adidogomé','Agoe','Baguida','Lomé centre','Hédzranawoe','Avedji'];

export const INIT_LIVREURS: Livreur[] = [
  { id:'L1', nom:'Jean Kossi',   zone:'Adidogomé',   statut:'disponible',  position:{lat:6.172,lng:1.213}, telephone:'90 11 22 33' },
  { id:'L2', nom:'Koffi Dossou', zone:'Agoe',         statut:'en_course',   position:{lat:6.198,lng:1.225}, telephone:'90 22 33 44' },
  { id:'L3', nom:'Abdou M.',     zone:'Baguida',      statut:'disponible',  position:{lat:6.123,lng:1.298}, telephone:'90 33 44 55' },
  { id:'L4', nom:'Salifou A.',   zone:'Lomé centre',  statut:'hors_ligne',  position:{lat:6.137,lng:1.212}, telephone:'90 44 55 66' },
  { id:'L5', nom:'Mariam L.',    zone:'Hédzranawoe',  statut:'disponible',  position:{lat:6.155,lng:1.240}, telephone:'90 55 66 77' },
  { id:'L6', nom:'Fabio K.',     zone:'Avedji',       statut:'disponible',  position:{lat:6.148,lng:1.195}, telephone:'90 66 77 88' },
];

export const INIT_PRODUITS: Produit[] = [
  { ref:'PR-101', nom:'Sachet de mil',    poids:'20 kg', categorie:'Céréales', prixRef:4500,  stock:45 },
  { ref:'PR-102', nom:"Huile d'arachide", poids:'5 L',   categorie:'Huiles',   prixRef:3200,  stock:30 },
  { ref:'PR-103', nom:'Couscous local',   poids:'10 kg', categorie:'Céréales', prixRef:6000,  stock:22 },
  { ref:'PR-104', nom:'Sucre en poudre',  poids:'1 kg',  categorie:'Épicerie', prixRef:800,   stock:8  },
  { ref:'PR-105', nom:'Lait en poudre',   poids:'500 g', categorie:'Laiterie', prixRef:2500,  stock:5  },
  { ref:'PR-106', nom:'Riz importé',      poids:'25 kg', categorie:'Céréales', prixRef:18000, stock:60 },
];

const now = () => new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

const INIT_VENTES: Vente[] = [
  { id:'V001',ref:'#V-001',vendeurId:'vendeur',vendeurNom:'Abdoulaye',produitRef:'PR-101',produitNom:'Sachet de mil',       qte:3,prixRef:4500, prixVente:5000, remise:200, prixFinal:4800, montantTotal:14400, zone:'Adidogomé',  livreurId:'L1', livreurNom:'Jean Kossi',   statut:'en_livraison',  motifRejet:'',note:'Client fidèle', date:'14 Mai, 09:30',updatedAt:'14 Mai, 10:00',position:{lat:6.172,lng:1.213} },
  { id:'V002',ref:'#V-002',vendeurId:'vendeur',vendeurNom:'Mariam',   produitRef:'PR-102',produitNom:"Huile d'arachide",   qte:5,prixRef:3200, prixVente:3500, remise:0,   prixFinal:3500, montantTotal:17500, zone:'Agoe',        livreurId:null, livreurNom:null,           statut:'en_attente',    motifRejet:'',note:'',            date:'14 Mai, 10:15',updatedAt:'14 Mai, 10:15' },
  { id:'V003',ref:'#V-003',vendeurId:'vendeur',vendeurNom:'Abdoulaye',produitRef:'PR-103',produitNom:'Couscous local',      qte:2,prixRef:6000, prixVente:6500, remise:500, prixFinal:6000, montantTotal:12000, zone:'Baguida',     livreurId:'L3', livreurNom:'Abdou M.',     statut:'livree',        motifRejet:'',note:'',            date:'13 Mai, 14:00',updatedAt:'13 Mai, 16:30',position:{lat:6.123,lng:1.298} },
  { id:'V004',ref:'#V-004',vendeurId:'vendeur',vendeurNom:'Fabio',    produitRef:'PR-106',produitNom:'Riz importé',         qte:1,prixRef:18000,prixVente:19000,remise:1000,prixFinal:18000,montantTotal:18000, zone:'Lomé centre', livreurId:null, livreurNom:null,           statut:'en_attente',    motifRejet:'',note:'Urgent',       date:'14 Mai, 11:00',updatedAt:'14 Mai, 11:00' },
  { id:'V005',ref:'#V-005',vendeurId:'vendeur',vendeurNom:'Fabio',    produitRef:'PR-104',produitNom:'Sucre en poudre',     qte:4,prixRef:800,  prixVente:900,  remise:0,   prixFinal:900,  montantTotal:3600,  zone:'Avedji',      livreurId:'L6', livreurNom:'Fabio K.',     statut:'notif_livreur', motifRejet:'',note:'',            date:'14 Mai, 11:30',updatedAt:'14 Mai, 11:35' },
];

const INIT_NOTIFS: Notification[] = [
  { id:'N1',type:'rupture',    destinataire:'tous',          message:'Stock bas : Lait en poudre (5 unités)',                 date:'14 Mai, 08:00',lu:false },
  { id:'N2',type:'rupture',    destinataire:'tous',          message:'Stock bas : Sucre en poudre (8 unités)',                date:'14 Mai, 08:05',lu:false },
  { id:'N3',type:'en_attente', destinataire:'coordinateur',  message:'2 ventes en attente de validation',                    date:'14 Mai, 11:00',lu:false },
  { id:'N4',type:'non_livre',  destinataire:'admin',         message:'Vente #V-001 : livraison en cours depuis 1h',           date:'14 Mai, 10:00',lu:true  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORE SINGLETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _ventes:   Vente[]        = INIT_VENTES;
let _produits: Produit[]      = INIT_PRODUITS;
let _livreurs: Livreur[]      = INIT_LIVREURS;
let _notifs:   Notification[] = INIT_NOTIFS;

const _listeners = new Set<() => void>();
const broadcast = () => _listeners.forEach(fn => fn());

export const subscribeStore = (fn: () => void) => { _listeners.add(fn); return () => _listeners.delete(fn); };

// ── Getters
export const getVentes   = () => _ventes;
export const getProduits = () => _produits;
export const getLivreurs = () => _livreurs;
export const getNotifs   = () => _notifs;
export const getNotifsNonLues = (dest?: Notification['destinataire'], livreurId?: string) =>
  _notifs.filter(n => !n.lu && (
    !dest || n.destinataire === dest || n.destinataire === 'tous' ||
    (livreurId && n.livreurId === livreurId)
  )).length;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGIQUE AUTO-ASSIGNATION LIVREUR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function dist(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  return Math.sqrt(Math.pow(a.lat-b.lat,2)+Math.pow(a.lng-b.lng,2));
}

function assignerLivreur(vente: Vente): { livreur: Livreur | null; motif: string } {
  // 1. Livreurs disponibles dans la même zone
  const disponibles = _livreurs.filter(l => l.zone === vente.zone && l.statut === 'disponible');

  if (disponibles.length === 0) {
    // 2. Livreurs disponibles dans zones adjacentes (tous disponibles)
    const adjacents = _livreurs.filter(l => l.statut === 'disponible');
    if (adjacents.length === 0) {
      return { livreur: null, motif: 'Aucun livreur disponible pour le moment' };
    }
    // Prendre le plus proche géographiquement
    const zonePos = _livreurs.find(l=>l.zone===vente.zone)?.position || adjacents[0].position;
    const plusProche = adjacents.sort((a,b) => dist(a.position,zonePos) - dist(b.position,zonePos))[0];
    return { livreur: plusProche, motif: `Aucun livreur en zone ${vente.zone}, livreur le plus proche assigné` };
  }

  // Trier par proximité si position vente disponible
  const sorted = disponibles.sort((a,b) => {
    if (!vente.position) return 0;
    return dist(a.position,vente.position) - dist(b.position,vente.position);
  });

  return { livreur: sorted[0], motif: '' };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Vendeur soumet une vente
export function soumettreVente(data: {
  vendeurId:string; vendeurNom:string; produitRef:string; produitNom:string;
  qte:number; prixRef:number; prixVente:number; remise:number; zone:string; note:string;
}) {
  const id  = `V${String(Date.now()).slice(-4)}`;
  const ref = `#V-${id}`;
  const prixFinal   = Math.max(data.prixRef, data.prixVente - data.remise);
  const montantTotal = prixFinal * data.qte;
  const vente: Vente = {
    ...data, id, ref,
    prixFinal, montantTotal,
    livreurId:null, livreurNom:null,
    statut:'en_attente', motifRejet:'',
    date:now(), updatedAt:now(),
  };
  _ventes = [vente, ..._ventes];
  _addNotif({ type:'en_attente', destinataire:'coordinateur', venteId:id, message:`Nouvelle vente ${ref} en attente — ${data.vendeurNom} — ${montantTotal.toLocaleString()} FCFA` });
  broadcast();
  return vente;
}

// ── Gestionnaire/Coordinateur valident → système assigne livreur
export function validerVente(id: string) {
  const vente = _ventes.find(v => v.id === id);
  if (!vente) return;

  const { livreur, motif } = assignerLivreur(vente);

  if (!livreur) {
    // Pas de livreur → alerte coordinateur
    _ventes = _ventes.map(v => v.id===id ? {...v, statut:'validee', updatedAt:now()} : v);
    _addNotif({ type:'pas_livreur', destinataire:'coordinateur', venteId:id, message:`⚠️ Vente ${vente.ref} validée mais aucun livreur disponible. Motif : ${motif}` });
    broadcast();
    return;
  }

  // Livreur trouvé → envoyer notification au livreur
  _ventes = _ventes.map(v => v.id===id ? {
    ...v,
    statut:     'notif_livreur',
    livreurId:  livreur.id,
    livreurNom: livreur.nom,
    updatedAt:  now(),
  } : v);

  // Décrémenter stock
  _produits = _produits.map(p => {
    if (p.ref !== vente.produitRef) return p;
    const newStock = Math.max(0, p.stock - vente.qte);
    if (newStock < 10) _addNotif({ type:'rupture', destinataire:'tous', message:`Stock bas : ${p.nom} (${newStock} unités restantes)` });
    return { ...p, stock: newStock };
  });

  // Notif au livreur
  _addNotif({ type:'info', destinataire:'livreur', livreurId:livreur.id, venteId:id, message:`📦 Nouvelle livraison assignée : ${vente.ref} — Zone : ${vente.zone} — ${vente.montantTotal.toLocaleString()} FCFA` });

  if (motif) _addNotif({ type:'info', destinataire:'coordinateur', venteId:id, message:`ℹ️ ${motif} — Vente ${vente.ref}` });

  broadcast();
}

// ── Gestionnaire refuse une vente
export function refuserVente(id: string, motif: string) {
  _ventes = _ventes.map(v => v.id===id ? {...v, statut:'refusee', motifRejet:motif, updatedAt:now()} : v);
  broadcast();
}

// ── Livreur accepte la livraison
export function accepterLivraison(venteId: string) {
  const vente = _ventes.find(v => v.id === venteId);
  if (!vente || !vente.livreurId) return;
  _ventes = _ventes.map(v => v.id===venteId ? {...v, statut:'en_livraison', updatedAt:now()} : v);
  _livreurs = _livreurs.map(l => l.id===vente.livreurId ? {...l, statut:'en_course'} : l);
  broadcast();
}

// ── Livreur rejette la livraison avec motif
export function rejeterLivraison(venteId: string, motif: string) {
  const vente = _ventes.find(v => v.id === venteId);
  if (!vente || !vente.livreurId) return;

  const livreurNom = vente.livreurNom;
  _ventes = _ventes.map(v => v.id===venteId ? {
    ...v,
    statut:    'rejetee_livreur',
    motifRejet: motif,
    updatedAt: now(),
  } : v);

  // Remettre livreur disponible
  _livreurs = _livreurs.map(l => l.id===vente.livreurId ? {...l, statut:'disponible'} : l);

  // Alerter coordinateur avec motif
  _addNotif({
    type:'rejet_livreur',
    destinataire:'coordinateur',
    venteId,
    message:`🚫 ${livreurNom} a rejeté la livraison ${vente.ref}. Motif : "${motif}" — Réassignation nécessaire`,
  });

  broadcast();
}

// ── Coordinateur réassigne manuellement un livreur
export function reassignerLivreur(venteId: string, livreurId: string) {
  const livreur = _livreurs.find(l => l.id === livreurId);
  const vente   = _ventes.find(v => v.id === venteId);
  if (!livreur || !vente) return;

  _ventes = _ventes.map(v => v.id===venteId ? {
    ...v,
    livreurId:  livreur.id,
    livreurNom: livreur.nom,
    statut:     'notif_livreur',
    motifRejet: '',
    updatedAt:  now(),
  } : v);

  _addNotif({ type:'info', destinataire:'livreur', livreurId:livreur.id, venteId, message:`📦 Livraison réassignée : ${vente.ref} — Zone : ${vente.zone} — ${vente.montantTotal.toLocaleString()} FCFA` });
  broadcast();
}

// ── Livreur marque livré / non livré
export function marquerLivree(venteId: string) {
  const vente = _ventes.find(v => v.id === venteId);
  _ventes = _ventes.map(v => v.id===venteId ? {...v, statut:'livree', updatedAt:now()} : v);
  if (vente?.livreurId) _livreurs = _livreurs.map(l => l.id===vente.livreurId ? {...l, statut:'disponible'} : l);
  broadcast();
}

export function marquerNonLivree(venteId: string, motif: string) {
  const vente = _ventes.find(v => v.id === venteId);
  _ventes = _ventes.map(v => v.id===venteId ? {...v, statut:'non_livree', motifRejet:motif, updatedAt:now()} : v);
  if (vente?.livreurId) _livreurs = _livreurs.map(l => l.id===vente.livreurId ? {...l, statut:'disponible'} : l);
  _addNotif({ type:'non_livre', destinataire:'coordinateur', venteId, message:`❌ Livraison non effectuée : ${vente?.ref} — Motif : "${motif}"` });
  broadcast();
}

// ── Mise à jour position livreur (simulée)
export function updatePositionLivreur(livreurId: string, position:{lat:number;lng:number}) {
  _livreurs = _livreurs.map(l => l.id===livreurId ? {...l, position} : l);
  _ventes   = _ventes.map(v => v.livreurId===livreurId && v.statut==='en_livraison' ? {...v, position} : v);
  broadcast();
}

// ── Produits
export function updateProduit(p: Produit) { _produits = _produits.map(x => x.ref===p.ref ? p : x); broadcast(); }
export function ajouterProduit(d: Omit<Produit,'ref'>) {
  const ref = `PR-${100+_produits.length+1}`;
  _produits = [..._produits, {...d, ref}];
  broadcast();
}

// ── Notifs
function _addNotif(d: Omit<Notification,'id'|'date'|'lu'>) {
  _notifs = [{ id:`N${Date.now()}`, ...d, date:now(), lu:false }, ..._notifs];
}
export function marquerNotifLue(id: string) { _notifs = _notifs.map(n => n.id===id ? {...n,lu:true} : n); broadcast(); }
export function toutMarquerLu()             { _notifs = _notifs.map(n => ({...n,lu:true})); broadcast(); }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOK React
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useStore() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsub = subscribeStore(() => forceUpdate(n => n+1));

    // Simuler le mouvement des livreurs toutes les 5s
    const timer = setInterval(() => {
      _livreurs.filter(l => l.statut==='en_course').forEach(l => {
        updatePositionLivreur(l.id, {
          lat: l.position.lat + (Math.random()-0.5)*0.002,
          lng: l.position.lng + (Math.random()-0.5)*0.002,
        });
      });
    }, 5000);

    return () => { unsub(); clearInterval(timer); };
  }, []);

  const classementVendeurs = useCallback(() => {
    const map: Record<string, {nom:string;total:number;nb:number;livrees:number}> = {};
    _ventes
      .filter(v => v.date.includes('14 Mai') && v.statut !== 'refusee')
      .forEach(v => {
        if (!map[v.vendeurId]) map[v.vendeurId] = {nom:v.vendeurNom, total:0, nb:0, livrees:0};
        map[v.vendeurId].total   += v.montantTotal;
        map[v.vendeurId].nb      += 1;
        if (v.statut === 'livree') map[v.vendeurId].livrees += 1;
      });
    return Object.entries(map)
      .map(([id,d]) => ({vendeurId:id, ...d}))
      .sort((a,b) => b.total - a.total);
  }, []);

  const mesVentes = useCallback((vendeurId: string) =>
    _ventes.filter(v => v.vendeurId === vendeurId), []);

  const mesLivraisons = useCallback((livreurId: string) =>
    _ventes.filter(v => v.livreurId === livreurId), []);

  const mesNotifs = useCallback((dest: Notification['destinataire'], livreurId?:string) =>
    _notifs.filter(n =>
      n.destinataire === dest || n.destinataire === 'tous' ||
      (livreurId && n.livreurId === livreurId)
    ), []);

  return {
    ventes:    _ventes,
    produits:  _produits,
    livreurs:  _livreurs,
    notifs:    _notifs,
    notifsNonLues:       getNotifsNonLues(),
    notifsCoordinateur:  getNotifsNonLues('coordinateur'),
    classementVendeurs,
    mesVentes,
    mesLivraisons,
    mesNotifs,
  };
}