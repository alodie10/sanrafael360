require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const axios = require('axios');

// Configuraciones desde el .env
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const TEMPLATE_NAME = process.env.TEMPLATE_NAME || 'sumate_directorio';
const TEMPLATE_LANGUAGE = process.env.TEMPLATE_LANGUAGE || 'es_AR';

// Validaciones iniciales
if (!META_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error('❌ FALTAN CREDENCIALES: Por favor, configura META_ACCESS_TOKEN y PHONE_NUMBER_ID en el archivo .env');
    process.exit(1);
}

const CSV_PATH = path.join(__dirname, 'curada.csv');
const ENVIADOS_PATH = path.join(__dirname, 'enviados.json');

const formatNumber = (number) => {
    let clean = number.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = clean.substring(1);
    }
    if (clean.startsWith('54') && !clean.startsWith('549')) {
        clean = clean.replace('54', '549');
    } else if (!clean.startsWith('549')) {
        clean = '549' + clean;
    }
    return clean; // Meta API necesita el formato numérico sin el @c.us
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function chequearHorarioDescanso() {
    let now = new Date();
    
    const isDescanso = () => {
        const h = now.getHours();
        const m = now.getMinutes();
        if (h >= 21) return true;
        if (h < 9) return true;
        if (h === 9 && m < 20) return true;
        return false;
    };

    if (isDescanso()) {
        console.log(`\n🌙 Modo Nocturno: Son las ${now.toLocaleTimeString()}. Pausando envíos para no molestar.`);
        while (isDescanso()) {
            await delay(1 * 60 * 1000); // 1 minuto
            now = new Date();
        }
        console.log(`\n☀️ ¡Buenos días! Son las ${now.toLocaleTimeString()}. Retomando la campaña...`);
    }
}

async function enviarMensajeMeta(numero, nombre, categoria) {
    const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        to: numero,
        type: "template",
        template: {
            name: TEMPLATE_NAME,
            language: { code: TEMPLATE_LANGUAGE },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: nombre },
                        { type: "text", text: categoria }
                    ]
                }
            ]
        }
    };

    const headers = {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios.post(url, payload, { headers });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response ? error.response.data : error.message };
    }
}

async function iniciarCampaña() {
    const contactos = [];
    
    let enviados = [];
    if (fs.existsSync(ENVIADOS_PATH)) {
        enviados = JSON.parse(fs.readFileSync(ENVIADOS_PATH));
        console.log(`📂 Se cargó el historial: ${enviados.length} mensajes ya enviados previamente.`);
    }
    
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
          contactos.push(row);
      })
      .on('end', async () => {
          console.log(`Lectura completada. Se encontraron ${contactos.length} contactos en curada.csv`);
          
          let enviadosEnEstaSesion = 0;
          let loteActual = 0;

          for (const [index, contacto] of contactos.entries()) {
              await chequearHorarioDescanso();

              const wspRaw = contacto.WhatsApp;
              if (!wspRaw || wspRaw.trim() === '') continue;

              // Format number for history tracking exactly like the old bot (e.g. 549...c.us) to maintain compatibility
              // Wait, the old bot saved them as formattedNumber with @c.us!
              // I will strip @c.us for Meta API, but check history with @c.us to match old format
              const cleanNumber = formatNumber(wspRaw);
              const historyNumber = `${cleanNumber}@c.us`; 
              
              if (enviados.includes(historyNumber)) {
                  console.log(`⏭️ ${contacto.Nombre} (${cleanNumber}): Ya se le envió anteriormente. Omitiendo.`);
                  continue;
              }

              console.log(`\n⏳ Enviando (Meta API) a: ${contacto.Nombre} (${cleanNumber})`);
              
              const result = await enviarMensajeMeta(cleanNumber, contacto.Nombre, contacto.Categoria);

              if (result.success) {
                  console.log(`   ✅ Mensaje enviado exitosamente!`);
                  enviados.push(historyNumber);
                  fs.writeFileSync(ENVIADOS_PATH, JSON.stringify(enviados, null, 2));
                  enviadosEnEstaSesion++;
                  loteActual++;
                  
                  // Para la API legal, el delay puede ser muchísimo menor (segundos) porque no es bloqueable por actividad robótica.
                  console.log(`   ⏱️ Pausa corta de seguridad de API: 5 segundos...`);
                  await delay(5000);
              } else {
                  console.error(`   ❌ Falló el envío:`, JSON.stringify(result.error));
                  // Puede fallar porque el número es inválido en Meta
                  console.log(`   Omitiendo y pasando al siguiente por seguridad...`);
                  await delay(2000);
              }
          }
          
          console.log(`\n🎉 CAMPAÑA FINALIZADA. Se enviaron ${enviadosEnEstaSesion} mensajes nuevos mediante Meta API.`);
          process.exit(0);
      });
}

console.log('🚀 INICIANDO CAMPAÑA MASIVA CON WHATSAPP CLOUD API (OFICIAL)...');
iniciarCampaña();
