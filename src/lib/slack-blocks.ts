/** Minimal Slack Block Kit shapes used for incoming webhooks. */

export type SlackPlainTextObject = {
  type: 'plain_text';
  text: string;
  emoji?: boolean;
};

export type SlackMrkdwnObject = {
  type: 'mrkdwn';
  text: string;
};

export type SlackHeaderBlock = {
  type: 'header';
  text: SlackPlainTextObject;
};

export type SlackDividerBlock = {
  type: 'divider';
};

export type SlackSectionBlock = {
  type: 'section';
  fields?: SlackMrkdwnObject[];
};

export type SlackContextBlock = {
  type: 'context';
  elements: SlackMrkdwnObject[];
};

export type SlackBlock =
  | SlackHeaderBlock
  | SlackDividerBlock
  | SlackSectionBlock
  | SlackContextBlock;

export type SlackWebhookPayload = {
  blocks: SlackBlock[];
};
