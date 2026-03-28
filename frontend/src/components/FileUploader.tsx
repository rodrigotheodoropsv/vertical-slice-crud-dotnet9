import { useState } from 'react';
import { parseSpreadsheet } from '../utils/fileParser';
import { guessFieldMapping } from '../utils/productMapper';
import type { CatalogState, FieldMapping, SpreadsheetRow } from '../types';
import { UploadCloud, FileSpreadsheet, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onLoad: (catalog: CatalogState) => void;
}

const FIELD_LABELS: Record<keyof FieldMapping, string> = {
  idCol:      'Coluna de ID / Código',
  nomeCol:    'Coluna de Nome do Produto',
  precoCol:   'Coluna de Preço Unitário',
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
    // restore preserving original file order
    setActiveColumns(() => allHeaders.filter((h) => h === col || activeColumns.includes(h)));
  }

  function handleConfirm() {
    const keys = Object.keys(fieldMapping) as (keyof FieldMapping)[];
    const missing = keys.filter((k) => !fieldMapping[k]);
    if (missing.length) {
      toast.error(
        `Selecione as colunas obrigatórias: ${missing.map((k) => FIELD_LABELS[k]).join(', ')}`,
      );
      return;
    }
    // ensure required mapping cols are in activeColumns even if the vendor removed them
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

  // ─── Done banner ─────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">{fileName}</p>
            <p className="text-sm text-green-600">
              {rows.length} produtos · {activeColumns.length} colunas ativas
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-green-700 underline hover:text-green-900"
        >
          Trocar arquivo
        </button>
      </div>
    );
  }

  // ─── Column-selection step ────────────────────────────────────────────────────
  if (step === 'select') {
    const removedColumns = allHeaders.filter((h) => !activeColumns.includes(h));

    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-5">
        {/* File info */}
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-700" />
          <span className="font-semibold text-blue-900">{fileName}</span>
          <span className="ml-auto text-sm text-blue-600">{rows.length} linhas detectadas</span>
        </div>

        {/* Column chips */}
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-2">
            Colunas detectadas — remova as que não são necessárias clicando no{' '}
            <X className="inline h-3 w-3" />:
          </p>
          <div className="flex flex-wrap gap-2">
            {allHeaders.map((col) => {
              const isActive = activeColumns.includes(col);
              return isActive ? (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                >
                  {col}
                  <button
                    onClick={() => removeColumn(col)}
                    className="ml-0.5 text-blue-400 hover:text-red-500 transition-colors"
                    title="Remover coluna"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <button
                  key={col}
                  onClick={() => restoreColumn(col)}
                  className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-400 line-through hover:bg-blue-100 hover:text-blue-700 hover:no-underline transition"
                  title="Clique para restaurar"
                >
                  {col}
                </button>
              );
            })}
          </div>
          {removedColumns.length > 0 && (
            <p className="text-xs text-gray-400 mt-1.5">
              {removedColumns.length} coluna(s) removida(s) — clique para restaurar
            </p>
          )}
        </div>

        {/* Required field designation */}
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-2">
            Campos obrigatórios para geração do pedido:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(FIELD_LABELS) as (keyof FieldMapping)[]).map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-blue-800 mb-1">
                  {FIELD_LABELS[field]} <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={fieldMapping[field]}
                  onChange={(e) =>
                    setFieldMapping((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                >
                  <option value="">-- Selecione --</option>
                  {allHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Confirmar e Carregar
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-blue-300 px-5 py-2 text-sm text-blue-700 hover:bg-blue-100 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ─── Idle / drop zone ─────────────────────────────────────────────────────────
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition ${
        dragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
      }`}
    >
      <UploadCloud className="h-10 w-10 text-blue-400 mb-3" />
      <p className="font-semibold text-gray-700 mb-1">Arraste um arquivo ou clique para selecionar</p>
      <p className="text-sm text-gray-400 mb-4">CSV, XLSX ou XLS</p>
      <label className="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition">
        Selecionar Arquivo
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </label>
    </div>
  );
}

