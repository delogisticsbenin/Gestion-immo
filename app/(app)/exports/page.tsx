"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import {
  getImmobilisations,
  getServices,
  getPersonnels,
  getCategories,
  getHistoriqueReaffectations,
} from "@/app/lib/store";
import { exporterCSV, exporterXLSX, ColonneExport } from "@/app/lib/export";

export default function ExportsPage() {
  const [immobilisations, setImmobilisations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [personnels, setPersonnels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      const [i, s, p, c, m] = await Promise.all([
        getImmobilisations(),
        getServices(),
        getPersonnels(),
        getCategories(),
        getHistoriqueReaffectations(),
      ]);
      setImmobilisations(i);
      setServices(s);
      setPersonnels(p);
      setCategories(c);
      setMouvements(m);
      setChargement(false);
    })();
  }, []);

  const serviceNom = (id: string) => services.find((s) => s.id === id)?.nom || "";
  const personnelNom = (id: string) => personnels.find((p) => p.id === id)?.nom || "";

  // Colonnes comptables calculées (durée, cumul, VNC)
  const avecCompta = immobilisations.map((i) => {
    const cat = categories.find((c) => c.nom === i.categorie);
    const duree = i.annee_amortissement > 0 ? i.annee_amortissement : (cat?.duree_utilite || 0);
    const annees = Math.max(0, new Date().getFullYear() - new Date(i.date_acquisition).getFullYear());
    const cumul = duree > 0 ? Math.min(i.montant || 0, ((i.montant || 0) / duree) * annees) : 0;
    return { ...i, duree, cumul, vnc: (i.montant || 0) - cumul };
  });

  const lignesInventaire = avecCompta.map((i) => ({
    ...i,
    service: serviceNom(i.service_id),
    personnel: personnelNom(i.personnel_id),
    date_acquisition: (i.date_acquisition || "").slice(0, 10),
  }));

  const COL_INVENTAIRE: ColonneExport[] = [
    { cle: "code_interne", titre: "Code" },
    { cle: "nom", titre: "Désignation" },
    { cle: "categorie", titre: "Catégorie" },
    { cle: "etat", titre: "État" },
    { cle: "statut", titre: "Statut" },
    { cle: "date_acquisition", titre: "Date acquisition" },
    { cle: "montant", titre: "Valeur brute" },
    { cle: "duree", titre: "Durée (ans)" },
    { cle: "cumul", titre: "Amortissements cumulés" },
    { cle: "vnc", titre: "VNC" },
    { cle: "service", titre: "Service" },
    { cle: "personnel", titre: "Détenteur" },
  ];

  const COL_ETAT: ColonneExport[] = [
    { cle: "code_interne", titre: "Code" },
    { cle: "nom", titre: "Désignation" },
    { cle: "categorie", titre: "Catégorie" },
    { cle: "date_acquisition", titre: "Acquisition" },
    { cle: "duree", titre: "Durée (ans)" },
    { cle: "montant", titre: "Valeur brute" },
    { cle: "cumul", titre: "Amort. cumulés" },
    { cle: "vnc", titre: "VNC" },
    { cle: "service", titre: "Service" },
  ];

  const mouvementsFiltres = mouvements.filter((m) =>
    (!dateDebut || (m.date_reaffectation || "").slice(0, 10) >= dateDebut) &&
    (!dateFin || (m.date_reaffectation || "").slice(0, 10) <= dateFin)
  );

  const lignesMouvements = mouvementsFiltres.map((m) => {
    const immo = immobilisations.find((i) => i.id === m.immobilisation_id);
    return {
      date: (m.date_reaffectation || "").slice(0, 10),
      code: immo?.code_interne || "",
      bien: immo?.nom || "",
      ancien_service: serviceNom(m.ancien_service_id),
      nouveau_service: serviceNom(m.nouveau_service_id),
      ancien_detenteur: personnelNom(m.ancien_personnel_id),
      nouveau_detenteur: personnelNom(m.nouveau_personnel_id),
      motif: m.motif || "",
    };
  });

  const COL_MOUVEMENTS: ColonneExport[] = [
    { cle: "date", titre: "Date" },
    { cle: "code", titre: "Code" },
    { cle: "bien", titre: "Équipement" },
    { cle: "ancien_service", titre: "Ancien service" },
    { cle: "nouveau_service", titre: "Nouveau service" },
    { cle: "ancien_detenteur", titre: "Ancien détenteur" },
    { cle: "nouveau_detenteur", titre: "Nouveau détenteur" },
    { cle: "motif", titre: "Motif" },
  ];

  const parService = services.map((s) => {
    const biens = avecCompta.filter((i) => i.service_id === s.id && i.statut !== "sorti");
    return {
      service: s.nom,
      nb_equipements: biens.length,
      valeur_brute: biens.reduce((t, b) => t + (b.montant || 0), 0),
      vnc: biens.reduce((t, b) => t + b.vnc, 0),
    };
  });
  const COL_SERVICE: ColonneExport[] = [
    { cle: "service", titre: "Service" },
    { cle: "nb_equipements", titre: "Nb équipements" },
    { cle: "valeur_brute", titre: "Valeur brute" },
    { cle: "vnc", titre: "VNC" },
  ];

  const parPersonne = personnels.map((p) => {
    const biens = avecCompta.filter((i) => i.personnel_id === p.id && i.statut !== "sorti");
    return {
      personne: p.nom,
      service: serviceNom(p.service_id),
      nb_equipements: biens.length,
      valeur_detenue: biens.reduce((t, b) => t + (b.montant || 0), 0),
    };
  });
  const COL_PERSONNE: ColonneExport[] = [
    { cle: "personne", titre: "Personne" },
    { cle: "service", titre: "Service" },
    { cle: "nb_equipements", titre: "Nb équipements" },
    { cle: "valeur_detenue", titre: "Valeur détenue" },
  ];

  const nonAffectes = lignesInventaire.filter((i) => i.statut !== "sorti" && !i.service_id && !i.personnel_id);
  const totalementAmortis = lignesInventaire.filter((i) => i.statut !== "sorti" && i.duree > 0 && i.vnc <= 0);

  const Carte = ({ titre, description, lignes, colonnes, enfants }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-3">
      <h2 className="font-bold text-gray-900">{titre}</h2>
      <p className="text-sm text-gray-600 flex-1">{description}</p>
      {enfants}
      <div className="flex gap-2">
        <button
          onClick={() => exporterCSV(titre.toLowerCase().replace(/\s+/g, "-"), lignes, colonnes)}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
        >
          CSV
        </button>
        <button
          onClick={() => exporterXLSX(titre.toLowerCase().replace(/\s+/g, "-"), lignes, colonnes, titre)}
          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
        >
          XLSX
        </button>
      </div>
    </div>
  );

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Download className="h-8 w-8 text-blue-600" /> Exports
        </h1>
        <p className="text-gray-600">Toutes les restitutions au format CSV (Excel compatible) et XLSX.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Carte
          titre="Matériel"
          description="Inventaire complet : désignation, état, statut, valeur, service, détenteur."
          lignes={lignesInventaire}
          colonnes={COL_INVENTAIRE}
        />
        <Carte
          titre="État des immobilisations"
          description="Restitution comptable SYSCOHADA : valeur brute, amortissements cumulés, VNC."
          lignes={lignesInventaire}
          colonnes={COL_ETAT}
        />
        <Carte
          titre="Mouvements de la période"
          description="Registre des réaffectations entre deux dates (ancien/nouveau service, détenteurs, motif)."
          lignes={lignesMouvements}
          colonnes={COL_MOUVEMENTS}
          enfants={
            <div className="flex gap-2">
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm" />
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg text-sm" />
            </div>
          }
        />
        <Carte
          titre="Matériel par service"
          description="Nombre d'équipements, valeur brute et VNC par service."
          lignes={parService}
          colonnes={COL_SERVICE}
        />
        <Carte
          titre="Matériel par personne"
          description="Équipements détenus et valeur détenue par personne."
          lignes={parPersonne}
          colonnes={COL_PERSONNE}
        />
        <Carte
          titre="Non affecté"
          description="Biens en service sans service ni détenteur : à affecter en priorité."
          lignes={nonAffectes}
          colonnes={COL_INVENTAIRE}
        />
        <Carte
          titre="Totalement amorti"
          description="Biens dont la VNC est nulle : à surveiller pour le renouvellement."
          lignes={totalementAmortis}
          colonnes={COL_ETAT}
        />
      </div>
    </div>
  );
}