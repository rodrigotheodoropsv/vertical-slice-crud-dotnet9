import { ClipboardList } from 'lucide-react';

interface Props {
  vendedor: string;
  condicaoPagamento: string;
  prazoEntrega: string;
  observacoes: string;
  onChange: (field: string, value: string) => void;
}

const PAYMENT_OPTIONS = [
  'À vista',
  'Boleto 30 dias',
  'Boleto 30/60 dias',
  'Boleto 30/60/90 dias',
  'Cartão de crédito à vista',
  'Cartão de crédito 3x sem juros',
  'Pix',
  'Transferência bancária',
];

const DELIVERY_OPTIONS = [
  'Imediato',
  '1-3 dias úteis',
  '5 dias úteis',
  '7 dias úteis',
  '10 dias úteis',
  '15 dias úteis',
  '30 dias',
  'A combinar',
];

function Select({
  label,
  options,
  value,
  onChange,
  required,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Selecione…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function OrderDetails({ vendedor, condicaoPagamento, prazoEntrega, observacoes, onChange }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList className="h-5 w-5 text-blue-700" />
        <h3 className="font-semibold text-gray-800">Detalhes do Pedido</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Vendedor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Nome do vendedor"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={vendedor}
            onChange={(e) => onChange('vendedor', e.target.value)}
          />
        </div>

        <Select
          label="Condição de Pagamento"
          required
          options={PAYMENT_OPTIONS}
          value={condicaoPagamento}
          onChange={(v) => onChange('condicaoPagamento', v)}
        />

        <Select
          label="Prazo de Entrega"
          required
          options={DELIVERY_OPTIONS}
          value={prazoEntrega}
          onChange={(v) => onChange('prazoEntrega', v)}
        />

        <div className="sm:col-span-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Observações</label>
          <textarea
            rows={3}
            placeholder="Instruções especiais de entrega, referência de produto, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={observacoes}
            onChange={(e) => onChange('observacoes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
