import type { BrandingConfig, Order, SmtpConfig } from '../types';
import { formatBRL } from './productMapper';

const EMAIL_LOGO_CID = 'company-logo';

/** Build the plain-text subject line following the real template. */
export function buildEmailSubject(order: Order): string {
  const cod = order.cliente.codCliente ?? '';
  return `PEDIDO DO CLIENTE ${order.cliente.razaoSocial.toUpperCase()}${cod ? ` - CÓDIGO: ${cod}` : ''} ( NOTA IMPORTANTE: ATENÇÃO PARA AS OBSERVAÇÕES CONSTANTES NO CORPO DESTE E-MAIL )`;
}

/** Build the plain-text body matching the real email template. */
export function buildEmailBody(order: Order, smtp?: SmtpConfig): string {
  const { idCol, nomeCol } = order.fieldMapping;
  const itemLines = order.itens
    .map(
      (item, i) =>
        `  ${i + 1}. [${String(item.row[idCol] ?? '')}] ${String(item.row[nomeCol] ?? '')} — ` +
        `${item.quantidade} × ${formatBRL(item.unitPrice)} = ${formatBRL(item.subtotal)}`,
    )
    .join('\n');

  const nome = smtp?.fromName || 'Claudio Theodoro';
  const cargo = smtp?.fromCargo || 'Assistente Comercial';
  const cel = smtp?.fromCelular || '(11)99619-9894';

  return `Prezado(a),



Segue anexo arquivo contendo pedido do cliente mencionado acima.



" FAVOR ATENTAR PARA TODAS AS OBSERVAÇÕES CONSTANTES NO PEDIDO QUE ESTÁ SENDO ENVIADO E POR GENTILEZA NOS DAR RETORNO DE RECEBIMENTO DESTE PEDIDO ".



Quaisquer dúvidas, encontro-me à disposição.


Atenciosamente,


${nome.toUpperCase()}
${cargo.toUpperCase()}
CEL: ${cel}

──────────────────────────────────────────
INFORMAÇÕES DO PEDIDO (ref. interna)
──────────────────────────────────────────
Pedido Nº  : ${order.numero}
Data       : ${order.data} às ${order.hora}
Cliente    : ${order.cliente.razaoSocial}${order.cliente.codCliente ? ` (Cód. ${order.cliente.codCliente})` : ''}
CNPJ       : ${order.cliente.cnpj}
Vendedor   : ${order.vendedor}

ITENS:
${itemLines}

TOTAL DOS PRODUTOS : ${formatBRL(order.totalProdutos)}
TOTAL IPI (+)      : ${formatBRL(order.totalComImpostos - order.totalProdutos)}
TOTAL              : ${formatBRL(order.totalComImpostos)}

Cond. Pagamento    : ${order.condicaoPagamento}
Prazo de Entrega   : ${order.prazoEntrega}
Frete              : ${order.frete || 'CIF - Entrega pelo Carro da Própria Lubefer'}${order.observacoes ? `\nObservações        : ${order.observacoes}` : ''}
`.trim();
}

