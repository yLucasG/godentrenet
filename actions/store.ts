"use server";

import { prisma } from "@/lib/prisma";
import { createInstance } from "@/actions/evolution";

export async function createStore(name: string): Promise<{
  success: true;
  storeId: string;
  instanceName: string;
}> {
  console.log(`[STORE ACTION] criando loja: name="${name}"`);

  // Deriva o nome da instância a partir do nome da loja (sem espaços, lowercase)
  const instanceName = name.trim().toLowerCase().replace(/\s+/g, "-");

  const store = await prisma.store.create({
    data: {
      name: name.trim(),
      evolutionInstanceName: instanceName,
      evolutionConnectionState: "DISCONNECTED",
    },
  });

  console.log(`[STORE ACTION] loja criada no banco: id=${store.id}`);

  await createInstance(store.id, instanceName);

  console.log(
    `[STORE ACTION] instância Evolution criada: instanceName="${instanceName}"`
  );

  return { success: true, storeId: store.id, instanceName };
}
