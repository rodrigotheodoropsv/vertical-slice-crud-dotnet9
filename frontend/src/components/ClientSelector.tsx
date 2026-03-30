import { memo } from 'react';
import { Autocomplete, TextField, Typography, Box } from '@mui/material';
import type { ClientRecord } from '../utils/clientParser';

interface Props {
  clients: ClientRecord[];
  value: ClientRecord | null;
  onSelect: (client: ClientRecord | null) => void;
}

function ClientSelector({ clients, value, onSelect }: Props) {
  return (
    <Autocomplete
      fullWidth
      value={value}
      options={clients}
      getOptionLabel={(c) =>
        [c.codigo, c.razaoSocial].filter(Boolean).join(' – ')
      }
      onChange={(_, val) => onSelect(val)}
      filterOptions={(options, { inputValue }) => {
        const q = inputValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return options.filter((c) => {
          const hay = [c.codigo, c.razaoSocial, c.cnpj, c.comprador]
            .join(' ')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          return hay.includes(q);
        });
      }}
      renderOption={(props, c) => (
        <Box component="li" {...props} key={c.codigo || c.razaoSocial}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {c.codigo ? `[${c.codigo}] ` : ''}{c.razaoSocial}
            </Typography>
            {(c.cnpj || c.comprador) && (
              <Typography variant="caption" color="text.secondary">
                {[c.cnpj, c.comprador ? `Comprador: ${c.comprador}` : ''].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Buscar cliente cadastrado"
          placeholder="Digite código, razão social ou CNPJ..."
          size="small"
        />
      )}
      noOptionsText="Nenhum cliente encontrado"
      clearOnEscape
      isOptionEqualToValue={(a, b) => a.codigo === b.codigo && a.razaoSocial === b.razaoSocial}
    />
  );
}

export default memo(ClientSelector);
