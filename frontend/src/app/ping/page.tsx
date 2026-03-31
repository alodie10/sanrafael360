export default function PingPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui' 
    }}>
      <h1>✅ El Frontend está vivo</h1>
      <p>Si ves esto, el ruteo de Vercel está funcionando correctamente.</p>
      <a href="/">Volver al Inicio</a>
    </div>
  );
}
