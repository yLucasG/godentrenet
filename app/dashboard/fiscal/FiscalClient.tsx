"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2, Building2, FileText, ShieldCheck, Info } from "lucide-react";
import { updateStoreFiscal } from "@/actions/fiscal";

const TAX_REGIMES = [
  "Simples Nacional",
  "Simples Nacional - Excesso",
  "MEI",
  "Lucro Presumido",
  "Lucro Real",
];

function formatCnpj(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

type Props = {
  initial: { name: string; cnpj: string; stateRegistration: string; taxRegime: string };
};

export function FiscalClient({ initial }: Props) {
  const [cnpj, setCnpj] = useState(initial.cnpj);
  const [stateReg, setStateReg] = useState(initial.stateRegistration);
  const [taxRegime, setTaxRegime] = useState(initial.taxRegime || "Simples Nacional");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError("");
    startTransition(async () => {
      try {
        await updateStoreFiscal({
          cnpj: cnpj.replace(/\D/g, ""),
          stateRegistration: stateReg.trim(),
          taxRegime,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch {
        setError("Erro ao salvar. Tente novamente.");
      }
    });
  }

  const isComplete = cnpj.replace(/\D/g, "").length === 14 && stateReg.trim().length > 0;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-white font-bold text-xl">Configurações Fiscais</h1>
        <p className="text-gray-500 text-sm mt-1">
          Dados necessários para emissão de NFC-e e integração com APIs fiscais.
        </p>
      </div>

      {/* Status card */}
      <div className={`rounded-xl border px-4 py-3 mb-6 flex items-center gap-3 ${
        isComplete
          ? "bg-amber-500/10 border-amber-500/25"
          : "bg-yellow-500/10 border-yellow-500/25"
      }`}>
        {isComplete ? (
          <ShieldCheck size={18} className="text-amber-400 flex-shrink-0" />
        ) : (
          <Info size={18} className="text-yellow-400 flex-shrink-0" />
        )}
        <p className={`text-sm ${isComplete ? "text-amber-300" : "text-yellow-300"}`}>
          {isComplete
            ? "Configuração fiscal completa. Pronto para emitir NFC-e."
            : "Preencha CNPJ e Inscrição Estadual para habilitar a emissão de NFC-e."}
        </p>
      </div>

      <div className="space-y-6">
        {/* Empresa */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-gray-500" />
            <h2 className="text-white font-semibold text-sm">Dados da Empresa</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Nome da Loja</label>
              <input
                value={initial.name}
                readOnly
                className="w-full bg-gray-800/50 text-gray-500 rounded-xl px-3 py-2.5 text-sm cursor-not-allowed"
              />
              <p className="text-gray-600 text-[11px] mt-1">Altere o nome em Configurações → Loja.</p>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">CNPJ *</label>
              <input
                value={formatCnpj(cnpj)}
                onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ""))}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5">Inscrição Estadual *</label>
              <input
                value={stateReg}
                onChange={(e) => setStateReg(e.target.value)}
                placeholder="Ex: 123.456.789.112"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Regime */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-gray-500" />
            <h2 className="text-white font-semibold text-sm">Regime Tributário</h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {TAX_REGIMES.map((regime) => (
              <button
                key={regime}
                onClick={() => setTaxRegime(regime)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                  taxRegime === regime
                    ? "border-amber-500 bg-amber-500/10 text-white"
                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                  taxRegime === regime ? "border-amber-500 bg-amber-500" : "border-gray-600"
                }`} />
                {regime}
              </button>
            ))}
          </div>
        </div>

        {/* API Integration info */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className="text-gray-500" />
            <h2 className="text-white font-semibold text-sm">API Emissora (NFC-e)</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            A integração com a API emissora (Focus NFe, Webmania, etc.) será configurada aqui. Por ora o sistema gera o payload JSON para revisão manual.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["Focus NFe", "Webmania"].map(api => (
              <div key={api} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 opacity-60">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <span className="text-gray-500 text-xs font-medium">{api}</span>
                <span className="ml-auto text-[10px] text-gray-600 font-mono">Em breve</span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm transition-all text-gray-950 disabled:opacity-50"
          style={{ background: "#F59E0B" }}
        >
          {isPending ? (
            <><Save size={16} className="animate-pulse" /> Salvando...</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Salvo com sucesso!</>
          ) : (
            <><Save size={16} /> Salvar Configurações</>
          )}
        </button>
      </div>
    </div>
  );
}
