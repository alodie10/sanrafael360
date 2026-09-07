import { describe, expect, it } from "vitest";
import { isChitchatMessage, isFollowUpMessage, lastNeedQuery, needsZonaClarify, splitRubroZona, canonicalizeZona } from "../../../frontend/src/lib/asistente/intent";
import {
  algoliaRubroQuery,
  coerceGuideKeywords,
  excludeHitIds,
  filterHitsByRubro,
  filterHitsByZona,
  hitMatchesRubro,
  keepOnlySourceHits,
  preferHospitalHits,
  rankHitsPremiumFirst,
  takeTopHits,
} from "../../../frontend/src/lib/asistente/rank";

const hits = [
  { objectID: "free-a", is_premium: false },
  { objectID: "prem-a", is_premium: true },
  { objectID: "free-b", is_premium: false },
  { objectID: "prem-b", is_premium: true },
];

describe("asistente rank", () => {
  it("puts premium before free when PREMIUM_FIRST is on", () => {
    const ranked = rankHitsPremiumFirst(hits, true);
    expect(ranked.map((h) => h.objectID)).toEqual(["prem-a", "prem-b", "free-a", "free-b"]);
  });

  it("keeps Algolia order when PREMIUM_FIRST is off", () => {
    expect(rankHitsPremiumFirst(hits, false).map((h) => h.objectID)).toEqual(
      hits.map((h) => h.objectID)
    );
  });

  it("keeps matching premium ahead of a free hospital name", () => {
    expect(
      preferHospitalHits(
        [
          { objectID: "hospital-espanol", nombre: "Hospital Español", categoria: "Salud y Bienestar", is_premium: false },
          { objectID: "lidherma", nombre: "Distribuidora Lidherma", categoria: "Salud y Bienestar", is_premium: true },
        ],
        "necesito un medico"
      ).map((hit) => hit.objectID)
    ).toEqual(["lidherma", "hospital-espanol"]);
  });

  it("takes only the top 2–3 real hits", () => {
    expect(takeTopHits(hits, 3)).toHaveLength(3);
    expect(takeTopHits(hits, 2)).toHaveLength(2);
  });

  it("never keeps hits that were not in the Algolia source", () => {
    const invented = [{ objectID: "fake-local", is_premium: true }, hits[1]];
    expect(keepOnlySourceHits(invented, hits).map((h) => h.objectID)).toEqual(["prem-a"]);
  });

  it("drops already shown ids for otras opciones", () => {
    expect(excludeHitIds(hits, ["prem-a", "free-a"]).map((h) => h.objectID)).toEqual([
      "free-b",
      "prem-b",
    ]);
  });
});

describe("asistente zona constraint", () => {
  const fichas = [
    {
      objectID: "gomeria-lp",
      is_premium: false,
      nombre: "Centro del Neumático Gomería",
      zona: "Bertani Sur 100 – Las Paredes",
    },
    {
      objectID: "cabana-lp",
      is_premium: true,
      nombre: "Cabañas Expoarte - Las Paredes",
      zona: "Bertani Sur 1285 – Las Paredes",
    },
    {
      objectID: "gomeria-centro",
      is_premium: true,
      nombre: "Gomería del Centro",
      zona: "Mitre 200, San Rafael",
    },
  ];

  it("keeps only hits in the requested zona after a rubro search", () => {
    expect(filterHitsByZona(fichas, "Las Paredes").map((h) => h.objectID)).toEqual([
      "gomeria-lp",
      "cabana-lp",
    ]);
  });

  it("matches centro in the ficha name, not the whole phrase el centro de san rafael", () => {
    expect(
      filterHitsByZona(
        [
          {
            objectID: "ambar",
            is_premium: true,
            nombre: "AMBAR Beauty & Spa (Centro de San Rafael)",
            zona: "San Martín 100",
          },
          {
            objectID: "dique",
            is_premium: false,
            nombre: "Parrilla del Dique",
            zona: "Valle Grande",
          },
        ],
        "centro"
      ).map((h) => h.objectID)
    ).toEqual(["ambar"]);
    expect(
      filterHitsByZona(
        [
          {
            objectID: "ambar",
            is_premium: true,
            nombre: "AMBAR Beauty & Spa (Centro de San Rafael)",
            zona: "San Martín 100",
          },
        ],
        "el centro de san rafael"
      )
    ).toHaveLength(0);
  });

  it("does not treat other businesses in the zona as a match for a different rubro set", () => {
    const gomerias = fichas.filter((h) => h.nombre.toLowerCase().includes("gomer"));
    expect(filterHitsByZona(gomerias, "las paredes").map((h) => h.objectID)).toEqual(["gomeria-lp"]);
  });
});

