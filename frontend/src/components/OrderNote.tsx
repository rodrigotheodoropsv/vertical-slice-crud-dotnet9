import { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import OrderPDF from './OrderPDF';

import type { BrandingConfig, Order } from '../types';
import { formatBRL } from '../utils/productMapper';
import { getAbsoluteAssetUrl } from '../utils/branding';

interface Props {
  order: Order;
  branding: BrandingConfig;
  onClose: () => void;
}

export default function OrderNote({ order, branding, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const hasIpi = order.itens.some((i) => i.ipiPct > 0);
  const hasSt  = order.itens.some((i) => i.stPct  > 0);
  const hasImpostos = hasIpi || hasSt;
  const realIpiTotal = order.totalComImpostos - order.totalProdutos - order.totalST;
  const cs = 5 + (hasIpi ? 1 : 0) + (hasSt ? 1 : 0); // colSpan for label cells

  async function handleDownloadPDF() {
    setPdfLoading(true);
    try {
      // Fetch logo as base64 to avoid CORS issues inside @react-pdf/renderer
      let logoUrl = '';
      try {
        const resp = await fetch(`${window.location.origin}${branding.logoPath}`);
        if (resp.ok) {
          const blob = await resp.blob();
          logoUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        // logo unavailable — PDF renders without it
      }

      const blob = await pdf(
        <OrderPDF order={order} branding={branding} logoUrl={logoUrl} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pedido-${order.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
    } finally {
      setPdfLoading(false);
    }
  }

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
          .obs{background:#fffbeb;border-left:4px solid #f59e0b;padding:8px 12px;margin-top:12px;font-size:12px}
          .print-header{display:flex;align-items:center;gap:12px;margin-bottom:10px}
          .print-logo{height:44px;max-width:180px;object-fit:contain}
          @media print{body{padding:16px}}
        </style>
      </head><body>
      <div class="print-header">
        <img class="print-logo" src="${getAbsoluteAssetUrl(branding.logoPath)}" alt="${branding.logoAlt}" onerror="this.style.display='none'" />
        <div style="font-weight:700;color:#1e3a8a">${branding.companyName}</div>
      </div>
      ${content}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  }

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Nota do Pedido</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers ref={printRef}>
        <Paper sx={{ mb: 2.2, p: 2.4, background: 'linear-gradient(120deg,#1565C0,#1976D2)', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Pedido de Vendas No {order.numero}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.88 }}>
            Emitido em {order.data} as {order.hora} - Vendedor: {order.vendedor}
          </Typography>
        </Paper>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Dados do Cliente</Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableBody>
              {[
                ['Razao Social', order.cliente.razaoSocial],
                ['CNPJ', order.cliente.cnpj],
                ['E-mail', order.cliente.email],
                ['Telefone', order.cliente.telefone],
                ['Endereco', order.cliente.endereco],
              ].map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell sx={{ width: 180, fontWeight: 700, color: 'text.secondary' }}>{k}</TableCell>
                  <TableCell>{v || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Itens do Pedido</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cod.</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell align="center">Qtd</TableCell>
                <TableCell align="right">Vlr Unit.</TableCell>
                <TableCell align="right">Desconto</TableCell>
                <TableCell align="right">Total</TableCell>
                {hasIpi && <TableCell align="center">IPI</TableCell>}
                {hasSt  && <TableCell align="center">Subst. Trib.</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {order.itens.map((item) => {
                const { idCol, nomeCol } = order.fieldMapping;
                const id = String(item.row[idCol] ?? '');
                const nome = String(item.row[nomeCol] ?? '');
                return (
                  <TableRow key={id}>
                    <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{nome}</TableCell>
                    <TableCell align="center">{item.quantidade}</TableCell>
                    <TableCell align="right">{formatBRL(item.unitPrice)}</TableCell>
                    <TableCell align="right">{item.discountTotal > 0 ? formatBRL(item.discountTotal) : '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBRL(item.subtotal)}</TableCell>
                    {hasIpi && (
                      <TableCell align="center" sx={{ color: item.ipiPct > 0 ? 'warning.dark' : 'text.disabled' }}>
                        {item.ipiPct > 0 ? item.ipiPct.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—'}
                      </TableCell>
                    )}
                    {hasSt && (
                      <TableCell align="center" sx={{ color: item.stPct > 0 ? 'error.main' : 'text.disabled' }}>
                        {item.stPct > 0 ? item.stPct.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—'}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: 'rgba(21, 101, 192, 0.07)' }}>
                <TableCell colSpan={cs} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Subtotal bruto</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBRL(order.grossTotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={cs} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Desconto em itens</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: order.itemDiscountTotal > 0 ? 'success.main' : 'text.primary' }}>{formatBRL(order.itemDiscountTotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={cs} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Desconto geral</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: order.orderDiscountTotal > 0 ? 'success.main' : 'text.primary' }}>{formatBRL(order.orderDiscountTotal)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'rgba(21, 101, 192, 0.07)' }}>
                <TableCell colSpan={cs} align="right" sx={{ fontWeight: hasImpostos ? 700 : 800 }}>{hasImpostos ? 'TOTAL DOS PRODUTOS' : 'TOTAL DO PEDIDO'}</TableCell>
                <TableCell align="right" sx={{ fontWeight: hasImpostos ? 700 : 800, color: 'primary.main' }}>{formatBRL(order.totalProdutos)}</TableCell>
              </TableRow>
              {hasIpi && realIpiTotal > 0 && (
                <TableRow>
                  <TableCell colSpan={cs} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>IPI Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.dark' }}>{formatBRL(realIpiTotal)}</TableCell>
                </TableRow>
              )}
              {hasSt && (
                <TableRow>
                  <TableCell colSpan={cs} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>ST Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{formatBRL(order.totalST)}</TableCell>
                </TableRow>
              )}
              {hasImpostos && (
                <TableRow sx={{ bgcolor: 'rgba(21, 101, 192, 0.12)' }}>
                  <TableCell colSpan={cs} align="right" sx={{ fontWeight: 800 }}>TOTAL C/ IMPOSTOS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(order.totalComImpostos)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2"><strong>Condicao de Pagamento:</strong> {order.condicaoPagamento}</Typography>
          <Typography variant="body2"><strong>Prazo de Entrega:</strong> {order.prazoEntrega}</Typography>
        </Stack>

        {order.observacoes && (
          <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderLeft: '4px solid', borderColor: 'warning.main', bgcolor: 'warning.50' }}>
            <Typography variant="body2"><strong>Observacoes:</strong> {order.observacoes}</Typography>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Documento gerado eletronicamente - {order.data} as {order.hora}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Fechar</Button>
        <Button onClick={handlePrint} variant="outlined" startIcon={<PrintIcon />}>Imprimir</Button>
        <Button
          onClick={handleDownloadPDF}
          variant="contained"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          disabled={pdfLoading}
        >
          {pdfLoading ? 'Gerando PDF…' : 'Baixar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
