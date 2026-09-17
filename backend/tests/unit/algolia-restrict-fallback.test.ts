import { describe, expect, it, vi } from "vitest";
import {
  algoliaResultErrorMessage,
  dropRestrictAttribute,
  isSearchableAttributeMismatch,
  missingSearchableAttribute,
  omitRestrictAttributes,
  relaxSearchRequests,
  searchAlgoliaWithRestrictFallback,
} from "../../../frontend/src/lib/algolia-restrict-fallback";

const mismatch =
  "restrictSearchableAttributes: attribute atributos is not in searchableAttributes";

describe("Algolia restrict fallback", () => {
  it("detects searchableAttributes mismatches and the missing field", () => {
    expect(isSearchableAttributeMismatch(mismatch)).toBe(true);
    expect(missingSearchableAttribute(mismatch)).toBe("atributos");
    expect(isSearchableAttributeMismatch("Index not found")).toBe(false);
  });

  it("drops the missing restrict field instead of sending an empty search", () => {
    const next = dropRestrictAttribute(
      {
        query: "sushi",
        restrictSearchableAttributes: ["nombre", "atributos", "descripcion"],
        attributesToHighlight: ["nombre", "atributos"],
      },
      "atributos"
    );
    expect(next.restrictSearchableAttributes).toEqual(["nombre", "descripcion"]);
    expect(next.attributesToHighlight).toEqual(["nombre"]);
  });

  it("omits restrict entirely when the mismatch has no field name", () => {
    const relaxed = relaxSearchRequests(
      [{ query: "sushi", restrictSearchableAttributes: ["atributos"] }],
      "restrictSearchableAttributes is invalid for searchableAttributes"
    );
    expect(relaxed?.[0].restrictSearchableAttributes).toBeUndefined();
    expect(omitRestrictAttributes({ query: "q", restrictSearchableAttributes: ["nombre"] }))
      .not.toHaveProperty("restrictSearchableAttributes");
  });

  it("reads per-result Algolia errors when hits are missing", () => {
    expect(algoliaResultErrorMessage({ status: 400, message: mismatch })).toBe(mismatch);
    expect(algoliaResultErrorMessage({ hits: [], nbHits: 0 })).toBeNull();
  });

  it("retries after a thrown restrict mismatch and then returns hits", async () => {
    const search = vi.fn()
      .mockRejectedValueOnce(new Error(mismatch))
      .mockResolvedValueOnce({ results: [{ hits: [{ objectID: "1", nombre: "Majal Sushi" }] }] });

    const results = await searchAlgoliaWithRestrictFallback(
      { search },
      [{ query: "sushi", restrictSearchableAttributes: ["nombre", "atributos"] }]
    );

    expect(search).toHaveBeenCalledTimes(2);
    expect(search.mock.calls[1][0].requests[0].restrictSearchableAttributes).toEqual(["nombre"]);
    expect((results[0] as { hits: { nombre: string }[] }).hits[0].nombre).toBe("Majal Sushi");
  });

  it("retries when Algolia returns a 400 inside results instead of throwing", async () => {
    const search = vi.fn()
      .mockResolvedValueOnce({ results: [{ status: 400, message: mismatch }] })
      .mockResolvedValueOnce({ results: [{ hits: [{ objectID: "2" }] }] });

    const results = await searchAlgoliaWithRestrictFallback(
      { search },
      [{ query: "cabaña", restrictSearchableAttributes: ["nombre", "atributos"] }]
    );

    expect(search).toHaveBeenCalledTimes(2);
    expect((results[0] as { hits: unknown[] }).hits).toHaveLength(1);
  });

  it("does not retry unrelated Algolia failures", async () => {
    const search = vi.fn().mockRejectedValue(new Error("Valid API key required"));
    await expect(
      searchAlgoliaWithRestrictFallback({ search }, [{ query: "sushi" }])
    ).rejects.toThrow("Valid API key required");
    expect(search).toHaveBeenCalledTimes(1);
  });
});
