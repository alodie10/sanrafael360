'use client';

import { useState } from 'react';

const MP_APPS_URL = 'https://www.mercadopago.com.ar/developers/panel/app';

type Props = {
  /** Si puede pegar el token en este panel */
  canPaste: boolean;
};

/**
 * Guía E3 / RES-DEC-009: cómo pedir el Access Token sin jerga de API.
 */
export default function ReservasMpTokenGuide({ canPaste }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ra-mp-guide" data-testid="reserva-mp-token-guide">
      <button
        type="button"
        className="ra-mp-guide-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="reserva-mp-token-guide-toggle"
      >
        {open ? 'Ocultar guía' : '¿Cómo consigo el token de cobros?'}
      </button>

      {open ? (
        <div className="ra-mp-guide-body">
          <p className="ra-mp-guide-lead">
            No hace falta saber de programación. Pedile al dueño del local (o hacelo vos en una
            llamada) que copie un texto que Mercado Pago llama <strong>Access Token</strong> — acá
            lo tratamos como <strong>token de cobros</strong>.
          </p>

          <ol className="ra-mp-guide-steps">
            <li>
              <span className="ra-mp-guide-step-num">1</span>
              <div>
                <strong>Entrá a Mercado Pago Developers</strong>
                <p>
                  Con el usuario de Mercado Pago del local (no el personal).
                </p>
                <a
                  href={MP_APPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ra-mp-guide-link"
                >
                  Abrir panel de aplicaciones →
                </a>
              </div>
            </li>
            <li>
              <span className="ra-mp-guide-step-num">2</span>
              <div>
                <strong>Abrí o creá “su aplicación”</strong>
                <p>
                  Si no tiene ninguna, Mercado Pago permite crear una en el mismo panel (nombre
                  libre, ej. “Reservas San Rafael”).
                </p>
              </div>
            </li>
            <li>
              <span className="ra-mp-guide-step-num">3</span>
              <div>
                <strong>Andá a Credenciales</strong>
                <p>
                  Para pruebas usá <em>Credenciales de prueba</em>. Cuando cobren de verdad,{' '}
                  <em>Credenciales de producción</em>.
                </p>
              </div>
            </li>
            <li>
              <span className="ra-mp-guide-step-num">4</span>
              <div>
                <strong>Copiá el Access Token</strong>
                <p>
                  Es un texto largo que suele empezar con <code>APP_USR-</code> o{' '}
                  <code>TEST-</code>. Solo ese campo — no el Public Key.
                </p>
              </div>
            </li>
            <li>
              <span className="ra-mp-guide-step-num">5</span>
              <div>
                <strong>
                  {canPaste
                    ? 'Pegalo abajo en “Token de cobros”'
                    : 'Pasáselo al admin de San Rafael 360'}
                </strong>
                <p>
                  {canPaste
                    ? 'Guardá la configuración. Después vas a poder apagar la simulación y cobrar.'
                    : 'Solo un administrador puede cargarlo en el portal por ahora.'}
                </p>
              </div>
            </li>
          </ol>

          <p className="ra-mp-guide-note">
            Tip: la primera vez conviene hacerlo juntos (videollamada). Más adelante habrá un botón
            “Conectar Mercado Pago” para no copiar nada.
          </p>
        </div>
      ) : null}
    </div>
  );
}
