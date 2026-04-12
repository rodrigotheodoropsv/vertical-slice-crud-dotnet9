import {
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AssignmentOutlined as DetailsIcon } from '@mui/icons-material';
import { formatBRL } from '../utils/productMapper';

const VENDEDOR_FIXO = 'Claúdio José Theodoro';

interface Props {
  orderDate: string;
  condicaoPagamento: string;
  prazoEntrega: string;
  observacoes: string;
  frete: string;
  validadeOrcamento: string;
  totalPedido: number;
  descontoPedido: number;
  onChange: (field: string, value: string) => void;
}

export default function OrderDetails({ orderDate, condicaoPagamento, prazoEntrega, observacoes, frete, validadeOrcamento, totalPedido, descontoPedido, onChange }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <DetailsIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Detalhes do Pedido</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            Fechamento: <strong>{formatBRL(totalPedido)}</strong>
            {descontoPedido > 0 && <> · desc. {formatBRL(descontoPedido)}</>}
          </Typography>
        </Stack>

        <Grid container spacing={1.5}>
          {/* ── Linha 1: Vendedor · Data · Cond.Pagamento · Prazo ── */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Vendedor"
              value={VENDEDOR_FIXO}
              slotProps={{ input: { readOnly: true } }}
              sx={{ '& .MuiInputBase-input': { color: 'text.primary', fontWeight: 600 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Data do Pedido"
              placeholder="DD/MM/AAAA"
              value={orderDate}
              onChange={(e) => onChange('data', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              required
              label="Cond. de Pagamento"
              placeholder="Boleto 30/60, Pix…"
              value={condicaoPagamento}
              onChange={(e) => onChange('condicaoPagamento', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              required
              label="Prazo de Entrega"
              placeholder="5 dias úteis, imediato…"
              value={prazoEntrega}
              onChange={(e) => onChange('prazoEntrega', e.target.value)}
            />
          </Grid>

          {/* ── Linha 2: Frete · Validade ── */}
          <Grid size={{ xs: 12, sm: 8, md: 8 }}>
            <TextField
              fullWidth
              label="Frete"
              placeholder="CIF – Entrega pelo carro próprio Lubefer"
              value={frete}
              onChange={(e) => onChange('frete', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 4 }}>
            <TextField
              fullWidth
              label="Validade do Orçamento"
              placeholder="05 Dias Úteis"
              value={validadeOrcamento}
              onChange={(e) => onChange('validadeOrcamento', e.target.value)}
            />
          </Grid>

          {/* ── Linha 3: Observações ── */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Observações"
              multiline
              minRows={2}
              placeholder="Instruções especiais de entrega, referência de produto, etc."
              value={observacoes}
              onChange={(e) => onChange('observacoes', e.target.value)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