describe("splitRubroZona", () => {
  it("splits gomería en las paredes into rubro + zona", () => {
    expect(splitRubroZona("gomería en las paredes")).toEqual({
      keywords: "gomería",
      zona: "las paredes",
    });
  });

  it("maps dime donde comer en el centro de san rafael to comer + centro", () => {
    expect(canonicalizeZona("el centro de san rafael")).toBe("centro");
    expect(splitRubroZona("dime donde comer en el centro de san rafael")).toEqual({
      keywords: "dime donde comer",
      zona: "centro",
    });
    expect(algoliaRubroQuery("dime donde comer")).toBe("restaurante");
  });
});

describe("asistente rubro constraint", () => {
  const fichas = [
    {
      objectID: "gomeria",
      is_premium: false,
      nombre: "Neumaticos Moreno",
      categoria: "Talleres Mecánicos - Gomerías",
      zona: "Bombal 122",
    },
    {
      objectID: "bodega",
      is_premium: true,
      nombre: "Bodega Bianchi",
      categoria: "Bodegas",
      zona: "Las Paredes",
    },
  ];

  it("keeps tire shops and drops a bodega for a gomería need", () => {
    expect(hitMatchesRubro(fichas[0], "gomería")).toBe(true);
    expect(hitMatchesRubro(fichas[1], "gomería")).toBe(false);
    expect(filterHitsByRubro(fichas, "gomería").map((h) => h.objectID)).toEqual(["gomeria"]);
  });

  it("does not accept a workshop just because it shares a mixed category", () => {
    expect(
      hitMatchesRubro(
        {
          objectID: "escapes",
          nombre: "Escapes San Rafael",
          categoria: "Talleres Mecánicos - Gomerías",
          keywords: "gomería neumático",
        },
        "gomería"
      )
    ).toBe(false);
  });

  it("reads the description when the name does not contain the rubro", () => {
    expect(
      hitMatchesRubro(
        {
          objectID: "duvar",
          nombre: "DUVAR Club de Eventos",
          categoria: "Salones de Eventos",
          descripcion: "<p>Resto club en Las Paredes para eventos y reuniones.</p>",
        },
        "resto"
      )
    ).toBe(true);
  });

  it("does not treat comercio as a match for comer", () => {
    expect(
      hitMatchesRubro(
        {
          objectID: "comercio",
          nombre: "Comercio del Valle",
          categoria: "Tiendas",
          descripcion: "Venta de productos regionales",
        },
        "comer"
      )
    ).toBe(false);
  });

  it("matches gastronomía and comedor as a place to eat", () => {
    expect(
      hitMatchesRubro(
        {
          objectID: "obrador",
          nombre: "L´OBRADOR",
          categoria: "Gastronomía",
          descripcion: "Comedor de campo con cocina casera.",
        },
        "quiero comer"
      )
    ).toBe(true);
  });

  it("searches the product in a natural question, not the verb", () => {
    expect(algoliaRubroQuery("donde puedo comprar alfajores")).toBe("alfajor");
    expect(
      hitMatchesRubro(
        {
          objectID: "fabrica",
          nombre: "Havanna San Rafael",
          categoria: "Productos regionales",
          descripcion: "Fábrica y venta de alfajores de dulce de leche.",
        },
        "donde puedo comprar alfajores"
      )
    ).toBe(true);
  });

  it("asks zona for wine and only keeps bodegas, not a pizzeria with vinos on the menu", () => {
    expect(algoliaRubroQuery("donde puedo encontrar buenos vinos")).toBe("bodega");
    expect(
      needsZonaClarify({ categoria: null, zona: null, keywords: "donde puedo encontrar buenos vinos" })
    ).toBe(true);
    expect(
      hitMatchesRubro(
        {
          objectID: "pizza",
          nombre: "La Buenos Aires Pizza",
          categoria: "Pizzeria",
          descripcion: "Pizzas y buenos vinos de la casa.",
        },
        "buenos vinos"
      )
    ).toBe(false);
    expect(
      hitMatchesRubro(
        {
          objectID: "etnia",
          nombre: "BODEGA ETNIA",
          categoria: "Bodegas",
          zona: "Rama Caída",
        },
        "buenos vinos"
      )
    ).toBe(true);
  });

  it("maps qué lugares visitar to interés turístico, not a random ficha", () => {
    expect(algoliaRubroQuery("qué lugares visitar")).toBe("turistico");
    expect(coerceGuideKeywords("que lugares puedo visitar?", "lugares")).toBe("visitar");
    expect(algoliaRubroQuery("que lugares puedo visitar?")).toBe("turistico");
    expect(
      hitMatchesRubro(
        {
          objectID: "atuel",
          nombre: "Cañón del Atuel",
          categoria: "Interés Turístico",
        },
        "qué lugares visitar"
      )
    ).toBe(true);
    expect(
      hitMatchesRubro(
        {
          objectID: "cabanas",
          nombre: "Cabañas Complejo Turístico Motel Cañón Del Atuel",
          categoria: "Cabañas",
        },
        "qué lugares visitar"
      )
    ).toBe(false);
  });

  it("maps balancear rueda to gomería and drops a restaurant that mentions rueda", () => {
    expect(algoliaRubroQuery("balancear rueda")).toBe("gomeria");
    expect(
      hitMatchesRubro(
        {
          objectID: "gomeria",
          nombre: "Neumaticos Moreno",
          categoria: "Talleres Mecánicos - Gomerías",
          descripcion: "Balanceo y alineación de cubiertas.",
        },
        "balancear rueda"
      )
    ).toBe(true);
    expect(
      hitMatchesRubro(
        {
          objectID: "resto",
          nombre: "El Quincho de la Rueda",
          categoria: "Gastronomía",
          descripcion: "Hola, parrilla y rueda de vinos en el centro.",
        },
        "balancear rueda"
      )
    ).toBe(false);
  });

  it("maps medico and centro medico to salud, not a gym in the same category", () => {
    expect(algoliaRubroQuery("necesito un medico")).toBe("hospital");
    expect(algoliaRubroQuery("centro medico")).toBe("hospital");
    expect(coerceGuideKeywords("necesito un medico", null)).toBe("medico");
    expect(
      hitMatchesRubro(
        {
          objectID: "hospital-espanol",
          nombre: "Hospital Español",
          categoria: "Salud y Bienestar",
        },
        "necesito un medico"
      )
    ).toBe(true);
    expect(
      hitMatchesRubro(
        {
          objectID: "schestakow",
          nombre: "Hospital Teodoro J. Schestakow",
          categoria: "Salud y Bienestar",
        },
        "centro medico"
      )
    ).toBe(true);
    expect(
      hitMatchesRubro(
        {
          objectID: "gym",
          nombre: "Absolute Fitness",
          categoria: "Salud y Bienestar",
        },
        "centro medico"
      )
    ).toBe(false);
    expect(
      preferHospitalHits(
        [
          { objectID: "kine", nombre: "Kinesiología Sur", categoria: "Salud y Bienestar", is_premium: false },
          { objectID: "hospital-espanol", nombre: "Hospital Español", categoria: "Salud y Bienestar", is_premium: false },
        ],
        "necesito un medico"
      ).map((hit) => hit.objectID)
    ).toEqual(["hospital-espanol", "kine"]);
  });
});

