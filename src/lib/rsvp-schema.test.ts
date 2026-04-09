import { describe, expect, it } from 'vitest';
import { rsvpBodySchema } from './rsvp-schema';

describe('rsvpBodySchema', () => {
  it('accepts valid attending payload', () => {
    const r = rsvpBodySchema.safeParse({
      name: 'Kim',
      side: '신랑측',
      isAttending: true,
      guestCount: 2,
      hasMeal: true,
      timestamp: new Date().toISOString(),
      website: '',
    });
    expect(r.success).toBe(true);
  });

  it('rejects non-empty honeypot', () => {
    const r = rsvpBodySchema.safeParse({
      name: 'Kim',
      side: '신랑측',
      isAttending: false,
      guestCount: 0,
      hasMeal: null,
      website: 'http://spam.com',
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty name', () => {
    const r = rsvpBodySchema.safeParse({
      name: '   ',
      side: '신랑측',
      isAttending: true,
      guestCount: 1,
      hasMeal: false,
    });
    expect(r.success).toBe(false);
  });
});
