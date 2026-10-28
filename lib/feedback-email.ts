export const FEEDBACK_EMAIL = 'ma.matheusaaguirra@gmail.com';

/** Prepare a draft only. The visitor confirms delivery in their email application. */
export function buildFeedbackEmail(message: string): string {
  const body = message.trim();
  if (body.length < 10 || body.length > 1800) throw new RangeError('feedback_length');
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('[Feedback] WealthOS')}&body=${encodeURIComponent(body)}`;
}
