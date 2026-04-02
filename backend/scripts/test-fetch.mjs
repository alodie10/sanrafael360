
async function test() {
  try {
    const res = await fetch('https://sanrafael360-production.up.railway.app/api/negocios');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data count:', data.data?.length);
  } catch (err) {
    console.error('FULL ERROR:', err);
  }
}
test();
