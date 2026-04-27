import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function SetupPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({ where: { id: session.userId } });

  if (user?.onboardingCompleted) redirect("/finanzas");

  return <OnboardingWizard username={session.displayName ?? session.username} />;
}
