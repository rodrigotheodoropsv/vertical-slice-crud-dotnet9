import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
  AppBar, Toolbar, Box, Container, Typography, Paper,
  Chip, Collapse, IconButton, Stack, Button, Divider, Badge, Tooltip,
} from '@mui/material';
import {
  Inventory2 as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  ArticleOutlined as ArticleIcon,
  MailOutline as MailIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

import FileUploader from './components/FileUploader';
import ProductCatalog from './components/ProductCatalog';
import OrderCart from './components/OrderCart';
import ClientForm from './components/ClientForm';
import OrderDetails from './components/OrderDetails';
import OrderNote from './components/OrderNote';
import EmailModal from './components/EmailModal';

import { generateOrderNumber, formatDateBR, formatBRL } from './utils/productMapper';
import { BRANDING } from './utils/branding';
import type {
  CatalogState,
  SpreadsheetRow,
  OrderItem,
  Order,
  ClientInfo,
  SmtpConfig,
} from './types';

const SMTP_STORAGE_KEY = 'pvs_smtp_config';
const CATALOG_SESSION_KEY = 'pvs_catalog';

function saveCatalog(catalog: CatalogState) {
  try { sessionStorage.setItem(CATALOG_SESSION_KEY, JSON.stringify(catalog)); } catch { /* quota */ }
}

function loadCatalog(): CatalogState | null {
  try {
    const raw = sessionStorage.getItem(CATALOG_SESSION_KEY);
    return raw ? (JSON.parse(raw) as CatalogState) : null;
  } catch { return null; }
}

const DEFAULT_CLIENT: ClientInfo = {
  razaoSocial: '', cnpj: '', email: '', telefone: '', endereco: '',
};

const DEFAULT_SMTP: SmtpConfig = {
  serviceId: '', templateId: '', publicKey: '', toEmail: '', fromName: '',
};

function loadSmtpConfig(): SmtpConfig {
  try {
    const raw = localStorage.getItem(SMTP_STORAGE_KEY);
    return raw ? { ...DEFAULT_SMTP, ...JSON.parse(raw) } : DEFAULT_SMTP;
  } catch { return DEFAULT_SMTP; }
}

function StepBadge({ n }: { n: number }) {
  return (
    <Box
      sx={{
        width: 28, height: 28, borderRadius: '50%',
        bgcolor: 'primary.main', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13, flexShrink: 0,
      }}
    >
      {n}
    </Box>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState<CatalogState | null>(loadCatalog);
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [client, setClient] = useState<ClientInfo>(DEFAULT_CLIENT);
  const [vendedor, setVendedor] = useState('');
  const [condicaoPagamento, setCondicaoPagamento] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(loadSmtpConfig);

  const [showNote, setShowNote] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [logoVisible, setLogoVisible] = useState(true);

  useEffect(() => {
    localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(smtpConfig));
  }, [smtpConfig]);

  useEffect(() => {
    if (catalog) saveCatalog(catalog);
    else sessionStorage.removeItem(CATALOG_SESSION_KEY);
  }, [catalog]);

  const handleFileParsed = useCallback((newCatalog: CatalogState) => {
    setCatalog(newCatalog);
    setCartItems([]);
  }, []);

  const handleAddItem = useCallback((row: SpreadsheetRow, quantity: number) => {
    if (!catalog) return;
    const { idCol, nomeCol, precoCol, estoqueCol } = catalog.fieldMapping;
    const id = String(row[idCol] ?? '');
    const stock = Number(row[estoqueCol] ?? 0);
    const price = Number(row[precoCol] ?? 0);
    let toastType: 'success' | 'error' | null = null;
    let toastMessage = '';

    setCartItems((prev) => {
      const existing = prev.find((i) => String(i.row[idCol] ?? '') === id);
      if (existing) {
        const newQty = existing.quantidade + quantity;
        if (newQty > stock) {
          toastType = 'error';
          toastMessage = `Quantidade maxima em estoque: ${stock}`;
          return prev;
        }
        return prev.map((i) =>
          String(i.row[idCol] ?? '') === id
            ? { ...i, quantidade: newQty, subtotal: newQty * price }
            : i,
        );
      }
      toastType = 'success';
      toastMessage = `${String(row[nomeCol] ?? '')} adicionado ao pedido`;
      return [...prev, { row, quantidade: quantity, subtotal: quantity * price }];
    });

    if (toastType === 'error') toast.error(toastMessage);
    if (toastType === 'success') toast.success(toastMessage);
  }, [catalog]);

  const handleUpdateActiveColumns = useCallback((columns: string[]) => {
    setCatalog((prev) => {
      if (!prev) return prev;
      const ordered = prev.allHeaders.filter((h) => columns.includes(h));
      if (ordered.length === 0) return prev;
      return { ...prev, activeColumns: ordered };
    });
  }, []);

  const handleRemoveItem = useCallback((rowId: string) => {
    if (!catalog) return;
    const { idCol } = catalog.fieldMapping;
    setCartItems((prev) => prev.filter((i) => String(i.row[idCol] ?? '') !== rowId));
  }, [catalog]);

  const handleChangeQty = useCallback((rowId: string, qty: number) => {
    if (!catalog || qty <= 0) return;
    const { idCol, estoqueCol, precoCol } = catalog.fieldMapping;
    setCartItems((prev) =>
      prev.map((i) => {
        if (String(i.row[idCol] ?? '') !== rowId) return i;
        const stock = Number(i.row[estoqueCol] ?? 0);
        const price = Number(i.row[precoCol] ?? 0);
        const safeQty = Math.min(qty, stock);
        return { ...i, quantidade: safeQty, subtotal: safeQty * price };
      }),
    );
  }, [catalog]);

  const handleOrderDetail = useCallback((field: string, value: string) => {
    if (field === 'vendedor') setVendedor(value);
    else if (field === 'condicaoPagamento') setCondicaoPagamento(value);
    else if (field === 'prazoEntrega') setPrazoEntrega(value);
    else if (field === 'observacoes') setObservacoes(value);
  }, []);

  function buildOrder(): Order | null {
    if (cartItems.length === 0) { toast.error('Adicione ao menos um produto ao pedido.'); return null; }
    if (!client.razaoSocial || !client.cnpj) { toast.error('Preencha Razão Social e CNPJ do cliente.'); return null; }
    if (!vendedor || !condicaoPagamento || !prazoEntrega) { toast.error('Preencha Vendedor, Condição de Pagamento e Prazo de Entrega.'); return null; }
    const now = new Date();
    return {
      numero: generateOrderNumber(),
      data: formatDateBR(now.toISOString().slice(0, 10)),
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      cliente: client,
      itens: cartItems,
      total: cartItems.reduce((s, i) => s + i.subtotal, 0),
      observacoes,
      condicaoPagamento,
      prazoEntrega,
      vendedor,
      fieldMapping: catalog!.fieldMapping,
      activeColumns: catalog!.activeColumns,
    };
  }

  function handleEmitNote() {
    const order = buildOrder();
    if (!order) return;
    setCurrentOrder(order);
    setShowNote(true);
  }

  function handleOpenEmail() {
    const order = buildOrder();
    if (!order) return;
    setCurrentOrder(order);
    setShowEmail(true);
  }

  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const hasProducts = catalog !== null;
  const hasItems = cartItems.length > 0;

  function handleClearOrder() {
    setCartItems([]);
    setClient(DEFAULT_CLIENT);
    setVendedor('');
    setCondicaoPagamento('');
    setPrazoEntrega('');
    setObservacoes('');
    toast('Pedido limpo.', { icon: '🗑️' });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      {/* ─── Top AppBar ─── */}
      <AppBar position="sticky" elevation={0} sx={{ background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 60%, #1976D2 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
          {logoVisible ? (
            <Box
              component="img"
              src={BRANDING.logoPath}
              alt={BRANDING.logoAlt}
              onError={() => setLogoVisible(false)}
              sx={{
                mr: 1.5,
                height: { xs: 34, sm: 40 },
                width: 'auto',
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.1)',
                p: 0.25,
              }}
            />
          ) : (
            <InventoryIcon sx={{ mr: 1.5, fontSize: 28 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2, color: 'white' }}>
              Emissão de Pedido de Vendas
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75, color: 'white' }}>
              {BRANDING.companyName}
            </Typography>
          </Box>

          {hasItems && (
            <Tooltip title="Itens no pedido">
              <Badge badgeContent={cartItems.length} color="secondary" sx={{ mr: 1 }}>
                <Chip
                  icon={<ShoppingCartIcon sx={{ fontSize: '16px !important' }} />}
                  label={formatBRL(total)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 700, '& .MuiChip-icon': { color: 'white' } }}
                />
              </Badge>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* ─── Main content ─── */}
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>

          {/* Step 1 — Catálogo */}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
              <StepBadge n={1} />
              <Typography variant="subtitle1">Catálogo de Produtos</Typography>
              <Chip label="CSV ou XLSX" size="small" variant="outlined" sx={{ ml: 0.5 }} />
            </Stack>
            <FileUploader onLoad={handleFileParsed} />
          </Paper>

          {/* Step 2 — Selecionar Produtos */}
          {hasProducts && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
              <Box
                component="button"
                onClick={() => setCatalogOpen((o) => !o)}
                sx={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  px: { xs: 2.5, sm: 3 }, py: 2, background: 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <StepBadge n={2} />
                <Typography variant="subtitle1" sx={{ flex: 1, ml: 1.5 }}>Selecionar Produtos</Typography>
                <Chip label={`${catalog?.rows.length ?? 0} no catálogo`} size="small" color="primary" variant="outlined" sx={{ mr: 1 }} />
                <IconButton size="small" disableRipple>
                  {catalogOpen ? <ArrowUpIcon /> : <ArrowDownIcon />}
                </IconButton>
              </Box>
              <Collapse in={catalogOpen}>
                <Divider />
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {catalog && (
                    <ProductCatalog
                      catalog={catalog}
                      onAddItem={handleAddItem}
                      onActiveColumnsChange={handleUpdateActiveColumns}
                    />
                  )}
                </Box>
              </Collapse>
            </Paper>
          )}

          {/* Step 3 — Carrinho */}
          {hasProducts && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                <StepBadge n={3} />
                <Typography variant="subtitle1" sx={{ flex: 1 }}>Itens do Pedido</Typography>
                {hasItems && (
                  <Typography variant="subtitle2" color="primary">
                    Total: {formatBRL(total)}
                  </Typography>
                )}
              </Stack>
              <OrderCart
                items={cartItems}
                fieldMapping={catalog!.fieldMapping}
                onRemove={handleRemoveItem}
                onChangeQty={handleChangeQty}
              />
            </Paper>
          )}

          {/* Step 4 — Informações do Pedido */}
          {hasProducts && (
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 0.5 }}>
                <StepBadge n={4} />
                <Typography variant="subtitle1">Informações do Pedido</Typography>
              </Stack>
              <ClientForm value={client} onChange={setClient} />
              <OrderDetails
                vendedor={vendedor}
                condicaoPagamento={condicaoPagamento}
                prazoEntrega={prazoEntrega}
                observacoes={observacoes}
                onChange={handleOrderDetail}
              />
            </Stack>
          )}

          {/* Step 5 — Emitir */}
          {hasProducts && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
                <StepBadge n={5} />
                <Typography variant="subtitle1">Emitir Pedido</Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ArticleIcon />}
                  onClick={handleEmitNote}
                  sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  Gerar Nota do Pedido
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<MailIcon />}
                  onClick={handleOpenEmail}
                  color="secondary"
                >
                  Gerar &amp; Enviar E-mail
                </Button>
                {hasItems && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<DeleteIcon />}
                    onClick={handleClearOrder}
                    color="error"
                  >
                    Limpar Pedido
                  </Button>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>

      {showNote && currentOrder && (
        <OrderNote
          order={currentOrder}
          branding={BRANDING}
          onClose={() => setShowNote(false)}
        />
      )}
      {showEmail && currentOrder && (
        <EmailModal
          order={currentOrder}
          branding={BRANDING}
          smtpConfig={smtpConfig}
          onConfigChange={setSmtpConfig}
          onClose={() => setShowEmail(false)}
        />
      )}
    </Box>
  );
}
