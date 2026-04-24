"use client";

import { useState } from "react";
import { LuExternalLink, LuImage, LuLoader } from "react-icons/lu";
import type { DrivePhoto } from "@/lib/google-drive";

interface PhotoBrowserProps {
  photos: DrivePhoto[];
  folderUrl: string;
}

export default function PhotoBrowser({ photos, folderUrl }: PhotoBrowserProps) {
  const [selected, setSelected] = useState<DrivePhoto | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <LuImage size={28} className="text-neutral-600" />
        <p className="mt-3 text-sm text-neutral-500">La carpeta todavía no tiene fotos</p>
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-600 transition-colors"
        >
          <LuExternalLink size={13} />
          Abrir en Drive
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-500">{photos.length} fotos</p>
        <a
          href={folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <LuExternalLink size={13} />
          Abrir en Drive
        </a>
      </div>

      {/* Grid de thumbnails */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PhotoThumb fileId={photo.id} name={photo.name} />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full overflow-hidden rounded-xl bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <p className="truncate text-sm text-neutral-400">{selected.name}</p>
              <div className="flex items-center gap-2">
                <a
                  href={selected.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600 transition-colors"
                >
                  <LuExternalLink size={12} />
                  Ver en Drive
                </a>
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center p-2">
              <img
                src={`/api/fotografia/drive/thumbnail/${selected.id}`}
                alt={selected.name}
                className="max-h-[75vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PhotoThumb({ fileId, name }: { fileId: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LuLoader size={16} className="animate-spin text-neutral-600" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LuImage size={16} className="text-neutral-700" />
        </div>
      ) : (
        <img
          src={`/api/fotografia/drive/thumbnail/${fileId}`}
          alt={name}
          className={`h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-80 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </>
  );
}
