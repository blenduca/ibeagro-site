import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/js/config.js';
import { validPhone, submitLead } from '../src/js/leads.js';

const originalFetch = globalThis.fetch;
afterEach(() => { CONFIG.leadsEndpoint = ''; globalThis.fetch = originalFetch; delete globalThis.location; });

test('aceita telefones nacionais e internacionais e rejeita números incompletos', () => {
  for (const phone of ['(49) 99999-9999', '(49) 3333-3333', '+5549999999999', '+51999999999']) assert.equal(validPhone(phone), true, phone);
  for (const phone of ['', '49999', '499999999999', '+123', '+00000000000', '+1234567890123456']) assert.equal(validPhone(phone), false, phone);
});
test('demonstração não transmite dados e informa seu estado', async () => {
  globalThis.fetch = () => assert.fail('Não deve fazer requisições');
  assert.deepEqual(await submitLead('interesse', { nome: 'Teste' }), { ok: true, demo: true });
});
test('integração envia JSON com tipo, página e horário', async () => {
  CONFIG.leadsEndpoint = 'https://example.com/leads';
  globalThis.location = { pathname: '/contato.html' };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, CONFIG.leadsEndpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    const payload = JSON.parse(options.body);
    assert.equal(payload.nome, 'Teste');
    assert.equal(payload.type, 'contato');
    assert.equal(payload.page, '/contato.html');
    assert.ok(Number.isFinite(Date.parse(payload.sentAt)));
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true };
  };
  assert.deepEqual(await submitLead('contato', { nome: 'Teste', type: 'sobrescrito' }), { ok: true });
});
for (const scenario of ['resposta de erro', 'sem conexão']) {
  test(`integração propaga ${scenario} para a interface permitir nova tentativa`, async () => {
    CONFIG.leadsEndpoint = 'https://example.com/leads';
    globalThis.location = { pathname: '/' };
    globalThis.fetch = async () => { if (scenario === 'sem conexão') throw new TypeError('offline'); return { ok: false }; };
    await assert.rejects(submitLead('interesse', {}));
  });
}
