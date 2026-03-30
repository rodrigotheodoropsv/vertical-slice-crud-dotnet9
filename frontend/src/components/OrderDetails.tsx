import {
  Box,
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
  condicaoPagamento: string;
  prazoEntrega: string;
  observacoes: string;
  frete: string;
  validadeOrcamento: string;
  totalPedido: number;
  descontoPedido: number;
  onChange: (field: string, value: string) => void;
}

export default function OrderDetails({ condicaoPagamento, prazoEntrega, observacoes, frete, validadeOrcamento, totalPedido, descontoPedido, onChange }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 2.2, sm: 2.8 } }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <DetailsIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Detalhes do Pedido</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            Fechamento atual: {formatBRL(totalPedido)}{descontoPedido > 0 ? ` · desconto ${formatBRL(descontoPedido)}` : ''}
          </Typography>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                Vendedor
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{VENDEDOR_FIXO}</Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Condicao de Pagamento"
              placeholder="Ex.: Boleto 30/60 dias, Pix, etc."
              value={condicaoPagamento}
              onChange={(e) => onChange('condicaoPagamento', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Prazo de Entrega"
              placeholder="Ex.: 5 dias uteis, imediato, etc."
              value={prazoEntrega}
              onChange={(e) => onChange('prazoEntrega', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Frete"
              placeholder="CIF - Entrega pelo Carro da Propria Lubefer"
              value={frete}
              onChange={(e) => onChange('frete', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Validade do Orcamento"
              placeholder="05 Dias Uteis"
              value={validadeOrcamento}
              onChange={(e) => onChange('validadeOrcamento', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Observacoes"
              multiline
              minRows={3}
              placeholder="Instrucoes especiais de entrega, referencia de produto, etc."
              value={observacoes}
              onChange={(e) => onChange('observacoes', e.target.value)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
