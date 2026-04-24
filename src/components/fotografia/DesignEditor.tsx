"use client";

import { useState, useRef, useCallback } from "react";
import { LuWand, LuLoader, LuMaximize2, LuDownload, LuX, LuImage, LuRefreshCw, LuFolder, LuChevronRight, LuHouse } from "react-icons/lu";
import type { DriveItem } from "@/lib/google-drive";

interface DesignEditorProps {
  sessions?: unknown[];
}

const QUICK_PROMPTS = [
  "Reminder de disponibilidad para este finde — fútbol y básquet",
  "Story anunciando fotos nuevas de un partido de fútbol amateur",
  "Historia para media day de básquet, estilo cinematográfico",
  "Story de entrega de fotos lista — 'tus fotos ya están disponibles'",
];

type SelectedPhoto = { id: string; name: string };

type BreadcrumbEntry = { id: string; name: string };

export default function DesignEditor({ sessions: _ }: DesignEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // Drive browser
  const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([{ id: "root", name: "Mi unidad" }]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const PREVIEW_WIDTH = 360;
  const PREVIEW_HEIGHT = 640;
  const SCALE = PREVIEW_WIDTH / 1080;

  const browseDrive = useCallback(async (folderId: string, folderName: string, isNavBack = false) => {
    setLoadingDrive(true);
    try {
      const res = await fetch(`/api/fotografia/drive/browse/${folderId}`);
      const items: DriveItem[] = await res.json();
      setDriveItems(items);

      if (!isNavBack) {
        setBreadcrumb((prev) => {
          const idx = prev.findIndex((b) => b.id === folderId);
          if (idx !== -1) return prev.slice(0, idx + 1);
          return [...prev, { id: folderId, name: folderName }];
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDrive(false);
    }
  }, []);

  function openPhotoPicker() {
    setShowPhotoPicker(true);
    setBreadcrumb([{ id: "root", name: "Mi unidad" }]);
    browseDrive("root", "Mi unidad");
  }

  const generate = useCallback(async (overridePrompt?: string, keepPrevious = false) => {
    const text = overridePrompt ?? prompt;
    if (!text.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/fotografia/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          photoUrl: selectedPhoto ? `/api/fotografia/drive/thumbnail/${selectedPhoto.id}` : undefined,
          previousHtml: keepPrevious ? html : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) throw new Error(data.error ?? "Error al generar");

      setHtml(data.html);
    } catch (err) {
      console.error("[Editor]", err);
      alert(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedPhoto, html]);

  function downloadHtml() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openFullscreen() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

      {/* ── Panel izquierdo ── */}
      <div className="flex flex-col gap-4 lg:w-96 lg:flex-shrink-0">

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Ideas rápidas</p>
          <div className="flex flex-col gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => setPrompt(q)}
                className="rounded-lg bg-neutral-800 px-3 py-2 text-left text-xs text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Tu prompt</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describí el diseño que necesitás..."
            className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none ring-1 ring-neutral-700 focus:ring-blue-500 resize-none"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
          />
          <p className="mt-1 text-xs text-neutral-600">⌘+Enter para generar</p>
        </div>

        {/* Foto de Drive */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Foto de Drive</p>
            {selectedPhoto && (
              <button onClick={() => setSelectedPhoto(null)} className="text-xs text-neutral-600 hover:text-neutral-400">
                Quitar
              </button>
            )}
          </div>

          {selectedPhoto ? (
            <div className="relative overflow-hidden rounded-xl bg-neutral-800">
              <img
                src={`/api/fotografia/drive/thumbnail/${selectedPhoto.id}`}
                alt={selectedPhoto.name}
                className="h-32 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="truncate text-xs text-white">{selectedPhoto.name}</p>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <LuX size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={openPhotoPicker}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-700 py-4 text-sm text-neutral-500 hover:border-neutral-600 hover:text-neutral-400 transition-colors"
            >
              <LuImage size={15} />
              Elegir foto de Drive
            </button>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => generate()}
            disabled={loading || !prompt.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <LuLoader size={15} className="animate-spin" /> : <LuWand size={15} />}
            {loading ? "Generando..." : "Generar Story"}
          </button>

          {html && (
            <button
              onClick={() => generate(prompt, true)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-neutral-700 py-2.5 text-sm text-neutral-300 hover:bg-neutral-600 disabled:opacity-50 transition-colors"
            >
              <LuRefreshCw size={13} />
              Ajustar diseño actual
            </button>
          )}
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="flex flex-1 flex-col items-center gap-3">
        <div className="flex w-full items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Preview {html ? "(1080×1920)" : ""}
          </p>
          {html && (
            <div className="flex gap-2">
              <button
                onClick={openFullscreen}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600 transition-colors"
              >
                <LuMaximize2 size={12} />
                Ver completo
              </button>
              <button
                onClick={downloadHtml}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-600 transition-colors"
              >
                <LuDownload size={12} />
                Descargar
              </button>
            </div>
          )}
        </div>

        <div
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
          className="relative overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl ring-1 ring-neutral-700"
        >
          {loading && !html && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <LuLoader size={24} className="animate-spin text-blue-400" />
              <p className="text-sm text-neutral-500">Generando tu Story...</p>
            </div>
          )}
          {!html && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <LuWand size={28} className="text-neutral-700" />
              <p className="text-sm text-neutral-600">El preview de tu Story aparece acá</p>
            </div>
          )}
          {html && (
            <div style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, overflow: "hidden" }}>
              <iframe
                ref={iframeRef}
                srcDoc={html}
                style={{
                  width: 1080,
                  height: 1920,
                  border: "none",
                  transform: `scale(${SCALE})`,
                  transformOrigin: "top left",
                  pointerEvents: "none",
                }}
                title="Story preview"
              />
            </div>
          )}
          {loading && html && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <LuLoader size={20} className="animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      {/* ── Drive Browser Modal ── */}
      {showPhotoPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center"
          onClick={() => setShowPhotoPicker(false)}
        >
          <div
            className="flex w-full max-w-lg flex-col rounded-t-2xl bg-neutral-900 sm:rounded-2xl"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
              <p className="font-medium text-white">Google Drive</p>
              <button onClick={() => setShowPhotoPicker(false)} className="text-neutral-500 hover:text-neutral-300">
                <LuX size={18} />
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 overflow-x-auto px-5 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {breadcrumb.map((crumb, i) => (
                <div key={crumb.id} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && <LuChevronRight size={12} className="text-neutral-600" />}
                  <button
                    onClick={() => {
                      setBreadcrumb((prev) => prev.slice(0, i + 1));
                      browseDrive(crumb.id, crumb.name, true);
                    }}
                    className={`text-xs transition-colors ${
                      i === breadcrumb.length - 1
                        ? "text-white font-medium"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {i === 0 ? <LuHouse size={13} /> : crumb.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loadingDrive ? (
                <div className="flex items-center justify-center py-12">
                  <LuLoader size={20} className="animate-spin text-neutral-500" />
                </div>
              ) : driveItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-600">Carpeta vacía</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {driveItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.isFolder) {
                          browseDrive(item.id, item.name);
                        } else {
                          setSelectedPhoto({ id: item.id, name: item.name });
                          setShowPhotoPicker(false);
                        }
                      }}
                      className="group flex flex-col overflow-hidden rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors"
                    >
                      {item.isFolder ? (
                        <div className="flex h-24 items-center justify-center">
                          <LuFolder size={32} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                        </div>
                      ) : (
                        <div className="h-24 overflow-hidden bg-neutral-900">
                          <img
                            src={`/api/fotografia/drive/thumbnail/${item.id}`}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <p className="truncate px-2 pb-2 pt-1.5 text-[11px] text-neutral-400 group-hover:text-neutral-200 text-left">
                        {item.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
