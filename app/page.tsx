import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-green-400 font-bold text-xl tracking-tight">GODENTRENET</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Login
            </Link>
            <Link
              href="/cadastro"
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-green-900/40 text-green-400 text-xs font-medium px-3 py-1 rounded-full border border-green-800 mb-6">
          Bot de WhatsApp para sua loja
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Venda mais com um bot inteligente no{" "}
          <span className="text-green-400">WhatsApp</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
          Conecte seu WhatsApp, cadastre seus produtos e deixe o bot atender seus clientes automaticamente — 24 horas por dia.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/cadastro"
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors"
          >
            Começar agora — é grátis
          </Link>
          <a
            href="https://wa.me/558788444564?text=Quero+saber+mais+sobre+o+GODENTRENET"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium px-8 py-4 rounded-xl text-base transition-colors"
          >
            💬 Falar com a equipe
          </a>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Cadastre sua loja",
              desc: "Crie sua conta em segundos. Adicione o nome da loja, seus produtos e preços.",
              icon: "🏪",
            },
            {
              step: "2",
              title: "Conecte o WhatsApp",
              desc: "Escaneie o QR Code com seu celular. Pronto — seu número já está ativo.",
              icon: "📱",
            },
            {
              step: "3",
              title: "O bot responde sozinho",
              desc: "Seu cliente manda mensagem e o bot envia o cardápio e o link da loja automaticamente.",
              icon: "🤖",
            },
          ].map((item) => (
            <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
                Passo {item.step}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Tudo que você precisa</h2>
        <p className="text-gray-400 text-center mb-12">Uma plataforma completa para sua loja vender pelo WhatsApp.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "🤖", title: "Bot automático", desc: "Responde clientes 24h sem precisar de você." },
            { icon: "🛍️", title: "Catálogo de produtos", desc: "Cadastre produtos, preços e emojis." },
            { icon: "📊", title: "Dashboard completo", desc: "Acompanhe conversas e métricas em tempo real." },
            { icon: "📱", title: "Seu WhatsApp", desc: "Use o seu número atual, sem trocar nada." },
            { icon: "🔗", title: "Loja pública", desc: "Uma URL bonita para divulgar seu negócio." },
            { icon: "⚙️", title: "Configurações simples", desc: "Mude a mensagem do bot a qualquer hora." },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4 items-start">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-gray-400 text-xs mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Plano único, sem surpresas</h2>
        <p className="text-gray-400 mb-10">Tudo incluso, sem limite de mensagens.</p>
        <div className="bg-gray-900 border border-green-800 rounded-2xl p-8 shadow-2xl shadow-green-900/20">
          <div className="inline-block bg-green-900/40 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-800 mb-4">
            Plano Completo
          </div>
          <div className="text-5xl font-bold text-white mb-1">
            R$ 49<span className="text-2xl text-gray-400">/mês</span>
          </div>
          <p className="text-gray-500 text-sm mb-8">Cancele quando quiser</p>
          <ul className="text-left space-y-3 mb-8">
            {[
              "Bot automático no WhatsApp",
              "Catálogo de produtos ilimitados",
              "Dashboard com métricas",
              "Loja pública com URL própria",
              "Configuração de mensagens",
              "Suporte via WhatsApp",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                <span className="text-green-400 font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <a
            href="https://wa.me/558788444564?text=Quero+contratar+o+GODENTRENET"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-base transition-colors"
          >
            💬 Falar com a gente no WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} GODENTRENET — Todos os direitos reservados.</p>
      </footer>

    </main>
  );
}
