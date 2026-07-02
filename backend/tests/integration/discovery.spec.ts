import { test, expect } from '@playwright/test';
import { DiscoveryService } from '../../src/services/discovery-service';

test.describe('Discovery Service Integration', () => {
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
