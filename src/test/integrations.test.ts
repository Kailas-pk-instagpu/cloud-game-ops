import { describe, expect, it } from 'vitest';
import { INTEGRATIONS } from '@/shared/lib/integrationsStatus';

describe('available integrations', () => {
  it('excludes the retired E2Links provider', () => {
    expect(INTEGRATIONS.map(integration => integration.id)).not.toContain('e2link');
  });
});