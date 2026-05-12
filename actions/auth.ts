"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createInstance } from "@/actions/evolution";

export async function registerUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email já cadastrado.");

  const hashed = await hash(password, 10);

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  const instanceName = `${slug}-${Date.now().toString(36)}`;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      store: {
        create: {
          name,
          evolutionInstanceName: instanceName,
        },
      },
    },
    include: { store: true },
  });

  if (user.store) {
    try {
      await createInstance(user.store.id, instanceName);
    } catch {
      // Não bloqueia o cadastro se Evolution falhar
    }
  }

  return { ok: true };
}

export async function createAdminUser(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email já cadastrado.");
  const hashed = await hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed, isAdmin: true } });
  return { ok: true };
}
