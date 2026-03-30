import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

interface EmailHistoryRow {
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  documentType: string;
  orderNumber: string;
  clientName: string;
  messageId: string;
  error: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function minusDaysIsoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function EmailHistoryModal({ open, onClose }: Props) {
  const [rows, setRows] = useState<EmailHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(minusDaysIsoDate(7));
  const [toDate, setToDate] = useState(todayIsoDate());
  const [status, setStatus] = useState<'ALL' | 'SUCCESS' | 'ERROR'>('ALL');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (status !== 'ALL') params.set('status', status);

      const response = await fetch(`/api/email/history?${params.toString()}`);
      const data = (await response.json()) as { ok?: boolean; items?: EmailHistoryRow[]; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao buscar historico.');
      }
      setRows(data.items ?? []);
    } catch (err) {
      setError((err as Error).message || 'Erro ao consultar historico.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, status]);

  useEffect(() => {
    if (!open) return;
    fetchHistory();
  }, [open, fetchHistory]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>Historico de Envio de E-mails</DialogTitle>
      <DialogContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} sx={{ mb: 2, mt: 0.5 }}>
          <Stack spacing={0.4} sx={{ minWidth: 210 }}>
            <Typography variant="caption" color="text.secondary">De</Typography>
            <TextField
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Stack>
          <Stack spacing={0.4} sx={{ minWidth: 210 }}>
            <Typography variant="caption" color="text.secondary">Ate</Typography>
            <TextField
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Stack>
          <Stack spacing={0.4} sx={{ minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <TextField
              size="small"
              select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'ALL' | 'SUCCESS' | 'ERROR')}
            >
              <MenuItem value="ALL">Todos</MenuItem>
              <MenuItem value="SUCCESS">Sucesso</MenuItem>
              <MenuItem value="ERROR">Erro</MenuItem>
            </TextField>
          </Stack>
          <Stack spacing={0.4} sx={{ minWidth: 180 }}>
            <Typography variant="caption" color="transparent" sx={{ userSelect: 'none' }}>
              Acao
            </Typography>
            <Button variant="contained" size="small" onClick={fetchHistory} disabled={loading} sx={{ height: 40 }}>
              {loading ? 'Buscando...' : 'Filtrar'}
            </Button>
          </Stack>
          <Box sx={{ flex: 1 }} />
          <Chip label={`${rows.length} registro(s)`} color="primary" variant="outlined" />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Data/Hora</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Pedido/Orc.</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Para</TableCell>
                <TableCell>CC</TableCell>
                <TableCell>Assunto</TableCell>
                <TableCell>Erro</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={`${r.timestamp}-${idx}`} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(r.timestamp).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={r.status === 'SUCCESS' ? 'success' : 'error'}
                      label={r.status === 'SUCCESS' ? 'Sucesso' : 'Erro'}
                    />
                  </TableCell>
                  <TableCell>{r.documentType || '-'}</TableCell>
                  <TableCell>{r.orderNumber || '-'}</TableCell>
                  <TableCell>{r.clientName || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.to}>{r.to || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.cc}>{r.cc || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.subject}>{r.subject || '-'}</TableCell>
                  <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.error}>{r.error || '-'}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography variant="body2" color="text.secondary">Nenhum envio encontrado para o filtro informado.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
