import assert from "node:assert/strict";
import { test } from "node:test";
import { portalPathsInMessage, splitGuideMessage } from "../src/lib/asistente/message-links.ts";

const SAMPLE =
  "Encontrá de todo para regalarle a mamá en https://www.sanrafael360.com/efemerides/dia-de-la-madre. Los mejores comercios.";

function visibleText(parts: ReturnType<typeof splitGuideMessage>): string {
  return parts.map((part) => (part.type === "text" ? part.text : part.label)).join("");
}

test("el punto final no entra en el link del portal", () => {
  const parts = splitGuideMessage(SAMPLE);
  const link = parts.find((part) => part.type === "link");
  assert.ok(link && link.type === "link");
  assert.equal(link.href, "/efemerides/dia-de-la-madre");
  assert.equal(link.portalPath, "/efemerides/dia-de-la-madre");
  assert.equal(link.label, "https://www.sanrafael360.com/efemerides/dia-de-la-madre");
  assert.equal(visibleText(parts), SAMPLE);
  const after = parts[parts.findIndex((part) => part.type === "link") + 1];
  assert.equal(after?.type === "text" && after.text.startsWith("."), true);
});

test("un link externo queda absoluto y sin preview", () => {
  const parts = splitGuideMessage("Mirá https://example.com/guia.");
  const link = parts.find((part) => part.type === "link");
  assert.ok(link && link.type === "link");
  assert.equal(link.href, "https://example.com/guia");
  assert.equal(link.portalPath, null);
});

test("ruta relativa del portal y markdown", () => {
  const bare = splitGuideMessage("Ficha en /negocios/bodega-sur.");
  const bareLink = bare.find((part) => part.type === "link");
  assert.ok(bareLink && bareLink.type === "link");
  assert.equal(bareLink.portalPath, "/negocios/bodega-sur");

  const markdown = splitGuideMessage(
    "Mirá [Día de la Madre](https://sanrafael360.com/efemerides/dia-de-la-madre)."
  );
  const mdLink = markdown.find((part) => part.type === "link");
  assert.ok(mdLink && mdLink.type === "link");
  assert.equal(mdLink.label, "Día de la Madre");
  assert.equal(mdLink.portalPath, "/efemerides/dia-de-la-madre");
});

test("no linkifica javascript y deduplica previews", () => {
  const parts = splitGuideMessage("javascript:alert(1) no es link");
  assert.equal(parts.every((part) => part.type === "text"), true);

  const paths = portalPathsInMessage(
    "https://www.sanrafael360.com/categoria/alojamientos y otra vez https://www.sanrafael360.com/categoria/alojamientos"
  );
  assert.deepEqual(paths, ["/categoria/alojamientos"]);
});

test("rechaza rutas con salto de directorio", () => {
  const parts = splitGuideMessage("https://www.sanrafael360.com/efemerides/../admin");
  const link = parts.find((part) => part.type === "link");
  assert.ok(link && link.type === "link");
  assert.equal(link.portalPath, null);
  assert.equal(link.href.startsWith("/"), true);
});
