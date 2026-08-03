import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    adminPermissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::permission'
    >;
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON & Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiActividadActividad extends Struct.CollectionTypeSchema {
  collectionName: 'actividades';
  info: {
    description: 'Log de acciones realizadas por usuarios y administradores';
    displayName: 'Actividad';
    pluralName: 'actividades';
    singularName: 'actividad';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accion: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    detalles: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::actividad.actividad'
    > &
      Schema.Attribute.Private;
    negocio: Schema.Attribute.Relation<'manyToOne', 'api::negocio.negocio'>;
    publishedAt: Schema.Attribute.DateTime;
    tipo: Schema.Attribute.Enumeration<
      ['info', 'warning', 'success', 'error']
    > &
      Schema.Attribute.DefaultTo<'info'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usuario: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiAtributoAtributo extends Struct.CollectionTypeSchema {
  collectionName: 'atributos';
  info: {
    description: 'Tags, facilidades y caracter\u00EDsticas de los negocios';
    displayName: 'Atributo';
    pluralName: 'atributos';
    singularName: 'atributo';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icono: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::atributo.atributo'
    > &
      Schema.Attribute.Private;
    negocios: Schema.Attribute.Relation<'manyToMany', 'api::negocio.negocio'>;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'nombre'> & Schema.Attribute.Required;
    tipo: Schema.Attribute.Enumeration<
      ['tag', 'facilidad', 'ambiente', 'servicio', 'otro']
    > &
      Schema.Attribute.DefaultTo<'tag'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCategoriaCategoria extends Struct.CollectionTypeSchema {
  collectionName: 'categorias';
  info: {
    description: 'Categor\u00EDas principales de negocios (Hoteles, Gastronom\u00EDa, etc.)';
    displayName: 'Categor\u00EDa';
    pluralName: 'categorias';
    singularName: 'categoria';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.Text;
    icono: Schema.Attribute.String;
    imagen: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::categoria.categoria'
    > &
      Schema.Attribute.Private;
    negocios: Schema.Attribute.Relation<'oneToMany', 'api::negocio.negocio'>;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    parent: Schema.Attribute.Relation<'manyToOne', 'api::categoria.categoria'>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'nombre'> & Schema.Attribute.Required;
    subcategorias: Schema.Attribute.Relation<
      'oneToMany',
      'api::categoria.categoria'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiClienteCliente extends Struct.CollectionTypeSchema {
  collectionName: 'clientes';
  info: {
    description: 'Contacto comercial (1 email) con uno o m\u00E1s negocios';
    displayName: 'Cliente';
    pluralName: 'clientes';
    singularName: 'cliente';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::cliente.cliente'
    > &
      Schema.Attribute.Private;
    negocios: Schema.Attribute.Relation<'oneToMany', 'api::negocio.negocio'>;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    notas: Schema.Attribute.Text;
    opt_out: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDailyStatDailyStat extends Struct.CollectionTypeSchema {
  collectionName: 'daily_stats';
  info: {
    displayName: 'Estadistica Diaria';
    pluralName: 'daily-stats';
    singularName: 'daily-stat';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clicks_website: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clicks_whatsapp: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::daily-stat.daily-stat'
    > &
      Schema.Attribute.Private;
    negocio_id: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    views: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface ApiLeadLead extends Struct.CollectionTypeSchema {
  collectionName: 'leads';
  info: {
    description: 'Interesados en sumarse a la plataforma';
    displayName: 'Lead de Negocio';
    pluralName: 'leads';
    singularName: 'lead';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    estado: Schema.Attribute.Enumeration<
      ['nuevo', 'contactado', 'descartado', 'convertido']
    > &
      Schema.Attribute.DefaultTo<'nuevo'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'> &
      Schema.Attribute.Private;
    mensaje: Schema.Attribute.Text;
    negocio_vinculado: Schema.Attribute.Relation<
      'oneToOne',
      'api::negocio.negocio'
    >;
    nombre_completo: Schema.Attribute.String & Schema.Attribute.Required;
    nombre_negocio: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    telefono: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNegocioNegocio extends Struct.CollectionTypeSchema {
  collectionName: 'negocios';
  info: {
    description: 'Directorio de negocios de San Rafael 360';
    displayName: 'Negocio';
    pluralName: 'negocios';
    singularName: 'negocio';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    atributos: Schema.Attribute.Relation<
      'manyToMany',
      'api::atributo.atributo'
    >;
    categoria: Schema.Attribute.Relation<
      'manyToOne',
      'api::categoria.categoria'
    >;
    clicks_website: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    clicks_whatsapp: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    cliente: Schema.Attribute.Relation<'manyToOne', 'api::cliente.cliente'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    crop_gravity: Schema.Attribute.Enumeration<
      ['g_auto', 'g_center', 'g_north', 'g_south', 'g_auto:subject']
    > &
      Schema.Attribute.DefaultTo<'g_auto'>;
    cta_boton_texto: Schema.Attribute.String;
    cta_habilitado: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    cta_link: Schema.Attribute.String;
    cta_tag_confirmacion: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    cta_tag_sin_comisiones: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    cta_texto: Schema.Attribute.Text;
    cta_titulo: Schema.Attribute.String;
    descripcion: Schema.Attribute.RichText;
    direccion: Schema.Attribute.String;
    discovery_pending: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    discovery_verified: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    documentacion_reclamo: Schema.Attribute.Media<'files'>;
    email: Schema.Attribute.Email;
    estado_reclamo: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'ninguno'>;
    facebook: Schema.Attribute.String;
    favorited_by: Schema.Attribute.Relation<
      'manyToMany',
      'plugin::users-permissions.user'
    >;
    galeria: Schema.Attribute.Media<'images', true>;
    galeria_config: Schema.Attribute.JSON;
    google_maps_url: Schema.Attribute.String;
    google_place_id: Schema.Attribute.String;
    google_rating: Schema.Attribute.Float & Schema.Attribute.DefaultTo<0>;
    google_review_count: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    google_reviews: Schema.Attribute.JSON;
    google_reviews_synced_at: Schema.Attribute.DateTime;
    horario_apertura: Schema.Attribute.JSON;
    horarios_texto: Schema.Attribute.String;
    imagen_portada: Schema.Attribute.Media<'images'>;
    instagram: Schema.Attribute.String;
    is_premium: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    latitud: Schema.Attribute.Float;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::negocio.negocio'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    longitud: Schema.Attribute.Float;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    ofertas: Schema.Attribute.Relation<'oneToMany', 'api::oferta.oferta'>;
    owner: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    pagos: Schema.Attribute.Relation<'oneToMany', 'api::pago.pago'>;
    premium_notes: Schema.Attribute.Text;
    premium_since: Schema.Attribute.DateTime;
    premium_valid_until: Schema.Attribute.DateTime;
    price_range: Schema.Attribute.Enumeration<
      ['Economico', 'Moderado', 'Medio-Alto', 'Alto']
    >;
    promocion_activa: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    promocion_flyer: Schema.Attribute.Media<'images'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Float & Schema.Attribute.DefaultTo<0>;
    reclamar_habilitado: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    reserva_comercio: Schema.Attribute.Relation<
      'oneToOne',
      'api::reserva-comercio.reserva-comercio'
    >;
    reserva_habilitada: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    reserva_url: Schema.Attribute.String;
    review_count: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    reviews: Schema.Attribute.Relation<'oneToMany', 'api::review.review'>;
    schedules: Schema.Attribute.Component<'shared.schedule', true>;
    slug: Schema.Attribute.UID<'nombre'> & Schema.Attribute.Required;
    telefono: Schema.Attribute.String;
    trigger_discovery: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    tripadvisor_rating: Schema.Attribute.Float & Schema.Attribute.DefaultTo<0>;
    tripadvisor_review_count: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    tripadvisor_url: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    verificado: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    views: Schema.Attribute.BigInteger & Schema.Attribute.DefaultTo<'0'>;
    website: Schema.Attribute.String;
    whatsapp: Schema.Attribute.String;
    youtube_url: Schema.Attribute.String;
  };
}

export interface ApiOfertaOferta extends Struct.CollectionTypeSchema {
  collectionName: 'ofertas';
  info: {
    description: 'Ofertas promocionales de los negocios';
    displayName: 'Oferta';
    pluralName: 'ofertas';
    singularName: 'oferta';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    activa: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    condiciones: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descripcion: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 255;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::oferta.oferta'
    > &
      Schema.Attribute.Private;
    negocio: Schema.Attribute.Relation<'manyToOne', 'api::negocio.negocio'>;
    porcentaje_descuento: Schema.Attribute.Integer;
    precio_descuento: Schema.Attribute.Float;
    precio_original: Schema.Attribute.Float;
    publishedAt: Schema.Attribute.DateTime;
    tipo_oferta: Schema.Attribute.Enumeration<
      ['Descuento', 'Promocion2x1', 'Regalo', 'Especial', 'Experiencia']
    > &
      Schema.Attribute.DefaultTo<'Descuento'>;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    valida_desde: Schema.Attribute.DateTime & Schema.Attribute.Required;
    valida_hasta: Schema.Attribute.DateTime & Schema.Attribute.Required;
  };
}

export interface ApiPagoPago extends Struct.CollectionTypeSchema {
  collectionName: 'pagos';
  info: {
    description: 'Registro de transacciones de Mercado Pago';
    displayName: 'Pago';
    pluralName: 'pagos';
    singularName: 'pago';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    detalles_mp: Schema.Attribute.JSON;
    estado: Schema.Attribute.Enumeration<
      ['pendiente', 'aprobado', 'rechazado', 'cancelado']
    > &
      Schema.Attribute.DefaultTo<'pendiente'>;
    external_reference: Schema.Attribute.String;
    fecha_pago: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::pago.pago'> &
      Schema.Attribute.Private;
    monto: Schema.Attribute.Decimal & Schema.Attribute.Required;
    mp_payment_id: Schema.Attribute.String;
    mp_preference_id: Schema.Attribute.String;
    negocio: Schema.Attribute.Relation<'manyToOne', 'api::negocio.negocio'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReservaBloqueoReservaBloqueo
  extends Struct.CollectionTypeSchema {
  collectionName: 'reserva_bloqueos';
  info: {
    description: 'Franja bloqueada (mantenimiento / uso interno); recurso null = todo el comercio';
    displayName: 'Reserva Bloqueo';
    pluralName: 'reserva-bloqueos';
    singularName: 'reserva-bloqueo';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    comercio: Schema.Attribute.Relation<
      'manyToOne',
      'api::reserva-comercio.reserva-comercio'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    fin: Schema.Attribute.DateTime & Schema.Attribute.Required;
    inicio: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva-bloqueo.reserva-bloqueo'
    > &
      Schema.Attribute.Private;
    motivo: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    recurso: Schema.Attribute.Relation<
      'manyToOne',
      'api::reserva-recurso.reserva-recurso'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReservaComercioReservaComercio
  extends Struct.CollectionTypeSchema {
  collectionName: 'reserva_comercios';
  info: {
    description: 'Comercio del m\u00F3dulo de reservas (dominio separado del directorio)';
    displayName: 'Reserva Comercio';
    pluralName: 'reserva-comercios';
    singularName: 'reserva-comercio';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    anticipacion_llegada_minutos: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<15>;
    bloqueos: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva-bloqueo.reserva-bloqueo'
    >;
    buffer_limpieza_minutos: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<0>;
    cancelacion_horas_minimas: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<24>;
    cancelacion_politica: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    duracion_minutos: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<60>;
    hold_ttl_minutos: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<15>;
    horario: Schema.Attribute.JSON & Schema.Attribute.Required;
    imagen_portada: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva-comercio.reserva-comercio'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    modo_simulacion: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    mp_access_token_enc: Schema.Attribute.Text & Schema.Attribute.Private;
    mp_token_env: Schema.Attribute.String;
    mp_token_hint: Schema.Attribute.String & Schema.Attribute.Private;
    negocio: Schema.Attribute.Relation<'oneToOne', 'api::negocio.negocio'>;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    nombre_publico: Schema.Attribute.String;
    operado_por_plataforma: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<true>;
    precio_ars: Schema.Attribute.Decimal & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    recursos: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva-recurso.reserva-recurso'
    >;
    reservas: Schema.Attribute.Relation<'oneToMany', 'api::reserva.reserva'>;
    slug: Schema.Attribute.UID<'nombre'> & Schema.Attribute.Required;
    texto_llegada: Schema.Attribute.Text;
    timezone: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'America/Argentina/Mendoza'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReservaRecursoReservaRecurso
  extends Struct.CollectionTypeSchema {
  collectionName: 'reserva_recursos';
  info: {
    description: 'Recurso reservable de un comercio (puesto, sala, silla, etc.)';
    displayName: 'Reserva Recurso';
    pluralName: 'reserva-recursos';
    singularName: 'reserva-recurso';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    bloqueos: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva-bloqueo.reserva-bloqueo'
    >;
    comercio: Schema.Attribute.Relation<
      'manyToOne',
      'api::reserva-comercio.reserva-comercio'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva-recurso.reserva-recurso'
    > &
      Schema.Attribute.Private;
    nombre: Schema.Attribute.String & Schema.Attribute.Required;
    orden: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    reservas: Schema.Attribute.Relation<'oneToMany', 'api::reserva.reserva'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReservaReserva extends Struct.CollectionTypeSchema {
  collectionName: 'reservas';
  info: {
    description: 'Ocupaci\u00F3n vendible (hold / confirmada / cancelada / expirada)';
    displayName: 'Reserva';
    pluralName: 'reservas';
    singularName: 'reserva';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    cancelada_at: Schema.Attribute.DateTime;
    cliente_email: Schema.Attribute.Email;
    cliente_nombre: Schema.Attribute.String;
    cliente_telefono: Schema.Attribute.String;
    codigo: Schema.Attribute.String & Schema.Attribute.Unique;
    comercio: Schema.Attribute.Relation<
      'manyToOne',
      'api::reserva-comercio.reserva-comercio'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    estado: Schema.Attribute.Enumeration<
      ['hold', 'confirmada', 'cancelada', 'expirada']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'hold'>;
    excepcion_sin_pago: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    fin: Schema.Attribute.DateTime & Schema.Attribute.Required;
    hold_expires_at: Schema.Attribute.DateTime;
    inicio: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reserva.reserva'
    > &
      Schema.Attribute.Private;
    monto_ars: Schema.Attribute.Decimal;
    mp_payment_id: Schema.Attribute.String;
    mp_preference_id: Schema.Attribute.String;
    mp_refund_id: Schema.Attribute.String;
    origen: Schema.Attribute.Enumeration<['online', 'walk_in', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'online'>;
    publishedAt: Schema.Attribute.DateTime;
    recurso: Schema.Attribute.Relation<
      'manyToOne',
      'api::reserva-recurso.reserva-recurso'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReviewReview extends Struct.CollectionTypeSchema {
  collectionName: 'reviews';
  info: {
    description: 'Rese\u00F1as de usuarios para los negocios';
    displayName: 'Review';
    pluralName: 'reviews';
    singularName: 'review';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    autor: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
    comentario: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::review.review'
    > &
      Schema.Attribute.Private;
    negocio: Schema.Attribute.Relation<'manyToOne', 'api::negocio.negocio'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSoporteSoporte extends Struct.CollectionTypeSchema {
  collectionName: 'consultas-soporte';
  info: {
    description: 'Mensajes de soporte de los due\u00F1os de negocios';
    displayName: 'Soporte';
    pluralName: 'soportes';
    singularName: 'soporte';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    asunto: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.String;
    estado: Schema.Attribute.Enumeration<['pendiente', 'respondido']> &
      Schema.Attribute.DefaultTo<'pendiente'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::soporte.soporte'
    > &
      Schema.Attribute.Private;
    mensaje: Schema.Attribute.Text & Schema.Attribute.Required;
    negocio: Schema.Attribute.Relation<'manyToOne', 'api::negocio.negocio'>;
    nombre: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    respuesta: Schema.Attribute.Text;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    usuario: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiSuscripcionConfigSuscripcionConfig
  extends Struct.SingleTypeSchema {
  collectionName: 'suscripcion_configs';
  info: {
    description: 'Precios y duraciones de los planes';
    displayName: 'Configuraci\u00F3n de Suscripci\u00F3n';
    pluralName: 'suscripcion-configs';
    singularName: 'suscripcion-config';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dias_mensual: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<30>;
    dias_semestral: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<180>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::suscripcion-config.suscripcion-config'
    > &
      Schema.Attribute.Private;
    modo_prueba: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    precio_mensual: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<1200>;
    precio_semestral: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<50000>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    favoritos: Schema.Attribute.Relation<'manyToMany', 'api::negocio.negocio'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    tipo_registro: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::actividad.actividad': ApiActividadActividad;
      'api::atributo.atributo': ApiAtributoAtributo;
      'api::categoria.categoria': ApiCategoriaCategoria;
      'api::cliente.cliente': ApiClienteCliente;
      'api::daily-stat.daily-stat': ApiDailyStatDailyStat;
      'api::lead.lead': ApiLeadLead;
      'api::negocio.negocio': ApiNegocioNegocio;
      'api::oferta.oferta': ApiOfertaOferta;
      'api::pago.pago': ApiPagoPago;
      'api::reserva-bloqueo.reserva-bloqueo': ApiReservaBloqueoReservaBloqueo;
      'api::reserva-comercio.reserva-comercio': ApiReservaComercioReservaComercio;
      'api::reserva-recurso.reserva-recurso': ApiReservaRecursoReservaRecurso;
      'api::reserva.reserva': ApiReservaReserva;
      'api::review.review': ApiReviewReview;
      'api::soporte.soporte': ApiSoporteSoporte;
      'api::suscripcion-config.suscripcion-config': ApiSuscripcionConfigSuscripcionConfig;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
