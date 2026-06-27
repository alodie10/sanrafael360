(async () => {
  const documentId = 'k425n5e6383vnv0p8m54y3is'; // I need to find the correct documentId. I will query the DB for "Quinchos de Ortubia"
  
  const res1 = await fetch('http://localhost:1337/api/negocios?filters[nombre][$contains]=Ortubia');
  const json1 = await res1.json();
  const negocio = json1.data[0];
  if (!negocio) {
    console.log("Not found in API. Is it published?");
    // Let's create a test document instead
    return;
  }
  console.log("Current Date:", negocio.premium_valid_until);
  
  // Try to update it to August
  const res2 = await fetch('http://localhost:1337/api/negocios/admin/vigencia/' + negocio.documentId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    // Temporarily disabled auth for testing in my mind, wait! The server requires auth for this route!
  });
  console.log("Update status:", res2.status);
})();
