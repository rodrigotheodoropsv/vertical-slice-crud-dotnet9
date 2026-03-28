import type { OrderItem } from '../types';
import { formatBRL } from '../utils/productMapper';
import { Trash2, ShoppingCart } from 'lucide-react';

interface Props {
  items: OrderItem[];
  onRemove: (productId: string) => void;
  onChangeQty: (productId: string, qty: number) => void;
}

export default function OrderCart({ items, onRemove, onChangeQty }: Props) {
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
            <th className="px-4 py-3 text-center">Un.</th>
            <th className="px-4 py-3 text-right">Vlr Unit.</th>
            <th className="px-4 py-3 text-center">Qtd</th>
            <th className="px-4 py-3 text-right">Subtotal</th>
            <th className="px-4 py-3 text-center">–</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {items.map((item) => (
            <tr key={item.product.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{item.product.nome}</div>
                <div className="text-xs text-gray-400 font-mono">{item.product.id}</div>
              </td>
              <td className="px-4 py-3 text-center text-gray-500">{item.product.unidade}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatBRL(item.product.precoUnitario)}</td>
              <td className="px-4 py-3 text-center">
                <input
                  type="number"
                  min={1}
                  max={item.product.estoque}
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={item.quantidade}
                  onChange={(e) => onChangeQty(item.product.id, Number(e.target.value))}
                />
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-800">
                {formatBRL(item.subtotal)}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onRemove(item.product.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-semibold">
            <td colSpan={4} className="px-4 py-3 text-right text-gray-700">
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
