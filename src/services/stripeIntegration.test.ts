import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripeService } from './stripeIntegration';

describe('stripeIntegration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updatePricing should call the correct API with the provided prices', async () => {
    const prices = { premium: 5.99, coach: 59 };
    const mockResponse = { success: true, message: 'Prices updated' };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await stripeService.updatePricing(prices);

    expect(fetch).toHaveBeenCalledWith('/api/stripe/update-pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prices),
    });
    expect(result).toEqual(mockResponse);
  });

  it('updatePricing should handle API errors gracefully', async () => {
    const prices = { premium: 5.99, coach: 59 };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await stripeService.updatePricing(prices);

    expect(fetch).toHaveBeenCalledWith('/api/stripe/update-pricing', expect.any(Object));
    expect(result.success).toBe(false);
    expect(result.message).toContain('HTTP 500');
  });
});
