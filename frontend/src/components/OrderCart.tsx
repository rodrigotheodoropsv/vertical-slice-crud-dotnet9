import { memo } from 'react';
import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  DeleteOutline as DeleteIcon,
  ShoppingCartOutlined as CartIcon,
} from '@mui/icons-material';

import type { FieldMapping, OrderItem } from '../types';
import { formatBRL, getNumber } from '../utils/productMapper';

interface Props {
  items: OrderItem[];
  fieldMapping: FieldMapping;
  onRemove: (rowId: string) => void;
  onChangeQty: (rowId: string, qty: number) => void;
}

function OrderCart({ items, fieldMapping, onRemove, onChangeQty }: Props) {
  const { idCol, nomeCol, precoCol, estoqueCol } = fieldMapping;

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

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Produto</TableCell>
            <TableCell align="right">Vlr Unit.</TableCell>
            <TableCell align="center">Qtd</TableCell>
            <TableCell align="right">Subtotal</TableCell>
            <TableCell align="center">-</TableCell>
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
                  <Typography sx={{ fontWeight: 600 }}>{nome}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{id}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatBRL(price)}</TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={item.quantidade}
                    inputProps={{ min: 1, max: stock || undefined, style: { textAlign: 'center' } }}
                    onChange={(e) => onChangeQty(id, Number(e.target.value))}
                    sx={{ width: 82 }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatBRL(item.subtotal)}</TableCell>
                <TableCell align="center">
                  <IconButton color="error" onClick={() => onRemove(id)} size="small" title="Remover item">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ bgcolor: 'rgba(21, 101, 192, 0.07)' }}>
            <TableCell colSpan={3} align="right">
              <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>TOTAL DO PEDIDO</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.15rem' }}>
                {formatBRL(total)}
              </Typography>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

export default memo(OrderCart);
