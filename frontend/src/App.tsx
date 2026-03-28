import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import FileUploader from './components/FileUploader';
import ProductCatalog from './components/ProductCatalog';
import OrderCart from './components/OrderCart';
import ClientForm from './components/ClientForm';
import OrderDetails from './components/OrderDetails';
import OrderNote from './components/OrderNote';
import EmailModal from './components/EmailModal';

import { mapRowsToProducts, generateOrderNumber, formatDateBR } from './utils/productMapper';
import type {
  ColumnMapping,
  SpreadsheetRow,
  Product,
  OrderItem,
  Order,
  ClientInfo,
  SmtpConfig,
} from './types';

import { ShoppingCart, FileText, Mail, ChevronDown, ChevronUp, Package } from 'lucide-react';

const SMTP_STORAGE_KEY = 'pvs_smtp_config';

const DEFAULT_CLIENT: ClientInfo = {
  razaoSocial: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
};

const DEFAULT_SMTP: SmtpConfig = {
  serviceId: '',
  templateId: '',
  publicKey: '',
  toEmail: '',
  fromName: '',
};

function loadSmtpConfig(): SmtpConfig {
  try {
    const raw = localStorage.getItem(SMTP_STORAGE_KEY);
    return raw ? { ...DEFAULT_SMTP, ...JSON.parse(raw) } : DEFAULT_SMTP;
  } catch {
    return DEFAULT_SMTP;
  }
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
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

  // Persist SMTP config
  useEffect(() => {
    localStorage.setItem(SMTP_STORAGE_KEY, JSON.stringify(smtpConfig));
  }, [smtpConfig]);

  function handleFileParsed(_headers: string[], rows: SpreadsheetRow[], mapping: ColumnMapping) {
    const mapped = mapRowsToProducts(rows, mapping);
    setProducts(mapped);
    setCartItems([]);
  }

  function handleAddItem(product: Product, quantity: number) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const newQty = existing.quantidade + quantity;
        if (newQty > product.estoque) {
          toast.error(`Quantidade máxima em estoque: ${product.estoque}`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantidade: newQty, subtotal: newQty * product.precoUnitario }
            : i,
        );
      }
      toast.success(`${product.nome} adicionado ao pedido`);
      return [...prev, { product, quantidade: quantity, subtotal: quantity * product.precoUnitario }];
    });
  }

  function handleRemoveItem(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function handleChangeQty(productId: string, qty: number) {
    if (qty <= 0) return;
    setCartItems((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        const safeQty = Math.min(qty, i.product.estoque);
        return { ...i, quantidade: safeQty, subtotal: safeQty * i.product.precoUnitario };
      }),
    );
  }

  function handleOrderDetail(field: string, value: string) {
    if (field === 'vendedor') setVendedor(value);
    else if (field === 'condicaoPagamento') setCondicaoPagamento(value);
    else if (field === 'prazoEntrega') setPrazoEntrega(value);
    else if (field === 'observacoes') setObservacoes(value);
  }

  function buildOrder(): Order | null {
    if (cartItems.length === 0) {
      toast.error('Adicione ao menos um produto ao pedido.');
      return null;
    }
    if (!client.razaoSocial || !client.cnpj) {
      toast.error('Preencha os dados obrigatórios do cliente (Razão Social e CNPJ).');
      return null;
    }
    if (!vendedor || !condicaoPagamento || !prazoEntrega) {
      toast.error('Preencha todos os campos obrigatórios do pedido (Vendedor, Pagamento, Prazo).');
      return null;
    }

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
  const hasProducts = products.length > 0;
  const hasItems = cartItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      {/* Top navbar */}
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-7 w-7" />
            <div>
              <h1 className="text-xl font-bold leading-tight">Emissão de Pedido de Vendas</h1>
              <p className="text-xs text-blue-200">Distribuidora Central</p>
            </div>
          </div>

          {hasItems && (
            <div className="flex items-center gap-2 text-sm bg-blue-800 rounded-lg px-4 py-2">
              <ShoppingCart className="h-4 w-4" />
              <span>
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} —{' '}
                <strong>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Step 1: Load file */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white text-sm font-bold">1</span>
            <h2 className="text-base font-bold text-gray-800">Catálogo de Produtos</h2>
            <span className="text-xs text-gray-400">(CSV ou XLSX)</span>
          </div>
          <FileUploader onLoad={handleFileParsed} />
        </section>

        {/* Step 2: Select products */}
        {hasProducts && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <button
              className="w-full flex items-center gap-2 text-left"
              onClick={() => setCatalogOpen((o) => !o)}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white text-sm font-bold">2</span>
              <h2 className="text-base font-bold text-gray-800 flex-1">Selecionar Produtos</h2>
              <span className="text-xs text-gray-400">{products.length} no catálogo</span>
              {catalogOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>

            {catalogOpen && (
              <div className="mt-4">
                <ProductCatalog products={products} onAddItem={handleAddItem} />
              </div>
            )}
          </section>
        )}

        {/* Step 3: Cart */}
        {hasProducts && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white text-sm font-bold">3</span>
              <h2 className="text-base font-bold text-gray-800">Itens do Pedido</h2>
              {hasItems && (
                <span className="ml-auto text-sm font-semibold text-blue-700">
                  Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              )}
            </div>
            <OrderCart
              items={cartItems}
              onRemove={handleRemoveItem}
              onChangeQty={handleChangeQty}
            />
          </section>
        )}

        {/* Step 4: Client + details */}
        {hasProducts && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white text-sm font-bold">4</span>
              <h2 className="text-base font-bold text-gray-800">Informações do Pedido</h2>
            </div>

            <ClientForm value={client} onChange={setClient} />

            <OrderDetails
              vendedor={vendedor}
              condicaoPagamento={condicaoPagamento}
              prazoEntrega={prazoEntrega}
              observacoes={observacoes}
              onChange={handleOrderDetail}
            />
          </section>
        )}

        {/* Step 5: Actions */}
        {hasProducts && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-white text-sm font-bold">5</span>
              <h2 className="text-base font-bold text-gray-800">Emitir Pedido</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleEmitNote}
                className="flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 transition shadow-sm"
              >
                <FileText className="h-5 w-5" />
                Gerar Nota do Pedido
              </button>

              <button
                onClick={handleOpenEmail}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <Mail className="h-5 w-5" />
                Gerar &amp; Enviar E-mail
              </button>

              {hasItems && (
                <button
                  onClick={() => {
                    setCartItems([]);
                    setClient(DEFAULT_CLIENT);
                    setVendedor('');
                    setCondicaoPagamento('');
                    setPrazoEntrega('');
                    setObservacoes('');
                    toast('Pedido limpo.', { icon: '🗑️' });
                  }}
                  className="flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Limpar Pedido
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      {showNote && currentOrder && (
        <OrderNote order={currentOrder} onClose={() => setShowNote(false)} />
      )}

      {showEmail && currentOrder && (
        <EmailModal
          order={currentOrder}
          smtpConfig={smtpConfig}
          onConfigChange={setSmtpConfig}
          onClose={() => setShowEmail(false)}
        />
      )}
    </div>
  );
}
