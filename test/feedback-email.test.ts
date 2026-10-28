import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildFeedbackEmail, FEEDBACK_EMAIL } from '../lib/feedback-email';

test('feedback prepares the owner email with a lossless, encoded draft', () => {
  const message = 'Sugestão: contas & categorias?\nGostaria de uma opção #nova.\nCc: ninguém';
  const draft = new URL(buildFeedbackEmail('  ' + message + '  '));
  assert.equal(draft.protocol, 'mailto:');
  assert.equal(draft.pathname, 'ma.matheusaaguirra@gmail.com');
  assert.equal(draft.pathname, FEEDBACK_EMAIL);
  assert.equal(draft.searchParams.get('subject'), '[Feedback] WealthOS');
  assert.equal(draft.searchParams.get('body'), message);
  assert.deepEqual([...draft.searchParams.keys()], ['subject','body']);
  assert.equal(draft.hash, '');
});

test('empty, short and oversized feedback never opens an email draft', () => {
  for (const message of ['', '   ', 'curto', 'x'.repeat(1801)]) assert.throws(() => buildFeedbackEmail(message), RangeError);
  assert.doesNotThrow(() => buildFeedbackEmail('x'.repeat(1800)));
});
