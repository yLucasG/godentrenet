import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await prisma.store.findFirst({
    where: { evolutionInstanceName: slug },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!store) notFound();

  const whatsappUrl = store.phoneNumber
    ? `https://wa.me/${store.phoneNumber.replace(/\D/g, "")}?text=Ol%C3%A1%2C+quero+fazer+um+pedido`
    : null;

  return (
    <main className="min-h-screen bg-amber-50">
      <header className="bg-amber-700 text-white py-6 px-4 text-center shadow-lg">
        <p className="text-amber-200 text-sm uppercase tracking-widest mb-1">Bem-vindo à</p>
        <h1 className="text-4xl font-bold">{store.name}</h1>
      </header>

      <section className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-amber-800 mb-6 text-center">Nossos Produtos</h2>

        {store.products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🛍️</p>
            <p className="text-amber-800 font-semibold text-lg">Em breve!</p>
            <p className="text-amber-600 text-sm mt-2">Nossos produtos serão divulgados em breve.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 shadow text-center border border-amber-100"
              >
                <div className="text-4xl mb-2">{product.emoji}</div>
                <p className="font-semibold text-gray-800 text-sm">{product.name}</p>
                <p className="text-amber-700 font-bold text-sm mt-1">
                  {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-12 text-center">
        <div className="bg-white rounded-2xl p-6 shadow border border-amber-100">
          <p className="text-gray-600 text-sm mb-4">
            Faça seu pedido ou tire dúvidas direto pelo WhatsApp!
          </p>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-full text-sm transition-colors shadow"
            >
              💬 Falar no WhatsApp
            </a>
          ) : (
            <p className="text-gray-400 text-sm italic">WhatsApp em breve disponível.</p>
          )}
        </div>
      </section>

      <footer className="text-center text-amber-400 text-xs pb-6">
        Powered by GODENTRENET
      </footer>
    </main>
  );
}
