# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/integration/discovery.spec.ts >> Discovery Service Unit Validation >> Should handle non-existent business gracefully
- Location: tests/integration/discovery.spec.ts:25:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { DiscoveryService } from '../../src/services/discovery-service';
  3  | 
  4  | test.describe('Discovery Service Unit Validation', () => {
  5  |   const service = new DiscoveryService();
  6  | 
  7  |   test('Should find and extract website for a known business (La Delicia Boulevard)', async () => {
  8  |     // We increase timeout as real scraping involves loading Maps
  9  |     test.setTimeout(30000); 
  10 |     
  11 |     const result = await service.discover('La Delicia Boulevard');
  12 |     
  13 |     expect(result.success).toBe(true);
  14 |     // Success means we found at least the Maps URL
  15 |     expect(result.google_maps_url).toContain('google.com/maps');
  16 |     
  17 |     // We expect a website for this business
  18 |     if (result.website) {
  19 |        expect(result.website).toMatch(/^https?:\/\//);
  20 |     }
  21 |     
  22 |     console.log(`Discovered for La Delicia: Website=${result.website}, Booking=${result.reserva_url}`);
  23 |   });
  24 | 
  25 |   test('Should handle non-existent business gracefully', async () => {
  26 |     const result = await service.discover('BusinessThatDefinitelyDoesNotExist123456789');
  27 |     
> 28 |     expect(result.success).toBe(false);
     |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  29 |     expect(result.error).toContain('Negocio no encontrado');
  30 |   });
  31 | 
  32 |   test('Batch Discovery success threshold monitoring', async () => {
  33 |     const mockList = [
  34 |       { id: '1', name: 'La Delicia Boulevard' },
  35 |       { id: '2', name: 'Cabañas El Sol San Rafael' }, // Example that might exist
  36 |       { id: '3', name: 'Fake Business XYZ' }
  37 |     ];
  38 | 
  39 |     const results = await service.discoverBatch(mockList);
  40 |     expect(results.size).toBe(mockList.length);
  41 |     
  42 |     // Total success rate check (internally logs error if < 70%)
  43 |     let successCount = 0;
  44 |     results.forEach(res => { if (res.success) successCount++; });
  45 |     
  46 |     console.log(`Unit Test Batch Result: ${successCount}/${mockList.length} success.`);
  47 |   });
  48 | });
  49 | 
```