import { memo } from 'react';
import {
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import type { DiscountConfig, DiscountKind } from '../types';

interface Props {
  discount: DiscountConfig;
  onChange: (discount: DiscountConfig) => void;
  amountLabel: string;
}

function DiscountInputControl({ discount, onChange, amountLabel }: Props) {
  function handleAmountChange(value: string) {
    const normalized = value.replace(',', '.');
    const amount = Number(normalized);
    onChange({
      ...discount,
      amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
    });
  }

  function handleKindChange(_event: React.MouseEvent<HTMLElement>, kind: DiscountKind | null) {
    if (!kind) return;
    onChange({ ...discount, kind });
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <TextField
        size="small"
        type="number"
        label={amountLabel}
        value={discount.amount || ''}
        onChange={(event) => handleAmountChange(event.target.value)}
        inputProps={{ min: 0, step: discount.kind === 'percent' ? 1 : 0.01 }}
        sx={{ minWidth: 110 }}
        InputProps={{
          startAdornment: discount.kind === 'value' ? <InputAdornment position="start">R$</InputAdornment> : undefined,
          endAdornment: discount.kind === 'percent' ? <InputAdornment position="end">%</InputAdornment> : undefined,
        }}
      />

      <ToggleButtonGroup
        size="small"
        exclusive
        value={discount.kind}
        onChange={handleKindChange}
        color="primary"
      >
        <ToggleButton value="value" sx={{ px: 1.5 }}>R$</ToggleButton>
        <ToggleButton value="percent" sx={{ px: 1.5 }}>%</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

export default memo(DiscountInputControl);