import { describe, expect, it } from "vitest";
import { ValidationError } from "../../src/utils/errors";
import { validateExpansionInput } from "../../src/api/guide-expansion/services/expansion-validate";
import { asStringList, canonicalizeCategoryNames, stripNeedPhrases } from "../../src/api/guide-expansion/services/guide-text";
import { resolveLiveAsistenteConfig } from "../../../frontend/src/lib/asistente/live-config";

describe("guide expansion validation", () => {
  it("requires key and queries or categories", () => {
    expect(() => validateExpansionInput({})).toThrow(ValidationError);
    expect(() => validateExpansionInput({ key: "medico" })).toThrow(/queries o categories/);
    const ok = validateExpansionInput({
      key: "Médico",
      queries: "hospital, clinica",
      categories: "",
    });
    expect(ok.key).toBe("medico");
    expect(ok.queries).toEqual(["hospital", "clinica"]);
  });

  it("allows partial toggle without wiping queries", () => {
    const patch = validateExpansionInput({ activo: false }, true);
    expect(patch.activo).toBe(false);
    expect(patch.queries).toBeUndefined();
    expect(patch.categories).toBeUndefined();
  });
});

describe("guide miss grouping", () => {
  it("groups necesito/busco variants on the same query_norm", () => {
    expect(stripNeedPhrases("necesito médico")).toBe("medico");
    expect(stripNeedPhrases("busco un medico")).toBe(stripNeedPhrases("necesito médico"));
    expect(stripNeedPhrases("quiero un médico")).toBe("medico");
    expect(stripNeedPhrases("quiero mate")).toBe("mate");
  });

  it("canonicalizes category casing against the catalog", () => {
    expect(canonicalizeCategoryNames(["productos regionales"], ["Productos Regionales"])).toEqual([
      "Productos Regionales",
    ]);
    expect(asStringList("quiero mate")).toEqual(["quiero mate"]);
  });
});

describe("live asistente settings", () => {
  it("pauses the bot without touching env kill switch", () => {
    const paused = resolveLiveAsistenteConfig({
      expansions: {},
      settings: {
        paused: true,
        copy_intro: "Intro panel",
        copy_no_results: "Sin fichas panel",
        copy_cta_anunciar: "Anunciá",
        copy_cta_anunciar_url: "/contacto",
      },
    });
    expect(paused.enabled).toBe(false);
    expect(paused.copyIntro).toBe("Intro panel");
    expect(paused.copyNoResults).toBe("Sin fichas panel");
  });
});
