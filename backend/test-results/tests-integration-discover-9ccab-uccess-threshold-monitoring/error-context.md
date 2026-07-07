# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/integration/discovery.spec.ts >> Discovery Service Integration >> Batch Discovery success threshold monitoring
- Location: tests/integration/discovery.spec.ts:31:7

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 1
Received:    0
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { DiscoveryService } from '../../src/services/discovery-service';
  3  | 
  4  | test.describe('Discovery Service Integration', () => {
  5  |   const service = new DiscoveryService();
  6  | 
  7  |   test.setTimeout(90000);
  8  | 
  9  |   test('Should find and extract website for a known business (La Delicia Boulevard)', async () => {
  10 |     const result = await service.discover('La Delicia Boulevard');
  11 | 
  12 |     expect(result.success).toBe(true);
  13 |     expect(result.data?.google_maps_url).toMatch(/google\.com/);
  14 | 
  15 |     if (result.data?.website) {
  16 |       expect(result.data.website).toMatch(/^https?:\/\//);
  17 |     }
  18 | 
  19 |     console.log(
  20 |       `Discovered for La Delicia: Website=${result.data?.website}, Maps=${result.data?.google_maps_url}`
  21 |     );
  22 |   });
  23 | 
  24 |   test('Should handle non-existent business gracefully', async () => {
  25 |     const result = await service.discover('BusinessThatDefinitelyDoesNotExist123456789');
  26 | 
  27 |     expect(result.success).toBe(false);
  28 |     expect(result.error).toBeTruthy();
  29 |   });
  30 | 
  31 |   test('Batch Discovery success threshold monitoring', async () => {
  32 |     const mockList = [
  33 |       { id: '1', name: 'La Delicia Boulevard' },
  34 |       { id: '2', name: 'Cabañas El Sol San Rafael' },
  35 |       { id: '3', name: 'Fake Business XYZ' },
  36 |     ];
  37 | 
  38 |     const results = await service.discoverBatch(mockList);
  39 |     expect(results.size).toBe(mockList.length);
  40 | 
  41 |     let successCount = 0;
  42 |     results.forEach((res) => {
  43 |       if (res.success) successCount++;
  44 |     });
  45 | 
  46 |     console.log(`Integration batch result: ${successCount}/${mockList.length} success.`);
> 47 |     expect(successCount).toBeGreaterThanOrEqual(1);
     |                          ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  48 |   });
  49 | });
  50 | 
```