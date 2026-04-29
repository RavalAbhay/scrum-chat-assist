import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface AsyncOption {
  id: string;
  name: string;
  description?: string;
}

interface AsyncSearchSelectProps {
  value?: string;
  onChange: (value: string | undefined, option?: AsyncOption) => void;
  /** Async loader. Receives the current query string. Should return matching options. */
  fetchOptions: (query: string, signal: AbortSignal) => Promise<AsyncOption[]>;
  placeholder?: string;
  emptyText?: string;
  /** Debounce delay in ms. Default 300. */
  debounceMs?: number;
  /** Width of the popover (matches trigger by default). */
  className?: string;
  popoverClassName?: string;
  required?: boolean;
  disabled?: boolean;
  /** Optional: render initial option list when query is empty. Default true. */
  loadOnOpen?: boolean;
  /** Optional preloaded label for the current value (so trigger can show name without re-fetching). */
  selectedLabel?: string;
  ariaLabel?: string;
}

export function AsyncSearchSelect({
  value,
  onChange,
  fetchOptions,
  placeholder = "Select...",
  emptyText = "No results",
  debounceMs = 300,
  className,
  popoverClassName,
  required,
  disabled,
  loadOnOpen = true,
  selectedLabel,
  ariaLabel,
}: AsyncSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [options, setOptions] = React.useState<AsyncOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Debounce query
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  // Fetch when popover open + debounced query changes
  React.useEffect(() => {
    if (!open) return;
    if (!loadOnOpen && !debounced) {
      setOptions([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetchOptions(debounced, ctrl.signal)
      .then((res) => {
        setOptions(res);
        setActiveIndex(0);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setOptions([]);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [open, debounced, fetchOptions, loadOnOpen]);

  // Focus input when opening
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const triggerLabel = selectedLabel ?? placeholder;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) {
        onChange(opt.id, opt);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Scroll active item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={open}
          aria-required={required}
          disabled={disabled}
          className={cn(
            "group inline-flex min-w-0 max-w-full items-center justify-between gap-2 rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none transition hover:bg-secondary/40 focus:border-ring disabled:cursor-not-allowed disabled:opacity-50",
            required && !value ? "border-accent/60" : "border-border",
            className
          )}
        >
          <span
            className={cn(
              "truncate",
              !value && "text-muted-foreground"
            )}
          >
            {triggerLabel}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {value && !disabled && (
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined, undefined);
                }}
              />
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-[--radix-popover-trigger-width] min-w-[220px] p-0", popoverClassName)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
          {loading && options.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              {debounced ? emptyText : "Start typing to search"}
            </div>
          ) : (
            options.map((opt, idx) => {
              const selected = value === opt.id;
              const active = idx === activeIndex;
              return (
                <button
                  key={opt.id}
                  type="button"
                  data-idx={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onChange(opt.id, opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition",
                    active && "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      selected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{highlight(opt.name, debounced)}</span>
                    {opt.description && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Wrap matching substring in <mark> for typeahead emphasis. */
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-primary/20 px-0.5 text-foreground">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}
