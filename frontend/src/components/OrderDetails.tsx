import {
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AssignmentOutlined as DetailsIcon } from '@mui/icons-material';

interface Props {
  vendedor: string;
  condicaoPagamento: string;
  prazoEntrega: string;
  observacoes: string;
  onChange: (field: string, value: string) => void;
}

const PAYMENT_OPTIONS = [
  'A vista',
  'Boleto 30 dias',
  'Boleto 30/60 dias',
  'Boleto 30/60/90 dias',
  'Cartao de credito a vista',
  'Cartao de credito 3x sem juros',
  'Pix',
  'Transferencia bancaria',
];

const DELIVERY_OPTIONS = [
  'Imediato',
  '1-3 dias uteis',
  '5 dias uteis',
  '7 dias uteis',
  '10 dias uteis',
  '15 dias uteis',
  '30 dias',
  'A combinar',
];

export default function OrderDetails({ vendedor, condicaoPagamento, prazoEntrega, observacoes, onChange }: Props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 2.2, sm: 2.8 } }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <DetailsIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Detalhes do Pedido</Typography>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Vendedor"
              placeholder="Nome do vendedor"
              value={vendedor}
              onChange={(e) => onChange('vendedor', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              required
              label="Condicao de Pagamento"
              value={condicaoPagamento}
              onChange={(e) => onChange('condicaoPagamento', e.target.value)}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {PAYMENT_OPTIONS.map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              required
              label="Prazo de Entrega"
              value={prazoEntrega}
              onChange={(e) => onChange('prazoEntrega', e.target.value)}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {DELIVERY_OPTIONS.map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </TextField>
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
