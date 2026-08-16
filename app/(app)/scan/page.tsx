"use client";

import { useState, useEffect, useRef } from "react";
import { QrCode, CameraOff } from "lucide-react";
import {
  getImmobilisations,
  getServices,
  getPersonnels,
  formatMontant,
} from "@/app/lib/store";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  const [scannerActif, setScannerActif] = useState(false);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");
  const [codeManuel, setCodeManuel] = useState("");
  const [resultat, setResultat] = useState<any | null>(null);
  const [introuvable, setIntrouvable] = useState("");

  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);

  useEffect(() => {
    const charger = async () => {
      const [i, s, p] = await Promise.all([
        getImmobilisations(),
        getServices(),
        getPersonnels(),
      ]);
      setImmobilisations(i);
      setServices(s);
      setPersonnels(p);
    };
    charger();
    return () => arreterCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arreterCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScannerActif(false);
  };

  const traiterCode = (code: string) => {
    const immo = immobilisations.find(
      (i) => (i.code_interne || "").toLowerCase() === code.trim().toLowerCase()
    );
    if (!immo) {
      setIntrouvable(`Code « ${code} » inconnu du registre.`);
      setResultat(null);
    } else {
      setResultat(immo);
      setIntrouvable("");
    }
  };

  // ✅ SCA-02 : chaque cas d'erreur est traité explicitement
  const demarrerScan = async () => {
    setErreur("");
    setInfo("");

    if (!window.isSecureContext) {
      setErreur("Le scan caméra nécessite HTTPS (ou localhost). Utilisez la saisie manuelle ci-dessous.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErreur("Caméra non disponible sur ce navigateur. Utilisez la saisie manuelle.");
      return;
    }
    const BD: any = (window as any).BarcodeDetector;
    if (!BD) {
      setInfo("Détection QR non supportée par ce navigateur — utilisez la saisie manuelle.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new BD({ formats: ["qr_code"] });
      setScannerActif(true);
      timerRef.current = setInterval(async () => {
        try {
          if (!videoRef.current) return;
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const texte = codes[0].rawValue;
            arreterCamera();
            traiterCode(texte);
          }
        } catch {
          /* image pas encore prête */
        }
      }, 500);
    } catch (e: any) {
      if (e?.name === "NotAllowedError") {
        setErreur("Permission caméra refusée. Autorisez la caméra dans le navigateur, ou utilisez la saisie manuelle.");
      } else if (e?.name === "NotFoundError") {
        setErreur("Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle.");
      } else {
        setErreur("Impossible de démarrer la caméra. Utilisez la saisie manuelle.");
      }
    }
  };

  // ✅ SCA-01 : saisie manuelle de repli
  const rechercherManuel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeManuel.trim()) return;
    traiterCode(codeManuel);
  };

  const nomService = (id: string) => services.find((s) => s.id === id)?.nom || "—";
  const nomPersonnel = (id: string) => personnels.find((p) => p.id === id)?.nom || "—";

  // ✅ SCA-03 : gabarit aligné sur le reste de l'application (fond gris, cartes blanches)
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scanner QR</h1>
        <p className="text-gray-600">Scannez l'étiquette d'un équipement ou saisissez son code.</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Caméra</h2>
            {scannerActif ? (
              <button
                onClick={arreterCamera}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                Arrêter le scan
              </button>
            ) : (
              <button
                onClick={demarrerScan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Démarrer le scan
              </button>
            )}
          </div>

          <video
            ref={videoRef}
            playsInline
            muted
            className={scannerActif ? "w-full rounded-lg bg-black" : "hidden"}
          />
          {!scannerActif && (
            <div className="h-40 rounded-lg bg-gray-100 flex flex-col items-center justify-center text-gray-500 gap-2">
              <CameraOff className="h-8 w-8" />
              <p className="text-sm">Caméra inactive</p>
            </div>
          )}

          {erreur && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              ⛔ {erreur}
            </div>
          )}
          {info && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              ℹ️ {info}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Saisie manuelle</h2>
          <form onSubmit={rechercherManuel} className="flex gap-2">
            <input
              type="text"
              value={codeManuel}
              onChange={(e) => setCodeManuel(e.target.value)}
              placeholder="Ex. : DELO-26-0001"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
            >
              Rechercher
            </button>
          </form>
        </div>

        {introuvable && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            ⛔ {introuvable}
          </div>
        )}

        {resultat && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <QrCode className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">{resultat.code_interne}</h2>
              <span className={`ml-auto inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                resultat.etat === 'Neuf' ? 'bg-green-100 text-green-800' :
                resultat.etat === 'Bon état' ? 'bg-blue-100 text-blue-800' :
                resultat.etat === 'Usagé' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {resultat.etat}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <p><span className="text-gray-500">Désignation :</span> <span className="font-medium">{resultat.nom}</span></p>
              <p><span className="text-gray-500">Catégorie :</span> {resultat.categorie}</p>
              <p><span className="text-gray-500">Service :</span> {nomService(resultat.service_id)}</p>
              <p><span className="text-gray-500">Détenteur :</span> {nomPersonnel(resultat.personnel_id)}</p>
              <p><span className="text-gray-500">Statut :</span> {resultat.statut === 'sorti' ? `Sorti du parc (${resultat.motif_sortie})` : 'En service'}</p>
              <p><span className="text-gray-500">Valeur :</span> {formatMontant(resultat.montant)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}