import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processPayment } from './mock-payment';

describe('mock-payment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const validPayment = {
    amount: 25.99,
    cardNumber: '4242424242424242',
    expiryDate: '07/12',
    cvc: '301',
  };

  it('resolves after 1.5 seconds delay', async () => {
    const promise = processPayment(validPayment);

    vi.advanceTimersByTime(1499);
    let resolved = false;
    promise.then(() => { resolved = true; });
    await vi.advanceTimersByTimeAsync(1);

    expect(resolved).toBe(true);
  });

  it('returns success with valid demo card details', async () => {
    const promise = processPayment(validPayment);
    vi.advanceTimersByTime(1500);

    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.transactionId).not.toBeNull();
    expect(result.transactionId).toMatch(/^txn_[a-z0-9]{24}$/);
    expect(result.message).toBe('Payment successful');
  });

  it('declines when card number is wrong', async () => {
    const promise = processPayment({ ...validPayment, cardNumber: '1234567890123456' });
    vi.advanceTimersByTime(1500);

    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.transactionId).toBeNull();
    expect(result.message).toBe('Payment declined. Please check your card details.');
  });

  it('declines when expiry date is wrong', async () => {
    const promise = processPayment({ ...validPayment, expiryDate: '12/26' });
    vi.advanceTimersByTime(1500);

    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.transactionId).toBeNull();
  });

  it('declines when CVC is wrong', async () => {
    const promise = processPayment({ ...validPayment, cvc: '123' });
    vi.advanceTimersByTime(1500);

    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.transactionId).toBeNull();
  });

  it('accepts card number with spaces', async () => {
    const promise = processPayment({ ...validPayment, cardNumber: '4242 4242 4242 4242' });
    vi.advanceTimersByTime(1500);

    const result = await promise;

    expect(result.success).toBe(true);
    expect(result.transactionId).not.toBeNull();
  });

  it('generates unique transaction IDs for each successful payment', async () => {
    const promise1 = processPayment(validPayment);
    vi.advanceTimersByTime(1500);
    const result1 = await promise1;

    const promise2 = processPayment(validPayment);
    vi.advanceTimersByTime(1500);
    const result2 = await promise2;

    expect(result1.transactionId).not.toBe(result2.transactionId);
  });

  it('transaction ID has realistic format (txn_ prefix + alphanumeric)', async () => {
    const promise = processPayment(validPayment);
    vi.advanceTimersByTime(1500);
    const result = await promise;

    expect(result.transactionId).toMatch(/^txn_[a-z0-9]+$/);
    expect(result.transactionId!.startsWith('txn_')).toBe(true);
    expect(result.transactionId!.length).toBeGreaterThan(4);
  });
});
