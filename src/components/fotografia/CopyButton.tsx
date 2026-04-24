"use client";

import { useState } from "react";
import { LuCopy, LuCheck } from "react-icons/lu";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        copied
          ? "bg-green-500/20 text-green-400"
          : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
      }`}
    >
      {copied ? <LuCheck size={12} /> : <LuCopy size={12} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
