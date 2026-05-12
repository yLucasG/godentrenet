"use client";

import { useState } from "react";
import { adminCreateLojista } from "@/actions/admin";

type Store = {
  id: string;
  name: string;
  evolutionConnectionState: string;
  evolutionInstanceName: string | null;
  createdAt: Date;
  user: { email: string } | null;
  _count: { messages: number };
};

type Props = {
  totalStores: number;
  connectedStores: number;
  totalMessages: number;
  stores: Store[];
};

export function AdminClient({ totalStores, connectedStores, totalMessages, stores }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const result = await adminCreateLojista(name, email, password);
      setSuccess(`Lojista criado! Instância: ${result.instanceName}`);
      setName("");
      setEmail("");
      setPassword("");
      setTimeout(() => { setSuccess(""); setShowModal(false); }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie todos os lojistas da plataforma.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Criar Lojista
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total de Lojas", value: totalStores, color: "text-white" },
          { label: "Lojas Conectadas", value: connectedStores, color: "text-green-400" },
          { label: "Total de Mensagens", value: totalMessages, color: "text-blue-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Stores table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Loja</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Lojista</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Instância</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Status</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Mensagens</th>
              <th className="text-left text-gray-400 font-medium px-4 py-3">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {stores.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  Nenhuma loja cadastrada.
                </td>
              </tr>
            )}
            {stores.map((store) => (
              <tr key={store.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 text-white font-medium">{store.name}</td>
                <td className="px-4 py-3 text-gray-400">{store.user?.email ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{store.evolutionInstanceName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    store.evolutionConnectionState === "open"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-gray-800 text-gray-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${store.evolutionConnectionState === "open" ? "bg-green-400" : "bg-gray-500"}`} />
                    {store.evolutionConnectionState === "open" ? "Conectado" : "Desconectado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{store._count.messages}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(store.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-white font-bold text-lg mb-4">Criar Conta Lojista</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nome da loja</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="Ex: Padaria do João"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="lojista@email.com"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              {success && <p className="text-green-400 text-xs">{success}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(""); }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {creating ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
