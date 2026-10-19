import { cache } from "react";
import { db } from "@/lib/db";

export const getUserWallets = cache((userId: string) =>
  db.wallet.findMany({ where: { userId }, orderBy: { name: "asc" } })
);

export const getUserForeignAccounts = cache((userId: string) =>
  db.foreignAccount.findMany({ where: { userId }, orderBy: { name: "asc" } })
);

export const getUserCategories = cache((userId: string) =>
  db.category.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
);
