import { useState, useEffect, useCallback, useRef } from 'react';
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
  History as HistoryIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

import FileUploader from './components/FileUploader';
import ProductCatalog from './components/ProductCatalog';
import OrderCart from './components/OrderCart';
import ClientForm from './components/ClientForm';
import OrderDetails from './components/OrderDetails';
import OrderNote from './components/OrderNote';
import OrcamentoNote from './components/OrcamentoNote';
import EmailModal from './components/EmailModal';
import EmailHistoryModal from './components/EmailHistoryModal';

import { generateOrderNumber, generateOrcamentoNumber, formatDateBR, formatBRL, guessFieldMapping } from './utils/productMapper';
import { fetchDefaultCatalog, checkCatalogFileChanged } from './utils/fileParser';
import { fetchClients, checkClientFileChanged } from './utils/clientParser';
import type { ClientRecord } from './utils/clientParser';
import { BRANDING } from './utils/branding';
import {
  DEFAULT_DISCOUNT,
  buildOrderItem,
  calculateOrderItemPricing,
  calculateOrderSummary,
} from './utils/pricing';
import type {
  CatalogState,
  SpreadsheetRow,
  DiscountConfig,
  OrderItem,
  Order,
  ClientInfo,
  SmtpConfig,
} from './types';

const SMTP_STORAGE_KEY = 'pvs_smtp_config';

const DEFAULT_CLIENT: ClientInfo = {
  razaoSocial: '', cnpj: '', email: '', telefone: '', endereco: '', comprador: '',
};

const DEFAULT_SMTP: SmtpConfig = {
  salesEmail: 'vendas1@lubefer.com.br',
  fromName: 'Claudio Theodoro',
  fromCargo: 'Assistente Comercial',
  fromCelular: '(11)99619-9894',
};

