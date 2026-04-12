import type { BrandingConfig, Order, SmtpConfig } from '../types';

const EMAIL_LOGO_CID = 'company-logo';

/** Build the plain-text subject line following the real template. */
export function buildEmailSubject(order: Order): string {
  const cod = order.cliente.codCliente ?? '';
  return `PEDIDO DO CLIENTE ${order.cliente.razaoSocial.toUpperCase()}${cod ? ` - CÓDIGO: ${cod}` : ''} ( NOTA IMPORTANTE: ATENÇÃO PARA AS OBSERVAÇÕES CONSTANTES NO CORPO DESTE E-MAIL )`;
}

/** Strip HTML tags and decode basic entities — used to produce the plain-text fallback. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/** Build the plain-text body matching the real email template. */
export function buildEmailBody(_order: Order, smtp?: SmtpConfig, customMessage?: string): string {
  const nome = smtp?.fromName || 'Claudio Theodoro';
  const cargo = smtp?.fromCargo || 'Assistente Comercial';
  const cel = smtp?.fromCelular || '(11)99619-9894';

  const bodyParagraphs = customMessage?.trim()
    ? customMessage.trim()
    : `Segue anexo arquivo contendo pedido do cliente mencionado acima.\n\n\n\n" FAVOR ATENTAR PARA TODAS AS OBSERVAÇÕES CONSTANTES NO PEDIDO QUE ESTÁ SENDO ENVIADO E POR GENTILEZA NOS DAR RETORNO DE RECEBIMENTO DESTE PEDIDO ".\n\n\n\nQuaisquer dúvidas, encontro-me à disposição.`;

  return `Prezado(a),\n\n\n\n${bodyParagraphs}


Atenciosamente,


${nome.toUpperCase()}
${cargo.toUpperCase()}
CEL: ${cel}`.trim();
}

/** Build an HTML email body matching the visual model. */
export function buildEmailHtml(order: Order, branding: BrandingConfig, smtp?: SmtpConfig, customMessage?: string): string {
  const nome = smtp?.fromName || 'Claudio Theodoro';
  const cargo = smtp?.fromCargo || 'Assistente Comercial';
  const cel = smtp?.fromCelular || '(11)99619-9894';

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

    ${customMessage && stripHtml(customMessage).trim()
      ? `<div style="margin:0 0 32px;font-size:15px;line-height:1.7">${customMessage.trim()}</div>`
      : `<p style="margin:0 0 24px;font-size:15px">
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
    </p>`}

    <!-- Assinatura -->
    <p style="margin:0 0 6px;font-size:15px">Atenciosamente,</p>
    <br/>
    <p style="margin:0;font-size:15px;font-weight:bold;line-height:1.8">
      ${nome.toUpperCase()}<br/>
      ${cargo.toUpperCase()}<br/>CEL: ${cel}
    </p>
  </div>

</body>
</html>
  `.trim();
}
