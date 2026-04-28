import { redirect } from "next/navigation";

export default function IngresosPage() {
  redirect("/finanzas/transacciones?tipo=income");
}
