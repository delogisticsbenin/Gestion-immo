import * as XLSX from "xlsx";

export interface ColonneExport {
  cle: string;
  titre: string;
}

const preparerLignes = (lignes: Record<string, any>[], colonnes: ColonneExport[]) =>
  lignes.map((l) => {
    const obj: Record<string, any> = {};
    colonnes.forEach((c) => { obj[c.titre] = l[c.cle] ?? ""; });
    return obj;
  });

// CSV : BOM UTF-8 + point-virgule → s'ouvre parfaitement dans Excel en français
export function exporterCSV(nomFichier: string, lignes: Record<string, any>[], colonnes: ColonneExport[]) {
  const entetes = colonnes.map((c) => c.titre);
  const corps = preparerLignes(lignes, colonnes).map((l) =>
    entetes.map((h) => {
      const s = l[h] === null || l[h] === undefined ? "" : String(l[h]);
      return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(";")
  );
  const csv = "\uFEFF" + [entetes.join(";"), ...corps].join("\r\n");
  telecharger(new Blob([csv], { type: "text/csv;charset=utf-8;" }), nomFichier + ".csv");
}

export function exporterXLSX(nomFichier: string, lignes: Record<string, any>[], colonnes: ColonneExport[], nomFeuille = "Export") {
  const ws = XLSX.utils.json_to_sheet(preparerLignes(lignes, colonnes));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomFeuille);
  XLSX.writeFile(wb, nomFichier + ".xlsx");
}

function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}