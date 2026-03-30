import { memo, useState } from 'react';
import {
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  LocalOfferOutlined as DiscountIcon,
  ShoppingCartOutlined as CartIcon,
} from '@mui/icons-material';

import type { DiscountConfig, FieldMapping, OrderItem } from '../types';
import { formatBRL, getNumber } from '../utils/productMapper';
import DiscountInputControl from './DiscountInputControl';
import { calculateOrderSummary, DEFAULT_DISCOUNT, formatDiscountLabel, hasDiscount } from '../utils/pricing';

interface Props {
  items: OrderItem[];
  fieldMapping: FieldMapping;
  orderDiscount: DiscountConfig;
  onRemove: (rowId: string) => void;
  onChangeQty: (rowId: string, qty: number) => void;
  onItemDiscountChange: (rowId: string, discount: DiscountConfig) => void;
  onOrderDiscountChange: (discount: DiscountConfig) => void;
}

function OrderCart({
  items,
  fieldMapping,
  orderDiscount,
  onRemove,
  onChangeQty,
  onItemDiscountChange,
  onOrderDiscountChange,
}: Props) {
  const { idCol, nomeCol, precoCol, estoqueCol } = fieldMapping;
  const [discountAnchor, setDiscountAnchor] = useState<{ el: HTMLElement; itemId: string } | null>(null);
  const popoverItem = discountAnchor ? items.find((i) => String(i.row[idCol] ?? '') === discountAnchor.itemId) : null;

  if (items.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          py: 7,
          px: 3,
          textAlign: 'center',
          borderRadius: 2.5,
          borderStyle: 'dashed',
          color: 'text.secondary',
        }}
      >
        <CartIcon sx={{ fontSize: 42, mb: 1 }} />
        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Nenhum item adicionado ainda</Typography>
        <Typography variant="body2">Selecione produtos no catalogo acima</Typography>
      </Paper>
    );
  }

  const summary = calculateOrderSummary(items, orderDiscount);
  const ipiTotal = summary.totalComImpostos - summary.totalProdutos;

  return (
    <Stack spacing={2}>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Produto</TableCell>
              <TableCell align="right">Vlr Unit.</TableCell>
              <TableCell align="center">Qtd</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center" sx={{ width: 72 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const id = String(item.row[idCol] ?? '');
              const nome = String(item.row[nomeCol] ?? '');
              const price = getNumber(item.row, precoCol);
              const stock = getNumber(item.row, estoqueCol);
              return (
                <TableRow key={id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.3 }}>{nome}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.3, flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{id}</Typography>
                      {hasDiscount(item.discount) && (
                        <Chip
                          size="small"
                          color="success"
                          variant="outlined"
                          label={`-${formatBRL(item.discountTotal)} (${formatDiscountLabel(item.discount)})`}
                          sx={{ height: 18, fontSize: 10, '& .MuiChip-label': { px: 0.75 } }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {item.discountTotal > 0 ? (
                      <>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', textDecoration: 'line-through' }}>
                          {formatBRL(item.grossTotal)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatBRL(price)}</Typography>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatBRL(price)}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      value={item.quantidade}
                      inputProps={{ min: 1, max: stock || undefined, style: { textAlign: 'center' } }}
                      onChange={(e) => onChangeQty(id, Number(e.target.value))}
                      sx={{ width: 72 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 700 }}>{formatBRL(item.subtotal)}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0} justifyContent="center">
                      <Tooltip title={hasDiscount(item.discount) ? `Desconto: ${formatDiscountLabel(item.discount)}` : 'Aplicar desconto no item'}>
                        <IconButton
                          size="small"
                          color={hasDiscount(item.discount) ? 'success' : 'default'}
                          onClick={(e) => setDiscountAnchor({ el: e.currentTarget, itemId: id })}
                        >
                          <DiscountIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton color="error" onClick={() => onRemove(id)} size="small" title="Remover item">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Per-item discount popover ─── */}
      <Popover
        open={Boolean(discountAnchor)}
        anchorEl={discountAnchor?.el}
        onClose={() => setDiscountAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: 2, boxShadow: 4 } } }}
      >
        <Box sx={{ p: 2, minWidth: 240 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {popoverItem ? String(popoverItem.row[nomeCol] ?? '') : ''}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Vlr unit.: {popoverItem ? formatBRL(getNumber(popoverItem.row, precoCol)) : '—'}
          </Typography>
          <DiscountInputControl
            discount={popoverItem?.discount ?? DEFAULT_DISCOUNT}
            onChange={(d) => {
              if (discountAnchor) onItemDiscountChange(discountAnchor.itemId, d);
            }}
            amountLabel="Desconto"
          />
          {popoverItem && hasDiscount(popoverItem.discount) && (
            <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
              Economia: {formatBRL(popoverItem.discountTotal)}
            </Typography>
          )}
        </Box>
      </Popover>

      <Paper variant="outlined" sx={{ borderRadius: 2.5, p: { xs: 2, sm: 2.4 }, background: 'linear-gradient(180deg, rgba(21,101,192,0.03), rgba(21,101,192,0.01))' }}>
        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">Subtotal bruto</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatBRL(summary.grossTotal)}</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">Desconto em itens</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: summary.itemDiscountTotal > 0 ? 'success.main' : 'text.primary' }}>
                {formatBRL(summary.itemDiscountTotal)}
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">Desconto geral</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: summary.orderDiscountTotal > 0 ? 'success.main' : 'text.primary', mb: 1 }}>
                {formatBRL(summary.orderDiscountTotal)}
              </Typography>
              <DiscountInputControl
                discount={orderDiscount}
                onChange={onOrderDiscountChange}
                amountLabel="Desc. no pedido"
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
          <Box>
            {ipiTotal > 0 ? (
              <>
                <Typography variant="caption" color="text.secondary">Total dos Produtos</Typography>
                <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}>
                  {formatBRL(summary.totalProdutos)}
                </Typography>
                <Typography variant="caption" color="text.secondary">+ IPI</Typography>
                <Typography sx={{ fontWeight: 700, color: 'warning.dark', fontSize: '1rem', mb: 0.5 }}>
                  {formatBRL(ipiTotal)}
                </Typography>
                <Typography variant="caption" color="text.secondary">TOTAL C/ IMPOSTOS</Typography>
                <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.3rem' }}>
                  {formatBRL(summary.totalComImpostos)}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="caption" color="text.secondary">TOTAL DO PEDIDO</Typography>
                <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.3rem' }}>
                  {formatBRL(summary.total)}
                </Typography>
              </>
            )}
          </Box>
          {(summary.itemDiscountTotal + summary.orderDiscountTotal) > 0 && (
            <Chip
              color="success"
              variant="filled"
              label={`Economia total ${formatBRL(summary.itemDiscountTotal + summary.orderDiscountTotal)}`}
            />
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default memo(OrderCart);
