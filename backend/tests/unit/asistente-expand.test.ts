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
import { stripNeedPhrases } from "../../../frontend/src/lib/asistente/text";

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
    expect(expandIntent("dónde comer").queries.length).toBeGreaterThan(0);
    expect(hitMatchesRubro(
      { objectID: "gomeria", nombre: "Neumaticos Moreno", categoria: "Talleres Mecánicos - Gomerías" },
      "gomería"
    )).toBe(true);
    expect(hitMatchesRubro(
      { objectID: "obrador", nombre: "L´OBRADOR", categoria: "Gastronomía" },
      "dónde comer"
    )).toBe(true);
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
});
