import { useRef } from 'react';
import type { Order } from '../types';
import { formatBRL } from '../utils/productMapper';
import { Printer, X } from 'lucide-react';

interface Props {
  order: Order;
  onClose: () => void;
}

export default function OrderNote({ order, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html lang="pt-BR"><head>
        <meta charset="UTF-8">
        <title>Pedido ${order.numero}</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:Arial,sans-serif;font-size:13px;color:#111827;padding:32px}
          h1{font-size:20px;margin-bottom:4px}
          h2{font-size:14px;margin:20px 0 8px;color:#1e40af;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
          table{width:100%;border-collapse:collapse;margin-bottom:12px}
          th,td{border:1px solid #e5e7eb;padding:7px 10px;font-size:12px}
          th{background:#f3f4f6;font-weight:600;text-align:left}
          .right{text-align:right} .center{text-align:center}
          .total-row td{background:#eff6ff;font-weight:700}
          .badge{background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:9999px;font-size:11px}
          .footer{margin-top:32px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}
          .obs{background:#fffbeb;border-left:4px solid #f59e0b;padding:8px 12px;margin-top:12px;font-size:12px}
          @media print{body{padding:16px}}
        </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800">Nota do Pedido</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 transition">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6" ref={printRef}>
          {/* Order header */}
          <div className="mb-6 rounded-lg bg-blue-700 px-6 py-5 text-white">
            <h1 className="text-xl font-bold">Pedido de Vendas Nº {order.numero}</h1>
            <p className="mt-1 text-sm opacity-85">
              Emitido em {order.data} às {order.hora} — Vendedor: {order.vendedor}
            </p>
          </div>

          {/* Client */}
          <h2 className="text-sm font-bold text-blue-800 border-b border-gray-200 pb-1 mb-3">Dados do Cliente</h2>
          <table className="w-full text-sm mb-6">
            <tbody>
              {[
                ['Razão Social', order.cliente.razaoSocial],
                ['CNPJ', order.cliente.cnpj],
                ['E-mail', order.cliente.email],
                ['Telefone', order.cliente.telefone],
                ['Endereço', order.cliente.endereco],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-500 w-36">{k}</td>
                  <td className="py-2 text-gray-800">{v || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Items */}
          <h2 className="text-sm font-bold text-blue-800 border-b border-gray-200 pb-1 mb-3">Itens do Pedido</h2>
          <table className="w-full text-sm mb-4">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 border border-gray-200 text-left">Cód.</th>
                <th className="px-3 py-2 border border-gray-200 text-left">Produto</th>
                <th className="px-3 py-2 border border-gray-200 text-center">Un.</th>
                <th className="px-3 py-2 border border-gray-200 text-center">Qtd</th>
                <th className="px-3 py-2 border border-gray-200 text-right">Vlr Unit.</th>
                <th className="px-3 py-2 border border-gray-200 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.itens.map((item, i) => (
                <tr key={item.product.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 border border-gray-200 font-mono text-xs text-gray-500">{item.product.id}</td>
                  <td className="px-3 py-2 border border-gray-200 font-medium text-gray-800">{item.product.nome}</td>
                  <td className="px-3 py-2 border border-gray-200 text-center text-gray-500">{item.product.unidade}</td>
                  <td className="px-3 py-2 border border-gray-200 text-center">{item.quantidade}</td>
                  <td className="px-3 py-2 border border-gray-200 text-right text-gray-600">{formatBRL(item.product.precoUnitario)}</td>
                  <td className="px-3 py-2 border border-gray-200 text-right font-semibold text-gray-800">{formatBRL(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 font-bold">
                <td colSpan={5} className="px-3 py-3 border border-gray-200 text-right text-gray-700">TOTAL DO PEDIDO</td>
                <td className="px-3 py-3 border border-gray-200 text-right text-blue-700 text-lg">{formatBRL(order.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Conditions */}
          <div className="flex flex-wrap gap-4 text-sm mt-4">
            <div>
              <span className="text-gray-500">Condição de Pagamento: </span>
              <strong>{order.condicaoPagamento}</strong>
            </div>
            <div>
              <span className="text-gray-500">Prazo de Entrega: </span>
              <strong>{order.prazoEntrega}</strong>
            </div>
          </div>

          {order.observacoes && (
            <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm">
              <strong>Observações:</strong> {order.observacoes}
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-400 text-center">
            Documento gerado eletronicamente — {order.data} às {order.hora}
          </div>
        </div>
      </div>
    </div>
  );
}
