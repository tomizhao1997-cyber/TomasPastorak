'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';

type Status = 'Not started' | 'In progress' | 'Done';
type Formato = '' | 'Reel' | 'Carrusel' | 'Historia' | 'TikTok' | 'Anuncio';

type Row = {
  id: string;
  position: number;
  name: string;
  anotaciones: string;
  copy: string;
  crudo: string;
  estado: Status;
  fecha: string;
  formato: Formato;
  referencia: string;
  videoTerminado: string;
  body: string;
};

type View = 'table' | 'board';
type SyncState = 'loading' | 'saving' | 'saved' | 'error';

const VIEW_KEY = 'aurum-contenido-view';
const SAVE_DELAY = 500;
const STATUSES: Status[] = ['Not started', 'In progress', 'Done'];
const FORMATOS: Formato[] = ['Reel', 'Carrusel', 'Historia', 'TikTok', 'Anuncio'];

const STATUS_STYLE: Record<Status, { pill: string; dot: string; col: string }> = {
  'Not started': { pill: 'bg-[#e3e2e080] text-[#32302c]', dot: 'bg-[#91918e]', col: 'bg-[#f9f9f8]' },
  'In progress': { pill: 'bg-[#d3e5ef] text-[#183347]', dot: 'bg-[#5b97bd]', col: 'bg-[#f5fafc]' },
  Done: { pill: 'bg-[#dbeddb] text-[#1c3829]', dot: 'bg-[#6c9b7d]', col: 'bg-[#f6faf6]' },
};

const FORMATO_STYLE: Record<Exclude<Formato, ''>, string> = {
  Reel: 'bg-[#fadec9] text-[#49290e]',
  Carrusel: 'bg-[#e8deee] text-[#412454]',
  Historia: 'bg-[#fdecc8] text-[#402c1b]',
  TikTok: 'bg-[#f5e0e9] text-[#4c2337]',
  Anuncio: 'bg-[#ffe2dd] text-[#5d1715]',
};

const blank = (overrides: Partial<Row> = {}): Row => ({
  id: crypto.randomUUID(),
  position: Date.now() / 1000,
  name: '',
  anotaciones: '',
  copy: '',
  crudo: '',
  estado: 'Not started',
  fecha: '',
  formato: '',
  referencia: '',
  videoTerminado: '',
  body: '',
  ...overrides,
});

/* ---------- db mapping (snake_case columns in public.content_items) ---------- */

type DbRow = Omit<Row, 'videoTerminado' | 'fecha'> & { video_terminado: string; fecha: string | null };

const fromDb = ({ video_terminado, fecha, ...r }: DbRow): Row => ({ ...r, videoTerminado: video_terminado, fecha: fecha ?? '' });

function toDb(patch: Partial<Row>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'videoTerminado') out.video_terminado = v;
    else if (k === 'fecha') out.fecha = v || null;
    else out[k] = v;
  }
  return out;
}

const SELECT = 'id, position, name, anotaciones, copy, crudo, estado, fecha, formato, referencia, video_terminado, body';
const byPosition = (a: Row, b: Row) => a.position - b.position;

/* ---------- tiny icons ---------- */

const Icon = {
  page: (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 fill-[#91918e]">
      <path d="M4.35 1.5h4.9l3.25 3.25v8.4c0 .75-.6 1.35-1.35 1.35h-6.8C3.6 14.5 3 13.9 3 13.15v-10.3C3 2.1 3.6 1.5 4.35 1.5zm0 1.2a.15.15 0 0 0-.15.15v10.3c0 .08.07.15.15.15h6.8a.15.15 0 0 0 .15-.15V5.5H9.1a.6.6 0 0 1-.6-.6V2.7H4.35zM5.5 8h5v1.1h-5V8zm0 2.3h5v1.1h-5v-1.1z" />
    </svg>
  ),
  text: <span className="text-[13px] leading-none text-[#91918e]">≡</span>,
  title: <span className="text-[11px] font-semibold leading-none text-[#91918e]">Aa</span>,
  link: <span className="text-[13px] leading-none text-[#91918e]">🔗︎</span>,
  status: <span className="text-[13px] leading-none text-[#91918e]">◌</span>,
  date: <span className="text-[13px] leading-none text-[#91918e]">▦</span>,
  select: <span className="text-[13px] leading-none text-[#91918e]">⌄</span>,
};

type ColKey = keyof Omit<Row, 'id' | 'position' | 'body'>;
type ColType = 'title' | 'text' | 'url' | 'status' | 'date' | 'select';

const COLUMNS: { key: ColKey; label: string; type: ColType; width: number }[] = [
  { key: 'name', label: 'Name', type: 'title', width: 300 },
  { key: 'anotaciones', label: 'ANOTACIONES', type: 'text', width: 170 },
  { key: 'copy', label: 'COPY', type: 'text', width: 170 },
  { key: 'crudo', label: 'CRUDO', type: 'url', width: 190 },
  { key: 'estado', label: 'ESTADO', type: 'status', width: 150 },
  { key: 'fecha', label: 'FECHA DE PUBLICACION', type: 'date', width: 190 },
  { key: 'formato', label: 'FORMATO', type: 'select', width: 140 },
  { key: 'referencia', label: 'REFERENCIA', type: 'url', width: 190 },
  { key: 'videoTerminado', label: 'VIDEO TERMINADO', type: 'url', width: 190 },
];

const TYPE_ICON: Record<ColType, JSX.Element> = {
  title: Icon.title,
  text: Icon.text,
  url: Icon.link,
  status: Icon.status,
  date: Icon.date,
  select: Icon.select,
};

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shortUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '');
}

