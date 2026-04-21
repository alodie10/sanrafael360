import { test, expect } from '@playwright/test';
import { DiscoveryService } from '../../src/services/discovery-service';

test.describe('Discovery Service Unit Validation', () => {
  const service = new DiscoveryService();
  
  // Set a longer timeout for the whole suite as Maps scraping is heavy
  test.setTimeout(90000); 

  test('Should find and extract website for a known business (La Delicia Boulevard)', async () => {
    const result = await service.discover('La Delicia Boulevard');
    
    expect(result.success).toBe(true);
    expect(result.google_maps_url).toContain('google.com/maps');
    
    if (result.website) {
       expect(result.website).toMatch(/^https?:\/\//);
    }
    
    console.log(`Discovered for La Delicia: Website=${result.website}, Booking=${result.reserva_url}`);
  });

  test('Should handle non-existent business gracefully', async () => {
    const result = await service.discover('BusinessThatDefinitelyDoesNotExist123456789');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Negocio no encontrado');
  });

  test('Batch Discovery success threshold monitoring', async () => {
    const mockList = [
      { id: '1', name: 'La Delicia Boulevard' },
      { id: '2', name: 'Cabañas El Sol San Rafael' }, 
      { id: '3', name: 'Fake Business XYZ' }
    ];

    const results = await service.discoverBatch(mockList);
    expect(results.size).toBe(mockList.length);
    
    let successCount = 0;
    results.forEach(res => { if (res.success) successCount++; });
    
    console.log(`Unit Test Batch Result: ${successCount}/${mockList.length} success.`);
    // We expect at least one success (La Delicia) and one failure (Fake Business)
    expect(successCount).toBeGreaterThanOrEqual(1);
  });
});
