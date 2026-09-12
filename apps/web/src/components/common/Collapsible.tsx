import { type ReactNode, useState } from "react";

interface CollapsibleProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Collapsible({ title, count, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="collapsible">
      <button type="button" className="collapsible__trigger" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>
          {title}
          {count !== undefined && <span className="dim"> ({count})</span>}
        </span>
        <svg className="collapsible__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
      {open && <div className="collapsible__body">{children}</div>}
    </div>
  );
}
