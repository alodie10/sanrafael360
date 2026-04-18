import type { Schema, Struct } from '@strapi/strapi';

export interface SharedSchedule extends Struct.ComponentSchema {
  collectionName: 'components_shared_schedules';
  info: {
    description: 'Horarios granulares para negocios';
    displayName: 'Schedule';
    icon: 'clock';
  };
  attributes: {
    closing_time: Schema.Attribute.Time;
    day: Schema.Attribute.Enumeration<
      [
        'Lunes',
        'Martes',
        'Mi\u00E9rcoles',
        'Jueves',
        'Viernes',
        'S\u00E1bado',
        'Domingo',
      ]
    > &
      Schema.Attribute.Required;
    is_closed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    opening_time: Schema.Attribute.Time;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.schedule': SharedSchedule;
    }
  }
}