/* ---------- cells ---------- */

function StatusPill({ value }: { value: Status }) {
  const s = STATUS_STYLE[value];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[1px] text-[12px] ${s.pill}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {value}
    </span>
  );
}

function FormatoPill({ value }: { value: Formato }) {
  if (!value) return null;
  return <span className={`rounded px-1.5 py-[1px] text-[12px] ${FORMATO_STYLE[value]}`}>{value}</span>;
}

function Cell({
  row,
  col,
  onChange,
  onOpen,
}: {
  row: Row;
  col: (typeof COLUMNS)[number];
  onChange: (patch: Partial<Row>) => void;
  onOpen: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const value = row[col.key] as string;

  if (col.type === 'title') {
    return (
      <div className="group/title flex h-full items-center gap-1.5 px-2">
        {Icon.page}
        <input
          value={value}
          placeholder="Sin título"
          onChange={(e) => onChange({ name: e.target.value })}
          className="min-w-0 flex-1 bg-transparent font-medium text-[#37352f] outline-none placeholder:text-[#c7c6c4]"
        />
        <button
          onClick={onOpen}
          className="invisible shrink-0 rounded border border-[#e9e9e7] bg-white px-1.5 text-[11px] font-medium text-[#787774] shadow-sm hover:bg-[#f1f1ef] group-hover/row:visible"
        >
          ABRIR
        </button>
      </div>
    );
  }

  if (col.type === 'status' || col.type === 'select') {
    const options = col.type === 'status' ? STATUSES : (['', ...FORMATOS] as Formato[]);
    return (
      <label className="relative flex h-full cursor-pointer items-center px-2">
        {col.type === 'status' ? <StatusPill value={value as Status} /> : <FormatoPill value={value as Formato} />}
        <select
          value={value}
          onChange={(e) => onChange({ [col.key]: e.target.value } as Partial<Row>)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o || '—'}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (col.type === 'date') {
    return (
      <label className="relative flex h-full cursor-pointer items-center px-2 text-[#37352f]">
        {formatDate(value)}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange({ fecha: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full"
        />
      </label>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        onBlur={(e) => {
          onChange({ [col.key]: e.target.value.trim() } as Partial<Row>);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur();
        }}
        className="h-full w-full bg-white px-2 text-[#37352f] shadow-[inset_0_0_0_2px_#7a1a1e] outline-none"
      />
    );
  }

  return (
    <div onClick={() => setEditing(true)} className="flex h-full cursor-text items-center overflow-hidden px-2">
      {col.type === 'url' && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex max-w-full items-center gap-1 truncate rounded bg-[#f1f1ef] px-1.5 text-[12px] text-[#37352f] underline decoration-[#d3d3d1] underline-offset-2 hover:bg-[#e9e9e7]"
        >
          {Icon.page}
          <span className="truncate">{shortUrl(value)}</span>
        </a>
      ) : (
        <span className="truncate text-[#37352f]">{value}</span>
      )}
    </div>
  );
}

/* ---------- side peek ---------- */

function Peek({ row, onChange, onClose, onDelete }: { row: Row; onChange: (p: Partial<Row>) => void; onClose: () => void; onDelete: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[640px] flex-col border-l border-[#e9e9e7] bg-white shadow-[-8px_0_32px_rgba(15,15,15,0.08)]">
      <div className="flex h-11 shrink-0 items-center justify-between px-3 text-[14px] text-[#787774]">
        <button onClick={onClose} className="rounded px-1.5 py-0.5 hover:bg-[#f1f1ef]" title="Cerrar (Esc)">
          »
        </button>
        <button onClick={onDelete} className="rounded px-2 py-0.5 hover:bg-[#fdebec] hover:text-[#d44c47]">
          Eliminar
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-24 sm:px-12">
        <textarea
          value={row.name}
          placeholder="Sin título"
          rows={1}
          onChange={(e) => onChange({ name: e.target.value })}
          className="mt-6 w-full resize-none bg-transparent text-[32px] font-bold leading-tight text-[#37352f] outline-none placeholder:text-[#e1e1df]"
        />
        <div className="mt-4 space-y-0.5 text-[14px]">
          {COLUMNS.slice(1).map((col) => (
            <div key={col.key} className="flex min-h-[34px] items-stretch">
              <div className="flex w-44 shrink-0 items-center gap-2 px-1 text-[#787774]">
                <span className="w-4 text-center">{TYPE_ICON[col.type]}</span>
                <span className="truncate">{col.label}</span>
              </div>
              <div className="min-w-0 flex-1 rounded hover:bg-[#f7f7f5]">
                <Cell row={row} col={col} onChange={onChange} onOpen={() => {}} />
              </div>
            </div>
          ))}
        </div>
        <div className="my-5 border-t border-[#e9e9e7]" />
        <textarea
          value={row.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Escribí el guion, ideas o notas acá…"
          className="min-h-[300px] w-full resize-none bg-transparent text-[16px] leading-relaxed text-[#37352f] outline-none placeholder:text-[#c7c6c4]"
        />
      </div>
    </aside>
  );
}

/* ---------- board ---------- */

function Board({ rows, onChange, onOpen, onAdd }: { rows: Row[]; onChange: (id: string, p: Partial<Row>) => void; onOpen: (id: string) => void; onAdd: (s: Status) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Status | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-8">
      {STATUSES.map((status) => {
        const items = rows.filter((r) => r.estado === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={() => {
              if (dragId) onChange(dragId, { estado: status });
              setDragId(null);
              setOver(null);
            }}
            className={`w-[260px] shrink-0 rounded-lg p-2 transition-colors ${STATUS_STYLE[status].col} ${over === status ? 'ring-2 ring-[#7a1a1e]/40' : ''}`}
          >
            <div className="mb-2 flex items-center gap-2 px-1 text-[14px]">
              <StatusPill value={status} />
              <span className="text-[#9b9a97]">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((r) => (
                <button
                  key={r.id}
                  draggable
                  onDragStart={() => setDragId(r.id)}
                  onClick={() => onOpen(r.id)}
                  className="block w-full rounded-md border border-[#e9e9e7] bg-white p-2.5 text-left shadow-[0_1px_2px_rgba(15,15,15,0.06)] hover:bg-[#fbfbfa]"
                >
                  <div className="flex items-start gap-1.5 text-[14px] font-medium text-[#37352f]">
                    <span className="mt-0.5">{Icon.page}</span>
                    <span>{r.name || 'Sin título'}</span>
                  </div>
                  {(r.anotaciones || r.formato || r.fecha) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-[#787774]">
                      {r.anotaciones && <span className="rounded bg-[#f1f1ef] px-1.5">{r.anotaciones}</span>}
                      <FormatoPill value={r.formato} />
                      {r.fecha && <span>{formatDate(r.fecha)}</span>}
                    </div>
                  )}
                </button>
              ))}
              <button onClick={() => onAdd(status)} className="w-full rounded px-2 py-1.5 text-left text-[14px] text-[#9b9a97] hover:bg-black/[0.04]">
                + Nuevo
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- workspace ---------- */

export default function Workspace() {
  const [rows, setRows] = useState<Row[]>([]);
  const [title, setTitleState] = useState('');
  const [view, setView] = useState<View>('table');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(true);
  const [sync, setSync] = useState<SyncState>('loading');

  // Edits are applied locally right away and flushed to Supabase per row after a short pause.
  const pending = useRef(new Map<string, { patch: Partial<Row>; timer: ReturnType<typeof setTimeout> }>());
  const titleTimer = useRef<ReturnType<typeof setTimeout>>();

  const done = useCallback((error: unknown) => {
    if (error) setSync('error');
    else if (pending.current.size === 0) setSync('saved');
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === 'table' || v === 'board') setView(v);
    } catch {}
    if (window.innerWidth < 900) setSidebar(false);

    Promise.all([
      supabase.from('content_items').select(SELECT).order('position'),
      supabase.from('workspace_settings').select('title').eq('id', 1).single(),
    ]).then(([items, settings]) => {
      if (items.error || settings.error) return setSync('error');
      setRows((items.data as DbRow[]).map(fromDb));
      setTitleState(settings.data.title);
      setSync('saved');
    });

    const channel = supabase
      .channel('contenido')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setRows((rs) => rs.filter((r) => r.id !== id));
          return;
        }
        const incoming = fromDb(payload.new as DbRow);
        // Don't clobber a row someone is typing into here.
        if (pending.current.has(incoming.id)) return;
        setRows((rs) => {
          const exists = rs.some((r) => r.id === incoming.id);
          return exists ? rs.map((r) => (r.id === incoming.id ? incoming : r)) : [...rs, incoming].sort(byPosition);
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'workspace_settings' }, (payload) => {
        if (!titleTimer.current) setTitleState((payload.new as { title: string }).title);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {}
  }, [view]);

  const update = (id: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setSync('saving');
    const prev = pending.current.get(id);
    if (prev) clearTimeout(prev.timer);
    const merged = { ...prev?.patch, ...patch };
    const timer = setTimeout(async () => {
      pending.current.delete(id);
      const { error } = await supabase.from('content_items').update(toDb(merged)).eq('id', id);
      done(error);
    }, SAVE_DELAY);
    pending.current.set(id, { patch: merged, timer });
  };

  const setTitle = (value: string) => {
    setTitleState(value);
    setSync('saving');
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      titleTimer.current = undefined;
      const { error } = await supabase.from('workspace_settings').update({ title: value }).eq('id', 1);
      done(error);
    }, SAVE_DELAY);
  };

  const add = async (overrides: Partial<Row> = {}, open = false) => {
    const last = rows.reduce((m, r) => Math.max(m, r.position), 0);
    const row = blank({ position: last + 1, ...overrides });
    setRows((rs) => [...rs, row]);
    if (open) setOpenId(row.id);
    setSync('saving');
    const { id, ...rest } = row;
    const { error } = await supabase.from('content_items').insert({ id, ...toDb(rest) });
    done(error);
  };

  const remove = async (id: string) => {
    const p = pending.current.get(id);
    if (p) clearTimeout(p.timer);
    pending.current.delete(id);
    setRows((rs) => rs.filter((r) => r.id !== id));
    setOpenId(null);
    setSync('saving');
    const { error } = await supabase.from('content_items').delete().eq('id', id);
    done(error);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.anotaciones, r.copy, r.formato].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  const open = rows.find((r) => r.id === openId) ?? null;
  const tableWidth = COLUMNS.reduce((a, c) => a + c.width, 0);

  return (
    <div className="fixed inset-0 flex bg-white font-sans text-[14px] text-[#37352f] [color-scheme:light] selection:bg-[#7a1a1e]/20 selection:text-inherit">
      {/* sidebar */}
      {sidebar && (
        <nav className="aurum-texture flex w-60 shrink-0 flex-col text-[14px] text-white/70 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl">
          <div className="flex items-start justify-between px-4 pb-3 pt-4">
            <div>
              <div className="text-[26px] font-extrabold leading-none tracking-[-0.04em] text-white">aurum</div>
              <div className="mt-1.5 text-[11px] text-white/55">Creamos con criterio 🧷</div>
            </div>
            <button onClick={() => setSidebar(false)} className="rounded px-1 text-white/60 hover:bg-white/10 hover:text-white" title="Cerrar sidebar">
              «
            </button>
          </div>
          <div className="px-1.5">
            <label className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.08]">
              <span>⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar" className="w-full bg-transparent text-white outline-none placeholder:text-white/45" />
            </label>
            <div className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/[0.08]">⌂ Inicio</div>
          </div>
          <div className="mt-4 px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Clientes</div>
          <div className="flex-1 overflow-y-auto px-1.5">
            <div className="flex items-center gap-2 rounded bg-white/[0.12] px-2 py-1 font-medium text-white">
              <span>🍣</span>
              <span className="truncate">{title || 'Sin título'}</span>
            </div>
            {rows.slice(0, 40).map((r) => (
              <button key={r.id} onClick={() => setOpenId(r.id)} className={`flex w-full items-center gap-2 rounded py-1 pl-6 pr-2 text-left hover:bg-white/[0.08] ${openId === r.id ? 'bg-white/[0.12] text-white' : ''}`}>
                <span className="opacity-60 invert">{Icon.page}</span>
                <span className="truncate">{r.name || 'Sin título'}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 px-4 py-3 text-[11px] leading-relaxed text-white/40">
            pauta publicitaria • estrategia de mkt • creatividad • producción de contenido • páginas webs
          </div>
          <button onClick={() => add({}, true)} className="mx-1.5 mb-2 flex items-center gap-2 rounded px-2 py-1 text-left hover:bg-white/[0.08]">
            + Nueva página
          </button>
        </nav>
      )}

      {/* main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2 px-3 text-[14px]">
          {!sidebar && (
            <button onClick={() => setSidebar(true)} className="rounded px-1.5 text-[#787774] hover:bg-[#f1f1ef]" title="Abrir sidebar">
              ☰
            </button>
          )}
          <span className="truncate text-[#37352f]">
            <span className="font-bold tracking-[-0.03em] text-[#5a1215]">aurum</span>
            <span className="text-[#9b9a97]"> / </span>🍣 {title}
          </span>
          <span className={`ml-auto text-[12px] ${sync === 'error' ? 'text-[#d44c47]' : 'text-[#9b9a97]'}`}>
            {{ loading: 'Cargando…', saving: 'Guardando…', saved: 'Guardado', error: 'Error al guardar — revisá la conexión' }[sync]}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* cover */}
          <div className="aurum-texture relative flex h-[30vh] max-h-[280px] min-h-[160px] w-full items-center justify-center overflow-hidden">
            <div className="select-none text-center text-white">
              <div className="text-[clamp(28px,5vw,56px)] font-black uppercase leading-[0.95] tracking-[-0.04em]">
                Producción
                <br />≠ improvisación
              </div>
              <div className="mt-4 text-[15px] font-extrabold tracking-[-0.03em] opacity-90">aurum</div>
            </div>
          </div>

          <div className="px-4 sm:px-24">
            <div className="relative -mt-10 text-[64px] leading-none">🍣</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sin título"
              className="mt-3 w-full bg-transparent text-[30px] font-black uppercase tracking-[-0.035em] text-[#2b0a0b] outline-none sm:text-[40px]"
            />

            {/* view tabs + actions */}
            <div className="mt-4 flex items-center gap-1 border-b border-[#e9e9e7] text-[14px]">
              {(['table', 'board'] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`-mb-px border-b-2 px-2 py-1.5 ${view === v ? 'border-[#5a1215] font-medium text-[#5a1215]' : 'border-transparent text-[#787774] hover:text-[#37352f]'}`}
                >
                  {v === 'table' ? '▤ Tabla' : '▥ Tablero'}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1 pb-1">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar…"
                  className="w-28 rounded px-2 py-1 text-[14px] outline-none placeholder:text-[#9b9a97] hover:bg-[#f1f1ef] focus:w-44 focus:bg-[#f1f1ef]"
                />
                <button onClick={() => add({}, true)} className="rounded bg-[#7a1a1e] px-2.5 py-1 font-medium text-white hover:bg-[#4a0d10]">
                  Nuevo
                </button>
              </div>
            </div>
          </div>

          {view === 'table' ? (
            <div className="overflow-x-auto px-4 pb-24 sm:px-24">
              <div style={{ width: tableWidth }}>
                <div className="flex border-b border-[#e9e9e7] text-[14px] text-[#787774]">
                  {COLUMNS.map((c, i) => (
                    <div key={c.key} style={{ width: c.width }} className={`flex h-9 shrink-0 items-center gap-1.5 px-2 ${i ? 'border-l border-[#e9e9e7]' : ''}`}>
                      <span className="w-4 text-center">{TYPE_ICON[c.type]}</span>
                      <span className="truncate">{c.label}</span>
                    </div>
                  ))}
                </div>
                {visible.map((r) => (
                  <div key={r.id} className="group/row flex border-b border-[#e9e9e7] hover:bg-[#f7f7f5]">
                    {COLUMNS.map((c, i) => (
                      <div key={c.key} style={{ width: c.width }} className={`h-[34px] shrink-0 ${i ? 'border-l border-[#e9e9e7]' : ''}`}>
                        <Cell row={r} col={c} onChange={(p) => update(r.id, p)} onOpen={() => setOpenId(r.id)} />
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={() => add()} className="flex h-[34px] w-full items-center gap-2 border-b border-[#e9e9e7] px-2 text-left text-[#9b9a97] hover:bg-[#f7f7f5]">
                  + Nuevo
                </button>
                <div className="px-2 py-2 text-[12px] text-[#9b9a97]">
                  CANTIDAD <span className="text-[#37352f]">{visible.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pt-4 sm:px-24">
              <Board rows={visible} onChange={update} onOpen={setOpenId} onAdd={(s) => add({ estado: s }, true)} />
            </div>
          )}
        </div>
      </main>

      {open && <Peek row={open} onChange={(p) => update(open.id, p)} onClose={() => setOpenId(null)} onDelete={() => remove(open.id)} />}
    </div>
  );
}