describe("chitchat does not become a rubro", () => {
  it("treats hola and gracias as chitchat", () => {
    expect(isChitchatMessage("hola")).toBe(true);
    expect(isChitchatMessage("Hola!")).toBe(true);
    expect(isChitchatMessage("buenas tardes")).toBe(true);
    expect(isChitchatMessage("gracias")).toBe(true);
    expect(isChitchatMessage("balancear rueda")).toBe(false);
    expect(isChitchatMessage("hola, busco gomería")).toBe(false);
  });

  it("does not keep hola as the last need", () => {
    expect(
      lastNeedQuery(
        [
          { role: "user", content: "hola" },
          { role: "assistant", content: "preguntame" },
          { role: "user", content: "gomería" },
        ],
        ""
      )
    ).toBe("gomería");
  });
});

describe("follow-up keeps the original need", () => {
  it("treats otro lugar cercano as a follow-up", () => {
    expect(isFollowUpMessage("otro lugar cercano")).toBe(true);
  });

  it("treats las paredes as a zona follow-up", () => {
    expect(isFollowUpMessage("Las Paredes")).toBe(true);
  });

  it("does not treat centro medico as a zona follow-up", () => {
    expect(isFollowUpMessage("centro medico")).toBe(false);
  });

  it("reads the last real need, not the follow-up", () => {
    expect(
      lastNeedQuery(
        [
          { role: "user", content: "gomería en las paredes" },
          { role: "assistant", content: "no encontré" },
          { role: "user", content: "otro lugar cercano" },
        ],
        ""
      )
    ).toBe("gomería en las paredes");
  });
});
