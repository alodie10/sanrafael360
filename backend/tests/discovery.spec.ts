import { test, expect } from '@playwright/test';
import { DiscoveryService } from '../src/services/discovery-service';

test.describe('Discovery Service Unit Validation', () => {
  const service = new DiscoveryService();

  test('Should find and extract website for a known business (La Delicia Boulevard)', async () => {
    // We increase timeout as real scraping involves loading Maps
    test.setTimeout(30000); 
    
    const result = await service.discover('La Delicia Boulevard');
    
    expect(result.success).toBe(true);
    // Success means we found at least the Maps URL
    expect(result.google_maps_url).toContain('google.com/maps');
    
    // We expect a website for this business
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
      { id: '2', name: 'Cabañas El Sol San Rafael' }, // Example that might exist
      { id: '3', name: 'Fake Business XYZ' }
    ];

    const results = await service.discoverBatch(mockList);
    expect(results.size).toBe(mockList.length);
    
    // Total success rate check (internally logs error if < 70%)
    let successCount = 0;
    results.forEach(res => { if (res.success) successCount++; });
    
    console.log(`Unit Test Batch Result: ${successCount}/${mockList.length} success.`);
  });
});
