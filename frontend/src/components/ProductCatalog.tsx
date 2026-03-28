import { memo, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
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
  Search as SearchIcon,
  FilterAltOutlined as FilterIcon,
  AddShoppingCart as AddCartIcon,
  Inventory2Outlined as EmptyIcon,
  ViewColumnOutlined as ViewColumnIcon,
} from '@mui/icons-material';

import type { CatalogState, SpreadsheetRow } from '../types';
import { formatBRL, getNumber } from '../utils/productMapper';

interface Props {
  catalog: CatalogState;
  onAddItem: (row: SpreadsheetRow, qty: number) => void;
  onActiveColumnsChange: (columns: string[]) => void;
}

const MAX_FILTER_CARDINALITY = 25;

function ProductCatalog({ catalog, onAddItem, onActiveColumnsChange }: Props) {
  const { allHeaders, activeColumns, rows, fieldMapping } = catalog;
  const { idCol, nomeCol, precoCol, estoqueCol } = fieldMapping;

  const [search, setSearch] = useState('');
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [columnsMenuAnchor, setColumnsMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setColFilters((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([col]) => activeColumns.includes(col)),
      );
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [activeColumns]);

  const numericCols = useMemo(() => {
    return new Set(
      activeColumns.filter((col) =>
        rows.slice(0, 20).every((r) => r[col] === '' || r[col] === undefined || !isNaN(Number(r[col]))),
      ),
    );
  }, [activeColumns, rows]);

  const categoricalCols = useMemo(() => {
    return activeColumns.filter((col) => {
      if (col === idCol || numericCols.has(col)) return false;
      const unique = new Set(rows.map((r) => String(r[col] ?? '')));
      return unique.size > 0 && unique.size <= MAX_FILTER_CARDINALITY;
    });
  }, [activeColumns, rows, idCol, numericCols]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((row) => {
      const matchSearch = !q || activeColumns.some((col) => String(row[col] ?? '').toLowerCase().includes(q));
      const matchFilters = Object.entries(colFilters).every(([col, val]) => !val || String(row[col] ?? '') === val);
      return matchSearch && matchFilters;
    });
  }, [rows, search, colFilters, activeColumns]);

  function setQty(id: string, value: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, value) }));
  }

  function handleAdd(row: SpreadsheetRow) {
    const id = String(row[idCol] ?? '');
    const qty = quantities[id] ?? 1;
    const stock = getNumber(row, estoqueCol);
    if (qty > stock) return;
    onAddItem(row, qty);
    setQuantities((prev) => ({ ...prev, [id]: 1 }));
  }

  function handleColumnsChange(nextColumns: string[]) {
    const ordered = allHeaders.filter((h) => nextColumns.includes(h));
    if (ordered.length === 0) return;
    onActiveColumnsChange(ordered);
  }

  function toggleColumn(col: string) {
    if (activeColumns.includes(col)) {
      if (activeColumns.length === 1) return;
      handleColumnsChange(activeColumns.filter((c) => c !== col));
      return;
    }
    handleColumnsChange([...activeColumns, col]);
  }

  function renderCell(col: string, row: SpreadsheetRow) {
    const val = row[col];
    const stock = getNumber(row, estoqueCol);
    const outOfStock = stock <= 0;

    if (col === precoCol) {
      return <Typography sx={{ fontWeight: 700 }}>{formatBRL(Number(val ?? 0))}</Typography>;
    }
    if (col === estoqueCol) {
      return (
        <Chip
          size="small"
          label={outOfStock ? 'Sem estoque' : String(val ?? 0)}
          color={outOfStock ? 'error' : stock < 10 ? 'warning' : 'success'}
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      );
    }
    if (col === idCol) {
      return <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{String(val ?? '')}</Typography>;
    }
    if (col === nomeCol) {
      return <Typography sx={{ fontWeight: 600 }}>{String(val ?? '')}</Typography>;
    }
    if (categoricalCols.includes(col)) {
      return <Chip size="small" label={String(val ?? '')} color="primary" variant="outlined" />;
    }
    return <Typography color="text.secondary">{String(val ?? '—')}</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.2}>
        <TextField
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar em todos os campos..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          }}
        />

        {categoricalCols.map((col) => {
          const uniqueVals = Array.from(new Set(rows.map((r) => String(r[col] ?? '')))).sort();
          return (
            <FormControl key={col} size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{col}</InputLabel>
              <Select
                label={col}
                value={colFilters[col] ?? ''}
                onChange={(e) => setColFilters((prev) => ({ ...prev, [col]: e.target.value }))}
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="">Todos</MenuItem>
                {uniqueVals.filter(Boolean).map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        })}

        <Tooltip title="Editar colunas visiveis">
          <IconButton
            color="primary"
            onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}
            sx={{
              alignSelf: { xs: 'flex-end', md: 'center' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <ViewColumnIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Menu
        anchorEl={columnsMenuAnchor}
        open={Boolean(columnsMenuAnchor)}
        onClose={() => setColumnsMenuAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 360, minWidth: 260 } } }}
      >
        {allHeaders.map((col) => (
          <MenuItem key={col} onClick={() => toggleColumn(col)} dense>
            <Checkbox size="small" checked={activeColumns.includes(col)} />
            <ListItemText primary={col} />
          </MenuItem>
        ))}
      </Menu>

      <Typography variant="body2" color="text.secondary">
        {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado
        {filtered.length !== 1 ? 's' : ''}
        {(search || Object.values(colFilters).some(Boolean)) && ' com os filtros aplicados'}
      </Typography>

      {filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 8, textAlign: 'center', borderRadius: 2.5 }}>
          <EmptyIcon sx={{ fontSize: 42, color: 'text.disabled', mb: 1 }} />
          <Typography sx={{ fontWeight: 700 }}>Nenhum produto encontrado</Typography>
          <Typography variant="body2" color="text.secondary">Tente ajustar os filtros de busca</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {activeColumns.map((col) => (
                  <TableCell
                    key={col}
                    align="center"
                    sx={{ verticalAlign: 'middle', py: 1.25 }}
                  >
                    {col}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ verticalAlign: 'middle', py: 1.25 }}>Qtd</TableCell>
                <TableCell align="center" sx={{ verticalAlign: 'middle', py: 1.25 }}>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row, rowIdx) => {
                const id = String(row[idCol] ?? rowIdx);
                const stock = getNumber(row, estoqueCol);
                const outOfStock = stock <= 0;
                const qty = quantities[id] ?? 1;

                return (
                  <TableRow
                    key={id}
                    hover
                    sx={{ opacity: outOfStock ? 0.55 : 1, '&:last-child td': { borderBottom: 0 } }}
                  >
                    {activeColumns.map((col) => (
                      <TableCell
                        key={col}
                        align="center"
                        sx={{ verticalAlign: 'middle', py: 1.1 }}
                      >
                        {renderCell(col, row)}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ minWidth: 84 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={qty}
                        inputProps={{ min: 1, max: stock || undefined, style: { textAlign: 'center' } }}
                        disabled={outOfStock}
                        onChange={(e) => setQty(id, Number(e.target.value))}
                        sx={{ width: 74 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 132 }}>
                      <Tooltip title="Adicionar ao pedido">
                        <span>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddCartIcon fontSize="small" />}
                            disabled={outOfStock || qty > stock}
                            onClick={() => handleAdd(row)}
                          >
                            Adicionar
                          </Button>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

export default memo(ProductCatalog);
