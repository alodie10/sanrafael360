const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// 1. Configuramos el cliente con LocalAuth para que recuerde la sesión (no pida QR cada vez)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Ruta al CSV Real y al archivo de estado (checkpoint)
const CSV_PATH = path.join(__dirname, 'curada.csv');
const ENVIADOS_PATH = path.join(__dirname, 'enviados.json');

// Plantilla de mensaje de prueba
const getMessageTemplate = (nombre, categoria) => {
    return `¡Hola Propietarios de *${nombre}*! 👋\n\nSomos del equipo de *San Rafael 360*. Vimos que su rubro es ${categoria} y estamos armando el directorio digital más completo de la ciudad.\n\nLos invitamos a revisar vuestro perfil y cualquier otro que quieran consultar para que vean los distintos formatos que ofrecemos.\n\n👉 Pueden verlo:\nIngresando en www.sanrafael360.com o descargando la app de Play Store https://play.google.com/store/apps/details?id=com.sanrafael360.www.twa\n\nContratando el plan PREMIUM por $25.000 el trimestre acceden a cargar una galeria completa de fotos, videos, ubicación al instante con google maps, links a redes sociales, whatsapp y más.\n\nSi les interesa participar pueden responder a este mismo mensaje de whatsapp.`;
};

// Formatea el número local a internacional de WSP
// Asume números de Argentina (+54 9)
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
    return `${clean}@c.us`;
};

// Función de delay para anti-spam
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Comprueba si estamos en horario de descanso y pausa el script hasta las 09:20 AM
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
        console.log(`El bot se quedará durmiendo y retomará automáticamente a las 09:20 AM...`);
        
        // Bucle que verifica la hora cada minuto para ser exactos
        while (isDescanso()) {
            await delay(1 * 60 * 1000); // Esperar 1 minuto
            now = new Date();
        }
        
        console.log(`\n☀️ ¡Buenos días! Son las ${now.toLocaleTimeString()}. Retomando la campaña...`);
    }
}

client.on('qr', (qr) => {
    console.log('--------------------------------------------------');
    console.log('📸 ESCANEA ESTE QR CON EL WHATSAPP QUE ENVIARÁ LOS MENSAJES');
    console.log('--------------------------------------------------');
    qrcode.generate(qr, { small: true });
});

client.once('ready', () => {
    console.log('✅ Cliente conectado y listo.');
    console.log('🚀 INICIANDO CAMPAÑA MASIVA...');
    iniciarCampaña();
});

client.on('auth_failure', msg => {
    console.error('❌ Fallo de autenticación', msg);
});

async function iniciarCampaña() {
    const contactos = [];
    
    // Cargar historial de enviados
    let enviados = [];
    if (fs.existsSync(ENVIADOS_PATH)) {
        enviados = JSON.parse(fs.readFileSync(ENVIADOS_PATH));
        console.log(`📂 Se cargó el historial: ${enviados.length} mensajes ya enviados previamente.`);
    }
    
    // Leer el CSV
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
          contactos.push(row);
      })
      .on('end', async () => {
          console.log(`Lectura completada. Se encontraron ${contactos.length} contactos en curada.csv`);
          
          if (contactos.length === 0) {
              console.log("No hay contactos en el CSV. Cierra el script.");
              process.exit(0);
          }

          let enviadosEnEstaSesion = 0;
          let loteActual = 0;

          for (const [index, contacto] of contactos.entries()) {
              // 1. Chequear que sea horario comercial antes de procesar
              await chequearHorarioDescanso();

              const wspRaw = contacto.WhatsApp;
              
              if (!wspRaw || wspRaw.trim() === '') {
                  console.log(`⚠️ ${contacto.Nombre}: No tiene WhatsApp, se omite.`);
                  continue;
              }

              const formattedNumber = formatNumber(wspRaw);
              
              // Verificamos si ya le enviamos antes (CHECKPOINT)
              if (enviados.includes(formattedNumber)) {
                  console.log(`⏭️ ${contacto.Nombre} (${formattedNumber}): Ya se le envió anteriormente. Omitiendo.`);
                  continue;
              }

              const msg = getMessageTemplate(contacto.Nombre, contacto.Categoria);
              console.log(`\n⏳ Preparando mensaje para: ${contacto.Nombre} (${formattedNumber})`);
              
              let envioExitoso = false;
              
              try {
                  const isRegistered = await client.isRegisteredUser(formattedNumber);
                  
                  if (isRegistered) {
                      console.log(`   Enviando...`);
                      await client.sendMessage(formattedNumber, msg);
                      console.log(`   ✅ Mensaje enviado exitosamente!`);
                      
                      // Guardar en el historial
                      enviados.push(formattedNumber);
                      fs.writeFileSync(ENVIADOS_PATH, JSON.stringify(enviados, null, 2));
                      enviadosEnEstaSesion++;
                      loteActual++;
                      envioExitoso = true;
                  } else {
                      console.log(`   ❌ El número no está registrado en WhatsApp. Omitiendo pausa y pasando al siguiente.`);
                      envioExitoso = false; // Al ser falso, no ejecutará el delay anti-spam
                  }
              } catch (err) {
                  console.error(`   ❌ Error crítico de conexión:`, err.message);
                  console.log(`   🚨 WhatsApp Web se desconectó inesperadamente. Apagando el bot por seguridad...`);
                  console.log(`   Vuelve a ejecutar 'node bot.js' para retomar automáticamente desde aquí.`);
                  process.exit(1);
              }

              if (envioExitoso) {
                  if (loteActual >= 10) {
                      console.log('\n🛑 Lote de 10 mensajes completado. Pausa larga obligatoria de 15 minutos por seguridad...');
                      await delay(15 * 60 * 1000); // 15 minutos
                      loteActual = 0; // Reiniciar contador
                      console.log('\n🚀 Retomando campaña después del descanso de 15 minutos...');
                  } else {
                      // Esperar retraso anti-spam aleatorio (ej. 1 a 5 minutos)
                      const waitTime = Math.floor(Math.random() * (300000 - 60000 + 1) + 60000); 
                      console.log(`   ⏱️ Pausa de seguridad anti-spam: ${Math.round(waitTime/1000)}s (aprox ${Math.round(waitTime/60000)} min)...`);
                      await delay(waitTime);
                  }
              }
          }
          
          console.log(`\n🎉 CAMPAÑA FINALIZADA. Se enviaron ${enviadosEnEstaSesion} mensajes nuevos en esta sesión.`);
          process.exit(0); // Código 0 indica éxito total
      });
}

console.log('Iniciando Chromium y el cliente de WhatsApp...');
client.initialize();
