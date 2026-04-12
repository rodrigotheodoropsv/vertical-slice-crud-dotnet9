import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  AddShoppingCart as AddCartIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

import type { FieldMapping, SpreadsheetRow } from '../types';

interface Props {
  open: boolean;
  fieldMapping: FieldMapping;
  onAdd: (row: SpreadsheetRow, quantidade: number) => void;
  onClose: () => void;
}

interface FormState {
  codigo: string;
  grupo: string;
  descricao: string;
  preco: string;
  quantidade: string;
  ipiPct: string;
  stPct: string;
}

const EMPTY_FORM: FormState = {
  codigo: '',
  grupo: '',
  descricao: '',
  preco: '',
  quantidade: '1',
  ipiPct: '0',
  stPct: '0',
};

export default function AddCustomItemDialog({ open, fieldMapping, onAdd, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set(field: keyof FormState, value: string) {
    setForm((prev: FormState) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: Partial<Record<keyof FormState, string>>) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.descricao.trim()) newErrors.descricao = 'Informe a descrição do item.';

    const preco = parseFloat(form.preco.replace(',', '.'));
    if (!form.preco.trim() || isNaN(preco) || preco <= 0) newErrors.preco = 'Informe um preço válido maior que zero.';

    const qty = parseInt(form.quantidade, 10);
    if (!form.quantidade.trim() || isNaN(qty) || qty <= 0) newErrors.quantidade = 'Quantidade deve ser pelo menos 1.';

    const ipiPct = parseFloat(form.ipiPct.replace(',', '.'));
    if (isNaN(ipiPct) || ipiPct < 0) newErrors.ipiPct = 'IPI inválido.';

    const stPct = parseFloat(form.stPct.replace(',', '.'));
    if (isNaN(stPct) || stPct < 0) newErrors.stPct = 'ST inválido.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const preco = parseFloat(form.preco.replace(',', '.'));
    const qty   = parseInt(form.quantidade, 10);
    const ipi   = parseFloat(form.ipiPct.replace(',', '.') || '0');
    const st    = parseFloat(form.stPct.replace(',', '.') || '0');
    const codigo = form.codigo.trim() || `CUSTOM-${Date.now()}`;

    // Build a SpreadsheetRow with keys matching the catalog's fieldMapping
    const row: SpreadsheetRow = {
      [fieldMapping.idCol]:      codigo,
      [fieldMapping.nomeCol]:    form.descricao.trim(),
      [fieldMapping.precoCol]:   preco,
      [fieldMapping.estoqueCol]: 999999, // sem limite de estoque para itens personalizados
      [fieldMapping.ipiCol]:     ipi,
      [fieldMapping.stCol]:      st,
    };
    if (fieldMapping.grupoCol) row[fieldMapping.grupoCol] = form.grupo.trim();

    onAdd(row, qty);
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <AddCartIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Item Personalizado</Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Alert
          severity="info"
          icon={<InfoIcon fontSize="small" />}
          sx={{ mb: 2.5, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.82rem' } }}
        >
          Este item <strong>não altera o catálogo</strong>. Ele existirá apenas neste pedido e
          participará de todos os cálculos normalmente (desconto, acréscimo, IPI, ST, PDF, e-mail).
        </Alert>

        <Grid container spacing={2}>
          {/* Linha 1 — Código + Quantidade */}
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="Código / Referência"
              placeholder="Ex.: REF-001, ACO-304L"
              value={form.codigo}
              onChange={(e) => set('codigo', e.target.value)}
              helperText="Opcional — gerado automaticamente se deixado em branco"
              autoFocus
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Quantidade *"
              value={form.quantidade}
              onChange={(e) => set('quantidade', e.target.value)}
              error={Boolean(errors.quantidade)}
              helperText={errors.quantidade ?? ' '}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Grid>

          {/* Linha 1b — Grupo (apenas se o catálogo tiver coluna de grupo) */}
          {fieldMapping.grupoCol && (
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Grupo"
                placeholder="Ex.: TUBOS, CONEXÕES, VÁLVULAS"
                value={form.grupo}
                onChange={(e) => set('grupo', e.target.value)}
                helperText="Opcional"
              />
            </Grid>
          )}

          {/* Linha 2 — Descrição */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Descrição do Item *"
              placeholder="Ex.: TUBO AÇO INOX 304L 1/2&quot; SCH10 C/6m"
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              error={Boolean(errors.descricao)}
              helperText={errors.descricao ?? ' '}
            />
          </Grid>

          {/* Linha 3 — Preço */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Preço Unitário (R$) *"
              placeholder="0,00"
              value={form.preco}
              onChange={(e) => set('preco', e.target.value)}
              error={Boolean(errors.preco)}
              helperText={errors.preco ?? ' '}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                },
              }}
            />
          </Grid>

          {/* Linha 4 — IPI + ST */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="IPI %"
              value={form.ipiPct}
              onChange={(e) => set('ipiPct', e.target.value)}
              error={Boolean(errors.ipiPct)}
              helperText={errors.ipiPct ?? 'Deixe em 0 se não aplicável'}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
                htmlInput: { min: 0, step: 0.01 },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Substituição Tributária %"
              value={form.stPct}
              onChange={(e) => set('stPct', e.target.value)}
              error={Boolean(errors.stPct)}
              helperText={errors.stPct ?? 'Deixe em 0 se não aplicável'}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                },
                htmlInput: { min: 0, step: 0.01 },
              }}
            />
          </Grid>
        </Grid>

        {/* Preview do nome do arquivo */}
        {form.descricao.trim() && form.preco && parseFloat(form.preco.replace(',', '.')) > 0 && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
              Preview do item:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {form.codigo.trim() || 'CUSTOM-…'} — {form.descricao.trim()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              R$ {parseFloat(form.preco.replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × {form.quantidade || 1} un.
              {parseFloat(form.ipiPct || '0') > 0 ? ` · IPI ${form.ipiPct}%` : ''}
              {parseFloat(form.stPct || '0') > 0 ? ` · ST ${form.stPct}%` : ''}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.75 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          startIcon={<AddCartIcon />}
        >
          Adicionar ao Pedido
        </Button>
      </DialogActions>
    </Dialog>
  );
}
