import { test, expect } from '@playwright/test';
import { DiscoveryService } from '../../src/services/discovery-service';

/**
 * Integration contra Google Maps real.
 * En CI se saltea salvo RUN_DISCOVERY_INTEGRATION=1 + GOOGLE_MAPS_API_KEY
 * (QA-08: evitaba falsos rojos en Quality Gates).
 */
const runLiveDiscovery =
  process.env.RUN_DISCOVERY_INTEGRATION === '1' &&
  Boolean(process.env.GOOGLE_MAPS_API_KEY);

test.describe('Discovery Service Integration', () => {
  test.skip(
    !runLiveDiscovery,
    'Saltar Discovery live en CI/local sin RUN_DISCOVERY_INTEGRATION=1'
  );

  const service = new DiscoveryService();

  test.setTimeout(90000);

  test('Should find and extract website for a known business (La Delicia Boulevard)', async () => {
    const result = await service.discover('La Delicia Boulevard');

    expect(result.success).toBe(true);
    expect(result.data?.google_maps_url).toMatch(/google\.com/);

    if (result.data?.website) {
      expect(result.data.website).toMatch(/^https?:\/\//);
    }

    console.log(
      `Discovered for La Delicia: Website=${result.data?.website}, Maps=${result.data?.google_maps_url}`
    );
  });

  test('Should handle non-existent business gracefully', async () => {
    const result = await service.discover('BusinessThatDefinitelyDoesNotExist123456789');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('Batch Discovery success threshold monitoring', async () => {
    const mockList = [
      { id: '1', name: 'La Delicia Boulevard' },
      { id: '2', name: 'Cabañas El Sol San Rafael' },
      { id: '3', name: 'Fake Business XYZ' },
    ];

    const results = await service.discoverBatch(mockList);
    expect(results.size).toBe(mockList.length);

    let successCount = 0;
    results.forEach((res) => {
      if (res.success) successCount++;
    });

    console.log(`Integration batch result: ${successCount}/${mockList.length} success.`);
    expect(successCount).toBeGreaterThanOrEqual(1);
  });
});
