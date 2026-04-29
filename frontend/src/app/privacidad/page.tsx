import Navbar from "@/components/layout/Navbar";


export const metadata = {
  title: "Política de Privacidad | San Rafael 360",
  description: "Políticas de privacidad y tratamiento de datos de la plataforma San Rafael 360.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-32 px-4 md:px-8">
        <div className="max-w-4xl mx-auto prose prose-invert prose-emerald">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-8">
            Política de Privacidad
          </h1>
          
          <p className="text-slate-400 mb-8">
            Última actualización: 29 de abril de 2026
          </p>

          <section className="space-y-6 text-slate-300">
            <h2 className="text-2xl font-bold text-white mt-12 mb-4">1. Información que recopilamos</h2>
            <p>
              San Rafael 360 recopila información no personal de los usuarios que visitan la plataforma para mejorar la experiencia de navegación (datos analíticos, interacciones con la interfaz). 
              Para los propietarios de negocios que reclaman su perfil, recopilamos la información básica necesaria para la verificación y contacto: nombre, correo electrónico y datos públicos del negocio.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">2. Uso de la información</h2>
            <p>
              La información recopilada se utiliza exclusivamente para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Mejorar y optimizar el funcionamiento de la aplicación (PWA/TWA).</li>
              <li>Verificar la identidad de los propietarios de negocios.</li>
              <li>Responder a consultas de soporte.</li>
              <li>Mantener el directorio actualizado y libre de spam.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">3. Compartir información</h2>
            <p>
              San Rafael 360 no vende, alquila ni comparte información personal de los usuarios con terceros. Los datos de los negocios (direcciones, teléfonos, horarios) son de dominio público y se muestran con el propósito de conectar a los usuarios con los servicios locales.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">4. Permisos de la Aplicación Móvil</h2>
            <p>
              Nuestra aplicación móvil (disponible en Google Play) funciona como una Actividad Web de Confianza (TWA). Solo solicita los permisos estándar del navegador web (como acceso a internet) y, de forma opcional y con tu consentimiento explícito, acceso a la ubicación para mostrar negocios cercanos en el mapa.
            </p>

            <h2 className="text-2xl font-bold text-white mt-12 mb-4">5. Contacto</h2>
            <p>
              Si tienes dudas sobre esta política de privacidad o sobre el tratamiento de tus datos, puedes contactarnos a través de nuestra plataforma de soporte o escribiendo a: <strong>soporte@sanrafael360.com</strong>
            </p>
          </section>
        </div>
      </main>


    </div>
  );
}
