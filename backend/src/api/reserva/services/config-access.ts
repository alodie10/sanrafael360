import { ForbiddenError } from '../../../utils/errors';

export type ReservaAccessRole = 'admin' | 'owner';

export type ReservaAccess = {
  role: ReservaAccessRole;
  comercioDocumentId?: string;
};

export type ConfigCapabilities = {
  can_edit_config: boolean;
  can_edit_mp_token: boolean;
  can_edit_operacion: boolean;
};

/** Default true: si el campo no existe aún, lo opera la plataforma. */
export function isOperadoPorPlataforma(comercio: { operado_por_plataforma?: boolean | null }) {
  return comercio.operado_por_plataforma !== false;
}

export function resolveConfigCapabilities(
  comercio: { operado_por_plataforma?: boolean | null },
  access: ReservaAccess
): ConfigCapabilities {
  if (access.role === 'admin') {
    return {
      can_edit_config: true,
      can_edit_mp_token: true,
      can_edit_operacion: true,
    };
  }
  if (isOperadoPorPlataforma(comercio)) {
    return {
      can_edit_config: false,
      can_edit_mp_token: false,
      can_edit_operacion: false,
    };
  }
  // Dueño opera lo operativo; token MP solo Master Admin (RES-DEC-009).
  return {
    can_edit_config: true,
    can_edit_mp_token: false,
    can_edit_operacion: false,
  };
}

export function assertCanEditConfig(caps: ConfigCapabilities) {
  if (!caps.can_edit_config) {
    throw new ForbiddenError(
      'Este módulo de reservas lo opera San Rafael 360. Pedile al admin que cambie la configuración.'
    );
  }
}

export function assertCanEditMpToken(caps: ConfigCapabilities) {
  if (!caps.can_edit_mp_token) {
    throw new ForbiddenError(
      'Solo un administrador de San Rafael 360 puede cargar o rotar el Access Token de Mercado Pago.'
    );
  }
}

export function assertCanEditOperacion(caps: ConfigCapabilities) {
  if (!caps.can_edit_operacion) {
    throw new ForbiddenError(
      'Solo un administrador puede cambiar si el módulo lo opera la plataforma o el dueño.'
    );
  }
}
