import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getStoreFiscal } from "@/actions/fiscal";
import { FiscalClient } from "./FiscalClient";

export default async function FiscalPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/login");

  const fiscal = await getStoreFiscal();
  return <FiscalClient initial={fiscal} />;
}
