import { useRef, useCallback, useEffect } from 'react';
import { Box, Divider, IconButton, Tooltip } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  StrikethroughS,
  FormatColorText,
  FormatColorFill,
  FormatClear,
} from '@mui/icons-material';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editorRef    = useRef<HTMLDivElement>(null);
  const savedRange   = useRef<Range | null>(null);
  const textColorRef = useRef<HTMLInputElement>(null);
  const bgColorRef   = useRef<HTMLInputElement>(null);

  // Initialize on mount + enable CSS-based styling (produces <span style="…"> instead of <font> tags)
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value || '';
    try { document.execCommand('styleWithCSS', false, 'true'); } catch { /* no-op */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync when parent resets to empty (e.g., Limpar button)
  useEffect(() => {
    if (value === '' && editorRef.current && editorRef.current.innerHTML !== '') {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function exec(cmd: string, val?: string) {
    restoreSelection();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  // ── Toolbar button helpers ──────────────────────────────────────────────────

  function toolBtn(e: React.MouseEvent, cmd: string, val?: string) {
    e.preventDefault();
    exec(cmd, val);
  }

  /** Save selection, then programmatically open the hidden color input. */
  function openColorPicker(e: React.MouseEvent, ref: React.RefObject<HTMLInputElement | null>) {
    e.preventDefault();
    saveSelection();
    ref.current?.click();
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'background.paper' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 0.75, py: 0.5,
          bgcolor: 'grey.50',
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.25,
        }}
      >
        {/* Bold */}
        <Tooltip title="Negrito (Ctrl+B)">
          <IconButton size="small" onMouseDown={(e) => toolBtn(e, 'bold')}>
            <FormatBold sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* Italic */}
        <Tooltip title="Itálico (Ctrl+I)">
          <IconButton size="small" onMouseDown={(e) => toolBtn(e, 'italic')}>
            <FormatItalic sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* Underline */}
        <Tooltip title="Sublinhado (Ctrl+U)">
          <IconButton size="small" onMouseDown={(e) => toolBtn(e, 'underline')}>
            <FormatUnderlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* Strikethrough */}
        <Tooltip title="Tachado">
          <IconButton size="small" onMouseDown={(e) => toolBtn(e, 'strikeThrough')}>
            <StrikethroughS sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Text color */}
        <Tooltip title="Cor do texto">
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <IconButton size="small" onMouseDown={(e) => openColorPicker(e, textColorRef)}>
              <FormatColorText sx={{ fontSize: 18 }} />
            </IconButton>
            <input
              ref={textColorRef}
              type="color"
              defaultValue="#cc0000"
              onChange={(e) => exec('foreColor', e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', top: 0, left: 0 }}
            />
          </Box>
        </Tooltip>

        {/* Background / highlight color */}
        <Tooltip title="Cor de fundo (destaque)">
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <IconButton size="small" onMouseDown={(e) => openColorPicker(e, bgColorRef)}>
              <FormatColorFill sx={{ fontSize: 18 }} />
            </IconButton>
            <input
              ref={bgColorRef}
              type="color"
              defaultValue="#ffff00"
              onChange={(e) => exec('backColor', e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none', top: 0, left: 0 }}
            />
          </Box>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Font size — native select for simplicity (avoids MUI Select focus issues) */}
        <Tooltip title="Tamanho da fonte">
          <select
            defaultValue="3"
            onMouseDown={saveSelection}
            onChange={(e) => exec('fontSize', e.target.value)}
            style={{
              fontSize: 12,
              padding: '3px 6px',
              borderRadius: 4,
              border: '1px solid #ccc',
              cursor: 'pointer',
              outline: 'none',
              background: 'white',
              color: 'inherit',
            }}
          >
            <option value="1">Mínimo</option>
            <option value="2">Pequeno</option>
            <option value="3">Normal</option>
            <option value="4">Grande</option>
            <option value="5">Muito grande</option>
            <option value="6">Enorme</option>
          </select>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />

        {/* Clear formatting */}
        <Tooltip title="Remover formatação">
          <IconButton size="small" onMouseDown={(e) => toolBtn(e, 'removeFormat')}>
            <FormatClear sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Editable area ───────────────────────────────────────────────────── */}
      <Box
        ref={editorRef}
        component="div"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onSelect={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
        data-placeholder={placeholder ?? 'Digite sua mensagem…'}
        sx={{
          minHeight: 120,
          maxHeight: 300,
          overflowY: 'auto',
          p: 1.5,
          outline: 'none',
          fontSize: '14px',
          lineHeight: 1.65,
          cursor: 'text',
          '&:empty::before': {
            content: 'attr(data-placeholder)',
            color: 'text.disabled',
            pointerEvents: 'none',
            fontStyle: 'italic',
          },
        }}
      />
    </Box>
  );
}
