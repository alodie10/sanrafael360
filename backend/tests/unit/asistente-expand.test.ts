import { afterEach, describe, expect, it } from "vitest";
import frontendMap from "../../../frontend/src/lib/asistente/intent-map.json";
import backendMap from "../../src/api/negocio/data/guide-intent-map.json";
import { guideSynonymHits } from "../../src/api/negocio/services/algolia-synonyms";
import {
  applyLiveIntentMap,
  expandIntent,
  expansionSearchPlan,
  hitMatchesExpansion,
  matchIntentKey,
  preferIntentHits,
} from "../../../frontend/src/lib/asistente/expand-intent";
import { algoliaRubroQuery, coerceGuideKeywords, hitMatchesRubro } from "../../../frontend/src/lib/asistente/rank";
import { distinctiveRubroToken, isCloseToken, stripNeedPhrases } from "../../../frontend/src/lib/asistente/text";
import { materialSnippets } from "../../../frontend/src/lib/asistente/knowledge";

const hospitalEspanol = {
  objectID: "hospital-espanol",
  nombre: "Hospital Español",
  categoria: "Salud y Bienestar",
};
const hospitalSchestakow = {
  objectID: "schestakow",
  nombre: "Hospital Teodoro J. Schestakow",
  categoria: "Salud y Bienestar",
};
const gym = {
  objectID: "gym",
  nombre: "Absolute Fitness",
  categoria: "Salud y Bienestar",
};

describe("guide intent map", () => {
  afterEach(() => {
    applyLiveIntentMap(null);
  });
  it("keeps backend Algolia synonyms in sync with the editable frontend map", () => {
    expect(backendMap).toEqual(frontendMap);
    expect(guideSynonymHits().some((hit) => hit.objectID === "sr360-guide-medico")).toBe(true);
  });

  it("expands necesito médico to hospital/salud without naming a ficha", () => {
    expect(matchIntentKey("necesito médico")).toBe("medico");
    expect(matchIntentKey("necesito un medico")).toBe("medico");
    expect(expandIntent("necesito médico").queries).toContain("hospital");
    expect(expandIntent("necesito médico").categories).toContain("Salud y Bienestar");
    expect(coerceGuideKeywords("necesito médico", null)).toBe("medico");
    expect(algoliaRubroQuery("necesito médico")).toBe("hospital");
    expect(stripNeedPhrases("necesito médico")).toBe("medico");
  });

  it("keeps Hospital Español and Schestakow, drops a gym in the same category", () => {
    const expansion = expandIntent("necesito médico");
    expect(hitMatchesExpansion(hospitalEspanol, expansion)).toBe(true);
    expect(hitMatchesExpansion(hospitalSchestakow, expansion)).toBe(true);
    expect(hitMatchesExpansion(gym, expansion)).toBe(false);
    expect(hitMatchesRubro(hospitalEspanol, "centro medico")).toBe(true);
    expect(
      preferIntentHits([gym, hospitalEspanol], expansion).map((hit) => hit.objectID)[0]
    ).toBe("hospital-espanol");
  });

  it("covers other obvious catalog queries from the map", () => {
    expect(matchIntentKey("gomería")).toBe("gomeria");
    expect(matchIntentKey("dónde comer")).toBe("comer");
    expect(matchIntentKey("cabañas")).toBe("cabana");
    expect(matchIntentKey("hotel con pileta")).toBe("hotel");
    expect(matchIntentKey("dónde dormir")).toBe("hotel");
    expect(matchIntentKey("farmacia de turno")).toBe("farmacia");
    expect(matchIntentKey("que pelqueria me recomientas?")).toBe("peluqueria");
    expect(matchIntentKey("peluquería")).toBe("peluqueria");
    expect(matchIntentKey("barbería cerca")).toBe("peluqueria");
    expect(matchIntentKey("necesito cortarme el pelo")).toBe("peluqueria");
    expect(expandIntent("dónde comer").queries.length).toBeGreaterThan(0);
    expect(hitMatchesRubro(
      { objectID: "gomeria", nombre: "Neumaticos Moreno", categoria: "Talleres Mecánicos - Gomerías" },
      "gomería"
    )).toBe(true);
    expect(hitMatchesRubro(
      { objectID: "obrador", nombre: "L´OBRADOR", categoria: "Gastronomía" },
      "dónde comer"
    )).toBe(true);
    expect(hitMatchesRubro(
      { objectID: "almafuerte", nombre: "PELUQUERÍAS ALMAFUERTE", categoria: "Belleza & Estética" },
      "que pelqueria me recomientas?"
    )).toBe(true);
    expect(hitMatchesRubro(
      { objectID: "mafalda", nombre: "MAFALDA Insumos para Peluquerías", categoria: "Belleza & Estética" },
      "peluquería"
    )).toBe(false);
    expect(isCloseToken("pelqueria", "peluqueria")).toBe(true);
    expect(isCloseToken("hotel", "hostel")).toBe(false);
    expect(distinctiveRubroToken("que pelqueria me recomientas")).toBe("pelqueria");
  });

  it("uses a live expansion from the admin store without redeploying the seed JSON", () => {
    applyLiveIntentMap({
      ...frontendMap,
      masajista: {
        aliases: ["masajista", "necesito masajista"],
        queries: ["masaje"],
        categories: ["Salud y Bienestar"],
      },
    });
    expect(matchIntentKey("necesito masajista")).toBe("masajista");
    expect(expandIntent("necesito masajista").queries).toContain("masaje");
  });

  it("keeps seed intents when the live map only overrides one key", () => {
    applyLiveIntentMap({
      gomeria: frontendMap.gomeria,
    });
    expect(matchIntentKey("necesito hotel")).toBe("hotel");
    expect(matchIntentKey("gomería")).toBe("gomeria");
  });

  it("matches quiero mate to a live mate expansion", () => {
    applyLiveIntentMap({
      ...frontendMap,
      mate: {
        aliases: ["quiero mate"],
        queries: ["mate"],
        categories: ["Productos Regionales"],
      },
    });
    expect(matchIntentKey("quiero mate")).toBe("mate");
    expect(expandIntent("quiero mate").queries).toContain("mate");
    expect(expandIntent("necesito mate").key).toBe("mate");
    expect(expandIntent("busco mates").key).toBe("mate");
  });

  it("keeps shops in the expansion category when match is category", () => {
    applyLiveIntentMap({
      mate: {
        queries: ["mate"],
        categories: ["Productos Regionales"],
        match: "category",
      },
    });
    const expansion = expandIntent("busco mates");
    expect(expansion.key).toBe("mate");
    expect(
      hitMatchesExpansion(
        { nombre: "Don Yeyé Regionales", categoria: "Productos Regionales" },
        expansion
      )
    ).toBe(true);
    expect(
      hitMatchesExpansion(
        { nombre: "Hospital Español", categoria: "Salud y Bienestar" },
        expansion
      )
    ).toBe(false);
    const plan = expansionSearchPlan(expansion, "mate");
    expect(plan.some((item) => item.query === "Productos Regionales" && !item.filters)).toBe(true);
    expect(plan.some((item) => item.query === "mate" && !item.filters)).toBe(false);
  });

  it("covers catalog categories that are not hand-tuned in the seed", () => {
    expect(matchIntentKey("necesito una ferretería")).toBe("ferreterias");
    expect(matchIntentKey("dónde hay sushi")).toBe("sushi");
    expect(matchIntentKey("necesito un plomero")).toBe("servicios_para_el_hogar_y_tecno");
    expect(matchIntentKey("alquiler de auto")).toBe("alquiler_venta_de_autos");
    expect(expandIntent("ferretería").categories).toContain("Ferreterías");
    expect(hitMatchesRubro(
      { objectID: "ferre", nombre: "Don José", categoria: "Ferreterías" },
      "necesito una ferretería"
    )).toBe(true);
  });

  it("does not let the category floor steal hotel or peluquería", () => {
    expect(matchIntentKey("hotel con pileta")).toBe("hotel");
    expect(matchIntentKey("dónde dormir")).toBe("hotel");
    expect(matchIntentKey("que pelqueria me recomientas?")).toBe("peluqueria");
    expect(matchIntentKey("pasaje a buenos aires")).toBe("agencia_de_viajes");
  });
});

