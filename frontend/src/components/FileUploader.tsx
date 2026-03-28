import { useState } from 'react';
import { parseSpreadsheet } from '../utils/fileParser';
import { guessColumnMapping } from '../utils/productMapper';
import type { ColumnMapping, SpreadsheetRow } from '../types';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  onLoad: (headers: string[], rows: SpreadsheetRow[], mapping: ColumnMapping) => void;
}

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = [
  'id',
  'nome',
  'categoria',
  'unidade',
  'precoUnitario',
  'estoque',
];

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  id: 'Código / ID',
  nome: 'Nome do Produto',
  categoria: 'Categoria',
  unidade: 'Unidade',
  precoUnitario: 'Preço Unitário',
  estoque: 'Estoque Disponível',
};

export default function FileUploader({ onLoad }: Props) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<SpreadsheetRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<'idle' | 'mapping' | 'done'>('idle');

  async function handleFile(file: File) {
    try {
      const { headers: h, rows: r } = await parseSpreadsheet(file);
      if (h.length === 0) throw new Error('Arquivo sem colunas detectadas.');
      const guessed = guessColumnMapping(h);
      setHeaders(h);
      setRows(r);
      setFileName(file.name);
      setMapping({ id: '', nome: '', categoria: '', unidade: '', precoUnitario: '', estoque: '', ...guessed } as ColumnMapping);
      setStep('mapping');
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

  function handleConfirm() {
    if (!mapping) return;
    const missing = REQUIRED_FIELDS.filter((f) => !mapping[f]);
    if (missing.length) {
      toast.error(`Mapeie os campos: ${missing.map((f) => FIELD_LABELS[f]).join(', ')}`);
      return;
    }
    setStep('done');
    onLoad(headers, rows, mapping);
    toast.success(`${rows.length} produtos carregados com sucesso!`);
  }

  function handleReset() {
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setFileName('');
    setStep('idle');
  }

  if (step === 'done') {
    return (
      <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">{fileName}</p>
            <p className="text-sm text-green-600">{rows.length} produtos carregados</p>
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

  if (step === 'mapping' && mapping) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-700" />
          <span className="font-semibold text-blue-900">{fileName}</span>
          <span className="ml-auto text-sm text-blue-600">{rows.length} linhas detectadas</span>
        </div>

        <p className="text-sm text-blue-800">
          Confirme ou ajuste o mapeamento das colunas do arquivo para os campos obrigatórios:
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REQUIRED_FIELDS.map((field) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-blue-800 mb-1">
                {FIELD_LABELS[field]}
              </label>
              <select
                className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={mapping[field]}
                onChange={(e) => setMapping((prev) => prev ? ({ ...prev, [field]: e.target.value }) : prev)}
              >
                <option value="">-- Selecione a coluna --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleConfirm}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
          >
            Confirmar Mapeamento
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

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}`}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <UploadCloud className={`h-12 w-12 ${dragging ? 'text-blue-600' : 'text-gray-400'}`} />
      <div className="text-center">
        <p className="font-semibold text-gray-700">Arraste ou clique para carregar o catálogo</p>
        <p className="text-sm text-gray-500 mt-1">Suporta <strong>.csv</strong> e <strong>.xlsx</strong></p>
      </div>
      <a
        href="/produtos_catalogo.csv"
        download
        onClick={(e) => e.stopPropagation()}
        className="text-xs text-blue-600 underline hover:text-blue-800"
      >
        ↓ Baixar planilha de exemplo
      </a>
    </div>
  );
}
