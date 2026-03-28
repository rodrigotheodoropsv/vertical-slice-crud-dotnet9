import { useState, useMemo } from 'react';
import type { Product } from '../types';
import { formatBRL } from '../utils/productMapper';
import { Search, Filter, ShoppingCart, PackageSearch } from 'lucide-react';

interface Props {
  products: Product[];
  onAddItem: (product: Product, quantity: number) => void;
}

export default function ProductCatalog({ products, onAddItem }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const categories = useMemo(
    () => ['', ...Array.from(new Set(products.map((p) => p.categoria))).sort()],
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.nome.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      const matchCat = !categoryFilter || p.categoria === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  function setQty(id: string, value: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, value) }));
  }

  function handleAdd(product: Product) {
    const qty = quantities[product.id] ?? 1;
    if (qty > product.estoque) return;
    onAddItem(product, qty);
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  }

  return (
    <div className="space-y-4">
      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou categoria…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            className="rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.filter(Boolean).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500">
        {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        {(search || categoryFilter) && ' com os filtros aplicados'}
      </p>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <PackageSearch className="h-12 w-12" />
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Produto</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-right">Preço Unit.</th>
                <th className="px-4 py-3 text-center">Estoque</th>
                <th className="px-4 py-3 text-center">Qtd</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((product) => {
                const qty = quantities[product.id] ?? 1;
                const outOfStock = product.estoque <= 0;
                return (
                  <tr key={product.id} className={`hover:bg-blue-50 transition-colors ${outOfStock ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{product.nome}</div>
                      {product.extra['Descrição'] && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {String(product.extra['Descrição'])}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {product.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {formatBRL(product.precoUnitario)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${outOfStock ? 'text-red-500' : product.estoque < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                        {outOfStock ? 'Sem estoque' : product.estoque}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={product.estoque}
                        disabled={outOfStock}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        value={qty}
                        onChange={(e) => setQty(product.id, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={outOfStock || qty > product.estoque}
                        onClick={() => handleAdd(product)}
                        title="Adicionar ao pedido"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Adicionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
