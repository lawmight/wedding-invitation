import { z } from 'zod';

/** Max JSON body size for RSVP (bytes). */
export const RSVP_MAX_BODY_BYTES = 16_384;

export const rsvpBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  side: z.string().trim().min(1).max(100),
  isAttending: z.boolean(),
  guestCount: z.number().int().min(0).max(50),
  hasMeal: z.boolean().nullable(),
  timestamp: z.string().max(64).optional(),
  /** Honeypot: must be empty (bots often fill hidden fields). */
  website: z.string().max(0).optional(),
});

export type RsvpBody = z.infer<typeof rsvpBodySchema>;