function loadSmtpConfig(): SmtpConfig {
  try {
    const raw = localStorage.getItem(SMTP_STORAGE_KEY);
    if (!raw) return DEFAULT_SMTP;
    const parsed = JSON.parse(raw) as Partial<SmtpConfig>;
    return {
      ...DEFAULT_SMTP,
      ...parsed,
      // Backward compatibility: old localStorage may persist empty strings.
      salesEmail: parsed.salesEmail?.trim() || DEFAULT_SMTP.salesEmail,
      fromName: parsed.fromName?.trim() || DEFAULT_SMTP.fromName,
      fromCargo: parsed.fromCargo?.trim() || DEFAULT_SMTP.fromCargo,
      fromCelular: parsed.fromCelular?.trim() || DEFAULT_SMTP.fromCelular,
    };
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
  const [catalog, setCatalog] = useState<CatalogState | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const catalogMetaRef = useRef<{ lastModified: string | null; resolvedPath: string | null }>(
    { lastModified: null, resolvedPath: null },
  );
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const clientMetaRef = useRef<{ lastModified: string | null; resolvedPath: string | null }>(
    { lastModified: null, resolvedPath: null },
  );
  const [client, setClient] = useState<ClientInfo>(DEFAULT_CLIENT);
  const [vendedor, setVendedor] = useState('Claudio José Theodoro');
  const [condicaoPagamento, setCondicaoPagamento] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [frete, setFrete] = useState('');
  const [validadeOrcamento, setValidadeOrcamento] = useState('');
  const [orderDiscount, setOrderDiscount] = useState<DiscountConfig>(DEFAULT_DISCOUNT);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(loadSmtpConfig);

  const [showNote, setShowNote] = useState(false);
  const [showOrcamento, setShowOrcamento] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showEmailHistory, setShowEmailHistory] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [logoVisible, setLogoVisible] = useState(true);

  // Auto-load default catalog from public/catalogo/ on every page load
  useEffect(() => {
    setCatalogLoading(true);
    fetchDefaultCatalog().then((result) => {
      if (!result) return;
      const { headers, rows, fileName, lastModified, resolvedPath } = result;
      const newCatalog: CatalogState = {
        fileName,
        allHeaders: headers,
        activeColumns: headers,
        rows,
        fieldMapping: guessFieldMapping(headers),
      };
      setCatalog(newCatalog);
      catalogMetaRef.current = { lastModified, resolvedPath };
      toast.success(`Catálogo padrão carregado: ${rows.length} produtos`, { icon: '📦' });
    }).finally(() => setCatalogLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30 s for catalog file changes and reload automatically
  useEffect(() => {
    const POLL_MS = 30_000;
    const id = setInterval(async () => {
      const { resolvedPath, lastModified } = catalogMetaRef.current;
      if (!resolvedPath) return;
      const changed = await checkCatalogFileChanged(resolvedPath, lastModified);
      if (!changed) return;
      const result = await fetchDefaultCatalog();
      if (!result) return;
      const { headers, rows, fileName, lastModified: lm, resolvedPath: rp } = result;
      const newCatalog: CatalogState = {
        fileName,
        allHeaders: headers,
        activeColumns: headers,
        rows,
        fieldMapping: guessFieldMapping(headers),
      };
      setCatalog(newCatalog);
      catalogMetaRef.current = { lastModified: lm, resolvedPath: rp };
      toast.success(`Catálogo atualizado: ${rows.length} produtos`, { icon: '🔄' });
    }, POLL_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-load client list from public/clientes/ on startup
  useEffect(() => {
    setClientsLoading(true);
    fetchClients().then(({ clients: list, lastModified, resolvedPath }) => {
      if (list.length > 0) {
        setClients(list);
        clientMetaRef.current = { lastModified, resolvedPath };
        toast.success(`${list.length} clientes carregados`, { icon: '👤' });
      }
    }).finally(() => setClientsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 30 s for file changes and reload clients automatically
  useEffect(() => {
    const POLL_MS = 30_000;
    const id = setInterval(async () => {
      const { resolvedPath, lastModified } = clientMetaRef.current;
      if (!resolvedPath) return;
      const changed = await checkClientFileChanged(resolvedPath, lastModified);
      if (!changed) return;
      const { clients: list, lastModified: lm, resolvedPath: rp } = await fetchClients();
      if (list.length > 0) {
        setClients(list);
        clientMetaRef.current = { lastModified: lm, resolvedPath: rp };
        toast.success(`Clientes atualizados (${list.length})`, { icon: '🔄' });
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(smtpConfig));
  }, [smtpConfig]);



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
        return prev.map((i) => {
          if (String(i.row[idCol] ?? '') !== id) return i;
          const pricing = calculateOrderItemPricing(price, newQty, i.discount);
          return { ...i, ...pricing, ipiPct: i.ipiPct, ipiValue: (pricing.subtotal * i.ipiPct) / 100 };
        });
      }
      toastType = 'success';
      toastMessage = `${String(row[nomeCol] ?? '')} adicionado ao pedido`;
      return [...prev, buildOrderItem(row, quantity, catalog.fieldMapping, DEFAULT_DISCOUNT)];
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
        const pricing = calculateOrderItemPricing(price, safeQty, i.discount);
        return { ...i, ...pricing, ipiPct: i.ipiPct, ipiValue: (pricing.subtotal * i.ipiPct) / 100 };
      }),
    );
  }, [catalog]);

  const handleItemDiscountChange = useCallback((rowId: string, discount: DiscountConfig) => {
    if (!catalog) return;
    const { idCol, precoCol } = catalog.fieldMapping;
    setCartItems((prev) =>
      prev.map((item) => {
        if (String(item.row[idCol] ?? '') !== rowId) return item;
        const price = Number(item.row[precoCol] ?? 0);
        const pricing = calculateOrderItemPricing(price, item.quantidade, discount);
        return { ...item, ...pricing, ipiPct: item.ipiPct, ipiValue: (pricing.subtotal * item.ipiPct) / 100 };
      }),
    );
  }, [catalog]);

  const handleOrderDetail = useCallback((field: string, value: string) => {
    if (field === 'vendedor') setVendedor(value);
    else if (field === 'condicaoPagamento') setCondicaoPagamento(value);
    else if (field === 'prazoEntrega') setPrazoEntrega(value);
    else if (field === 'observacoes') setObservacoes(value);
    else if (field === 'frete') setFrete(value);
    else if (field === 'validadeOrcamento') setValidadeOrcamento(value);
  }, []);

  function buildOrder(): Order | null {
    if (cartItems.length === 0) { toast.error('Adicione ao menos um produto ao pedido.'); return null; }
    if (!client.razaoSocial || !client.cnpj) { toast.error('Preencha Razão Social e CNPJ do cliente.'); return null; }
    if (!condicaoPagamento || !prazoEntrega) { toast.error('Preencha Condição de Pagamento e Prazo de Entrega.'); return null; }
    const now = new Date();
    const summary = calculateOrderSummary(cartItems, orderDiscount);
    return {
      numero: generateOrderNumber(),
      data: formatDateBR(now.toISOString().slice(0, 10)),
      hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      cliente: client,
      itens: cartItems,
      grossTotal: summary.grossTotal,
      itemsSubtotal: summary.itemsSubtotal,
      itemDiscountTotal: summary.itemDiscountTotal,
      orderDiscount,
      orderDiscountTotal: summary.orderDiscountTotal,
      total: summary.total,
      totalProdutos: summary.totalProdutos,
      totalComImpostos: summary.totalComImpostos,
      observacoes,
      frete,
      validadeOrcamento,
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

  function handleEmitOrcamento() {
    const order = buildOrder();
    if (!order) return;
    setCurrentOrder({ ...order, numero: generateOrcamentoNumber() });
    setShowOrcamento(true);
  }

  function handleOpenEmail() {
    const order = buildOrder();
    if (!order) return;
    setCurrentOrder(order);
    setShowEmail(true);
  }

  const pricingSummary = calculateOrderSummary(cartItems, orderDiscount);
  const total = pricingSummary.total;
  const hasProducts = catalog !== null;
  const hasItems = cartItems.length > 0;

  function handleClearOrder() {
    setCartItems([]);
    setClient(DEFAULT_CLIENT);
    setVendedor('Claudio José Theodoro');
    setCondicaoPagamento('');
    setPrazoEntrega('');
    setObservacoes('');
    setFrete('');
    setValidadeOrcamento('');
    setOrderDiscount(DEFAULT_DISCOUNT);
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
            <FileUploader onLoad={handleFileParsed} defaultCatalog={catalog} loading={catalogLoading} />
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
                  <Stack alignItems="flex-end" spacing={0.25}>
                    {pricingSummary.itemDiscountTotal + pricingSummary.orderDiscountTotal > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Economia: {formatBRL(pricingSummary.itemDiscountTotal + pricingSummary.orderDiscountTotal)}
                      </Typography>
                    )}
                    <Typography variant="subtitle2" color="primary">
                    Total: {formatBRL(total)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
              <OrderCart
                items={cartItems}
                fieldMapping={catalog!.fieldMapping}
                orderDiscount={orderDiscount}
                onRemove={handleRemoveItem}
                onChangeQty={handleChangeQty}
                onItemDiscountChange={handleItemDiscountChange}
                onOrderDiscountChange={setOrderDiscount}
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
              <ClientForm value={client} onChange={setClient} clients={clients} onClear={() => setClient(DEFAULT_CLIENT)} loading={clientsLoading} />
              <OrderDetails
                condicaoPagamento={condicaoPagamento}
                prazoEntrega={prazoEntrega}
                observacoes={observacoes}
                frete={frete}
                validadeOrcamento={validadeOrcamento}
                totalPedido={total}
                descontoPedido={pricingSummary.orderDiscountTotal}
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
                  Gerar Pedido
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ArticleIcon />}
                  onClick={handleEmitOrcamento}
                  color="success"
                >
                  Gerar Orçamento
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
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<HistoryIcon />}
                  onClick={() => setShowEmailHistory(true)}
                >
                  Historico de Envios
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
      {showOrcamento && currentOrder && (
        <OrcamentoNote
          order={currentOrder}
          branding={BRANDING}
          onClose={() => setShowOrcamento(false)}
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
      {showEmailHistory && (
        <EmailHistoryModal
          open={showEmailHistory}
          onClose={() => setShowEmailHistory(false)}
        />
      )}
    </Box>
  );
}
