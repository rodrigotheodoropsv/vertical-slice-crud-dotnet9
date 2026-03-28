import type { Order } from '../types';
import { formatBRL } from './productMapper';

/** Build the full plain-text body for the order email. */
export function buildEmailBody(order: Order): string {
  const itemLines = order.itens
    .map(
      (item, i) =>
        `  ${i + 1}. ${item.product.nome} (${item.product.id}) — ` +
        `${item.quantidade} ${item.product.unidade} × ${formatBRL(item.product.precoUnitario)} = ${formatBRL(item.subtotal)}`,
    )
    .join('\n');

  return `
Prezado(a) ${order.cliente.razaoSocial},

Segue abaixo o pedido de vendas emitido pela nossa equipe comercial.

══════════════════════════════════════════
  PEDIDO DE VENDAS Nº ${order.numero}
  Data: ${order.data}   Hora: ${order.hora}
  Vendedor: ${order.vendedor}
══════════════════════════════════════════

📋 DADOS DO CLIENTE
  Razão Social : ${order.cliente.razaoSocial}
  CNPJ         : ${order.cliente.cnpj}
  E-mail       : ${order.cliente.email}
  Telefone     : ${order.cliente.telefone}
  Endereço     : ${order.cliente.endereco}

📦 ITENS DO PEDIDO
${itemLines}

──────────────────────────────────────────
  TOTAL DO PEDIDO: ${formatBRL(order.total)}
──────────────────────────────────────────

💳 Condição de Pagamento : ${order.condicaoPagamento}
🚚 Prazo de Entrega       : ${order.prazoEntrega}
${order.observacoes ? `\n📝 Observações: ${order.observacoes}` : ''}

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
${order.vendedor}
  `.trim();
}

/** Build an HTML email body for richer clients. */
export function buildEmailHtml(order: Order): string {
  const rows = order.itens
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:8px 12px;border:1px solid #e5e7eb">${item.product.id}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb">${item.product.nome}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${item.quantidade}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${item.product.unidade}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right">${formatBRL(item.product.precoUnitario)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:600">${formatBRL(item.subtotal)}</td>
    </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Pedido ${order.numero}</title></head>
<body style="font-family:Arial,sans-serif;color:#111827;max-width:720px;margin:auto;padding:24px">
  <div style="background:#1e40af;color:#fff;padding:20px 28px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">Pedido de Vendas Nº ${order.numero}</h1>
    <p style="margin:4px 0 0;opacity:.85;font-size:13px">Emitido em ${order.data} às ${order.hora} por ${order.vendedor}</p>
  </div>

  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 28px;border-radius:0 0 8px 8px">
    <h2 style="font-size:15px;color:#1e40af;margin-top:0">Dados do Cliente</h2>
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="width:140px;color:#6b7280;padding:4px 0">Razão Social</td><td><strong>${order.cliente.razaoSocial}</strong></td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">CNPJ</td><td>${order.cliente.cnpj}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">E-mail</td><td>${order.cliente.email}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Telefone</td><td>${order.cliente.telefone}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0">Endereço</td><td>${order.cliente.endereco}</td></tr>
    </table>

    <h2 style="font-size:15px;color:#1e40af;margin-top:24px">Itens do Pedido</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#1e40af;color:#fff">
          <th style="padding:10px 12px;border:1px solid #1e3a8a;text-align:left">Cód.</th>
          <th style="padding:10px 12px;border:1px solid #1e3a8a;text-align:left">Produto</th>
          <th style="padding:10px 12px;border:1px solid #1e3a8a;text-align:center">Qtd</th>
          <th style="padding:10px 12px;border:1px solid #1e3a8a;text-align:center">Un</th>
          <th style="padding:10px 12px;border:1px solid #1e3a8a;text-align:right">Vlr Unit.</th>
          <th style="padding:10px 12px;border:1px solid #1e3a8a;text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f0f9ff">
          <td colspan="5" style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:600">TOTAL</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-weight:700;font-size:16px;color:#1e40af">${formatBRL(order.total)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top:20px;display:flex;gap:32px;font-size:14px">
      <div><span style="color:#6b7280">Condição de Pagamento:</span> <strong>${order.condicaoPagamento}</strong></div>
      <div><span style="color:#6b7280">Prazo de Entrega:</span> <strong>${order.prazoEntrega}</strong></div>
    </div>

    ${order.observacoes ? `<div style="margin-top:16px;padding:12px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;font-size:14px"><strong>Observações:</strong> ${order.observacoes}</div>` : ''}
  </div>
</body>
</html>
  `.trim();
}
