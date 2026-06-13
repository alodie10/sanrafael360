const fs = require('fs');
const csv = require('csv-parser');

const templateText = `¡Hola Propietarios de *{{1}}*! 👋

Somos del equipo de *San Rafael 360*. Somos la guía local de San Rafael. Vimos que su rubro es *{{2}}* y estamos armando el directorio digital más completo de la ciudad.

Los invitamos a revisar vuestro perfil y cualquier otro que quieran consultar para que vean los distintos formatos que ofrecemos.

👉 Pueden verlo:
Ingresando en www.sanrafael360.com o si tienes celular con Android descargando la app de Play Store https://play.google.com/store/apps/details?id=com.sanrafael360.www.twa

Contratando el plan PREMIUM por $25.000 el trimestre y si eliges el pago anual con un 20% de descuento abonas solamente $80.000. 

Por este plan acceden a cargar una galería completa de fotos, videos, ubicación al instante con Google Maps, links a redes sociales, WhatsApp y más.

Si les interesa participar pueden responder a este mismo mensaje de WhatsApp.`;

function formatNumber(num) {
    let clean = num.replace(/\D/g, '');
    if (clean.startsWith('54') && !clean.startsWith('549')) {
        clean = clean.replace('54', '549');
    } else if (!clean.startsWith('549')) {
        clean = '549' + clean;
    }
    return clean;
}

const csvData = [];
const enviados = JSON.parse(fs.readFileSync('enviados.json', 'utf8')).map(n => n.replace('@c.us', ''));

fs.createReadStream('curada.csv')
    .pipe(csv())
    .on('data', (row) => {
        const telefonoOriginal = row['WhatsApp'] || row['Teléfono'] || row['Telefono'];
        if (!telefonoOriginal) return;

        const telefonoParseado = formatNumber(telefonoOriginal);
        if (enviados.includes(telefonoParseado)) {
            return;
        }

        const nombre = row['Nombre'] || row['name'] || '';
        const categoria = row['Categoría'] || row['Categoria'] || row['category'] || 'negocios';

        const mensaje = templateText.replace('{{1}}', nombre).replace('{{2}}', categoria);
        const urlEncodedMessage = encodeURIComponent(mensaje);
        const linkWhatsApp = `https://wa.me/${telefonoParseado}?text=${urlEncodedMessage}`;

        csvData.push({
            telefono: telefonoParseado,
            nombre: nombre,
            categoria: categoria,
            mensaje_texto: mensaje,
            link_whatsapp: linkWhatsApp
        });
    })
    .on('end', () => {
        // Build CSV string
        let csvOutput = '\uFEFF'; // BOM for Excel to read UTF-8 properly
        csvOutput += '"Teléfono","Nombre","Categoría","Mensaje Texto","Link Directo WhatsApp"\n';
        
        csvData.forEach(item => {
            const row = [
                `"${item.telefono}"`,
                `"${item.nombre.replace(/"/g, '""')}"`,
                `"${item.categoria.replace(/"/g, '""')}"`,
                `"${item.mensaje_texto.replace(/"/g, '""')}"`,
                `"${item.link_whatsapp}"`
            ].join(',');
            csvOutput += row + '\n';
        });

        fs.writeFileSync('envios_manuales.csv', csvOutput);
        console.log(`¡Archivo envios_manuales.csv generado con ${csvData.length} contactos!`);
    });
