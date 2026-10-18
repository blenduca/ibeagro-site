import { CONFIG } from './config.js';

// Integração única: POST JSON. O preview nunca armazena ou transmite dados.
export async function submitLead(type, data) {
  if (!CONFIG.leadsEndpoint) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { ok: true, demo: true };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(CONFIG.leadsEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, type, page: location.pathname, sentAt: new Date().toISOString() }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error('Falha no envio');
    return { ok: true };
  } finally { clearTimeout(timeout); }
}

export function validPhone(value) {
  const digits = value.replace(/\D/g, '');
  return value.startsWith('+') ? /^[1-9]\d{7,14}$/.test(digits) : /^\d{10,11}$/.test(digits);
}

function phoneMask(input) {
  input.addEventListener('input', () => {
    const international = input.value.trim().startsWith('+');
    const d = input.value.replace(/\D/g, '').slice(0, international ? 15 : 11);
    if (international) { input.value = '+' + d; return; }
    input.value = d.length <= 2 ? d : d.length <= 6 ? `(${d.slice(0, 2)}) ${d.slice(2)}` :
      `(${d.slice(0, 2)}) ${d.slice(2, d.length > 10 ? 7 : 6)}-${d.slice(d.length > 10 ? 7 : 6)}`;
  });
}

function fieldMessage(el) {
  if (el.disabled || el.type === 'hidden') return '';
  if (el.type === 'checkbox') return el.required && !el.checked ? 'Autorize o contato para continuar.' : '';
  if (el.required && !el.value.trim()) return 'Preencha este campo.';
  if (el.validity.typeMismatch) return 'Informe um e-mail válido, como nome@exemplo.com.';
  if (el.validity.tooShort) return `Use pelo menos ${el.minLength} caracteres.`;
  if (el.dataset.mask === 'phone' && el.value && !validPhone(el.value)) return 'Informe DDD e número (10 ou 11 dígitos), ou +DDI e número.';
  return '';
}

export function initForms(root = document) {
  root.querySelectorAll('[data-mask="phone"]').forEach(phoneMask);
  root.querySelectorAll('form[data-form]').forEach((form, formIndex) => {
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.firstChild.textContent;
    const success = form.querySelector('.form-success');
    success.tabIndex = -1;
    const feedback = document.createElement('p');
    feedback.className = 'form-feedback';
    feedback.setAttribute('role', 'alert');
    feedback.hidden = true;
    btn.before(feedback);
    if (!CONFIG.leadsEndpoint) {
      const note = document.createElement('p');
      note.className = 'note demo-note';
      note.textContent = 'Versão de apresentação: este formulário permite testar o preenchimento. Os dados não serão enviados nem armazenados.';
      btn.before(note);
    }
    const inputs = [...form.querySelectorAll('input, select, textarea')];
    inputs.forEach((el, index) => {
      const field = el.closest('.field') || el.closest('.check');
      if (!field) return;
      let err = field.querySelector('.err');
      if (!err) { err = document.createElement('span'); err.className = 'err'; field.append(err); }
      err.id = `form-${formIndex}-error-${index}`;
      el.setAttribute('aria-describedby', [el.getAttribute('aria-describedby'), err.id].filter(Boolean).join(' '));
      if (el.required) el.setAttribute('aria-required', 'true');
      const clear = () => {
        field.classList.remove('has-error'); err.textContent = ''; el.removeAttribute('aria-invalid');
      };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (btn.disabled) return;
      let first;
      inputs.forEach((el) => {
        const msg = fieldMessage(el);
        const field = el.closest('.field') || el.closest('.check');
        if (field) { field.classList.toggle('has-error', !!msg); field.querySelector('.err').textContent = msg; }
        el.setAttribute('aria-invalid', String(!!msg));
        if (msg && !first) first = el;
      });
      if (first) { first.focus(); return; }
      feedback.hidden = true;
      btn.disabled = true;
      form.setAttribute('aria-busy', 'true');
      btn.classList.add('is-loading');
      btn.firstChild.textContent = 'Enviando… ';
      try {
        const data = Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
        const result = await submitLead(form.dataset.form, data);
        if (result.demo) {
          success.querySelector('h3').textContent = 'Teste concluído.';
          success.querySelector('p').textContent = 'O preenchimento foi validado. Nesta versão de apresentação, nenhum dado foi enviado ou armazenado.';
        }
        form.classList.add('is-done');
        success.focus({ preventScroll: true });
        success.scrollIntoView({ block: 'nearest', behavior: 'instant' });
      } catch {
        feedback.textContent = 'Não foi possível enviar. Seus dados continuam preenchidos. Confira sua conexão e tente novamente.';
        feedback.hidden = false;
      } finally {
        btn.disabled = false;
        form.removeAttribute('aria-busy');
        btn.classList.remove('is-loading');
        btn.firstChild.textContent = label;
      }
    });
  });
}
