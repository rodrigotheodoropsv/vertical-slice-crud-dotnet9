import { useState, useMemo } from 'react';
import type { CatalogState, SpreadsheetRow } from '../types';
import { formatBRL, getNumber } from '../utils/productMapper';
import { Search, Filter, ShoppingCart, PackageSearch } from 'lucide-react';

interface Props {
  catalog: CatalogState;
  onAddItem: (row: SpreadsheetRow, qty: number) => void;
}

/** Columns with ≤ this many unique values are offered as dropdown filters. */
const MAX_FILTER_CARDINALITY = 25;

export default function ProductCatalog({ catalog, onAddItem }: Props) {
  const { activeColumns, rows, fieldMapping } = catalog;
  const { idCol, nomeCol, precoCol, estoqueCol } = fieldMapping;

  const [search, setSearch] = useState('');
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  /** Columns whose values are numeric (right-align + special formatting). */
  const numericCols = useMemo(() => {
    return new Set(
      activeColumns.filter((col) =>
        rows.slice(0, 20).every(
          (r) => r[col] === '' || r[col] === undefined || !isNaN(Number(r[col])),
        ),
      ),
    );
  }, [activeColumns, rows]);

  /** Categorical columns: non-numeric, few unique values → become dropdown filters. */
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
      const matchSearch =
        !q || activeColumns.some((col) => String(row[col] ?? '').toLowerCase().includes(q));
      const matchFilters = Object.entries(colFilters).every(
        ([col, val]) => !val || String(row[col] ?? '') === val,
      );
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

  function renderCell(col: string, row: SpreadsheetRow) {
    const val = row[col];
    const stock = getNumber(row, estoqueCol);
    const outOfStock = stock <= 0;

    if (col === precoCol) {
      return (
        <span className="font-semibold text-gray-800">{formatBRL(Number(val ?? 0))}</span>
      );
    }
    if (col === estoqueCol) {
      return (
        <span
          className={`font-medium ${
            outOfStock ? 'text-red-500' : stock < 10 ? 'text-amber-600' : 'text-green-600'
          }`}
        >
          {outOfStock ? 'Sem estoque' : String(val ?? 0)}
        </span>
      );
    }
    if (col === idCol) {
      return <span className="font-mono text-xs text-gray-500">{String(val ?? '')}</span>;
    }
    if (col === nomeCol) {
      return <span className="font-medium text-gray-900">{String(val ?? '')}</span>;
    }
    if (categoricalCols.includes(col)) {
      return (
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {String(val ?? '')}
        </span>
      );
    }
    return <span className="text-gray-600">{String(val ?? '—')}</span>;
  }

  return (
    <div className="space-y-4">
      {/* Search & dynamic filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar em todos os campos…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {categoricalCols.map((col) => {
          const uniqueVals = Array.from(
            new Set(rows.map((r) => String(r[col] ?? ''))),
          ).sort();
          return (
            <div key={col} className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                className="rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                value={colFilters[col] ?? ''}
                onChange={(e) =>
                  setColFilters((prev) => ({ ...prev, [col]: e.target.value }))
                }
              >
                <option value="">Todos: {col}</option>
                {uniqueVals.filter(Boolean).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500">
        {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado
        {filtered.length !== 1 ? 's' : ''}
        {(search || Object.values(colFilters).some(Boolean)) && ' com os filtros aplicados'}
      </p>

      {/* Product table */}
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
                {activeColumns.map((col) => (
                  <th
                    key={col}
                    className={`px-4 py-3 ${numericCols.has(col) ? 'text-right' : 'text-left'}`}
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Qtd</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((row, rowIdx) => {
                const id = String(row[idCol] ?? rowIdx);
                const stock = getNumber(row, estoqueCol);
                const outOfStock = stock <= 0;
                const qty = quantities[id] ?? 1;
                return (
                  <tr
                    key={id}
                    className={`hover:bg-blue-50 transition-colors ${outOfStock ? 'opacity-50' : ''}`}
                  >
                    {activeColumns.map((col) => (
                      <td
                        key={col}
                        className={`px-4 py-3 ${
                          col === estoqueCol
                            ? 'text-center'
                            : numericCols.has(col)
                            ? 'text-right'
                            : ''
                        }`}
                      >
                        {renderCell(col, row)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        max={stock || undefined}
                        disabled={outOfStock}
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        value={qty}
                        onChange={(e) => setQty(id, Number(e.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={outOfStock || qty > stock}
                        onClick={() => handleAdd(row)}
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

