import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/actions/store";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  return (
    <main className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-700 text-white py-6 px-4 text-center shadow-lg">
        <p className="text-amber-200 text-sm uppercase tracking-widest mb-1">Bem-vindo à</p>
        <h1 className="text-4xl font-bold">{store.name}</h1>
        <p className="text-amber-200 text-sm mt-2">Pães fresquinhos todos os dias 🍞</p>
      </header>

      {/* Produtos em destaque */}
      <section className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-amber-800 mb-6 text-center">Nossos Destaques</h2>

        <div className="grid grid-cols-2 gap-4">
          {[
            { nome: "Pão Francês", preco: "R$ 0,80", emoji: "🥖" },
            { nome: "Bolo de Cenoura", preco: "R$ 18,00", emoji: "🎂" },
            { nome: "Croissant", preco: "R$ 6,50", emoji: "🥐" },
            { nome: "Pão de Queijo", preco: "R$ 4,00", emoji: "🧀" },
          ].map((item) => (
            <div
              key={item.nome}
              className="bg-white rounded-2xl p-4 shadow text-center border border-amber-100"
            >
              <div className="text-4xl mb-2">{item.emoji}</div>
              <p className="font-semibold text-gray-800 text-sm">{item.nome}</p>
              <p className="text-amber-700 font-bold text-sm mt-1">{item.preco}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="max-w-2xl mx-auto px-4 pb-12 text-center">
        <div className="bg-white rounded-2xl p-6 shadow border border-amber-100">
          <p className="text-gray-600 text-sm mb-4">
            Faça seu pedido ou tire dúvidas direto pelo WhatsApp!
          </p>
          <a
            href="https://wa.me/"
            className="inline-block bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3 rounded-full text-sm transition-colors shadow"
          >
            💬 Falar no WhatsApp
          </a>
        </div>
      </section>

      <footer className="text-center text-amber-400 text-xs pb-6">
        Powered by GODENTRENET
      </footer>
    </main>
  );
}
