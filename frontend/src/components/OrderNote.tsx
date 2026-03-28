import { useRef } from 'react';
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
} from '@mui/icons-material';

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
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: 'rgba(21, 101, 192, 0.07)' }}>
                <TableCell colSpan={5} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Subtotal bruto</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBRL(order.grossTotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Desconto em itens</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: order.itemDiscountTotal > 0 ? 'success.main' : 'text.primary' }}>{formatBRL(order.itemDiscountTotal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Desconto geral</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: order.orderDiscountTotal > 0 ? 'success.main' : 'text.primary' }}>{formatBRL(order.orderDiscountTotal)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: 'rgba(21, 101, 192, 0.07)' }}>
                <TableCell colSpan={5} align="right" sx={{ fontWeight: 800 }}>TOTAL DO PEDIDO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatBRL(order.total)}</TableCell>
              </TableRow>
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
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>Imprimir / PDF</Button>
      </DialogActions>
    </Dialog>
  );
}