describe("guide material snippets", () => {
  const pricing = {
    titulo: "Cuanto cuesta publicar en la guía?",
    cuerpo:
      "El abono Premium es de $40.000 el trimestre, e incluye:\n\n• Galería de fotos y videos\n• WhatsApp, Mapa y Redes",
  };

  it("pulls the dique note and ignores unrelated text", () => {
    const materials = [
      {
        titulo: "Zonas",
        cuerpo: "Cuando dicen el dique, en San Rafael suele ser Valle Grande o Los Reyunos.\n\nEl centro es la planta urbana alrededor de San Martín.",
      },
      {
        titulo: "Vendimia",
        cuerpo: "La vendimia local suele caer en marzo, con actos en el departamento.",
      },
    ];
    const hits = materialSnippets("qué es el dique", materials);
    expect(hits[0]).toMatch(/Valle Grande/);
    expect(hits.join(" ")).not.toMatch(/vendimia/i);
  });

  it("does not dump an about page when the user wants a haircut", () => {
    const about = {
      titulo: "Acerca de",
      cuerpo:
        "San Rafael 360 es un directorio digital de la ciudad de San Rafael, Mendoza, que conecta a turistas y residentes con los mejores negocios.",
    };
    expect(materialSnippets("necesito cortarme el pelo", [about, pricing])).toEqual([]);
    expect(matchIntentKey("necesito cortarme el pelo")).toBe("peluqueria");
  });

  it("answers a pricing FAQ from the uploaded title even without a rubro", () => {
    const hits = materialSnippets("cuanto cuesta publicar?", [pricing]);
    expect(hits[0]).toMatch(/40\.000/);
    expect(hits[0]).toMatch(/Premium/i);
  });
});
