'use client';

import { useState } from 'react';
import { toast } from 'sonner';

type Props = {
  path: string;
  /** Absolute origin for clipboard (defaults to window.location.origin). */
  origin?: string;
  className?: string;
};

export default function CopyPublicReservaLink({ path, origin, className }: Props) {
  const [copied, setCopied] = useState(false);
  const normalized = path.startsWith('/') ? path : `/${path}`;

  const fullUrl = () => {
    if (origin) return `${origin.replace(/\/$/, '')}${normalized}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${normalized}`;
    return normalized;
  };

  const onCopy = async () => {
    const url = fullUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <div className={className || 'ra-public-link'} data-testid="reserva-public-link">
      <a href={normalized} target="_blank" rel="noreferrer" className="ra-public-link-url">
        {normalized}
      </a>
      <button
        type="button"
        className="ra-btn"
        data-testid="reserva-public-link-copy"
        onClick={() => void onCopy()}
      >
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
