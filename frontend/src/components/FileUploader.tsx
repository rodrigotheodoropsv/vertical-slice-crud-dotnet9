import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  CloudUploadOutlined as UploadIcon,
  DescriptionOutlined as FileIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { parseSpreadsheet } from '../utils/fileParser';
import { guessFieldMapping } from '../utils/productMapper';
import type { CatalogState, FieldMapping, SpreadsheetRow } from '../types';

interface Props {
  onLoad: (catalog: CatalogState) => void;
}

const FIELD_LABELS: Record<keyof FieldMapping, string> = {
  idCol: 'Coluna de ID / Codigo',
  nomeCol: 'Coluna de Nome do Produto',
  precoCol: 'Coluna de Preco Unitario',
  estoqueCol: 'Coluna de Estoque',
};

export default function FileUploader({ onLoad }: Props) {
  const [allHeaders, setAllHeaders] = useState<string[]>([]);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    idCol: '', nomeCol: '', precoCol: '', estoqueCol: '',
  });
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<'idle' | 'select' | 'done'>('idle');

  async function handleFile(file: File) {
    try {
      const { headers: h, rows: r } = await parseSpreadsheet(file);
      if (h.length === 0) throw new Error('Arquivo sem colunas detectadas.');
      const guessed = guessFieldMapping(h);
      setAllHeaders(h);
      setActiveColumns(h);
      setRows(r);
      setFileName(file.name);
      setFieldMapping(guessed);
      setStep('select');
    } catch (err) {
      toast.error(`Erro ao processar arquivo: ${(err as Error).message}`);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function removeColumn(col: string) {
    setActiveColumns((prev) => prev.filter((c) => c !== col));
  }

  function restoreColumn(col: string) {
    setActiveColumns((prev) => {
      const next = new Set(prev);
      next.add(col);
      return allHeaders.filter((h) => next.has(h));
    });
  }

  function handleConfirm() {
    const keys = Object.keys(fieldMapping) as (keyof FieldMapping)[];
    const missing = keys.filter((k) => !fieldMapping[k]);
    if (missing.length) {
      toast.error(`Selecione as colunas obrigatorias: ${missing.map((k) => FIELD_LABELS[k]).join(', ')}`);
      return;
    }
    const requiredCols = Object.values(fieldMapping);
    const finalActive = [
      ...activeColumns,
      ...requiredCols.filter((c) => c && !activeColumns.includes(c)),
    ];
    const catalog: CatalogState = { fileName, allHeaders, activeColumns: finalActive, rows, fieldMapping };
    setActiveColumns(finalActive);
    setStep('done');
    onLoad(catalog);
    toast.success(`${rows.length} produtos carregados com sucesso!`);
  }

  function handleReset() {
    setAllHeaders([]);
    setActiveColumns([]);
    setRows([]);
    setFieldMapping({ idCol: '', nomeCol: '', precoCol: '', estoqueCol: '' });
    setFileName('');
    setStep('idle');
  }

  if (step === 'done') {
    return (
      <Alert
        severity="success"
        sx={{
          borderRadius: 2,
          '& .MuiAlert-message': { width: '100%' },
        }}
        action={
          <Button size="small" color="success" onClick={handleReset} startIcon={<RefreshIcon />}>
            Trocar arquivo
          </Button>
        }
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{fileName}</Typography>
        <Typography variant="body2" color="text.secondary">
          {rows.length} produtos · {activeColumns.length} colunas ativas
        </Typography>
      </Alert>
    );
  }

  if (step === 'select') {
    const removedColumns = allHeaders.filter((h) => !activeColumns.includes(h));

    return (
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2.5, bgcolor: 'rgba(21, 101, 192, 0.03)' }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <FileIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>{fileName}</Typography>
            </Stack>
            <Chip label={`${rows.length} linhas detectadas`} size="small" color="primary" variant="outlined" />
          </Stack>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.2 }}>
              Colunas detectadas
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {allHeaders.map((col) => {
                const isActive = activeColumns.includes(col);
                return isActive ? (
                  <Chip
                    key={col}
                    label={col}
                    color="primary"
                    variant="filled"
                    onDelete={() => removeColumn(col)}
                    deleteIcon={<CloseIcon />}
                    sx={{ '& .MuiChip-label': { maxWidth: 220 }, opacity: 0.95 }}
                  />
                ) : (
                  <Chip
                    key={col}
                    label={col}
                    variant="outlined"
                    onClick={() => restoreColumn(col)}
                    sx={{
                      opacity: 0.5,
                      textDecoration: 'line-through',
                      '&:hover': { opacity: 0.9, textDecoration: 'none' },
                    }}
                  />
                );
              })}
            </Stack>
            {removedColumns.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {removedColumns.length} coluna(s) removida(s). Clique para restaurar.
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.2 }}>
              Campos obrigatorios para geracao do pedido
            </Typography>
            <Grid container spacing={1.5}>
              {(Object.keys(FIELD_LABELS) as (keyof FieldMapping)[]).map((field) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={field}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{FIELD_LABELS[field]}</InputLabel>
                    <Select
                      label={FIELD_LABELS[field]}
                      value={fieldMapping[field]}
                      onChange={(e) => setFieldMapping((prev) => ({ ...prev, [field]: e.target.value }))}
                    >
                      <MenuItem value="">-- Selecione --</MenuItem>
                      {allHeaders.map((h) => (
                        <MenuItem key={h} value={h}>{h}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
            <Button variant="contained" onClick={handleConfirm} startIcon={<UploadIcon />}>
              Confirmar e carregar
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleReset}>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 2.5,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: dragging ? 'primary.main' : 'divider',
        bgcolor: dragging ? 'rgba(21, 101, 192, 0.06)' : 'background.paper',
        transition: 'all 0.2s ease',
      }}
    >
      <Stack alignItems="center" spacing={1.5} textAlign="center">
        <UploadIcon sx={{ fontSize: 46, color: dragging ? 'primary.main' : 'text.secondary' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Arraste um arquivo ou clique para selecionar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          CSV, XLSX ou XLS
        </Typography>

        <Button variant="contained" component="label" startIcon={<FileIcon />}>
          Selecionar arquivo
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </Button>
      </Stack>
    </Paper>
  );
}
