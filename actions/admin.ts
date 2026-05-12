"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hash } from "bcryptjs";
import { createInstance } from "@/actions/evolution";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Acesso negado.");
  return session;
}

export async function getAdminStats() {
  await requireAdmin();

  const [totalStores, connectedStores, totalMessages, stores] = await Promise.all([
    prisma.store.count(),
    prisma.store.count({ where: { evolutionConnectionState: "open" } }),
    prisma.message.count(),
    prisma.store.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  return { totalStores, connectedStores, totalMessages, stores };
}

export async function adminCreateLojista(name: string, email: string, password: string) {
  await requireAdmin();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email já cadastrado.");

  const hashedPassword = await hash(password, 10);
  const instanceName = name.trim().toLowerCase().replace(/\s+/g, "-");

  const store = await prisma.store.create({
    data: {
      name: name.trim(),
      evolutionInstanceName: instanceName,
      evolutionConnectionState: "DISCONNECTED",
      user: {
        create: { email, password: hashedPassword },
      },
    },
    include: { user: true },
  });

  await createInstance(store.id, instanceName);

  revalidatePath("/admin");
  return { success: true, storeId: store.id, instanceName };
}
