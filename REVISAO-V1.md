# Revisão da v1 — IBEAGRO

Revisão em 17/10/2026. Trabalho local; site não publicado.

## Instalação

Impeccable 4.6.0 instalado para Codex no projeto, em `.agents/skills/impeccable`, pelo instalador oficial. PRODUCT.md e DESIGN.md existentes foram respeitados. O carregador global não executou por permissão; o contexto foi lido diretamente. A auditoria estática do Impeccable apontou cinco avisos de hierarquia tipográfica: falsos positivos, pois o HTML recebe o CSS pelo módulo do Vite. A escala tipográfica foi conferida no navegador, com títulos maiores que o corpo do texto.

## Correções

- Títulos com linhas recalculadas no carregamento das fontes e na mudança de largura; ênfases longas podem quebrar sem ultrapassar o contêiner. Mantida a animação por linhas.
- Rolagem horizontal de cursos: somente os cartões e seus controles ficam fixos, evitando que os botões desapareçam abaixo da tela. Setas e navegação por foco mantêm os cursos acessíveis. Em telas baixas e dispositivos sem ponteiro preciso, usa rolagem nativa.
- Contraste dos textos de apoio dos cursos e do globo; placeholders e mensagens de erro em fundos claros.
- Menu e gaveta: fundo inerte, foco contido, Escape, retorno do foco, trava de rolagem e limpeza de temporizadores. Mudança para desktop fecha o menu móvel.
- Links de âncora atualizam o histórico e respeitam o cabeçalho; parâmetros de contato continuam levando ao perfil correto.
- Formulários: rejeição de espaços em campos obrigatórios, validação de e-mail e telefone, mensagens associadas aos campos, consentimento inline, proteção contra envio duplicado e espera limitada no endpoint. Falhas preservam os dados para nova tentativa.
- Telefone nacional com 10/11 dígitos e internacional com +DDI. Demonstração sem dados pessoais no console, com aviso e confirmação explícitos.
- Contato: campos dos outros perfis ficam desabilitados, fora do envio. Título dinâmico não mantém o nome acessível do título original.
- WhatsApp e comunidade ainda não configurados levam a uma explicação no contato. Redes sem endereço ficam ocultas. Documentos legais pendentes aparecem como texto, sem links vazios.
- Filtros e abas: restauração do estado vazio, foco correto, Home/End e respeito à redução de movimento.
- Diagrama de biosseguridade: clique mantém a camada selecionada, sem ser anulado pelo hover; seleção também pelo foco.
- Globo: controle pelo teclado, um ponteiro por arraste, limpeza em cancelamento/perda de captura e perda de foco. Loops pausam com a página oculta; redução de movimento respeitada nos efeitos de canvas.
- Conteúdo com revelação permanece acessível se o módulo principal não carregar.

## Validação

`npm run check` executa:

1. Cinco testes automatizados: telefones, demonstração sem rede, payload do endpoint, resposta de erro e falha de conexão.
2. Build das nove páginas com Vite.
3. Verificação de arquivos locais, links, imagens, ícones, âncoras, IDs duplicados e referências de labels/ARIA no HTML compilado.

No navegador Chromium integrado: páginas em 320, 768 e 1440 px, com inspeções adicionais em 390 px. Sem transbordamento horizontal nem imagens concluídas com erro nas verificações. O título visualmente oculto de propósito/missão/visão foi excluído da avaliação de transbordamento visual.

Fluxos exercitados: menu, Escape, menu ao mudar para desktop, gaveta, validação e sucesso demonstrativo, cinco tipos de formulário (lista, contato, proposta, sugestão, interesse na página do curso), filtros com e sem resultados, abas corporativas, áreas pelo teclado, navegação e virada dos cartões, curso preselecionado, diagrama e teclado do globo. Sem novos erros de console na versão compilada.

Limites: tamanhos móveis foram emulados; não houve teste físico de toque/multitoque nem matriz completa de Safari/Firefox. A recuperação de erros de integração foi validada com requisições simuladas em testes; não existe endpoint real configurado. Não se afirma conformidade WCAG completa.

## O que ainda depende da cliente

- Número oficial de WhatsApp e link da comunidade gratuita.
- Instagram e LinkedIn oficiais; e-mail institucional, se desejar exibi-lo como canal adicional.
- Endpoint de captação de leads (POST JSON) e destino/automação dos contatos.
- Política de Privacidade e Termos de Uso aprovados, com seus endereços.
- Datas, carga horária, investimento e especialistas das formações — mantidos como em planejamento/a confirmar.
- Fotos reais de equipe, especialistas e eventos quando disponíveis; imagens atuais são de banco.

Os dados de configuração ficam em `src/js/config.js`. Nenhum endereço, especialista, preço ou prazo foi inventado.
