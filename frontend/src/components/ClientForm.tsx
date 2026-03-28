import type { ClientInfo } from '../types';
import { User } from 'lucide-react';

interface Props {
  value: ClientInfo;
  onChange: (v: ClientInfo) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function formatCnpj(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export default function ClientForm({ value, onChange }: Props) {
  function set<K extends keyof ClientInfo>(key: K, v: ClientInfo[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-5 w-5 text-blue-700" />
        <h3 className="font-semibold text-gray-800">Dados do Cliente</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Razão Social"
            required
            placeholder="Ex.: Comércio Silva Ltda."
            value={value.razaoSocial}
            onChange={(v) => set('razaoSocial', v)}
          />
        </div>

        <Field
          label="CNPJ"
          required
          placeholder="00.000.000/0000-00"
          value={value.cnpj}
          onChange={(v) => set('cnpj', formatCnpj(v))}
        />

        <Field
          label="E-mail"
          type="email"
          required
          placeholder="contato@empresa.com.br"
          value={value.email}
          onChange={(v) => set('email', v)}
        />

        <Field
          label="Telefone"
          placeholder="(11) 91234-5678"
          value={value.telefone}
          onChange={(v) => set('telefone', formatPhone(v))}
        />

        <div className="sm:col-span-2">
          <Field
            label="Endereço de Entrega"
            placeholder="Rua, nº – Bairro – Cidade/UF – CEP"
            value={value.endereco}
            onChange={(v) => set('endereco', v)}
          />
        </div>
      </div>
    </div>
  );
}
