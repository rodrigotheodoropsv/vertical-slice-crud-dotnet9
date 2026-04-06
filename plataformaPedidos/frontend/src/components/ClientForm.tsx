import { Box, Button, Card, CardContent, CircularProgress, Divider, Grid, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { ClearOutlined as ClearIcon, PersonOutline as UserIcon } from '@mui/icons-material';
import { useState } from 'react';

import type { ClientInfo } from '../types';
import type { ClientRecord } from '../utils/clientParser';
import ClientSelector from './ClientSelector';

interface Props {
  value: ClientInfo;
  onChange: (v: ClientInfo) => void;
  clients?: ClientRecord[];
  onClear?: () => void;
  loading?: boolean;
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

export default function ClientForm({ value, onChange, clients = [], onClear, loading = false }: Props) {
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  function set<K extends keyof ClientInfo>(key: K, v: ClientInfo[K]) {
    onChange({ ...value, [key]: v });
  }

  function handleClientSelect(rec: ClientRecord | null) {
    setSelectedClient(rec);
    if (!rec) return;
    onChange({
      razaoSocial:       rec.razaoSocial,
      cnpj:              rec.cnpj,
      email:             rec.email,
      telefone:          rec.telefone,
      endereco:          rec.endereco,
      bairro:            rec.bairro,
      cep:               rec.cep,
      cidade:            rec.cidade,
      estado:            rec.estado,
      inscricaoEstadual: rec.inscricaoEstadual,
      codCliente:        rec.codigo,
      comprador:         rec.comprador,
    });
  }

  function handleClear() {
    setSelectedClient(null);
    onClear?.();
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
      <CardContent sx={{ p: { xs: 2.2, sm: 2.8 } }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <UserIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Dados do Cliente</Typography>
          {loading && <CircularProgress size={14} thickness={5} sx={{ ml: 1 }} />}
        </Stack>

        {loading ? (
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={40} />
            <Stack direction="row" spacing={1.5}>
              <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
              <Skeleton variant="rounded" height={56} sx={{ flex: 1 }} />
            </Stack>
          </Stack>
        ) : (
          <>
            {clients.length > 0 && (
              <>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <ClientSelector clients={clients} value={selectedClient} onSelect={handleClientSelect} />
                  </Box>
                  {value.razaoSocial && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={handleClear}
                      sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      Limpar
                    </Button>
                  )}
                </Stack>
                <Divider sx={{ my: 2 }} />
              </>
            )}

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
                  label="Inscricao Estadual"
                  value={value.inscricaoEstadual ?? ''}
                  onChange={(e) => set('inscricaoEstadual', e.target.value)}
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

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Endereco"
                  placeholder="Rua, numero"
                  value={value.endereco}
                  onChange={(e) => set('endereco', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={value.bairro ?? ''}
                  onChange={(e) => set('bairro', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={value.cep ?? ''}
                  onChange={(e) => set('cep', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Estado (UF)"
                  value={value.estado ?? ''}
                  onChange={(e) => set('estado', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={value.cidade ?? ''}
                  onChange={(e) => set('cidade', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Comprador / Contato"
                  placeholder="Nome do comprador"
                  value={value.comprador ?? ''}
                  onChange={(e) => set('comprador', e.target.value)}
                />
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
}
