"use client";

import { useState } from "react";
import DropZone, { UploadedFile } from "@/components/DropZone";

interface Row {
  match: string;
  club: string;
}

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Row[] | null>(null);

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const formData = new FormData();
      uploadedFiles.forEach((f) => formData.append("images", f.file));

      const res = await fetch("/api/process", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur serveur (${res.status})`);
      }

      // Check if the response is JSON (preview) or binary (xlsx)
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data: { rows: Row[] } = await res.json();
        setPreview(data.rows);
      } else {
        // Direct download
        const blob = await res.blob();
        triggerDownload(blob);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview, download: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur serveur (${res.status})`);
      }
      const blob = await res.blob();
      triggerDownload(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "delegues_manquants.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">Délégués Manquants</h1>
          <p className="text-slate-500">
            Déposez vos feuilles de matchs manuscrites et obtenez un fichier Excel
            avec les colonnes <strong>G</strong> et <strong>H</strong> prêtes à l&apos;emploi.
          </p>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="font-semibold text-slate-700">1. Déposez vos images</h2>
          <DropZone onFilesChange={setUploadedFiles} disabled={loading} />
        </div>

        {/* Action */}
        <div className="flex justify-center">
          <button
            onClick={handleProcess}
            disabled={uploadedFiles.length === 0 || loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Traitement en cours…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analyser et prévisualiser
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {/* Preview table */}
        {preview && preview.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">
                2. Vérifier les données extraites ({preview.length} lignes)
              </h2>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Télécharger l&apos;Excel
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-2 text-left w-8">#</th>
                    <th className="px-4 py-2 text-left">Colonne G (Club + ----)</th>
                    <th className="px-4 py-2 text-left">Colonne H (MANQUE DELEGUE MATCH …)</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-2 font-mono">{row.club}----</td>
                      <td className="px-4 py-2 font-mono">MANQUE DELEGUE MATCH {row.match}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {preview && preview.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-5 py-4 text-sm">
            Aucune ligne avec un numéro de match et de club valide n&apos;a été détectée dans les images.
          </div>
        )}
      </div>
    </main>
  );
}
