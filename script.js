/* ============================================================
   AQUASOLIS · Projeto Integrador — CEP
   Telemetria, simulador, disco de Newton, fluxograma,
   acessibilidade e animações de rolagem.
   ============================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const rand  = (min, max) => min + Math.random() * (max - min);

  /* ---------- 1. Cabeçalho: sombra e menu mobile ---------- */
  const cabecalho = $('.cabecalho');
  const menuBtn   = $('#menuBtn');
  const menu      = $('#menuPrincipal');

  menuBtn.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    menuBtn.setAttribute('aria-expanded', String(aberto));
  });
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('aberto') && !e.target.closest('nav')) {
      menu.classList.remove('aberto');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('aberto')) {
      menu.classList.remove('aberto');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.focus();
    }
  });
  $$('.menu a').forEach(link => link.addEventListener('click', () => {
    menu.classList.remove('aberto');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- 2. Rolagem: sombra, botão topo e espião de seção ---------- */
  const voltarTopo = $('#voltarTopo');
  window.addEventListener('scroll', () => {
    cabecalho.classList.toggle('rolou', window.scrollY > 10);
    voltarTopo.classList.toggle('mostrar', window.scrollY > 600);
  }, { passive: true });

  voltarTopo.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduzMovimento ? 'auto' : 'smooth' });
  });

  // Destaca o link do menu conforme a seção visível
  const linksMenu = $$('.menu a');
  const espio = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;
      linksMenu.forEach(l => l.classList.toggle('ativo', l.getAttribute('href') === '#' + entrada.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('[data-secao]').forEach(secao => espio.observe(secao));

  /* ---------- 3. Revelação ao rolar ---------- */
  const revelador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        obs.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12 });
  $$('[data-reveal]').forEach(el => revelador.observe(el));

  /* ---------- 4. Contadores animados ---------- */
  const animarContador = (el) => {
    const alvo = parseFloat(el.dataset.contador);
    if (reduzMovimento) { el.textContent = alvo; return; }
    const duracao = 1300;
    const inicio = performance.now();
    const passo = (agora) => {
      const p = clamp((agora - inicio) / duracao, 0, 1);
      const suave = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(alvo * suave);
      if (p < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  };
  const obsContador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) { animarContador(entrada.target); obs.unobserve(entrada.target); }
    });
  }, { threshold: 0.6 });
  $$('[data-contador]').forEach(el => obsContador.observe(el));

  /* ---------- 5. Efeito de "decodificação" no título ---------- */
  const alvo = $('[data-scramble]');
  if (alvo && !reduzMovimento) {
    const original = alvo.textContent;
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';
    let quadro = 0;
    const totalQuadros = 34;
    const intervalo = setInterval(() => {
      quadro++;
      const reveladas = Math.floor((quadro / totalQuadros) * original.length);
      alvo.textContent = original.split('').map((ch, i) => {
        if (ch === ' ' || i < reveladas) return ch;
        return caracteres[Math.floor(Math.random() * caracteres.length)];
      }).join('');
      if (quadro >= totalQuadros) { alvo.textContent = original; clearInterval(intervalo); }
    }, 38);
  }

  /* ---------- 6. Telemetria simulada do painel ---------- */
  const telTemp  = $('#telTemp');
  const telRad   = $('#telRad');
  const telFluxo = $('#telFluxo');
  const telBomba = $('#telBomba');
  const telHora  = $('#telHora');
  const spark    = $('#sparkLinha');

  const estado = { temp: 29.6, rad: 620, fluxo: 11.8, bomba: true };
  const historico = Array.from({ length: 26 }, () => estado.temp + rand(-0.15, 0.15));

  const desenharGrafico = () => {
    const w = 260, h = 60;
    const min = 28.5, max = 31.5;
    const pontos = historico.map((v, i) => {
      const x = (i / (historico.length - 1)) * w;
      const y = h - ((clamp(v, min, max) - min) / (max - min)) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    spark.setAttribute('points', pontos);
  };

  const atualizarPainel = () => {
    if (document.hidden) return;

    estado.rad   = clamp(estado.rad + rand(-24, 24), 560, 760);
    estado.temp  = clamp(estado.temp + (estado.bomba ? 0.02 + (estado.rad - 600) / 9000 : -0.03), 28.6, 31.4);
    estado.fluxo = estado.bomba ? clamp(estado.fluxo + rand(-0.5, 0.5), 10.8, 12.9) : 0;

    historico.push(estado.temp);
    if (historico.length > 26) historico.shift();

    telTemp.textContent  = estado.temp.toFixed(1);
    telRad.textContent   = Math.round(estado.rad);
    telFluxo.textContent = estado.fluxo.toFixed(1);
    telHora.textContent  = new Date().toLocaleTimeString('pt-BR');

    telBomba.textContent = estado.bomba ? '● BOMBA LIGADA' : '○ BOMBA EM ESPERA';
    telBomba.classList.toggle('chip-on', estado.bomba);
    telBomba.classList.toggle('chip-off', !estado.bomba);

    desenharGrafico();
  };
  desenharGrafico();
  atualizarPainel();
  setInterval(atualizarPainel, reduzMovimento ? 4000 : 2400);

  /* ---------- 7. Disco de Newton interativo ---------- */
  const disco      = $('#discoNewton');
  const btnDisco   = $('#btnDisco');
  const velDisco   = $('#velDisco');
  const discoStatus = $('#discoStatus');
  let girando = false;

  const aplicarVelocidade = () => {
    const vel = Number(velDisco.value);
    disco.style.setProperty('--dur', ((11 - vel) * 0.85).toFixed(2) + 's');
    disco.classList.toggle('rapido', girando && vel >= 7);
    if (girando) {
      discoStatus.textContent = vel >= 7
        ? 'Em alta velocidade, as cores se misturam e percebemos luz quase branca — como Newton demonstrou.'
        : 'Girando: as cores começam a se fundir aos nossos olhos.';
    }
  };

  btnDisco.addEventListener('click', () => {
    girando = !girando;
    disco.classList.toggle('girando', girando);
    btnDisco.textContent = girando ? '■ Parar o disco' : '▶ Girar o disco';
    btnDisco.setAttribute('aria-pressed', String(girando));
    discoStatus.textContent = girando
      ? 'Girando: as cores começam a se fundir aos nossos olhos.'
      : 'Disco parado — sete cores distintas visíveis.';
    aplicarVelocidade();
  });
  velDisco.addEventListener('input', aplicarVelocidade);

  /* ---------- 8. Simulador de aquecimento solar ---------- */
  const ctr = {
    radiacao: $('#simRadiacao'), area: $('#simArea'),
    volume: $('#simVolume'),     horas: $('#simHoras'),
    cobertura: $('#simCobertura')
  };
  const saida = {
    radiacao: $('#outRadiacao'), area: $('#outArea'),
    volume: $('#outVolume'),     horas: $('#outHoras')
  };
  const res = {
    delta: $('#resDelta'), final: $('#resFinal'),
    kwh: $('#resKwh'), co2: $('#resCo2'), custo: $('#resCusto'),
    mercurio: $('#mercurio')
  };

  const fmt = (n, casas = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

  const calcular = () => {
    const I = Number(ctr.radiacao.value);   // W/m²
    const A = Number(ctr.area.value);       // m²
    const V = Number(ctr.volume.value);     // m³
    const h = Number(ctr.horas.value);      // horas
    const eta  = 0.62;                      // eficiência típica do coletor
    const perda = ctr.cobertura.checked ? 0.06 : 0.18;

    saida.radiacao.value = `${I} W/m²`;
    saida.area.value     = `${A} m²`;
    saida.volume.value   = `${V} m³`;
    saida.horas.value    = `${h} h`;

    // Física: Q = I·A·η·t  →  ΔT = Q / (m·c)
    const Q  = I * A * eta * (h * 3600);          // joules
    const m  = V * 1000;                          // kg
    const dT = Math.min((Q / (m * 4186)) * (1 - perda), 8);

    const kwh  = (Q / 3.6e6) * (1 - perda);
    const co2  = kwh * 0.07;
    const custo = kwh * 0.92;

    res.delta.textContent = `+${fmt(dT)}`;
    res.final.textContent = `${fmt(24 + dT)} °C`;
    res.kwh.textContent   = fmt(kwh);
    res.co2.textContent   = fmt(co2);
    res.custo.textContent = fmt(custo, 2);

    const pct = clamp(((24 + dT) - 20) / 15 * 100, 6, 100);
    res.mercurio.style.height = pct + '%';
    res.mercurio.style.width  = pct + '%'; // versão horizontal (mobile)
  };

  Object.values(ctr).forEach(el => el.addEventListener('input', calcular));
  $('#btnResetar').addEventListener('click', () => {
    ctr.radiacao.value = 600; ctr.area.value = 16;
    ctr.volume.value = 45;    ctr.horas.value = 6;
    ctr.cobertura.checked = true;
    calcular();
  });
  calcular();

  /* ---------- 9. Fluxograma interativo ---------- */
  const nos        = $$('#fluxograma .no');
  const fluxoTitulo = $('#fluxoTitulo');
  const fluxoTexto  = $('#fluxoTexto');

  const selecionarNo = (no) => {
    nos.forEach(n => n.setAttribute('aria-pressed', String(n === no)));
    fluxoTitulo.textContent = no.dataset.titulo;
    fluxoTexto.textContent  = no.dataset.info;
  };
  nos.forEach(no => no.addEventListener('click', () => selecionarNo(no)));
  selecionarNo(nos[0]);

  /* ---------- 10. Acessibilidade: fonte e alto contraste ---------- */
  const statusA11y = $('#statusA11y');
  const TAMANHOS = [87.5, 93.75, 100, 106.25, 112.5, 118.75, 125];
  let indiceFonte = Number(localStorage.getItem('as-fonte') ?? 2);

  const aplicarFonte = (anunciar = true) => {
    indiceFonte = clamp(indiceFonte, 0, TAMANHOS.length - 1);
    document.documentElement.style.fontSize = TAMANHOS[indiceFonte] + '%';
    localStorage.setItem('as-fonte', String(indiceFonte));
    if (anunciar && statusA11y) statusA11y.textContent = `Tamanho da fonte ajustado para ${TAMANHOS[indiceFonte]}%.`;
  };

  $$('[data-fonte]').forEach(btn => btn.addEventListener('click', () => {
    const acao = Number(btn.dataset.fonte);
    indiceFonte = acao === 0 ? 2 : indiceFonte + acao;
    aplicarFonte();
  }));

  const aplicarContraste = (ligado, anunciar = true) => {
    document.body.classList.toggle('alto-contraste', ligado);
    $$('[data-contraste]').forEach(b => b.setAttribute('aria-pressed', String(ligado)));
    localStorage.setItem('as-contraste', ligado ? '1' : '0');
    if (anunciar && statusA11y) statusA11y.textContent = ligado ? 'Alto contraste ativado.' : 'Alto contraste desativado.';
  };

  $$('[data-contraste]').forEach(btn => btn.addEventListener('click', () => {
    aplicarContraste(!document.body.classList.contains('alto-contraste'));
  }));

  // Restaura preferências salvas
  aplicarFonte(false);
  aplicarContraste(localStorage.getItem('as-contraste') === '1', false);

  /* ---------- 11. Rodapé: ano atual ---------- */
  $('#anoAtual').textContent = new Date().getFullYear();
});
