export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import DesignEditor from "@/components/fotografia/DesignEditor";

const TZ = "America/Argentina/Buenos_Aires";

export default async function EditorPage() {
  const { userId } = await requireSession();

  const sessions = await db.session.findMany({
    where: { client: { userId }, driveUrl: { not: null } },
    include: { client: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 20,
  });

  const sessionOptions = sessions.map((s) => ({
    id: s.id,
    clientName: s.client.name,
    date: s.date.toISOString(),
    driveUrl: s.driveUrl,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Editor de Stories</h1>
        <p className="mt-1 text-neutral-400">
          Describí lo que necesitás y Claude te genera un diseño para Instagram
        </p>
      </div>

      <DesignEditor sessions={sessionOptions} />
    </div>
  );
}
