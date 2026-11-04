# Spins-BOX 3D

## Download completo para jogar offline

**[Baixar ZIP completo — jogo, código-fonte e bibliotecas](https://github.com/Pacheco-3d/Spins-BOX/raw/refs/heads/main/downloads/Spins-BOX-completo-offline.zip)**

Extraia o arquivo e abra **Spins-BOX-offline/JOGAR.html** no navegador. Não é preciso instalar nada nem acessar a internet para jogar. O navegador precisa ter WebGL 2 disponível.

Se preferir apenas o jogo pronto, [baixe o HTML independente](https://github.com/Pacheco-3d/Spins-BOX/raw/refs/heads/main/offline/JOGAR.html). Esses links são downloads; não dependem de um site de jogo hospedado.

Jogo de lógica em 3D real, renderizado com Three.js e WebGL 2. Uma jornada com 40 fases de dificuldade gradual em sequência, revelação progressiva de plataformas, quedas de precisão, bloco rígido que tomba sobre suas bordas, câmera orbital, materiais de metal oxidado e pedra, sombras, reflexos e shaders para o céu e o portal. Texturas geradas localmente, sem serviços remotos ou assets externos durante o jogo.

## Executar

Requer Node.js 20 ou superior. Na pasta do projeto:

```sh
npm start
```

Em uma instalação nova, execute `npm ci` primeiro. `npm start` compila os módulos com esbuild e inicia o servidor na porta 3000. Para mudar a porta, use `PORT=8080 npm start`. O servidor usa `0.0.0.0` por padrão; `HOST=127.0.0.1` restringe ao computador local. Após editar o código, execute `npm run build` e recarregue o navegador.

Para gerar novamente o pacote completo, execute `npm run package:offline` após instalar as dependências. Esse empacotamento também requer Python 3 e inclui as bibliotecas instaladas; o executável do esbuild incluído corresponde ao sistema usado para empacotar. Isso só importa para recompilar o código, não para abrir o HTML pronto. O ZIP fica em `downloads/` e o HTML independente em `offline/JOGAR.html`.

O navegador precisa suportar WebGL 2 e ter aceleração gráfica disponível. Em computadores sem suporte, o jogo mostra uma mensagem em vez de simular o 3D em Canvas 2D.

## Jogar

Para gerar uma edição que funciona sem instalação e sem servidor, execute `npm run export` e abra `dist/Spins-BOX.html` no navegador. Esse arquivo contém toda a interface e o jogo, funciona offline e pode ser compartilhado sozinho.

- Setas ou WASD: mover. Cada movimento tomba o bloco por uma borda.
- Celular: deslize um dedo na direção desejada. Não há teclas de movimento na tela; as instruções ficam no ícone ? de tutorial.
- Q/E ou os botões acima do tabuleiro: girar a câmera. 0 restaura a vista inicial.
- Mouse: arraste com o botão direito para orbitar e use a roda para aproximar. Celular: dois dedos orbitam/aproximam; um dedo move o bloco.
- R: reiniciar. Z: desfazer (inclusive depois de cair).
- Chegue ao portal em pé para vencer.
- A jornada tem 40 fases em sequência, sem menu de seleção. Cada vitória libera a próxima.
- Capítulo Aprender (1–5): orientação, contornos e a primeira ponte.
- Capítulo Conectar (6–10): pontes, cobre e a primeira marca gravada.
- Capítulo Descobrir (11–15): ordem de marcas, quedas e um novo plano por vez.
- Capítulo Decifrar (16–20): pausas curtas e combinações de marcas, pontes, cobre e múltiplos planos.
- Após completar a fase 20, o cenário muda de brasa para azul/aurora. As fases 21–40 trazem rituais de três ou quatro marcas, mais retornos, pontes e múltiplos planos. As rotas exigem planejamento maior, sem acelerar o jogo nem limitar tentativas.
- Botão verde: fique em pé para alternar a ponte. Cobre: só atravesse deitado. Marca gravada: acorde-a em pé; I precede II.
- As aberturas estreitas recebem o bloco em pé. Os alvos compridos recebem o bloco deitado na orientação indicada.
- Os planos futuros permanecem ocultos. Ao acessar uma passagem resolvida, o próximo plano se alinha, o bloco desce e a câmera aproxima o novo desafio.
- Não há cronômetro, vidas limitadas ou penalidade por pedir dicas. Desfazer é ilimitado. A primeira ajuda dá uma estratégia; a seguinte sugere um movimento, sem jogar por você.
- Uma parte apoiada basta: o bloco deitado permanece estável com apenas um quadrado sobre piso sólido e pode voltar para a plataforma. A queda por uma borda só começa ao perder todo o apoio. Pontes fechadas e passagens ausentes não contam como piso.
- Ao encontrar um plano inferior, qualquer apoio interrompe a queda. Somente o encaixe exato no alvo libera a passagem; um pouso fora do alvo mantém o bloqueio e pode ser desfeito com Z. Pisos frágeis continuam cedendo ao bloco em pé e aberturas resolvidas continuam permitindo a descida.
- O portal final permanece bloqueado até acertar todos os alvos da fase. Os alvos acertados ficam verdes e as passagens âmbar se tornam sólidas.
- A jornada começa na dificuldade 1. Não há seleção de fases: vença o desafio: a mensagem **Muito bem! Você avançou para o próximo nível** aparece e a próxima fase carrega automaticamente. A barra e o contador abaixo do tabuleiro apenas mostram o progresso.
- O próximo nível conquistado é salvo antes da transição automática de cerca de 1,6 segundo. Recarregar durante a mensagem já retoma o nível seguinte. Recarregar retoma essa dificuldade, desde o início dela. Ao terminar a jornada, **Recomeçar a jornada** retorna à dificuldade 1.
- A primeira dica pedida no enigma explica o ritual; as seguintes sugerem um movimento. Nenhuma dica é necessária para ativar as marcas.
- Som opcional, desligado inicialmente. Recordes e progresso ficam apenas neste navegador. A expansão preserva a fase equivalente dos checkpoints da versão anterior, e os novos checkpoints usam IDs estáveis.

O direcional acompanha a câmera. A vista inicial deixa direita/esquerda na horizontal e cima/baixo no sentido da profundidade. Q/E e os botões de câmera giram 90 graus; 0 restaura a vista. Ao orbitar livremente com mouse ou dois dedos, cada seta usa o eixo do tabuleiro mais próximo daquela direção na tela. As dicas também se adaptam à vista.

## Testes

```sh
npm test
```

Os 82 testes verificam regras, apoio, portal, ponte, piso frágil e soluções completas das 40 fases, além de validar a transformação 3D em todas as orientações e direções, a borda de contato, a altura durante o giro, a preservação de faces após 100 movimentos e a reversão do giro. Os testes de andares verificam altura positiva/negativa, pouso alinhado, orientação exigida, aberturas, bloqueios intermediários, desbloqueios, portal bloqueado e continuidade da queda, ordem das runas, selos, visibilidade dos planos, etapas de revelação, progresso persistente por vitória, migração de checkpoints e objetivos obrigatórios da campanha, apoio parcial e atalhos que respeitam a nova regra. A interface usa HTML, CSS e WebGL 2 com resolução adaptada à tela. O áudio é sintetizado localmente.

O corpo tem dimensões fixas 1×2×1. Cada movimento aplica uma rotação de 90 graus em torno da borda inferior de contato. A orientação é acumulada por quaternion, inclusive quando a pose lógica continua deitada; desfazer restaura posição e orientação. Não há redimensionamento da malha para simular tombamento.

## Estrutura

- `src/levels.js`: 20 fases iniciais e 20 avançadas, pistas, capítulos e IDs estáveis.
- `src/engine.js`: regras e busca de soluções, independentes da interface.
- `src/app.js`: animações, interação e recordes.
- `src/renderer.js`: cena Three.js, materiais PBR, texturas procedurais, shaders GLSL, iluminação e câmera.
- `src/theme.js`: paleta do mundo, com troca depois de cada bloco de 20 níveis.
- `src/controls.js`: conversão entre direções da tela e do tabuleiro, usada no teclado, toque, gestos e dicas.
- `src/motion.js`: transformação rígida por pivô e quaternion, compartilhada com os testes.
- `src/presentation.js`: quais planos aparecem e como se deslocam na revelação, no pouso e na retirada.
- `src/journey.js`: checkpoint local e avanço de dificuldade apenas por vitória.
- `src/style.css`: interface responsiva.
- `scripts/build.mjs`: empacotamento local, sem CDN.
- `scripts/export.mjs`: geração do HTML portátil, incluindo Three.js.
- `server.mjs`: servidor estático de desenvolvimento.

Para criar fases, adicione uma entrada em `LEVELS` dentro de `src/levels.js`, com `id` único, `chapter`, `hint` e `strategy`: `#` pedra, `.` vazio, `O` portal, `S` botão, `B` ponte e `F` piso frágil. `start` usa coordenadas `[x, z]`. Execute os testes para garantir que a nova fase tenha solução.

Fases com andares usam `layers` em ordem decrescente de altura, cada uma com `height` e `map` nas mesmas coordenadas globais. `L` marca o piso de pouso; `D` marca uma saída pela borda; `H` é uma abertura que recebe o bloco em pé; `G` é uma passagem inicialmente ausente. Declare os alvos em `targets` (`id`, `x`, `z`, `pose`, `unlock`), a máscara de abertura em `gateRequires` e os pousos exigidos para vencer em `requiredUnlocks`. `pose` aceita `up`, `x` ou `z`. As quedas preservam x/z e quaternion; o primeiro plano interceptado precisa conter o alvo exato. O solver considera andar e desbloqueios ao procurar uma solução.

Para enigmas, `R` é uma marca. Cada andar pode declarar `runes` com `x`, `z`, `symbol`, `bit` e `requires`. A marca precisa receber o bloco em pé e seus pré-requisitos devem estar ativos. `exitRequires` mantém a abertura H sólida ou o portal O bloqueado até o ritual estar completo. Uma fase em um único plano também pode usar marcas e portais selados. O solver também considera `sigils`. A apresentação revela só o plano atual; na transição, alinha o próximo antes da queda e retira o anterior após o pouso.

## Hospedagem estática para testar em celular

O arquivo exportado é um jogo completo, mas um download HTML não é um endereço público. Para abrir por link no celular, hospede o conteúdo exportado como `index.html` na raiz de um site estático (Netlify, GitHub Pages ou equivalente). Não há backend nem variáveis de ambiente para configurar. O pacote de hospedagem preparado nesta tarefa contém esse `index.html` na raiz. Preparar os arquivos não publica um site; nenhuma publicação externa foi realizada.

## Tela de jogo

O tabuleiro ocupa a largura disponível e aproveita a altura da janela, sem painel lateral. Dicas, tutorial, desfazer e reiniciar ficam na barra superior. As teclas direcionais e legendas de movimento foram retiradas da tela. O botão ? abre o tutorial; Escape ou × fecha as instruções. Os movimentos ficam pausados enquanto a ajuda está aberta.

Vitórias comuns não abrem um painel com botão de continuar: a mensagem de parabéns é seguida pelo carregamento automático. Derrotas continuam oferecendo desfazer ou reiniciar. Na última fase disponível, aparece a conclusão da jornada. O progresso, o apoio parcial e a ausência de seleção de fases são preservados.
