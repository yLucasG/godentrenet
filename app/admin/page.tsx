import { getAdminStats } from "@/actions/admin";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const stats = await getAdminStats();
  return (
    <main className="min-h-screen bg-gray-950">
      <AdminClient {...stats} />
    </main>
  );
}
