import type { FieldMapping, OrderItem } from '../types';
import { formatBRL, getNumber } from '../utils/productMapper';
import { Trash2, ShoppingCart } from 'lucide-react';

interface Props {
  items: OrderItem[];
  fieldMapping: FieldMapping;
  onRemove: (rowId: string) => void;
  onChangeQty: (rowId: string, qty: number) => void;
}

export default function OrderCart({ items, fieldMapping, onRemove, onChangeQty }: Props) {
  const { idCol, nomeCol, precoCol, estoqueCol } = fieldMapping;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <ShoppingCart className="h-10 w-10" />
        <p className="font-medium text-sm">Nenhum item adicionado ainda</p>
        <p className="text-xs">Selecione produtos no catálogo acima</p>
      </div>
    );
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Produto</th>
            <th className="px-4 py-3 text-right">Vlr Unit.</th>
            <th className="px-4 py-3 text-center">Qtd</th>
            <th className="px-4 py-3 text-right">Subtotal</th>
            <th className="px-4 py-3 text-center">–</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item) => {
            const id = String(item.row[idCol] ?? '');
            const nome = String(item.row[nomeCol] ?? '');
            const price = getNumber(item.row, precoCol);
            const stock = getNumber(item.row, estoqueCol);
            return (
              <tr key={id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{nome}</div>
                  <div className="text-xs text-gray-400 font-mono">{id}</div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{formatBRL(price)}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min={1}
                    max={stock || undefined}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.quantidade}
                    onChange={(e) => onChangeQty(id, Number(e.target.value))}
                  />
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  {formatBRL(item.subtotal)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onRemove(id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-semibold">
            <td colSpan={3} className="px-4 py-3 text-right text-gray-700">
              TOTAL DO PEDIDO
            </td>
            <td className="px-4 py-3 text-right text-xl text-blue-700">
              {formatBRL(total)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