/** Build an HTML email body matching the visual model. */
export function buildEmailHtml(order: Order, branding: BrandingConfig, smtp?: SmtpConfig): string {
  const { idCol, nomeCol } = order.fieldMapping;

  const nome = smtp?.fromName || 'Claudio Theodoro';
  const cargo = smtp?.fromCargo || 'Assistente Comercial';
  const cel = smtp?.fromCelular || '(11)99619-9894';

  const rows = order.itens
    .map(
      (item, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:13px">${String(item.row[idCol] ?? '')}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:13px">${String(item.row[nomeCol] ?? '')}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:13px;text-align:center">${item.quantidade}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:13px;text-align:right">${formatBRL(item.unitPrice)}</td>
      <td style="padding:7px 10px;border:1px solid #e5e7eb;font-size:13px;text-align:right;font-weight:600">${formatBRL(item.subtotal)}</td>
    </tr>`,
    )
    .join('');

  const ipiTotal = order.totalComImpostos - order.totalProdutos;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Pedido ${order.numero}</title></head>
<body style="font-family:Arial,sans-serif;color:#111827;max-width:680px;margin:auto;padding:24px;background:#f3f4f6">

  <!-- Header com logo -->
  <div style="background:#ffffff;border-radius:8px;padding:18px 24px;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between">
    <img src="cid:${EMAIL_LOGO_CID}" alt="${branding.logoAlt}" onerror="this.style.display='none'" style="height:40px;max-width:160px;object-fit:contain" />
    <span style="font-size:13px;color:#6b7280">${branding.companyName}</span>
  </div>

  <!-- Corpo principal -->
  <div style="background:#ffffff;border-radius:8px;padding:28px 32px;margin-bottom:4px">

    <p style="margin:0 0 24px;font-size:15px"><strong>Prezado(a),</strong></p>

    <p style="margin:0 0 24px;font-size:15px">
      Segue anexo arquivo contendo pedido do cliente mencionado acima.
    </p>

    <!-- Destaque vermelho/azul igual ao modelo -->
    <div style="margin:0 0 28px;font-size:15px;font-weight:bold;line-height:1.6">
      "<span style="color:#cc0000;text-decoration:underline">FAVOR ATENTAR PARA TODAS AS OBSERVAÇÕES CONSTANTES NO PEDIDO QUE ESTÁ SENDO ENVIADO</span>
      <span style="font-weight:bold"> E </span>
      <span style="color:#0000cc;text-decoration:underline">POR GENTILEZA NOS DAR RETORNO DE RECEBIMENTO DESTE PEDIDO</span>".
    </div>

    <p style="margin:0 0 32px;font-size:15px">
      Quaisquer dúvidas, encontro-me à disposição.
    </p>

    <!-- Assinatura -->
    <p style="margin:0 0 6px;font-size:15px">Atenciosamente,</p>
    <br/>
    <p style="margin:0;font-size:15px;font-weight:bold;line-height:1.8">
      ${nome.toUpperCase()}<br/>
      ${cargo.toUpperCase()}<br/>CEL: ${cel}
    </p>
  </div>

  <!-- Separador - detalhes do pedido (ref interna) -->
  <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px">
    <p style="margin:0 0 12px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">Informações do pedido (referência interna)</p>

    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:16px">
      <tr><td style="width:140px;color:#6b7280;padding:3px 0">Pedido Nº</td><td><strong>${order.numero}</strong></td></tr>
      <tr><td style="color:#6b7280;padding:3px 0">Data</td><td>${order.data} às ${order.hora}</td></tr>
      <tr><td style="color:#6b7280;padding:3px 0">Cliente</td><td>${order.cliente.razaoSocial}${order.cliente.codCliente ? ` <span style="color:#6b7280">(Cód. ${order.cliente.codCliente})</span>` : ''}</td></tr>
      <tr><td style="color:#6b7280;padding:3px 0">CNPJ</td><td>${order.cliente.cnpj}</td></tr>
      <tr><td style="color:#6b7280;padding:3px 0">Vendedor</td><td>${order.vendedor}</td></tr>
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px">
      <thead>
        <tr style="background:#374151;color:#fff">
          <th style="padding:8px 10px;text-align:left;border:1px solid #4b5563">Cód.</th>
          <th style="padding:8px 10px;text-align:left;border:1px solid #4b5563">Produto</th>
          <th style="padding:8px 10px;text-align:center;border:1px solid #4b5563">Qtd</th>
          <th style="padding:8px 10px;text-align:right;border:1px solid #4b5563">Vlr Unit.</th>
          <th style="padding:8px 10px;text-align:right;border:1px solid #4b5563">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f0f9ff">
          <td colspan="4" style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:600">Total dos Produtos</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:700">${formatBRL(order.totalProdutos)}</td>
        </tr>
        ${ipiTotal > 0 ? `<tr style="background:#f0f9ff">
          <td colspan="4" style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:600">Total IPI (+)</td>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;text-align:right;font-weight:700">${formatBRL(ipiTotal)}</td>
        </tr>` : ''}
        <tr style="background:#1e3a8a">
          <td colspan="4" style="padding:8px 10px;border:1px solid #1e3a8a;text-align:right;font-weight:600;color:#fff">TOTAL</td>
          <td style="padding:8px 10px;border:1px solid #1e3a8a;text-align:right;font-weight:700;font-size:15px;color:#fff">${formatBRL(order.totalComImpostos)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="display:flex;gap:24px;font-size:13px;color:#374151;flex-wrap:wrap">
      <div><span style="color:#9ca3af">Cond. Pagamento:</span> <strong>${order.condicaoPagamento}</strong></div>
      <div><span style="color:#9ca3af">Prazo de Entrega:</span> <strong>${order.prazoEntrega}</strong></div>
      <div><span style="color:#9ca3af">Frete:</span> <strong>${order.frete || 'CIF - Entrega pelo Carro da Própria Lubefer'}</strong></div>
    </div>

    ${order.observacoes ? `<div style="margin-top:12px;padding:10px 14px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px"><strong>Observações:</strong> ${order.observacoes}</div>` : ''}
  </div>

</body>
</html>
  `.trim();
}
