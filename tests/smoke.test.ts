import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../src/shared/constants';

describe('constants', () => {
  it('names the product', () => {
    expect(APP_NAME).toBe('Downhill Summer');
  });
  it('has a version string', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
