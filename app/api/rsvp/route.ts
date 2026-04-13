import { NextResponse } from 'next/server';
import { weddingConfig } from '../../../src/config/wedding-config';
import type { SlackWebhookPayload } from '../../../src/lib/slack-blocks';
import { escapeSlackMrkdwn } from '../../../src/lib/slack-mrkdwn';
import { RSVP_MAX_BODY_BYTES, rsvpBodySchema } from '../../../src/lib/rsvp-schema';

function getSlackWebhookUrl(): string {
  return (
    process.env.SLACK_WEBHOOK_URL?.trim() ||
    process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL?.trim() ||
    ''
  );
}

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength !== null) {
      const n = Number(contentLength);
      if (Number.isFinite(n) && n > RSVP_MAX_BODY_BYTES) {
        return NextResponse.json(
          { success: false, message: 'Request body too large.' },
          { status: 413 }
        );
      }
    }

    const rawText = await request.text();
    if (rawText.length > RSVP_MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, message: 'Request body too large.' },
        { status: 413 }
      );
    }

    let json: unknown;
    try {
      json = rawText === '' ? {} : JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const parsed = rsvpBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid RSVP data.' },
        { status: 400 }
      );
    }

    const { name, side, isAttending, guestCount, hasMeal, timestamp } = parsed.data;

    if (isAttending && guestCount < 1) {
      return NextResponse.json(
        { success: false, message: 'Guest count must be at least 1 when attending.' },
        { status: 400 }
      );
    }

    if (weddingConfig.rsvp.showMealOption && isAttending && hasMeal === null) {
      return NextResponse.json(
        { success: false, message: 'Meal preference is required when attending.' },
        { status: 400 }
      );
    }

    const safeName = escapeSlackMrkdwn(name);
    const safeSide = escapeSlackMrkdwn(side);

    const slackMessage: SlackWebhookPayload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '💌 New RSVP response',
            emoji: true,
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name:* ${safeName} (${safeSide})`,
            },
            {
              type: 'mrkdwn',
              text: `*Attendance:* ${isAttending ? '✅ Attending' : '❌ Not attending'}`,
            },
          ],
        },
      ],
    };

    if (isAttending) {
      const additionalFields = [
        {
          type: 'mrkdwn' as const,
          text: `*Number of guests:* ${guestCount}`,
        },
      ];

      if (weddingConfig.rsvp.showMealOption) {
        additionalFields.push({
          type: 'mrkdwn' as const,
          text: `*Meal:* ${hasMeal ? '✅ Having meal' : '❌ No meal'}`,
        });
      }

      slackMessage.blocks.push({
        type: 'section',
        fields: additionalFields,
      });
    }

    const koreanTime = timestamp ? new Date(timestamp) : new Date();
    const koreanTimeString = koreanTime.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    slackMessage.blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Received at: ${koreanTimeString} (KST)`,
        },
      ],
    });

    const webhookUrl = getSlackWebhookUrl();

    if (webhookUrl) {
      try {
        const slackResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
        });

        if (!slackResponse.ok) {
          console.error(`Slack API error: ${slackResponse.status} ${slackResponse.statusText}`);
        }
      } catch (error) {
        console.error('Slack delivery error:', error);
      }
    } else {
      console.log('Slack webhook URL is not configured (set SLACK_WEBHOOK_URL in .env.local).');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RSVP handler error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your RSVP.',
      },
      { status: 500 }
    );
  }
}
