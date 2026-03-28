import { Card, CardContent, Grid, Stack, TextField, Typography } from '@mui/material';
import { PersonOutline as UserIcon } from '@mui/icons-material';

import type { ClientInfo } from '../types';

interface Props {
  value: ClientInfo;
  onChange: (v: ClientInfo) => void;
}

function formatCnpj(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export default function ClientForm({ value, onChange }: Props) {
  function set<K extends keyof ClientInfo>(key: K, v: ClientInfo[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 2.2, sm: 2.8 } }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <UserIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Dados do Cliente</Typography>
        </Stack>

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label="Razao Social"
              placeholder="Ex.: Comercio Silva Ltda."
              value={value.razaoSocial}
              onChange={(e) => set('razaoSocial', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={value.cnpj}
              onChange={(e) => set('cnpj', formatCnpj(e.target.value))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              required
              type="email"
              label="E-mail"
              placeholder="contato@empresa.com.br"
              value={value.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Telefone"
              placeholder="(11) 91234-5678"
              value={value.telefone}
              onChange={(e) => set('telefone', formatPhone(e.target.value))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Endereco de Entrega"
              placeholder="Rua, numero - Bairro - Cidade/UF - CEP"
              value={value.endereco}
              onChange={(e) => set('endereco', e.target.value)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
