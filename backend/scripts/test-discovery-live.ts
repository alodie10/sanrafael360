
import { DiscoveryService } from '../src/services/discovery-service';
import * as dotenv from 'dotenv';

dotenv.config();

function parseGoogleHours(hoursText: string) {
  if (!hoursText) return [];

  const daysMapping: { [key: string]: string } = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miércoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sábado': 'Sábado',
    'domingo': 'Domingo'
  };

  const schedules: any[] = [];
  // Google Maps Argentina usually uses: "Lunes: 12:00–23:00, Martes: ..."
  // or "Lunes, De 12:00 a 23:00; Martes, De 12:00 a 23:00; ..."
  
  // Let's try to detect the separator. It's often ", " but inside the day block, it might vary.
  const parts = hoursText.split(/;|,/).map(p => p.trim()).filter(p => p.length > 0);

  parts.forEach(part => {
    // Expected "Lunes: 12:00–23:00" or "Lunes (De 12:00 a 23:00)"
    const dayMatch = part.match(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i);
    if (!dayMatch) return;

    const dayNameRaw = dayMatch[0].toLowerCase();
    const day = daysMapping[dayNameRaw];
    if (!day) return;

    if (part.toLowerCase().includes('cerrado')) {
      schedules.push({ day, is_closed: true, opening_time: null, closing_time: null });
      return;
    }

    // Capture time range like "12:00–23:00" or "12:00 a 23:00"
    const timeMatch = part.match(/(\d{1,2}:\d{2})\s*[-–—a]\s*(\d{1,2}:\d{2})/i);
    if (timeMatch) {
      const formatTime = (t: string) => {
        const [h, m] = t.split(':');
        return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000`;
      };

      schedules.push({
        day,
        is_closed: false,
        opening_time: formatTime(timeMatch[1]),
        closing_time: formatTime(timeMatch[2])
      });
    }
  });

  return schedules;
}

async function testLive() {
  const service = new DiscoveryService();
  const name = "After House";
  
  console.log(`🚀 Probando descubrimiento + parsing para: ${name}...`);
  
  try {
    const result = await service.discover(name);
    console.log("📝 Horarios Crudos:", result.horarios_texto);
    
    if (result.success && result.horarios_texto) {
      const parsed = parseGoogleHours(result.horarios_texto);
      console.log("✅ Resultado Parsed:", JSON.stringify(parsed, null, 2));
      
      if (parsed.length > 0) {
        console.log(`🔥 ¡ÉXITO! Se obtuvieron ${parsed.length} días de horarios.`);
      } else {
        console.warn("⚠️ ALERTA: No se pudo parsear ningún horario del texto crudo.");
      }
    } else if (!result.success) {
      console.error("❌ FALLO SCRAPER:", result.error);
    } else {
      console.warn("⚠️ El negocio fue encontrado pero no devolvió horarios.");
    }
  } catch (err) {
    console.error("💥 ERROR CRÍTICO:", err);
  }
}

testLive();
