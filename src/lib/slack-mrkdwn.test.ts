import { describe, expect, it } from 'vitest';
import { escapeSlackMrkdwn } from './slack-mrkdwn';

describe('escapeSlackMrkdwn', () => {
  it('escapes angle brackets and ampersands', () => {
    expect(escapeSlackMrkdwn('a & b <c>')).toBe('a &amp; b &lt;c&gt;');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeSlackMrkdwn('Hello')).toBe('Hello');
  });
});
