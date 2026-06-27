const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', 'utf-8');

const targetPart = `      if (!res.ok) throw new Error("Error al guardar la vigencia");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert("Error al actualizar la fecha");
    }`;

const newPart = `      if (!res.ok) throw new Error("Error al guardar la vigencia: " + await res.text());
      const responseBody = await res.json();
      console.log("VIGENCIA UPDATE RESPONSE:", responseBody);
      setRefreshTrigger(prev => prev + 1);
      alert("Guardado OK! Vuelve a recargar si la fecha salta.");
    } catch (err) {
      console.error(err);
      alert("Error crítico al actualizar: " + err.message);
    }`;

code = code.replace(targetPart, newPart);
fs.writeFileSync('frontend/src/components/portal/AdminPaymentsView.tsx', code);
console.log("Added alerts to frontend");
