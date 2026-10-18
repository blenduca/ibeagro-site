# Site IBEAGRO

Site institucional multipágina (Vite + HTML/JS, Three.js, GSAP, Lenis). Tudo roda localmente — nada é publicado.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # gera /dist (estático, pronto para Vercel)
npm run check    # testes de leads + build + integridade das nove páginas
```

## Estrutura
- `index.html`, `instituto.html`, `formacoes.html`, `empresas.html`, `contato.html`
- `cursos/*.html` — **gerados** por `scripts/gen-courses.mjs` a partir de `src/js/data.js` (edite os dados, não o HTML).
- `partials/` — head, header, footer (com gaveta da lista de interesse) e ícones; incluídos via `<!-- @include nome -->`.
- `src/js/config.js` — **preencha** WhatsApp, comunidade, Instagram, LinkedIn e o endpoint dos formulários.
- `src/js/leads.js` — ponto único de envio dos formulários. Sem `leadsEndpoint`, roda em modo demonstração (não envia nada).
- `public/brand/` — variações do logo (fundo claro/escuro, horizontal/vertical, emblema).
- `public/img/` — fotos do Unsplash (licença livre). Fontes em `CREDITOS-IMAGENS.txt`.

## Pendências de conteúdo
- Número de WhatsApp, link da comunidade gratuita, redes sociais e e-mail oficiais.
- Endpoint da planilha/automação de leads.
- Carga horária, especialistas, investimento e datas das turmas.
- Fotos reais de especialistas e eventos quando existirem.
- Páginas de Política de Privacidade e Termos de Uso.

## Impeccable e revisão da v1

Impeccable instalado localmente para Codex em `.agents/skills/impeccable` pelo instalador oficial (`npx impeccable install --providers=codex --scope=project --yes`). É uma ferramenta de apoio ao desenvolvimento; não adiciona scripts ao site publicado.

A identidade visual, as animações e o fluxo original foram preservados. Veja `REVISAO-V1.md` para o escopo dos testes e as pendências de integração.

Formulários sem `CONFIG.leadsEndpoint` exibem um aviso e uma confirmação explícita de demonstração. Nenhum dado é enviado, armazenado ou registrado no console. Ao configurar um endpoint, o formulário envia POST JSON, mostra falhas recuperáveis e limita a espera a 20 segundos. O endpoint deve validar os dados e tratar consentimento no servidor.

Os campos `privacyUrl` e `termsUrl` em `src/js/config.js` ativam os links legais assim que os documentos aprovados estiverem disponíveis.
