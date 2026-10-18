// Gera /cursos/<slug>.html a partir de src/js/data.js (modelo de página individual de curso).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSES, areaById } from '../src/js/data.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, 'cursos'), { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const check = (t) => `<li data-reveal><svg aria-hidden="true"><use href="#i-check" /></svg><span>${esc(t)}</span></li>`;

const zones = `
      <section class="section deep" data-header-theme="dark" aria-labelledby="zones-title">
        <div class="wrap">
          <div class="sec-head split">
            <h2 id="zones-title" data-split>Biosseguridade se constrói em camadas.</h2>
            <p data-reveal>Uma ilustração didática de como os temas da formação se organizam — do perímetro da granja até a rotina dentro do galpão. Toque em cada camada.</p>
          </div>
          <div class="zones" data-zones>
            <svg viewBox="0 0 560 560" role="img" aria-label="Diagrama de camadas de biosseguridade">
              <g class="ring" data-z="0"><circle cx="280" cy="280" r="262" fill="#013b1c" stroke="#7cc46f" stroke-dasharray="6 8"/><text x="280" y="44" text-anchor="middle" fill="#b9d9b6" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="1.5">PERÍMETRO</text></g>
              <g class="ring" data-z="1"><circle cx="280" cy="280" r="196" fill="#0a4424" stroke="#56a050"/><text x="280" y="108" text-anchor="middle" fill="#b9d9b6" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="1.5">ACESSO</text></g>
              <g class="ring" data-z="2"><circle cx="280" cy="280" r="132" fill="#0f522d" stroke="#7cc46f"/><text x="280" y="172" text-anchor="middle" fill="#d3e6d4" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="1.5">OPERAÇÃO</text></g>
              <g class="ring" data-z="3"><circle cx="280" cy="280" r="70" fill="#f5b21f"/><text x="280" y="286" text-anchor="middle" fill="#02240f" font-family="Archivo Variable, sans-serif" font-weight="800" font-size="15">LOTE</text></g>
              <g fill="none" stroke="#f5b21f" stroke-width="2" stroke-linecap="round" class="z-arrows">
                <path d="M30 280h40M490 280h40M280 30v40M280 490v40" stroke-dasharray="4 6"/>
              </g>
            </svg>
            <ul class="zone-list">
              <li><button type="button" data-z="0" style="--c:#7cc46f" aria-pressed="false"><span><strong>Riscos e fundamentos</strong><small>Fundamentos da biosseguridade avícola e principais riscos sanitários.</small></span></button></li>
              <li><button type="button" data-z="1" style="--c:#56a050" aria-pressed="false"><span><strong>Higienização e controle de acesso</strong><small>Quem e o que entra — e em que condições.</small></span></button></li>
              <li><button type="button" data-z="2" style="--c:#3a9436" aria-pressed="false"><span><strong>Protocolos e boas práticas</strong><small>Protocolos de prevenção e controle e boas práticas operacionais.</small></span></button></li>
              <li><button type="button" data-z="3" style="--c:#f5b21f" aria-pressed="false"><span><strong>Rotina produtiva</strong><small>Aplicação de medidas preventivas no dia a dia da produção.</small></span></button></li>
            </ul>
          </div>
        </div>
      </section>`;

