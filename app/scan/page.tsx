"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Link from "next/link";
import { getImmobilisations } from "@/app/lib/store";

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [immobilisation, setImmobilisation] = useState<any>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScan = async () => {
    setError("");
    setResult(null);
    setImmobilisation(null);
    setScanning(true);

    setTimeout(() => {
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setResult(decodedText);
          setScanning(false);
          scanner.stop().catch(console.error);

          // Rechercher l'immobilisation
          const checkImmo = async () => {
            const immos = await getImmobilisations();
            const immo = immos.find((i) => i.code_interne === decodedText);
            setImmobilisation(immo || null);
            if (!immo) {
              setError("Aucun équipement trouvé pour ce code");
            }
          };
          checkImmo();
        },
        (errorMessage) => {
          console.log("Scan en cours...", errorMessage);
        }
      ).catch((err) => {
        console.error("Erreur de démarrage du scanner:", err);
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        setScanning(false);
      });
    }, 100);
  };

  const stopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
    setScanning(false);
  };

  const resetScan = () => {
    setResult(null);
    setImmobilisation(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/dashboard" className="text-white hover:text-blue-200 transition">
            ← Retour
          </Link>
          <h1 className="text-3xl font-bold text-white">📷 Scanner QR Code</h1>
          <div className="w-20"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!scanning && !result && !error && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Scanner un équipement</h2>
              <p className="text-gray-600 mb-8">
                Pointez votre caméra vers le QR Code de l'équipement pour voir ses informations
              </p>
              <button
                onClick={startScan}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
              >
                🎥 Démarrer le scan
              </button>
            </div>
          )}

          {scanning && (
            <div>
              <div id="reader" className="rounded-lg overflow-hidden"></div>
              <p className="text-center text-gray-600 mt-4">Recherche d'un QR Code...</p>
              <button
                onClick={stopScan}
                className="mt-4 w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          )}

          {result && immobilisation && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Équipement trouvé !</h2>
              <p className="text-sm text-gray-500 mb-6">Code: {result}</p>

              <div className="bg-gray-50 rounded-lg p-6 text-left space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-semibold text-gray-900">{immobilisation.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Catégorie</p>
                  <p className="font-semibold text-gray-900">{immobilisation.categorie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-semibold text-gray-900">{immobilisation.service_nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Personnel</p>
                  <p className="font-semibold text-gray-900">{immobilisation.personnel_nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">État</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    immobilisation.etat === "Neuf" ? "bg-green-100 text-green-800" :
                    immobilisation.etat === "Bon état" ? "bg-blue-100 text-blue-800" :
                    immobilisation.etat === "Usagé" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {immobilisation.etat}
                  </span>
                </div>
              </div>

              <button
                onClick={resetScan}
                className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                🔄 Scanner un autre équipement
              </button>
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <button
                onClick={resetScan}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}