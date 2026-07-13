import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPaymentSuccess } from '../../src/services/payment-success-handler';

describe('processPaymentSuccess', () => {
  const log = { info: vi.fn(), error: vi.fn() };
  const mockFindByMpPaymentId = vi.fn();
  const mockFindSubscriptionConfig = vi.fn();
  const mockFindPendingByExternalReference = vi.fn();
  const mockPagoUpdate = vi.fn();
  const mockPagoCreate = vi.fn();
  const mockNegocioFindById = vi.fn();
  const mockNegocioUpdate = vi.fn();

  const repos = {
    pagoRepo: {
      findByMpPaymentId: mockFindByMpPaymentId,
      findSubscriptionConfig: mockFindSubscriptionConfig,
      findPendingByExternalReference: mockFindPendingByExternalReference,
      update: mockPagoUpdate,
      create: mockPagoCreate,
    },
    negocioRepo: {
      findById: mockNegocioFindById,
      update: mockNegocioUpdate,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindSubscriptionConfig.mockResolvedValue({
      precio_semestral: 50000,
      dias_semestral: 180,
      dias_mensual: 30,
    });
  });

  it('returns duplicate when payment already approved', async () => {
    mockFindByMpPaymentId.mockResolvedValue([
      { estado: 'aprobado', documentId: 'pago-1' },
    ]);

    const result = await processPaymentSuccess(repos, log, 'neg-doc', 'mp-123');

    expect(result).toEqual({ success: true, duplicate: true });
    expect(mockNegocioUpdate).not.toHaveBeenCalled();
  });

  it('activates premium and updates pending pago on success', async () => {
    mockFindByMpPaymentId.mockResolvedValue([]);
    mockNegocioFindById.mockResolvedValue({ id: 7, nombre: 'Café Central' });
    mockFindPendingByExternalReference.mockResolvedValue({
      documentId: 'pago-pendiente',
      monto: 1200,
    });

    const result = await processPaymentSuccess(repos, log, 'neg-doc', 'mp-456');

    expect(result).toEqual({ success: true, negocio: 'Café Central' });
    expect(mockNegocioUpdate).toHaveBeenCalledWith(
      'neg-doc',
      expect.objectContaining({ is_premium: true })
    );
    expect(mockPagoUpdate).toHaveBeenCalledWith(
      'pago-pendiente',
      expect.objectContaining({ estado: 'aprobado', mp_payment_id: 'mp-456' })
    );
  });

  it('creates pago record when no pending exists', async () => {
    mockFindByMpPaymentId.mockResolvedValue([]);
    mockNegocioFindById.mockResolvedValue({ id: 7, nombre: 'Café Central' });
    mockFindPendingByExternalReference.mockResolvedValue(null);

    await processPaymentSuccess(repos, log, 'neg-doc', 'mp-789');

    expect(mockPagoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'aprobado', monto: 0 })
    );
  });

  it('logs error and returns undefined when negocio not found', async () => {
    mockFindByMpPaymentId.mockResolvedValue([]);
    mockNegocioFindById.mockResolvedValue(null);

    const result = await processPaymentSuccess(repos, log, 'missing', 'mp-000');

    expect(result).toBeUndefined();
    expect(log.error).toHaveBeenCalled();
    expect(mockNegocioUpdate).not.toHaveBeenCalled();
  });
});
