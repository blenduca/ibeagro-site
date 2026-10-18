# IBEAGRO — Design System

Visual world: **cartografia do agro** — levantamento topográfico, curvas de nível, perfil de solo, parcelas e coordenadas. Cores chapadas (sem gradiente na marca), autoridade de instituto, tecnologia aplicada ao campo.

## Cor
Uma única rampa de verdes (tirada do emblema) faz todos os neutros; dourado é a única cor de ação.

| Token | Valor | Uso |
|---|---|---|
| `--g-950` | `#02240f` | fundo dos capítulos escuros, hero |
| `--g-900` | `#013117` | seções escuras |
| `--g-800` | `#014620` | verde institucional (AGRO) |
| `--g-500` | `#3a9436` | verde da marca, ícones |
| `--g-300` | `#7cc46f` | curvas de nível, rótulos em fundo escuro |
| `--g-50` / `--paper` | `#f2f6f1` / `#f7f9f5` | capítulos claros |
| `--gold` | `#f5b21f` | botões, destaques, raiz, pins |

Cores por segmento (marcadores de parcela, chips, filtros) — iguais aos painéis do emblema:
Leite `#0f522d` · Suínos `#d44e23` · Aves `#f5b21f` · Cooperativismo `#3a9436` · Gestão `#024c7f` · Tecnologia `#1e7fb8`.

## Tipografia
- Display: **Archivo Variable** com eixo de largura (`font-stretch` 104–125%), peso 620–800.
- Texto: **Albert Sans Variable**.
- Dados/coordenadas: **JetBrains Mono** (apenas medidas, coordenadas, rótulos técnicos).
- Escala fluida `--step--1` … `--step-5` em `src/styles/main.css`.

## Componentes
Botão pílula dourado (preenchimento sobe em verde no hover, magnético no desktop) · botão ghost · botão verde · link com sublinhado animado · chip de segmento · ficha técnica (`.spec`) · cartão de curso com frente (promessa) e verso (ficha da turma) · parcelas isométricas · gaveta de lista de interesse · formulários com validação inline.

## Movimento
Lenis (scroll suave) + GSAP/ScrollTrigger. Assinatura: a raiz que desce pelos horizontes do solo enquanto a história é lida. Demais: títulos revelados por linha, imagens por máscara, parallax leve, transição de página com véu topográfico. `prefers-reduced-motion` desliga pins, scrubs e loops.

## 3D / Canvas
- Hero (padrão, V2 · Lavoura de precisão): lavoura 3D ao amanhecer em faixas de soja, trigo e milho; cresce ao carregar, balança com o vento; o cursor é um drone que mostra o vigor (NDVI) nas cores do emblema; ao rolar, a câmera sobe como um drone. Alternativas de estudo em `?hero=1` (relevo), `3` (grãos), `4` (pivôs) e `5` (maquete).
- Instituto: globo de pontos (Brasil destacado), arcos de Chapecó para a América Latina.
- Especialistas: rede animada em canvas 2D.
