import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">Liford</h1>
        <p className="mt-2 text-neutral-400">Tu gestor personal de finanzas y fotografía</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/finanzas"
          className="flex flex-col items-center gap-2 rounded-xl bg-neutral-800 p-8 transition-colors hover:bg-neutral-700 w-48"
        >
          <span className="text-3xl">💰</span>
          <span className="font-semibold text-white">Finanzas</span>
        </Link>
        <Link
          href="/fotografia"
          className="flex flex-col items-center gap-2 rounded-xl bg-neutral-800 p-8 transition-colors hover:bg-neutral-700 w-48"
        >
          <span className="text-3xl">📷</span>
          <span className="font-semibold text-white">Fotografía</span>
        </Link>
      </div>
    </main>
  );
}