for (const c of COURSES) {
  const area = areaById[c.area];
  const others = COURSES.filter((o) => o.slug !== c.slug);
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <!-- @include head -->
    <title>${esc(c.title)} — IBEAGRO</title>
    <meta name="description" content="${esc(c.promise)} Modalidade prevista: ${esc(c.mode)}. Cadastre seu interesse na próxima turma." />
  </head>
  <body data-page-ui>
    <!-- @include header {"theme":"","page":"formacoes"} -->
    <main id="conteudo">
      <section class="page-hero course-hero" data-area="${c.area}" style="--c: ${area.color}" data-hero data-header-theme="dark">
        <div class="bg" data-speed="0.6"><img src="${c.hero}" alt="" /></div>
        <div class="wrap">
          <nav class="crumbs coord" aria-label="Você está em" data-hero-in><a href="/">Início</a> / <a href="/formacoes.html">Formações</a> / <span>${esc(area.name)}</span></nav>
          <h1 data-split>${esc(c.title)}</h1>
          <p class="lead" data-hero-in>${esc(c.promise)}</p>
          <div class="btn-row" style="margin-top:2rem" data-hero-in>
            <button class="btn" type="button" data-interest="${c.slug}">${esc(c.cta)} <svg class="arr"><use href="#i-arrow" /></svg></button>
            <span class="chip coord">${esc(area.name)} · ${esc(c.mode)}</span>
          </div>
        </div>
      </section>

      <section class="section" id="detalhes" data-header-theme="light">
        <div class="wrap two-col">
          <div>
            <p class="course-promise" data-reveal>${esc(c.intro[0])}</p>
            ${c.intro.slice(1).map((p) => `<p class="lead" data-reveal>${esc(p)}</p>`).join('\n            ')}
          </div>
          <aside class="info-card" data-reveal>
            <h2 style="font-size:var(--step-2);margin-bottom:1.25rem">Informações da formação</h2>
            <dl class="spec">
              <div><dt>Modalidade prevista</dt><dd>${esc(c.mode)}</dd></div>
              <div><dt>Próxima turma</dt><dd>Em planejamento</dd></div>
              <div><dt>Carga horária</dt><dd>A confirmar</dd></div>
              <div><dt>Especialista</dt><dd>A divulgar</dd></div>
              <div><dt>Investimento</dt><dd>A divulgar</dd></div>
            </dl>
            <button class="btn btn--green" type="button" data-interest="${c.slug}" style="margin-top:1.5rem">Quero receber informações <svg class="arr"><use href="#i-arrow" /></svg></button>
          </aside>
        </div>
      </section>

      <section class="section mist" data-header-theme="light" aria-labelledby="quem-title">
        <div class="wrap two-col">
          <div>
            <h2 id="quem-title" data-split>Para quem é esta formação?</h2>
            <div class="media" style="aspect-ratio:4/3;margin-top:2rem" data-reveal="clip" data-parallax><img src="${c.img}" alt="" loading="lazy" /></div>
          </div>
          <ul class="checklist">
            ${c.audience.map(check).join('\n            ')}
          </ul>
        </div>
      </section>

      <section class="section dark" data-header-theme="dark" aria-labelledby="learn-title">
        <div class="wrap two-col">
          <h2 id="learn-title" data-split>O que você poderá aprender?</h2>
          <ol class="path" data-learn>
            <i class="fill" aria-hidden="true"></i>
            ${c.learn.map((t, i) => `<li><span class="node">${String(i + 1).padStart(2, '0')}</span><span>${esc(t)}</span></li>`).join('\n            ')}
          </ol>
        </div>
      </section>
${c.zones ? zones : ''}
      <section class="section final" id="interesse" data-header-theme="dark" aria-labelledby="prio-title">
        <svg class="contours-bg" data-contours="${c.slug}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"></svg>
        <div class="wrap two-col">
          <div>
            <h2 id="prio-title" data-split style="font-size:var(--step-4)">Tenha prioridade para receber informações.</h2>
            <p data-reveal>As próximas turmas estão em planejamento. Cadastre seu interesse e seja informado quando os detalhes da formação forem divulgados.</p>
          </div>
          <form class="form" data-form="interesse" novalidate data-reveal style="color:#fff">
            <input type="hidden" name="curso" value="${c.slug}" />
            <div class="field"><label for="c-nome" style="color:var(--g-150)">Nome completo</label><input id="c-nome" name="nome" autocomplete="name" required /><span class="err"></span></div>
            <div class="form-row two">
              <div class="field"><label for="c-email" style="color:var(--g-150)">E-mail</label><input id="c-email" name="email" type="email" autocomplete="email" required /><span class="err"></span></div>
              <div class="field"><label for="c-whats" style="color:var(--g-150)">WhatsApp</label><input id="c-whats" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" required data-mask="phone" /><span class="err"></span></div>
            </div>
            <label class="check" style="color:var(--g-150)"><input type="checkbox" name="consentimento" required /> <span>Aceito receber comunicações do IBEAGRO sobre esta formação.</span></label>
            <p class="note" style="color:var(--g-200)">O cadastro é gratuito e não representa matrícula, reserva garantida de vaga ou compromisso de pagamento.</p>
            <button class="btn" type="submit">Quero receber informações da próxima turma <svg class="arr"><use href="#i-arrow" /></svg></button>
            <div class="form-success" role="status" tabindex="-1">
              <svg style="color:var(--gold)"><use href="#i-check" /></svg>
              <h3 style="color:#fff">Interesse registrado.</h3>
              <p>Você terá prioridade para receber as informações desta formação.</p>
            </div>
          </form>
        </div>
      </section>

      <section class="section mist" data-header-theme="light" aria-labelledby="outras-title">
        <div class="wrap">
          <div class="sec-head split">
            <h2 id="outras-title" data-split style="font-size:var(--step-3)">Outras formações previstas.</h2>
            <p data-reveal><a class="link-arrow" href="/formacoes.html">Ver todas as formações <svg><use href="#i-arrow" /></svg></a></p>
          </div>
          <div class="course-list">
            ${others
              .map(
                (o) => `<a class="c-row" data-area="${o.area}" style="--c: ${areaById[o.area].color}" href="/cursos/${o.slug}.html" data-reveal>
              <div class="media"><img src="${o.img}" alt="" loading="lazy" /></div>
              <div class="body"><span class="chip">${esc(areaById[o.area].name)}</span><h3>${esc(o.title)}</h3><p>${esc(o.card)}</p><span class="link-arrow go">Conhecer a formação <svg><use href="#i-arrow" /></svg></span></div>
            </a>`
              )
              .join('\n            ')}
          </div>
        </div>
      </section>
    </main>
    <!-- @include footer -->
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;
  writeFileSync(resolve(root, 'cursos', `${c.slug}.html`), html);
  console.log('cursos/' + c.slug + '.html');
}
