"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";

export interface UploadedFile {
  file: File;
  preview: string;
}

interface DropZoneProps {
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesChange, disabled }: DropZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rejected, setRejected] = useState<FileRejection[]>([]);

  const onDrop = useCallback(
    (accepted: File[], rejectedFiles: FileRejection[]) => {
      const newFiles: UploadedFile[] = accepted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFiles((prev) => {
        const merged = [...prev, ...newFiles];
        onFilesChange(merged);
        return merged;
      });
      setRejected(rejectedFiles);
    },
    [onFilesChange]
  );

  const remove = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      onFilesChange(next);
      return next;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    disabled,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {isDragActive ? (
            <p className="font-medium text-blue-600">Déposez les images ici…</p>
          ) : (
            <>
              <p className="font-medium">Glissez vos images ici ou cliquez pour sélectionner</p>
              <p className="text-sm">JPG, JPEG, PNG, WEBP — plusieurs fichiers acceptés</p>
            </>
          )}
        </div>
      </div>

      {rejected.length > 0 && (
        <p className="text-sm text-red-500">
          {rejected.length} fichier(s) refusé(s) — seules les images sont acceptées.
        </p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((f, i) => (
            <div key={f.preview} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.preview}
                alt={f.file.name}
                className="w-full h-32 object-cover"
                onLoad={() => URL.revokeObjectURL(f.preview)}
              />
              <p className="text-xs text-slate-500 truncate px-2 py-1">{f.file.name}</p>
              {!disabled && (
                <button
                  onClick={() => remove(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Supprimer"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
