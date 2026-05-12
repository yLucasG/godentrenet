"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getBotConfig() {
  const session = await auth();
  if (!session?.user.storeId) throw new Error("Não autenticado.");
  return prisma.botConfig.findUnique({ where: { storeId: session.user.storeId } });
}

export async function saveBotConfig(data: {
  welcomeMessage: string;
  requireKeyword: boolean;
  keyword: string;
}) {
  const session = await auth();
  if (!session?.user.storeId) throw new Error("Não autenticado.");
  await prisma.botConfig.upsert({
    where: { storeId: session.user.storeId },
    update: data,
    create: { storeId: session.user.storeId, ...data },
  });
  revalidatePath("/dashboard/bot");
}
