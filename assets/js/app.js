(function () {
  "use strict";

  var ICONES = [""];
  var EQUIPAMENTOS_API_URL = (window.EQUIPAMENTOS_API_URL && window.EQUIPAMENTOS_API_URL.trim()) || "/api/equipamentos.json";

  function resolverUrlRelativa(origem) {
    if (!origem) return origem;
    if (/^(data:|blob:|https?:|\/\/)/i.test(origem)) return origem;
    var arquivo = String(origem).trim();
    if (!arquivo) return origem;
    var caminho = arquivo.replace(/\\/g, "/");
    try {
      if (!caminho.startsWith("/")) {
        return new URL("./" + caminho, document.baseURI || window.location.href).href;
      }
      return new URL(caminho, document.baseURI || window.location.href).href;
    } catch (e) {
      return arquivo;
    }
  }

  function normalizarNomeArquivoImagem(valor) {
    return String(valor || "").trim().replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
  }

  var ASSET_BASE = "./assets/images/";
  var ASSET_FALLBACK_BASE = "./";

  function caminhoImagem(nomeArquivo) {
    if (!nomeArquivo) return "";
    var nome = String(nomeArquivo).trim();
    if (!nome) return "";
    if (/^(data:|blob:|https?:|\/\/)/i.test(nome)) return nome;
    var caminhoPadrao = nome.replace(/\\/g, "/");
    var semPrefixo = caminhoPadrao.replace(/^\.\//, "");
    var candidatos = [
      ASSET_BASE + semPrefixo,
      ASSET_FALLBACK_BASE + semPrefixo,
      semPrefixo,
      ASSET_BASE + nome,
      ASSET_FALLBACK_BASE + nome
    ];
    return candidatos.find(function (caminho) {
      return Boolean(caminho) && !caminho.includes("undefined");
    }) || caminhoPadrao;
  }

  var TIPOS_BASE = [
    { nome: "OLT", icone: caminhoImagem("OLT.jpeg") },
    { nome: "Switch", icone: caminhoImagem("SWITCH.jpeg") },
    { nome: "Roteador", icone: caminhoImagem("MIROTIK.png") },
    { nome: "Rádio", icone: "" },
    { nome: "ONT", icone: "" },
    { nome: "ONU", icone: "" },
    { nome: "Firewall", icone: "" },
    { nome: "Servidor", icone: "" },
    { nome: "Antena", icone: "" },
    { nome: "MikroTik", icone: caminhoImagem("MIROTIK.png") },
    { nome: "UPS", icone: caminhoImagem("NOBREAK.jpeg") },
    { nome: "Nobreak", icone: caminhoImagem("NOBREAK.jpeg") }
  ];
  var CATALOGO_ICONES = [
    { valor: caminhoImagem("MIROTIK.png"), nome: "MikroTik / RB", arquivo: caminhoImagem("MIROTIK.png") },
    { valor: caminhoImagem("OLT.jpeg"), nome: "OLT", arquivo: caminhoImagem("OLT.jpeg") },
    { valor: caminhoImagem("SWITCH.jpeg"), nome: "Switch", arquivo: caminhoImagem("SWITCH.jpeg") },
    { valor: caminhoImagem("RTIFICADOR.jpeg"), nome: "Retificador / RPS", arquivo: caminhoImagem("RTIFICADOR.jpeg") },
    { valor: caminhoImagem("NOBREAK.jpeg"), nome: "Nobreak", arquivo: caminhoImagem("NOBREAK.jpeg") },
    { valor: caminhoImagem("VOLT.jpeg"), nome: "Módulo / Conversor", arquivo: caminhoImagem("VOLT.jpeg") }
  ];
  var catalogoTiposEquipamentos = TIPOS_BASE.slice();

  function normalizarTextoEquipamento(valor) {
    return String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
  }

  function extrairNomeTipo(item) {
    if (!item) return "";
    return item.nome || item.tipo || item.tipoequipamento || item.label || item.value || "";
  }

  function extrairIconeTipo(item) {
    if (!item) return "";
    return item.icone || item.arquivo || item.imagem || item.iconeArquivo || item.icon || "";
  }

  function imagemDoIcone(valor) {
    if (!valor) return "";
    var valorNormalizado = normalizarNomeArquivoImagem(valor);
    var item = CATALOGO_ICONES.find(function (icone) {
      var alvo = normalizarNomeArquivoImagem(icone.valor || icone.arquivo || icone.nome || "");
      return alvo === valorNormalizado || normalizarNomeArquivoImagem(icone.arquivo || "") === valorNormalizado;
    });
    if (item) return item.arquivo || "";

    var valorEmTexto = String(valor || "").toLowerCase();
    if (valorEmTexto.indexOf("mikrotik") >= 0 || valorEmTexto.indexOf("rb/") >= 0 || valorEmTexto.indexOf("roteador") >= 0) return caminhoImagem("MIROTIK.png");
    if (valorEmTexto.indexOf("switch") >= 0) return caminhoImagem("SWITCH.jpeg");
    if (valorEmTexto.indexOf("olt") >= 0) return caminhoImagem("OLT.jpeg");
    if (valorEmTexto.indexOf("retificador") >= 0 || valorEmTexto.indexOf("rps") >= 0) return caminhoImagem("RTIFICADOR.jpeg");
    if (valorEmTexto.indexOf("nobreak") >= 0 || valorEmTexto.indexOf("nobreack") >= 0) return caminhoImagem("NOBREAK.jpeg");
    if (valorEmTexto.indexOf("conversor") >= 0 || valorEmTexto.indexOf("modulo") >= 0 || valorEmTexto.indexOf("volt") >= 0) return caminhoImagem("VOLT.jpeg");
    return "";
  }

  function renderizarTiposSugeridos() {
    var datalist = document.getElementById("tipos-sugeridos");
    if (!datalist) return;
    var itens = [];
    catalogoTiposEquipamentos.forEach(function (tipo) {
      var nome = extrairNomeTipo(tipo);
      if (!nome) return;
      var chave = normalizarTextoEquipamento(nome);
      if (!itens.some(function (entry) { return normalizarTextoEquipamento(entry.nome) === chave; })) {
        itens.push({ nome: nome, icone: extrairIconeTipo(tipo) });
      }
    });
    datalist.innerHTML = itens.map(function (tipo) {
      return '<option value="' + escaparHtml(tipo.nome) + '"></option>';
    }).join("");
  }

  function buscarTipoNoCatalogo(tipo) {
    var chave = normalizarTextoEquipamento(tipo);
    if (!chave) return null;
    return catalogoTiposEquipamentos.find(function (item) {
      var nome = normalizarTextoEquipamento(extrairNomeTipo(item));
      return nome === chave || nome.indexOf(chave) >= 0 || chave.indexOf(nome) >= 0;
    }) || null;
  }

  function registrarTipoEquipamento(nome, opcoes) {
    var nomeTipo = String(nome || "").trim();
    if (!nomeTipo) return false;
    var item = {
      nome: nomeTipo,
      icone: opcoes && opcoes.icone ? opcoes.icone : ""
    };
    var existente = buscarTipoNoCatalogo(nomeTipo);
    if (existente) {
      if (opcoes && opcoes.icone && !existente.icone) existente.icone = opcoes.icone;
      return true;
    }
    catalogoTiposEquipamentos.push(item);
    renderizarTiposSugeridos();
    return true;
  }

  function aplicarCatalogoExterno(lista) {
    var tipos = Array.isArray(lista) ? lista : [];
    var merge = TIPOS_BASE.slice();
    tipos.forEach(function (item) {
      if (!item) return;
      var nome = String(extrairNomeTipo(item) || "").trim();
      if (!nome) return;
      merge.push({ nome: nome, icone: extrairIconeTipo(item) || "" });
    });
    catalogoTiposEquipamentos = merge.filter(function (item, index, array) {
      var nome = String(extrairNomeTipo(item) || "").trim();
      if (!nome) return false;
      return array.findIndex(function (entry) {
        return normalizarTextoEquipamento(extrairNomeTipo(entry)) === normalizarTextoEquipamento(nome);
      }) === index;
    });
    renderizarTiposSugeridos();
  }

  function carregarTiposDeEquipamento() {
    var urls = [EQUIPAMENTOS_API_URL, "/api/equipamentos", "./api/equipamentos.json", "/api/equipamentos.json"]; 
    var indiceAtual = 0;

    function tentarProximo() {
      if (indiceAtual >= urls.length) {
        catalogoTiposEquipamentos = TIPOS_BASE.slice();
        renderizarTiposSugeridos();
        return;
      }

      var urlAtual = urls[indiceAtual++];
      fetch(urlAtual, { cache: "no-store" })
        .then(function (resposta) {
          if (!resposta.ok) throw new Error("HTTP " + resposta.status);
          return resposta.json();
        })
        .then(function (dados) {
          var lista = Array.isArray(dados) ? dados : (Array.isArray(dados.tipos) ? dados.tipos : []);
          if (lista.length) {
            aplicarCatalogoExterno(lista);
          } else {
            catalogoTiposEquipamentos = TIPOS_BASE.slice();
            renderizarTiposSugeridos();
          }
        })
        .catch(function () {
          tentarProximo();
        });
    }

    tentarProximo();
  }

  function iconePorTipo(tipo) {
    var itemCatalogo = buscarTipoNoCatalogo(tipo);
    if (itemCatalogo && itemCatalogo.icone) return itemCatalogo.icone;

    var chave = normalizarTextoEquipamento(tipo);
    if (chave.indexOf("olt") >= 0) return ASSET_BASE + "OLT.jpeg";
    if (chave.indexOf("switch") >= 0) return ASSET_BASE + "SWITCH.jpeg";
    if (chave.indexOf("roteador") >= 0 || chave.indexOf("mikrotik") >= 0 || chave.indexOf("rb/") >= 0) return ASSET_BASE + "MIROTIK.png";
    if (chave.indexOf("retificador") >= 0 || chave.indexOf("rps") >= 0) return ASSET_BASE + "RTIFICADOR.jpeg";
    if (chave.indexOf("nobreak") >= 0 || chave.indexOf("nobreack") >= 0) return ASSET_BASE + "NOBREAK.jpeg";
    if (chave.indexOf("conversor") >= 0 || chave.indexOf("modulo") >= 0 || chave.indexOf("volt") >= 0) return ASSET_BASE + "VOLT.jpeg";
    return "";
  }

  window.apiEquipamentos = {
    listar: function () { return catalogoTiposEquipamentos.slice(); },
    registrar: registrarTipoEquipamento,
    recarregar: carregarTiposDeEquipamento,
    url: EQUIPAMENTOS_API_URL
  };

  renderizarTiposSugeridos();
  carregarTiposDeEquipamento();

  var contadorId = 1;
  function novoId() { return "eq" + (contadorId++) + "_" + Math.random().toString(36).slice(2, 6); }

  var estado = { equipamentos: [], conexoes: [] };

  var elListaEquip = document.getElementById("listaEquip");
  var elListaConex = document.getElementById("listaConex");
  var elFormEquip = document.getElementById("formEquipamento");
  var elFormCab = document.getElementById("formCabemamento");
  var elNavEquipList = document.getElementById("navEquipList");
  var elNavCableList = document.getElementById("navCableList");
  var elErro = document.getElementById("erro");
  var elCanvas = document.getElementById("canvas");
  var elZoomValue = document.getElementById("zoomValue");
  var elWorkspace = document.getElementById("workspace");
  var elPainelDados = document.getElementById("painelDados");
  var elProjetoSelect = document.getElementById("projetoSelect");
  var elLegenda = document.getElementById("legenda");
  var elDotCode = document.getElementById("dot-code");
  var elJsonAvancado = document.getElementById("jsonAvancado");
  var btnGerar = document.getElementById("btnGerar");
  var btnOrganizar = document.getElementById("btnOrganizarDiagrama");
  var btnCopiar = document.getElementById("btnCopiarDot");
  var btnBaixar = document.getElementById("btnBaixar");
  var btnBaixarPng = document.getElementById("btnBaixarPng");
  var btnDesfazer = document.getElementById("btnDesfazer");
  var btnRefazer = document.getElementById("btnRefazer");
  var selDirecao = document.getElementById("direcao");
  var btnTema = document.getElementById("btnTema");
  var btnModoAvancado = document.getElementById("btnModoAvancado");
  var btnSidebarCollapse = document.getElementById("btnSidebarCollapse");
  var elSidebar = document.querySelector(".sidebar");

  document.querySelectorAll(".nav-item").forEach(function (item) {
    if (!item.title) item.title = item.textContent.trim();
  });

  var ultimoDot = "";
  var downloadsCap = null;
  var projetos = {};
  var projetoAtual = "Projeto principal";
  var historicoDesfazer = [];
  var historicoRefazer = [];
  var ultimoEstadoHistorico = null;
  var aplicandoHistorico = false;
  var atualizacaoDiagramaPendente = null;
  var canvasView = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
  var LIMITE_CANVAS = { minX: -4200, maxX: 4200, minY: -3200, maxY: 3200 };
  Object.defineProperty(window, 'LIMITE_CANVAS', { value: LIMITE_CANVAS, configurable: true, writable: true, enumerable: true });
  Object.defineProperty(globalThis, 'LIMITE_CANVAS', { value: LIMITE_CANVAS, configurable: true, writable: true, enumerable: true });

  function limitarZoom(valor) { return Math.min(3, Math.max(0.4, Number(valor.toFixed(2)))); }

  function limitarPosicaoNoCanvas(valor, min, max) {
    var numero = Number(valor) || 0;
    if (!Number.isFinite(numero)) return min;
    return Math.min(max, Math.max(min, numero));
  }

  function normalizarEquipamentoDentroDoCanvas(equipamento) {
    if (!equipamento || !equipamento.deslocamento) return equipamento;
    equipamento.deslocamento.x = limitarPosicaoNoCanvas(equipamento.deslocamento.x, LIMITE_CANVAS.minX, LIMITE_CANVAS.maxX);
    equipamento.deslocamento.y = limitarPosicaoNoCanvas(equipamento.deslocamento.y, LIMITE_CANVAS.minY, LIMITE_CANVAS.maxY);
    return equipamento;
  }

  function aplicarCanvasView() {
    var svg = elCanvas.querySelector("svg");
    if (svg) svg.style.transform = "translate(" + canvasView.x + "px, " + canvasView.y + "px) scale(" + canvasView.scale + ")";
    elZoomValue.textContent = Math.round(canvasView.scale * 100) + "%";
  }

  function aplicarPosicoesEquipamentos() {
    var svg = elCanvas.querySelector("svg");
    if (!svg) return;
    svg.querySelectorAll("g.node").forEach(function (node) {
      var titulo = node.querySelector("title");
      if (!titulo) return;
      var equipamento = estado.equipamentos.find(function (eq) { return eq.id === titulo.textContent; });
      if (!equipamento || !equipamento.deslocamento) return;
      normalizarEquipamentoDentroDoCanvas(equipamento);
      node.setAttribute("transform", "translate(" + equipamento.deslocamento.x + "," + equipamento.deslocamento.y + ")");
    });
  }

  window.limitarPosicaoNoCanvas = limitarPosicaoNoCanvas;
  window.normalizarEquipamentoDentroDoCanvas = normalizarEquipamentoDentroDoCanvas;
  window.LIMITE_CANVAS = LIMITE_CANVAS;
  globalThis.limitarPosicaoNoCanvas = limitarPosicaoNoCanvas;
  globalThis.normalizarEquipamentoDentroDoCanvas = normalizarEquipamentoDentroDoCanvas;
  globalThis.LIMITE_CANVAS = LIMITE_CANVAS;

  function numeroSvg(valor) {
    var n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }

  function extrairExtremosDoPath(d) {
    var pares = [];
    var re = /(-?\d*\.?\d+(?:e[-+]?\d+)?),(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
    var m;
    while ((m = re.exec(String(d || "")))) pares.push({ x: Number(m[1]), y: Number(m[2]) });
    if (!pares.length) return null;
    return { inicio: pares[0], fim: pares[pares.length - 1] };
  }

  function obterNodePorId(svg, id) {
    var encontrado = null;
    svg.querySelectorAll("g.node").forEach(function (node) {
      if (encontrado) return;
      var titulo = node.querySelector("title");
      if (titulo && titulo.textContent === id) encontrado = node;
    });
    return encontrado;
  }

  function obterTranslateDoNode(svg, id) {
    var node = obterNodePorId(svg, id);
    if (!node) return { x: 0, y: 0 };
    var transform = node.getAttribute("transform") || "";
    var m = /translate\(\s*(-?\d*\.?\d+)\s*[, ]\s*(-?\d*\.?\d+)\s*\)/.exec(transform);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
  }

  function obterCaixasDosEquipamentos(svg) {
    var caixas = [];
    svg.querySelectorAll("g.node").forEach(function (node) {
      var titulo = node.querySelector("title");
      if (!titulo) return;
      var idEquipamento = titulo.textContent;
      try {
        var b = node.getBBox();
        var t = obterTranslateDoNode(svg, idEquipamento);
        caixas.push({ id: idEquipamento, tipo: "equipamento", x: b.x + t.x, y: b.y + t.y, width: b.width, height: b.height });

        Array.prototype.slice.call(node.querySelectorAll("polygon")).forEach(function (poligono) {
          var stroke = String(poligono.getAttribute("stroke") || "").toLowerCase();
          if (!stroke || stroke === "none" || stroke === "transparent") return;
          try {
            var bp = poligono.getBBox();
            if (bp.width < 8 || bp.width > 130 || bp.height < 6 || bp.height > 50) return;
            caixas.push({ id: idEquipamento, tipo: "porta", x: bp.x + t.x, y: bp.y + t.y, width: bp.width, height: bp.height });
          } catch (e) {}
        });
      } catch (e) {}
    });
    return caixas;
  }

  function obterPontosExatosDasPortas(svg) {
    var direcao = (selDirecao && selDirecao.value) || "LR";
    var estrutura = {};
    var pontos = {};

    estado.equipamentos.forEach(function (eq) {
      estrutura[eq.id] = { entrada: [], saida: [] };
    });

    estado.conexoes.forEach(function (conexao, indice) {
      if (estrutura[conexao.de]) estrutura[conexao.de].saida.push(indice);
      if (estrutura[conexao.para]) estrutura[conexao.para].entrada.push(indice);
    });

    Object.keys(estrutura).forEach(function (idEquipamento) {
      var node = obterNodePorId(svg, idEquipamento);
      if (!node) return;

      var bboxNode;
      try { bboxNode = node.getBBox(); } catch (e) { return; }
      var translacao = obterTranslateDoNode(svg, idEquipamento);
      var centroX = bboxNode.x + bboxNode.width / 2;
      var centroY = bboxNode.y + bboxNode.height / 2;

      var caixasPorta = Array.prototype.slice.call(node.querySelectorAll("polygon")).map(function (poligono) {
        var stroke = String(poligono.getAttribute("stroke") || "").toLowerCase();
        if (!stroke || stroke === "none" || stroke === "transparent") return null;
        try {
          var b = poligono.getBBox();
          if (b.width < 30 || b.width > 130 || b.height < 8 || b.height > 50) return null;
          return { poligono: poligono, bbox: b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
        } catch (e) { return null; }
      }).filter(Boolean);

      var entradasVisuais;
      var saidasVisuais;

      if (direcao === "TB") {
        entradasVisuais = caixasPorta.filter(function (item) { return item.cy < centroY; });
        saidasVisuais = caixasPorta.filter(function (item) { return item.cy >= centroY; });
      } else {
        entradasVisuais = caixasPorta.filter(function (item) { return item.cx < centroX; });
        saidasVisuais = caixasPorta.filter(function (item) { return item.cx >= centroX; });
      }

      entradasVisuais.sort(function (a, b) { return a.cy - b.cy; });
      saidasVisuais.sort(function (a, b) { return a.cy - b.cy; });

      estrutura[idEquipamento].entrada.forEach(function (indiceConexao, ordem) {
        var caixa = entradasVisuais[ordem];
        if (!caixa) return;
        if (!pontos[indiceConexao]) pontos[indiceConexao] = {};

        if (direcao === "TB") {
          pontos[indiceConexao].fim = {
            x: caixa.cx + translacao.x,
            y: caixa.bbox.y + translacao.y
          };
        } else {
          pontos[indiceConexao].fim = {
            x: caixa.bbox.x + translacao.x,
            y: caixa.cy + translacao.y
          };
        }
      });

      estrutura[idEquipamento].saida.forEach(function (indiceConexao, ordem) {
        var caixa = saidasVisuais[ordem];
        if (!caixa) return;
        if (!pontos[indiceConexao]) pontos[indiceConexao] = {};

        if (direcao === "TB") {
          pontos[indiceConexao].inicio = {
            x: caixa.cx + translacao.x,
            y: caixa.bbox.y + caixa.bbox.height + translacao.y
          };
        } else {
          pontos[indiceConexao].inicio = {
            x: caixa.bbox.x + caixa.bbox.width + translacao.x,
            y: caixa.cy + translacao.y
          };
        }
      });
    });

    return pontos;
  }

  function intervalosSobrepoem(a1, a2, b1, b2, folga) {
    var amin = Math.min(a1, a2), amax = Math.max(a1, a2);
    var bmin = Math.min(b1, b2), bmax = Math.max(b1, b2);
    return amax + folga >= bmin && bmax + folga >= amin;
  }

  function segmentosSeCruzam(x1, y1, x2, y2, x3, y3, x4, y4) {
    var denom = (x1 - x2) * (y3 - y4) - (x1 - x2) * (y3 - y4);
    var numerator = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    if (denom === 0) return false;
    var t = numerator / denom;
    if (t < 0 || t > 1) return false;
    var u = ((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    return u >= 0 && u <= 1;
  }

  function segmentoCruzaRetangulo(x1, y1, x2, y2, caixa, margem) {
    var rx1 = caixa.x - margem;
    var ry1 = caixa.y - margem;
    var rx2 = caixa.x + caixa.width + margem;
    var ry2 = caixa.y + caixa.height + margem;
    var lados = [
      [rx1, ry1, rx2, ry1],
      [rx2, ry1, rx2, ry2],
      [rx2, ry2, rx1, ry2],
      [rx1, ry2, rx1, ry1]
    ];
    for (var i = 0; i < lados.length; i++) {
      var lado = lados[i];
      if (segmentosSeCruzam(x1, y1, x2, y2, lado[0], lado[1], lado[2], lado[3])) return true;
    }
    var dentro = x1 >= rx1 && x1 <= rx2 && y1 >= ry1 && y1 <= ry2;
    var dentro2 = x2 >= rx1 && x2 <= rx2 && y2 >= ry1 && y2 <= ry2;
    return dentro || dentro2;
  }

  function verticalCruzaCaixa(x, y1, y2, caixa, margem) {
    return x >= caixa.x - margem && x <= caixa.x + caixa.width + margem &&
      intervalosSobrepoem(y1, y2, caixa.y, caixa.y + caixa.height, 0);
  }

  function horizontalCruzaCaixa(y, x1, x2, caixa, margem) {
    return y >= caixa.y - margem && y <= caixa.y + caixa.height + margem &&
      intervalosSobrepoem(x1, x2, caixa.x, caixa.x + caixa.width, 0);
  }

  function corredorVerticalLivre(x, rota, ocupados, caixas) {
    var espaco = CONFIG_ROTEAMENTO_CABOS.espaco;
    var margemObstaculo = CONFIG_ROTEAMENTO_CABOS.margemEquipamento + 3;
    for (var i = 0; i < ocupados.length; i++) {
      var o = ocupados[i];
      if (Math.abs(o.x - x) < espaco && intervalosSobrepoem(rota.inicio.y, rota.fim.y, o.y1, o.y2, espaco * 0.2)) return false;
    }

    var segmentos = [
      { x1: rota.inicio.x, y1: rota.inicio.y, x2: x, y2: rota.inicio.y },
      { x1: x, y1: rota.inicio.y, x2: x, y2: rota.fim.y },
      { x1: x, y1: rota.fim.y, x2: rota.fim.x, y2: rota.fim.y }
    ];

    for (var j = 0; j < caixas.length; j++) {
      var c = caixas[j];
      if (c.id === rota.conexao.de || c.id === rota.conexao.para) continue;
      for (var s = 0; s < segmentos.length; s++) {
        var seg = segmentos[s];
        if (segmentoCruzaRetangulo(seg.x1, seg.y1, seg.x2, seg.y2, c, margemObstaculo)) return false;
      }
    }
    return true;
  }

  function corredorHorizontalLivre(y, rota, ocupados, caixas) {
    var espaco = CONFIG_ROTEAMENTO_CABOS.espaco;
    var margemObstaculo = CONFIG_ROTEAMENTO_CABOS.margemEquipamento + 3;
    for (var i = 0; i < ocupados.length; i++) {
      var o = ocupados[i];
      if (Math.abs(o.y - y) < espaco && intervalosSobrepoem(rota.inicio.x, rota.fim.x, o.x1, o.x2, espaco * 0.2)) return false;
    }

    var segmentos = [
      { x1: rota.inicio.x, y1: rota.inicio.y, x2: rota.fim.x, y2: rota.inicio.y },
      { x1: rota.fim.x, y1: rota.inicio.y, x2: rota.fim.x, y2: y },
      { x1: rota.inicio.x, y1: y, x2: rota.fim.x, y2: y }
    ];

    for (var j = 0; j < caixas.length; j++) {
      var c = caixas[j];
      if (c.id === rota.conexao.de || c.id === rota.conexao.para) continue;
      for (var s = 0; s < segmentos.length; s++) {
        var seg = segmentos[s];
        if (segmentoCruzaRetangulo(seg.x1, seg.y1, seg.x2, seg.y2, c, margemObstaculo)) return false;
      }
    }
    return true;
  }

  function encontrarCorredorVertical(preferido, rota, ocupados, caixas, minimo, maximo) {
    var passo = CONFIG_ROTEAMENTO_CABOS.espaco;
    var candidatos = [preferido];
    for (var i = 1; i <= CONFIG_ROTEAMENTO_CABOS.tentativas; i++) {
      candidatos.push(preferido - i * passo);
      candidatos.push(preferido + i * passo);
    }
    for (var j = 0; j < candidatos.length; j++) {
      var x = candidatos[j];
      if (minimo < maximo && (x < minimo || x > maximo)) continue;
      if (corredorVerticalLivre(x, rota, ocupados, caixas)) return x;
    }
    return preferido;
  }

  function encontrarCorredorHorizontal(preferido, rota, ocupados, caixas, minimo, maximo) {
    var passo = CONFIG_ROTEAMENTO_CABOS.espaco;
    var candidatos = [preferido];
    for (var i = 1; i <= CONFIG_ROTEAMENTO_CABOS.tentativas; i++) {
      candidatos.push(preferido - i * passo);
      candidatos.push(preferido + i * passo);
    }
    for (var j = 0; j < candidatos.length; j++) {
      var y = candidatos[j];
      if (minimo < maximo && (y < minimo || y > maximo)) continue;
      if (corredorHorizontalLivre(y, rota, ocupados, caixas)) return y;
    }
    return preferido;
  }

  function posicionarRotuloDaAresta(aresta, rota, corredor, direcao) {
    var textos = aresta.querySelectorAll("text");
    if (!textos.length) return;
    var texto = textos[0];
    texto.removeAttribute("transform");
    texto.removeAttribute("data-move-x");
    texto.removeAttribute("data-move-y");
    if (direcao === "TB") {
      var d1 = Math.abs(corredor - rota.inicio.y);
      var d2 = Math.abs(rota.fim.y - corredor);
      var x = (rota.inicio.x + rota.fim.x) / 2;
      var y = d1 >= d2 ? (rota.inicio.y + corredor) / 2 : (corredor + rota.fim.y) / 2;
      texto.setAttribute("x", x.toFixed(2));
      texto.setAttribute("y", (y - 4).toFixed(2));
      texto.setAttribute("text-anchor", "middle");
    } else {
      var h1 = Math.abs(corredor - rota.inicio.x);
      var h2 = Math.abs(rota.fim.x - corredor);
      var tx = h1 >= h2 ? (rota.inicio.x + corredor) / 2 : (corredor + rota.fim.x) / 2;
      var ty = h1 >= h2 ? rota.inicio.y : rota.fim.y;
      texto.setAttribute("x", tx.toFixed(2));
      texto.setAttribute("y", (ty - 5).toFixed(2));
      texto.setAttribute("text-anchor", "middle");
    }
  }

  var CONFIG_ROTEAMENTO_CABOS = {
    espaco: 12,
    margemPorta: 1,
    margemEquipamento: 6,
    tentativas: 80
  };
  var roteamentoCabosFrame = null;

  function roteiarUmaRotaLR(rota, indiceNoGrupo, tamanhoGrupo, ocupados, caixas) {
    var margem = CONFIG_ROTEAMENTO_CABOS.margemPorta;
    var passo = CONFIG_ROTEAMENTO_CABOS.espaco;
    var direita = rota.fim.x >= rota.inicio.x;
    var minimo = Math.min(rota.inicio.x, rota.fim.x) + margem;
    var maximo = Math.max(rota.inicio.x, rota.fim.x) - margem;
    var preferido;

    if (direita) preferido = maximo - indiceNoGrupo * passo;
    else preferido = minimo + indiceNoGrupo * passo;

    if (minimo >= maximo) preferido = (rota.inicio.x + rota.fim.x) / 2 + (indiceNoGrupo - (tamanhoGrupo - 1) / 2) * passo;
    var corredor = encontrarCorredorVertical(preferido, rota, ocupados, caixas, minimo, maximo);
    ocupados.push({ x: corredor, y1: rota.inicio.y, y2: rota.fim.y });

    rota.path.setAttribute("d",
      "M" + rota.inicio.x.toFixed(2) + "," + rota.inicio.y.toFixed(2) +
      " H" + corredor.toFixed(2) +
      " V" + rota.fim.y.toFixed(2) +
      " H" + rota.fim.x.toFixed(2)
    );
    posicionarRotuloDaAresta(rota.aresta, rota, corredor, "LR");
  }

  function roteiarUmaRotaTB(rota, indiceNoGrupo, tamanhoGrupo, ocupados, caixas) {
    var margem = CONFIG_ROTEAMENTO_CABOS.margemPorta;
    var passo = CONFIG_ROTEAMENTO_CABOS.espaco;
    var baixo = rota.fim.y >= rota.inicio.y;
    var minimo = Math.min(rota.inicio.y, rota.fim.y) + margem;
    var maximo = Math.max(rota.inicio.y, rota.fim.y) - margem;
    var preferido = baixo ? maximo - indiceNoGrupo * passo : minimo + indiceNoGrupo * passo;
    if (minimo >= maximo) preferido = (rota.inicio.y + rota.fim.y) / 2 + (indiceNoGrupo - (tamanhoGrupo - 1) / 2) * passo;
    var corredor = encontrarCorredorHorizontal(preferido, rota, ocupados, caixas, minimo, maximo);
    ocupados.push({ y: corredor, x1: rota.inicio.x, x2: rota.fim.x });

    rota.path.setAttribute("d",
      "M" + rota.inicio.x.toFixed(2) + "," + rota.inicio.y.toFixed(2) +
      " V" + corredor.toFixed(2) +
      " H" + rota.fim.x.toFixed(2) +
      " V" + rota.fim.y.toFixed(2)
    );
    posicionarRotuloDaAresta(rota.aresta, rota, corredor, "TB");
  }

  function rotearCabosOrtogonalmente() {
    var svg = elCanvas.querySelector("svg");
    if (!svg) return;
    var arestas = Array.prototype.slice.call(svg.querySelectorAll("g.edge"));
    if (!arestas.length) return;
    var caixas = obterCaixasDosEquipamentos(svg);
    var pontosPortas = obterPontosExatosDasPortas(svg);
    var rotas = [];

    estado.conexoes.forEach(function (conexao, indice) {
      var aresta = svg.querySelector('g.edge[id="edge_' + indice + '"]') || arestas[indice];
      if (!aresta) return;
      aresta.removeAttribute("transform");
      var path = aresta.querySelector("path");
      if (!path) return;

      var pontoVisual = pontosPortas[indice] || {};
      var inicio = pontoVisual.inicio;
      var fim = pontoVisual.fim;

      if (!inicio || !fim) {
        if (!path.getAttribute("data-base-inicio-x")) {
          var extremos = extrairExtremosDoPath(path.getAttribute("d"));
          if (!extremos) return;
          path.setAttribute("data-base-inicio-x", extremos.inicio.x);
          path.setAttribute("data-base-inicio-y", extremos.inicio.y);
          path.setAttribute("data-base-fim-x", extremos.fim.x);
          path.setAttribute("data-base-fim-y", extremos.fim.y);
        }

        var tOrigem = obterTranslateDoNode(svg, conexao.de);
        var tDestino = obterTranslateDoNode(svg, conexao.para);
        if (!inicio) {
          inicio = {
            x: numeroSvg(path.getAttribute("data-base-inicio-x")) + tOrigem.x,
            y: numeroSvg(path.getAttribute("data-base-inicio-y")) + tOrigem.y
          };
        }
        if (!fim) {
          fim = {
            x: numeroSvg(path.getAttribute("data-base-fim-x")) + tDestino.x,
            y: numeroSvg(path.getAttribute("data-base-fim-y")) + tDestino.y
          };
        }
      }

      var direcaoRota = obterDirecaoConexaoPorPosicao(conexao);
      rotas.push({ indice: indice, conexao: conexao, aresta: aresta, path: path, inicio: inicio, fim: fim, direcao: direcaoRota });
    });

    var grupos = {};
    rotas.forEach(function (rota) {
      var chave = rota.conexao.para + "|" + rota.direcao;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(rota);
    });

    Object.keys(grupos).forEach(function (chave) {
      var grupo = grupos[chave];
      var direcaoRota = grupo[0] && grupo[0].direcao ? grupo[0].direcao : "LR";
      var ocupados = [];
      grupo.sort(function (a, b) {
        return direcaoRota === "TB" ? a.inicio.x - b.inicio.x : a.inicio.y - b.inicio.y;
      });
      grupo.forEach(function (rota, indice) {
        if (direcaoRota === "TB") roteiarUmaRotaTB(rota, indice, grupo.length, ocupados, caixas);
        else roteiarUmaRotaLR(rota, indice, grupo.length, ocupados, caixas);
      });
    });
  }

  function solicitarRoteamentoCabos() {
    if (roteamentoCabosFrame) cancelAnimationFrame(roteamentoCabosFrame);
    roteamentoCabosFrame = requestAnimationFrame(function () {
      roteamentoCabosFrame = null;
      rotearCabosOrtogonalmente();
    });
  }

  function atualizarArestasDoEquipamento(id, deslocamentoX, deslocamentoY) {
    solicitarRoteamentoCabos();
  }

  function ativarArrasteDosEquipamentos() {
    var svg = elCanvas.querySelector("svg");
    if (!svg) return;
    var viewBox = svg.viewBox && svg.viewBox.baseVal;
    svg.querySelectorAll("g.node").forEach(function (node) {
      var titulo = node.querySelector("title");
      if (!titulo) return;
      var equipamento = estado.equipamentos.find(function (eq) { return eq.id === titulo.textContent; });
      if (!equipamento) return;
      var deslocamento = equipamento.deslocamento || { x: 0, y: 0 };
      node.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.stopPropagation();
        svg.querySelectorAll("g.node.selecionado").forEach(function (item) { item.classList.remove("selecionado"); });
        node.classList.add("selecionado");
        node.setPointerCapture(event.pointerId);
        var rect = svg.getBoundingClientRect();
        var escalaX = viewBox && viewBox.width ? viewBox.width / rect.width : 1;
        var escalaY = viewBox && viewBox.height ? viewBox.height / rect.height : 1;
        var inicioX = event.clientX;
        var inicioY = event.clientY;
        var originalX = deslocamento.x;
        var originalY = deslocamento.y;
        var posicaoAnteriorX = originalX;
        var posicaoAnteriorY = originalY;
        function mover(movimento) {
          deslocamento.x = originalX + (movimento.clientX - inicioX) * escalaX / canvasView.scale;
          deslocamento.y = originalY + (movimento.clientY - inicioY) * escalaY / canvasView.scale;
          node.setAttribute("transform", "translate(" + deslocamento.x + "," + deslocamento.y + ")");
          atualizarArestasDoEquipamento(equipamento.id, deslocamento.x - posicaoAnteriorX, deslocamento.y - posicaoAnteriorY);
          posicaoAnteriorX = deslocamento.x;
          posicaoAnteriorY = deslocamento.y;
        }
        function soltar() {
          deslocamento.x = limitarPosicaoNoCanvas(deslocamento.x, LIMITE_CANVAS.minX, LIMITE_CANVAS.maxX);
          deslocamento.y = limitarPosicaoNoCanvas(deslocamento.y, LIMITE_CANVAS.minY, LIMITE_CANVAS.maxY);
          equipamento.deslocamento = { x: deslocamento.x, y: deslocamento.y };
          salvarLocal();
          atualizarJsonAvancado();
          solicitarAtualizacaoDiagrama();
          node.removeEventListener("pointermove", mover);
          node.removeEventListener("pointerup", soltar);
          node.removeEventListener("pointercancel", soltar);
        }
        node.addEventListener("pointermove", mover);
        node.addEventListener("pointerup", soltar);
        node.addEventListener("pointercancel", soltar);
      });
      node.addEventListener("dblclick", function (event) {
        event.stopPropagation();
        abrirModal({
          title: "Renomear equipamento",
          message: "Digite o novo nome do equipamento:",
          defaultValue: equipamento.nome || equipamento.id,
          confirmText: "Salvar",
          cancelText: "Cancelar",
          kind: "prompt"
        }).then(function (valor) {
          if (!valor || !String(valor).trim()) return;
          equipamento.nome = String(valor).trim();
          renderTudo();
        });
      });
    });
  }

  function ativarArrasteDosCabos() {
    var svg = elCanvas.querySelector("svg");
    if (!svg) return;
    var viewBox = svg.viewBox && svg.viewBox.baseVal;
    svg.querySelectorAll("g.edge").forEach(function (aresta) {
      var titulo = aresta.querySelector("title");
      if (!titulo) return;
      var partes = titulo.textContent.split("->");
      var conexao = estado.conexoes.find(function (item) { return item.de === partes[0] && item.para === partes[1]; });
      if (!conexao) return;
      var deslocamento = conexao.deslocamento || { x: 0, y: 0 };
      aresta.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.stopPropagation();
        aresta.classList.add("selecionado");
        aresta.setPointerCapture(event.pointerId);
        var rect = svg.getBoundingClientRect();
        var escalaX = viewBox && viewBox.width ? viewBox.width / rect.width : 1;
        var escalaY = viewBox && viewBox.height ? viewBox.height / rect.height : 1;
        var inicioX = event.clientX;
        var inicioY = event.clientY;
        var originalX = deslocamento.x;
        var originalY = deslocamento.y;
        function mover(movimento) {
          deslocamento.x = originalX + (movimento.clientX - inicioX) * escalaX / canvasView.scale;
          deslocamento.y = originalY + (movimento.clientY - inicioY) * escalaY / canvasView.scale;
          aresta.setAttribute("transform", "translate(" + deslocamento.x + "," + deslocamento.y + ")");
        }
        function soltar() {
          conexao.deslocamento = { x: deslocamento.x, y: deslocamento.y };
          salvarLocal();
          atualizarJsonAvancado();
          solicitarAtualizacaoDiagrama();
          aresta.classList.remove("selecionado");
          aresta.removeEventListener("pointermove", mover);
          aresta.removeEventListener("pointerup", soltar);
          aresta.removeEventListener("pointercancel", soltar);
        }
        aresta.addEventListener("pointermove", mover);
        aresta.addEventListener("pointerup", soltar);
        aresta.addEventListener("pointercancel", soltar);
      });
    });
  }

  function definirZoom(novoZoom, centroX, centroY) {
    var zoomAnterior = canvasView.scale;
    var zoomAtual = limitarZoom(novoZoom);
    if (zoomAnterior === zoomAtual) return;
    if (centroX != null && centroY != null) {
      canvasView.x += centroX * (zoomAnterior - zoomAtual);
      canvasView.y += centroY * (zoomAnterior - zoomAtual);
    }
    canvasView.scale = zoomAtual;
    aplicarCanvasView();
  }

  function resetarCanvasView() { canvasView.scale = 1; canvasView.x = 0; canvasView.y = 0; aplicarCanvasView(); }

  elCanvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    var rect = elCanvas.getBoundingClientRect();
    var centroX = event.clientX - rect.left - rect.width / 2;
    var centroY = event.clientY - rect.top - rect.height / 2;
    definirZoom(canvasView.scale * (event.deltaY < 0 ? 1.1 : 0.9), centroX, centroY);
  }, { passive: false });

  elCanvas.addEventListener("pointerdown", function (event) {
    if (event.button !== 0) return;
    canvasView.dragging = true;
    canvasView.startX = event.clientX;
    canvasView.startY = event.clientY;
    canvasView.originX = canvasView.x;
    canvasView.originY = canvasView.y;
    elCanvas.classList.add("panning");
    elCanvas.setPointerCapture(event.pointerId);
  });

  elCanvas.addEventListener("pointermove", function (event) {
    if (!canvasView.dragging) return;
    canvasView.x = canvasView.originX + event.clientX - canvasView.startX;
    canvasView.y = canvasView.originY + event.clientY - canvasView.startY;
    aplicarCanvasView();
  });

  function terminarPan(event) {
    if (!canvasView.dragging) return;
    canvasView.dragging = false;
    elCanvas.classList.remove("panning");
    if (event && elCanvas.hasPointerCapture(event.pointerId)) elCanvas.releasePointerCapture(event.pointerId);
  }

  elCanvas.addEventListener("pointerup", terminarPan);
  elCanvas.addEventListener("pointercancel", terminarPan);
  document.getElementById("btnZoomIn").addEventListener("click", function () { definirZoom(canvasView.scale + 0.1); });
  document.getElementById("btnZoomOut").addEventListener("click", function () { definirZoom(canvasView.scale - 0.1); });
  document.getElementById("btnZoomReset").addEventListener("click", resetarCanvasView);

  btnSidebarCollapse.addEventListener("click", function () {
    var recolhida = elSidebar.classList.toggle("collapsed");
    btnSidebarCollapse.textContent = recolhida ? "›" : "‹";
    btnSidebarCollapse.setAttribute("aria-label", recolhida ? "Expandir barra lateral" : "Recolher barra lateral");
    btnSidebarCollapse.title = recolhida ? "Expandir barra lateral" : "Recolher barra lateral";
  });

  btnModoAvancado.addEventListener("click", function () {
    var fechado = elPainelDados.classList.toggle("painel-dados-oculto");
    elWorkspace.classList.toggle("modo-avancado-fechado", fechado);
    btnModoAvancado.classList.toggle("active", !fechado);
    btnModoAvancado.textContent = fechado ? "Modo avançado" : "Fechar modo avançado";
  });

  var modalRef = {
    backdrop: document.getElementById("appModal"),
    title: document.getElementById("modalTitle"),
    message: document.getElementById("modalMessage"),
    fieldWrap: document.getElementById("modalFieldWrap"),
    input: document.getElementById("modalInput"),
    cancel: document.querySelector("[data-modal-cancel]"),
    confirm: document.querySelector("[data-modal-confirm]"),
    close: document.querySelector("[data-modal-close]"),
    resolver: null,
    mode: "confirm"
  };

  function abrirModal(opcoes) {
    var config = Object.assign({
      title: "Atenção",
      message: "",
      defaultValue: "",
      confirmText: "OK",
      cancelText: "Cancelar",
      kind: "confirm"
    }, opcoes || {});

    modalRef.title.textContent = config.title;
    modalRef.message.textContent = config.message;
    modalRef.input.value = config.defaultValue || "";
    modalRef.confirm.textContent = config.confirmText;
    modalRef.cancel.textContent = config.cancelText;
    modalRef.mode = config.kind;

    if (config.kind === "prompt") {
      modalRef.fieldWrap.classList.remove("hidden");
      modalRef.input.focus();
      modalRef.input.select && modalRef.input.select();
    } else {
      modalRef.fieldWrap.classList.add("hidden");
    }

    modalRef.backdrop.classList.remove("hidden");

    return new Promise(function (resolver) {
      modalRef.resolver = resolver;
    });
  }

  function fecharModal(valor) {
    modalRef.backdrop.classList.add("hidden");
    if (modalRef.resolver) {
      var resposta = valor;
      if (modalRef.mode === "prompt") {
        resposta = modalRef.input.value.trim();
      }
      modalRef.resolver(resposta);
      modalRef.resolver = null;
    }
  }

  modalRef.cancel.addEventListener("click", function () { fecharModal(null); });
  modalRef.close.addEventListener("click", function () { fecharModal(null); });
  modalRef.confirm.addEventListener("click", function () {
    if (modalRef.mode === "prompt") {
      fecharModal(modalRef.input.value);
    } else {
      fecharModal(true);
    }
  });
  modalRef.backdrop.addEventListener("click", function (event) {
    if (event.target === modalRef.backdrop) fecharModal(null);
  });
  modalRef.input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      fecharModal(modalRef.input.value);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      fecharModal(null);
    }
  });

  function clonarDados(dados) { return JSON.parse(JSON.stringify(dados)); }
  function projetoVazio() { return { equipamentos: [], conexoes: [] }; }

  function carregarProjetos() {
    try {
      var salvo = JSON.parse(localStorage.getItem("grafo-projetos") || "null");
      if (salvo && typeof salvo === "object" && Object.keys(salvo).length) {
        var projetosSanitizados = {};
        Object.keys(salvo).forEach(function (nome) {
          var projeto = salvo[nome];
          if (!projeto || typeof projeto !== "object") return;
          var equipamentos = Array.isArray(projeto.equipamentos) ? projeto.equipamentos : [];
          var conexoes = Array.isArray(projeto.conexoes) ? projeto.conexoes : [];
          projetosSanitizados[nome] = { equipamentos: equipamentos, conexoes: conexoes };
        });
        if (Object.keys(projetosSanitizados).length) return projetosSanitizados;
      }
    } catch (e) {}
    var legado = carregarLocal();
    if (legado && Array.isArray(legado.equipamentos) && legado.equipamentos.length) {
      return { "Projeto principal": clonarDados(legado) };
    }
    return { "Projeto principal": projetoVazio() };
  }
  function salvarLocal() {
    try {
      var estadoAtual = JSON.stringify(estado);
      if (!aplicandoHistorico && ultimoEstadoHistorico && ultimoEstadoHistorico !== estadoAtual) {
        historicoDesfazer.push(JSON.parse(ultimoEstadoHistorico));
        if (historicoDesfazer.length > 50) historicoDesfazer.shift();
        historicoRefazer = [];
      }
      ultimoEstadoHistorico = estadoAtual;
      btnDesfazer.disabled = historicoDesfazer.length === 0;
      btnRefazer.disabled = historicoRefazer.length === 0;
      projetos[projetoAtual] = clonarDados(estado);
      localStorage.setItem("grafo-projetos", JSON.stringify(projetos));
      localStorage.setItem("grafo-projeto-atual", projetoAtual);
      localStorage.setItem("diagrama-estado", JSON.stringify(estado));
    } catch (e) {}
  }
  function carregarLocal() { try { var s = localStorage.getItem("diagrama-estado"); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function salvarTema(t) { try { localStorage.setItem("diagrama-tema", t); } catch (e) {} }
  function carregarTema() { try { return localStorage.getItem("diagrama-tema"); } catch (e) { return null; } }

  function renderProjetos() {
    elProjetoSelect.innerHTML = Object.keys(projetos).map(function (nome) {
      return '<option value="' + escaparHtml(nome) + '"' + (nome === projetoAtual ? " selected" : "") + '>' + escaparHtml(nome) + '</option>';
    }).join("");
  }

  function limparDiagrama() {
    ultimoDot = "";
    elCanvas.classList.add("vazio");
    elCanvas.textContent = "Adicione equipamentos e gere o diagrama.";
    elLegenda.innerHTML = "";
    elDotCode.textContent = "";
    btnCopiar.disabled = true;
    btnBaixar.disabled = true;
    btnBaixarPng.disabled = true;
  }

  function atualizarBotoesHistorico() {
    btnDesfazer.disabled = historicoDesfazer.length === 0;
    btnRefazer.disabled = historicoRefazer.length === 0;
  }

  function restaurarHistorico(origem, destino) {
    if (!origem.length) return;
    destino.push(clonarDados(estado));
    estado = clonarDados(origem.pop());
    aplicandoHistorico = true;
    renderTudo();
    if (estado.equipamentos.length) gerar(); else limparDiagrama();
    aplicandoHistorico = false;
    atualizarBotoesHistorico();
  }

  btnDesfazer.addEventListener("click", function () { restaurarHistorico(historicoDesfazer, historicoRefazer); });
  btnRefazer.addEventListener("click", function () { restaurarHistorico(historicoRefazer, historicoDesfazer); });

  function abrirProjeto(nome) {
    if (!projetos[nome]) return;
    salvarLocal();
    projetoAtual = nome;
    estado = clonarDados(projetos[nome]);
    historicoDesfazer = [];
    historicoRefazer = [];
    ultimoEstadoHistorico = JSON.stringify(estado);
    renderProjetos();
    renderTudo();
    if (estado.equipamentos.length) gerar(); else limparDiagrama();
  }

  elProjetoSelect.addEventListener("change", function (event) { abrirProjeto(event.target.value); });
  document.getElementById("btnNovoProjeto").addEventListener("click", function () {
    abrirModal({
      title: "Novo projeto",
      message: "Digite o nome do novo projeto:",
      confirmText: "Criar",
      cancelText: "Cancelar",
      kind: "prompt"
    }).then(function (valor) {
      var nome = valor ? String(valor).trim() : "";
      if (!nome) return;
      if (projetos[nome]) { mostrarErro("Escolha um nome novo para o projeto."); return; }
      salvarLocal();
      projetos[nome] = { equipamentos: [], conexoes: [] };
      projetoAtual = nome;
      estado = clonarDados(projetos[nome]);
      historicoDesfazer = [];
      historicoRefazer = [];
      ultimoEstadoHistorico = JSON.stringify(estado);
      salvarLocal();
      renderProjetos();
      renderTudo();
      limparDiagrama();
    });
  });

  document.getElementById("btnExcluirProjeto").addEventListener("click", function () {
    var nomes = Object.keys(projetos);
    if (nomes.length <= 1) { mostrarErro("Mantenha ao menos um projeto salvo."); return; }
    abrirModal({
      title: "Excluir projeto",
      message: "Deseja excluir o projeto \"" + projetoAtual + "\"?",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      kind: "confirm"
    }).then(function (confirmado) {
      if (!confirmado) return;
      delete projetos[projetoAtual];
      projetoAtual = Object.keys(projetos)[0];
      estado = clonarDados(projetos[projetoAtual]);
      historicoDesfazer = [];
      historicoRefazer = [];
      ultimoEstadoHistorico = JSON.stringify(estado);
      salvarLocal();
      renderProjetos();
      renderTudo();
      if (estado.equipamentos.length) gerar(); else limparDiagrama();
    });
  });

  var themePresets = { "theme-nord": { bg: "#2E3440", bgPanel: "rgba(32, 38, 48, 0.95)", bgPanel2: "#3B4252", line: "rgba(136, 192, 208, 0.22)", lineSoft: "rgba(129, 161, 193, 0.18)", text: "#ECEFF4", textDim: "#D8DEE9", accent: "#88C0D0", accentInk: "#2E3440", teal: "#8FBCBB", paper: "#F4F6FA", paperLine: "#D8DEE9", ink: "#2E3440", danger: "#FF7D6C", fieldBg: "rgba(236,239,244,0.05)", fieldText: "#ECEFF4", fieldBorder: "rgba(136,192,208,0.22)", ghostBg: "rgba(236,239,244,0.04)", ghostText: "#D8DEE9", ghostBorder: "rgba(136,192,208,0.22)", optionBg: "#F4F6FA", optionText: "#2E3440", optionActiveBg: "#88C0D0", optionActiveText: "#2E3440", shadowSoft: "0 10px 30px rgba(5, 12, 20, 0.25)", shadowCard: "0 12px 28px rgba(6, 15, 22, 0.22)" }, "theme-dark-modern": { bg: "#1F1F1F", bgPanel: "rgba(33, 33, 33, 0.94)", bgPanel2: "#2B2B2B", line: "rgba(124, 124, 124, 0.2)", lineSoft: "rgba(170, 170, 170, 0.14)", text: "#F3F3F3", textDim: "#C9C9C9", accent: "#5AA9FF", accentInk: "#0F172A", teal: "#7CE6D8", paper: "#F8F8F8", paperLine: "#E2E2E2", ink: "#1D1D1D", danger: "#FF7D6C", fieldBg: "rgba(255,255,255,0.03)", fieldText: "#F3F3F3", fieldBorder: "rgba(170,170,170,0.18)", ghostBg: "rgba(255,255,255,0.02)", ghostText: "#C9C9C9", ghostBorder: "rgba(170,170,170,0.18)", optionBg: "#F8F8F8", optionText: "#1D1D1D", optionActiveBg: "#5AA9FF", optionActiveText: "#0F172A", shadowSoft: "0 10px 30px rgba(0, 0, 0, 0.24)", shadowCard: "0 12px 28px rgba(0, 0, 0, 0.18)" }, "theme-dracula": { bg: "#282A36", bgPanel: "rgba(40, 42, 54, 0.95)", bgPanel2: "#1E2029", line: "rgba(255, 121, 198, 0.18)", lineSoft: "rgba(189, 147, 249, 0.18)", text: "#F8F8F2", textDim: "#BD93F9", accent: "#FF79C6", accentInk: "#282A36", teal: "#8BE9FD", paper: "#F7F7F7", paperLine: "#E5E5E5", ink: "#282A36", danger: "#FF5555", fieldBg: "rgba(248,248,242,0.04)", fieldText: "#F8F8F2", fieldBorder: "rgba(255,121,198,0.2)", ghostBg: "rgba(248,248,242,0.03)", ghostText: "#BD93F9", ghostBorder: "rgba(255,121,198,0.2)", optionBg: "#F7F7F7", optionText: "#282A36", optionActiveBg: "#FF79C6", optionActiveText: "#282A36", shadowSoft: "0 10px 30px rgba(0, 0, 0, 0.28)", shadowCard: "0 12px 28px rgba(0, 0, 0, 0.2)" }, "theme-dark-plus": { bg: "#0D1117", bgPanel: "rgba(13, 17, 23, 0.94)", bgPanel2: "#161B22", line: "rgba(110, 118, 129, 0.18)", lineSoft: "rgba(110, 118, 129, 0.14)", text: "#C9D1D9", textDim: "#8B949E", accent: "#58A6FF", accentInk: "#0D1117", teal: "#39D353", paper: "#F6F8FA", paperLine: "#D0D7DE", ink: "#0D1117", danger: "#F85149", fieldBg: "rgba(201,209,217,0.04)", fieldText: "#C9D1D9", fieldBorder: "rgba(110,118,129,0.22)", ghostBg: "rgba(201,209,217,0.03)", ghostText: "#8B949E", ghostBorder: "rgba(110,118,129,0.22)", optionBg: "#F6F8FA", optionText: "#0D1117", optionActiveBg: "#58A6FF", optionActiveText: "#0D1117", shadowSoft: "0 10px 30px rgba(0, 0, 0, 0.3)", shadowCard: "0 12px 28px rgba(0, 0, 0, 0.22)" }, "theme-catppuccin-mocha": { bg: "#1E1E2E", bgPanel: "rgba(30, 30, 46, 0.94)", bgPanel2: "#302D41", line: "rgba(203, 166, 247, 0.18)", lineSoft: "rgba(137, 180, 250, 0.16)", text: "#CDD6F4", textDim: "#BAC2DE", accent: "#F38BA8", accentInk: "#1E1E2E", teal: "#94E2D5", paper: "#F4F3F8", paperLine: "#D9E0EC", ink: "#1E1E2E", danger: "#F38BA8", fieldBg: "rgba(205,214,244,0.05)", fieldText: "#CDD6F4", fieldBorder: "rgba(203,166,247,0.22)", ghostBg: "rgba(205,214,244,0.04)", ghostText: "#BAC2DE", ghostBorder: "rgba(203,166,247,0.22)", optionBg: "#F4F3F8", optionText: "#1E1E2E", optionActiveBg: "#F38BA8", optionActiveText: "#1E1E2E", shadowSoft: "0 10px 30px rgba(0, 0, 0, 0.25)", shadowCard: "0 12px 28px rgba(0, 0, 0, 0.2)" }, "theme-github-light": { bg: "#F6F8FA", bgPanel: "rgba(255, 255, 255, 0.96)", bgPanel2: "#FFFFFF", line: "rgba(208, 215, 222, 0.65)", lineSoft: "rgba(208, 215, 222, 0.8)", text: "#24292F", textDim: "#57606A", accent: "#0969DA", accentInk: "#FFFFFF", teal: "#1A7F37", paper: "#FFFFFF", paperLine: "#D0D7DE", ink: "#24292F", danger: "#CF222E", fieldBg: "rgba(36,41,47,0.03)", fieldText: "#24292F", fieldBorder: "rgba(208,215,222,0.9)", ghostBg: "rgba(36,41,47,0.02)", ghostText: "#57606A", ghostBorder: "rgba(208,215,222,0.9)", optionBg: "#FFFFFF", optionText: "#24292F", optionActiveBg: "#0969DA", optionActiveText: "#FFFFFF", shadowSoft: "0 18px 36px rgba(16, 33, 46, 0.12)", shadowCard: "0 12px 24px rgba(16, 33, 46, 0.08)" }, "theme-solarized-light": { bg: "#FDF6E3", bgPanel: "rgba(255, 250, 240, 0.96)", bgPanel2: "#F5E6C5", line: "rgba(147, 161, 161, 0.4)", lineSoft: "rgba(147, 161, 161, 0.3)", text: "#002B36", textDim: "#586E75", accent: "#B58900", accentInk: "#FDF6E3", teal: "#2AA198", paper: "#FFFDF7", paperLine: "#EEE8D5", ink: "#073642", danger: "#DC322F", fieldBg: "rgba(0,43,54,0.04)", fieldText: "#002B36", fieldBorder: "rgba(147,161,161,0.5)", ghostBg: "rgba(0,43,54,0.03)", ghostText: "#586E75", ghostBorder: "rgba(147,161,161,0.5)", optionBg: "#FFFDF7", optionText: "#073642", optionActiveBg: "#B58900", optionActiveText: "#FDF6E3", shadowSoft: "0 18px 36px rgba(7, 54, 66, 0.12)", shadowCard: "0 12px 24px rgba(7, 54, 66, 0.08)" }, "theme-light-plus": { bg: "#F3F3F3", bgPanel: "rgba(255, 255, 255, 0.96)", bgPanel2: "#F7F7F7", line: "rgba(201, 201, 201, 0.7)", lineSoft: "rgba(201, 201, 201, 0.55)", text: "#1F1F1F", textDim: "#5B5B5B", accent: "#2F80ED", accentInk: "#FFFFFF", teal: "#00A39D", paper: "#FFFFFF", paperLine: "#E5E5E5", ink: "#1F1F1F", danger: "#D64545", fieldBg: "rgba(31,31,31,0.04)", fieldText: "#1F1F1F", fieldBorder: "rgba(201,201,201,0.9)", ghostBg: "rgba(31,31,31,0.03)", ghostText: "#5B5B5B", ghostBorder: "rgba(201,201,201,0.9)", optionBg: "#FFFFFF", optionText: "#1F1F1F", optionActiveBg: "#2F80ED", optionActiveText: "#FFFFFF", shadowSoft: "0 18px 36px rgba(31, 31, 31, 0.08)", shadowCard: "0 12px 24px rgba(31, 31, 31, 0.06)" }, "theme-alto-contraste": { bg: "#000000", bgPanel: "rgba(0, 0, 0, 0.98)", bgPanel2: "#111111", line: "rgba(255, 255, 255, 0.46)", lineSoft: "rgba(255, 255, 255, 0.28)", text: "#FFFFFF", textDim: "#E6E6E6", accent: "#FFFF00", accentInk: "#000000", teal: "#00FFFF", paper: "#FFFFFF", paperLine: "#DADADA", ink: "#000000", danger: "#FF0000", fieldBg: "rgba(255,255,255,0.06)", fieldText: "#FFFFFF", fieldBorder: "rgba(255,255,255,0.5)", ghostBg: "rgba(255,255,255,0.04)", ghostText: "#E6E6E6", ghostBorder: "rgba(255,255,255,0.5)", optionBg: "#FFFFFF", optionText: "#000000", optionActiveBg: "#FFFF00", optionActiveText: "#000000", shadowSoft: "0 0 0 2px rgba(255,255,255,0.25)", shadowCard: "0 0 0 2px rgba(255,255,255,0.22)" } };

  var temaSelect = document.getElementById("temaSelect");

  function removerTemaCustomizado() {
    [
      "--bg", "--bg-panel", "--bg-panel-2", "--line", "--line-soft", "--text", "--text-dim", "--accent", "--accent-ink",
      "--teal", "--paper", "--paper-line", "--ink", "--danger", "--field-bg", "--field-text", "--field-border",
      "--ghost-bg", "--ghost-text", "--ghost-border", "--option-bg", "--option-text", "--option-active-bg",
      "--option-active-text", "--shadow-soft", "--shadow-card"
    ].forEach(function (prop) {
      document.documentElement.style.removeProperty(prop);
    });
  }

  function aplicarTemaPersonalizado(chave) {
    var preset = themePresets[chave];
    if (!preset) return;
    Object.keys(preset).forEach(function (key) {
      var cssKey = key.replace(/[A-Z]/g, function (letra) { return "-" + letra.toLowerCase(); });
      document.documentElement.style.setProperty("--" + cssKey, preset[key]);
    });
    document.documentElement.setAttribute("data-theme", "custom");
  }

  function aplicarTemaSelecionado(valor) {
    if (valor === "auto") {
      document.documentElement.removeAttribute("data-theme");
      removerTemaCustomizado();
      btnTema.textContent = "modo: automático";
      salvarTema("");
      return;
    }

    if (valor === "light" || valor === "dark") {
      document.documentElement.setAttribute("data-theme", valor);
      removerTemaCustomizado();
      btnTema.textContent = "modo: " + (valor === "dark" ? "escuro" : "claro");
      salvarTema(valor);
      return;
    }

    aplicarTemaPersonalizado(valor);
    btnTema.textContent = "modo: personalizado";
    salvarTema(valor);
  }

  var temaSalvo = carregarTema();
  if (temaSalvo && themePresets[temaSalvo]) {
    temaSelect.value = temaSalvo;
    aplicarTemaSelecionado(temaSalvo);
  } else if (temaSalvo === "dark" || temaSalvo === "light") {
    temaSelect.value = temaSalvo;
    document.documentElement.setAttribute("data-theme", temaSalvo);
    btnTema.textContent = "modo: " + (temaSalvo === "dark" ? "escuro" : "claro");
  } else {
    temaSelect.value = "auto";
    btnTema.textContent = "modo: automático";
  }

  btnTema.addEventListener("click", function () {
    var atual = document.documentElement.getAttribute("data-theme");
    var temaAtual = temaSelect.value;

    if (temaAtual && themePresets[temaAtual]) {
      aplicarTemaSelecionado(temaAtual);
      return;
    }

    if (atual === "dark") {
      document.documentElement.setAttribute("data-theme", "light");
      temaSelect.value = "light";
      btnTema.textContent = "modo: claro";
      salvarTema("light");
    } else if (atual === "light") {
      document.documentElement.setAttribute("data-theme", "dark");
      temaSelect.value = "dark";
      btnTema.textContent = "modo: escuro";
      salvarTema("dark");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      temaSelect.value = "dark";
      btnTema.textContent = "modo: escuro";
      salvarTema("dark");
    }
  });

  temaSelect.addEventListener("change", function (event) {
    aplicarTemaSelecionado(event.target.value);
  });

  function escapar(s) { return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n"); }
  function escaparHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escaparHtmlDot(s) {
    return escaparHtml(s).replace(/'/g, "&apos;");
  }
  function corPorTipo(tipo) {
    var paleta = ["#BFE7E3", "#C9D9FF", "#FFE0A8", "#F6C4D8", "#D8C7F2", "#B9E3F5", "#D8E8B8"];
    var str = String(tipo || "outro"); var hash = 0;
    for (var i = 0; i < str.length; i++) { hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff; }
    return paleta[Math.abs(hash) % paleta.length];
  }
  function corPorStatus(status) { return status === "manutencao" ? "#D99A22" : status === "offline" ? "#D94B5B" : "#2EAD68"; }
  function marcadorStatus(status) { return status === "manutencao" ? "⚙" : status === "offline" ? "×" : "●"; }

  function renderEquipamentos() {
    elListaEquip.innerHTML = estado.equipamentos.map(function (eq, i) {
      var opcoesEmoji = ICONES.map(function (ic) {
        return '<option value="' + escaparHtml(ic) + '"' + (ic === eq.icone ? " selected" : "") + '>' + (ic || "— sem ícone —") + '</option>';
      }).join("");
      var opcoesImagem = CATALOGO_ICONES.map(function (icone) {
        return '<option value="' + escaparHtml(icone.valor) + '"' + (icone.valor === eq.icone ? " selected" : "") + '>' + escaparHtml(icone.nome) + '</option>';
      }).join("");
      return (
        '<div class="equip-card" data-idx="' + i + '">' +
          '<div class="equip-row1">' +
            '<input type="text" data-field="nome" value="' + escaparHtml(eq.nome) + '" placeholder="Nome do equipamento">' +
            '<select data-field="icone"><optgroup label="Símbolos">' + opcoesImagem + '</optgroup><optgroup label="Emojis">' + opcoesEmoji + '</optgroup></select>' +
            '<span class="equip-status"><i class="equip-status-dot ' + (eq.status || "ativo") + '"></i>' + (eq.status === "manutencao" ? "Manutenção" : eq.status === "offline" ? "Offline" : "Ativo") + '</span>' +
            '<button type="button" class="ghost small equip-advanced-toggle" data-action="toggle-avancado">Modo avançado</button>' +
            '<button type="button" class="ghost small" data-action="remover-equip" title="Remover">×</button>' +
          '</div>' +
          '<div class="equip-advanced" data-advanced-panel>' +
            '<div class="equip-row2">' +
              '<input type="text" data-field="modelo" value="' + escaparHtml(eq.modelo) + '" placeholder="Modelo (fabricante)">' +
              '<input type="text" data-field="tipo" value="' + escaparHtml(eq.tipo) + '" placeholder="Tipo" list="tipos-sugeridos">' +
              '<input type="text" data-field="grupo" value="' + escaparHtml(eq.grupo || "") + '" placeholder="Grupo / rack / sala">' +
            '</div>' +
            '<div class="equip-row3">' +
              '<label class="color-picker">Fonte <input type="color" data-field="corFonte" value="' + (eq.corFonte || "#16323D") + '"></label>' +
              '<label class="color-picker">Status <select data-field="status"><option value="ativo"' + ((eq.status || "ativo") === "ativo" ? " selected" : "") + '>Ativo</option><option value="manutencao"' + (eq.status === "manutencao" ? " selected" : "") + '>Manutenção</option><option value="offline"' + (eq.status === "offline" ? " selected" : "") + '>Offline</option></select></label>' +
              '<label class="upload-label">Imagem/logo (opcional) <input type="file" accept="image/*" data-action="upload-imagem"></label>' +
              (eq.imagem ? '<img class="thumb" src="' + eq.imagem + '" alt=""><button type="button" class="ghost small" data-action="remover-imagem">remover imagem</button>' : '') +
            '</div>' +
            '<div class="equip-id">id: ' + escaparHtml(eq.id) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function renderConexoes() {
    var opcoesEquip = estado.equipamentos.map(function (eq) { return { id: eq.id, nome: eq.nome || eq.id }; });
    elListaConex.innerHTML = estado.conexoes.map(function (c, j) {
      function opcoes(selecionado) {
        return opcoesEquip.map(function (o) {
          return '<option value="' + escaparHtml(o.id) + '"' + (o.id === selecionado ? " selected" : "") + '>' + escaparHtml(o.nome) + '</option>';
        }).join("");
      }
      return (
        '<div class="conex-row" data-idx="' + j + '">' +
          '<select data-field="de">' + opcoes(c.de) + '</select>' +
          '<span class="conex-arrow">→</span>' +
          '<select data-field="para">' + opcoes(c.para) + '</select>' +
          '<input type="text" data-field="tipo" value="' + escaparHtml(c.tipo) + '" placeholder="Tipo de enlace">' +
          '<input type="text" data-field="saida" value="' + escaparHtml(c.saida || "") + '" placeholder="Porta origem">' +
          '<input type="text" data-field="chegada" value="' + escaparHtml(c.chegada || "") + '" placeholder="Porta destino">' +
          '<select data-field="potencia" title="Capacidade do cabo">' +
            ["1G", "10G", "25G", "40G", "100G", "GPON"].map(function (potencia) { return '<option value="' + potencia + '"' + (potencia === (c.potencia || "1G") ? " selected" : "") + '>' + potencia + '</option>'; }).join("") +
          '</select>' +
          '<label class="color-picker">Linha <input type="color" data-field="cor" value="' + (c.cor || "#5A7284") + '"></label>' +
          '<button type="button" class="ghost small" data-action="remover-conex" title="Remover">×</button>' +
        '</div>'
      );
    }).join("");
  }

  function renderSidebarPanels() {
    elNavEquipList.innerHTML = estado.equipamentos.length ? estado.equipamentos.map(function (eq, i) {
      return '<div class="nav-list-item"><span>' + escaparHtml((eq.icone ? eq.icone + " " : "") + (eq.nome || eq.id)) + '</span><button class="ghost small" type="button" data-sidebar-action="remove-equip" data-index="' + i + '">Remover</button></div>';
    }).join("") : '<div class="nav-empty">Nenhum equipamento cadastrado.</div>';

    elNavCableList.innerHTML = estado.conexoes.length ? estado.conexoes.map(function (c, i) {
      var de = estado.equipamentos.find(function (eq) { return eq.id === c.de; });
      var para = estado.equipamentos.find(function (eq) { return eq.id === c.para; });
      var texto = (c.tipo || "Cabeamento") + " · " + (c.potencia || "1G") + " · " + (de ? de.nome : c.de) + (c.saida ? " [" + c.saida + "]" : "") + " → " + (para ? para.nome : c.para) + (c.chegada ? " [" + c.chegada + "]" : "");
      return '<div class="nav-list-item"><span title="' + escaparHtml(texto) + '">' + escaparHtml(texto) + '</span><button class="ghost small" type="button" title="Excluir cabeamento" aria-label="Excluir cabeamento" data-sidebar-action="remove-cable" data-index="' + i + '">×</button></div>';
    }).join("") : '<div class="nav-empty">Nenhum cabeamento cadastrado.</div>';

    var options = estado.equipamentos.map(function (eq) {
      return '<option value="' + escaparHtml(eq.id) + '">' + escaparHtml(eq.nome || eq.id) + '</option>';
    }).join("");
    var de = document.getElementById("navCableDe");
    var para = document.getElementById("navCablePara");
    var deAtual = de.value;
    var paraAtual = para.value;
    de.innerHTML = options;
    para.innerHTML = options;
    if (estado.equipamentos.some(function (eq) { return eq.id === deAtual; })) de.value = deAtual;
    if (estado.equipamentos.some(function (eq) { return eq.id === paraAtual; })) para.value = paraAtual;
    if (estado.equipamentos.length > 1 && de.value === para.value) para.value = estado.equipamentos[1].id;
  }

  function solicitarAtualizacaoDiagrama() {
    window.clearTimeout(atualizacaoDiagramaPendente);
    atualizacaoDiagramaPendente = window.setTimeout(function () {
      if (estado.equipamentos.length) gerar(); else limparDiagrama();
    }, 120);
  }

  function renderTudo() { renderEquipamentos(); renderConexoes(); renderSidebarPanels(); atualizarJsonAvancado(); salvarLocal(); solicitarAtualizacaoDiagrama(); }

  function atualizarJsonAvancado() {
    elJsonAvancado.value = JSON.stringify(estado, null, 2);
  }

  elListaEquip.addEventListener("input", function (e) {
    var campo = e.target.getAttribute("data-field");
    if (!campo) return;
    var card = e.target.closest(".equip-card");
    var idx = parseInt(card.getAttribute("data-idx"), 10);
    estado.equipamentos[idx][campo] = e.target.value;
    if (campo === "nome") renderConexoes();
    salvarLocal();
    atualizarJsonAvancado();
    solicitarAtualizacaoDiagrama();
  });

  elListaEquip.addEventListener("change", function (e) {
    if (e.target.getAttribute("data-action") === "upload-imagem") {
      var card = e.target.closest(".equip-card");
      var idx = parseInt(card.getAttribute("data-idx"), 10);
      var arquivo = e.target.files && e.target.files[0];
      if (!arquivo) return;
      var leitor = new FileReader();
      leitor.onload = function () {
        estado.equipamentos[idx].imagem = leitor.result;
        renderEquipamentos();
        atualizarJsonAvancado();
        salvarLocal();
        solicitarAtualizacaoDiagrama();
      };
      leitor.readAsDataURL(arquivo);
      return;
    }
    var campo = e.target.getAttribute("data-field");
    if (!campo) return;
    var card = e.target.closest(".equip-card");
    var idx = parseInt(card.getAttribute("data-idx"), 10);
    estado.equipamentos[idx][campo] = e.target.value;
    renderEquipamentos();
    salvarLocal();
    atualizarJsonAvancado();
    solicitarAtualizacaoDiagrama();
  });

  elListaEquip.addEventListener("click", function (e) {
    var acao = e.target.getAttribute("data-action");
    if (!acao) return;
    var card = e.target.closest(".equip-card");
    if (acao === "toggle-avancado") {
      var painelAvancado = card.querySelector("[data-advanced-panel]");
      var aberto = painelAvancado.classList.toggle("open");
      e.target.textContent = aberto ? "Fechar avançado" : "Modo avançado";
      return;
    }
    var idx = parseInt(card.getAttribute("data-idx"), 10);
    if (acao === "remover-equip") {
      var idRemovido = estado.equipamentos[idx].id;
      estado.equipamentos.splice(idx, 1);
      estado.conexoes = estado.conexoes.filter(function (c) { return c.de !== idRemovido && c.para !== idRemovido; });
      renderTudo();
    } else if (acao === "remover-imagem") {
      estado.equipamentos[idx].imagem = "";
      renderEquipamentos();
      atualizarJsonAvancado();
      salvarLocal();
    }
  });

  document.getElementById("btnAddEquip").addEventListener("click", function () {
    abrirFormularioEquipamento();
  });

  function abrirFormularioEquipamento() {
    elFormEquip.classList.remove("hidden");
    elFormCab.classList.add("hidden");
    setTimeout(function () {
      var input = document.getElementById("novoEquipNome");
      if (input) input.focus();
    }, 20);
  }

  function fecharFormularioEquipamento() {
    elFormEquip.classList.add("hidden");
    document.getElementById("novoEquipNome").value = "";
    document.getElementById("novoEquipTipo").value = "";
    document.getElementById("novoEquipModelo").value = "";
    document.getElementById("novoEquipCor").value = "#16323D";
  }

  function abrirFormularioCabemamento() {
    elFormCab.classList.remove("hidden");
    elFormEquip.classList.add("hidden");
    var de = document.getElementById("novoCabDe");
    var para = document.getElementById("novoCabPara");
    var options = estado.equipamentos.map(function (eq) { return '<option value="' + eq.id + '">' + (eq.nome || eq.id) + '</option>'; }).join("");
    de.innerHTML = options;
    para.innerHTML = options;
    if (estado.equipamentos.length > 1) {
      de.value = estado.equipamentos[0].id;
      para.value = estado.equipamentos[1].id;
    }
    setTimeout(function () { var input = document.getElementById("novoCabNome"); if (input) input.focus(); }, 20);
  }

  function fecharFormularioCabemamento() {
    elFormCab.classList.add("hidden");
    document.getElementById("novoCabNome").value = "";
    document.getElementById("novoCabCor").value = "#5A7284";
    document.getElementById("novoCabGrossura").value = "2";
    document.getElementById("novoCabSaida").value = "";
    document.getElementById("novoCabChegada").value = "";
    document.getElementById("novoCabPotencia").value = "1G";
    document.getElementById("novoCabEstilo").value = "solid";
  }

  function fecharPaineisLaterais() {
    document.querySelectorAll(".nav-panel.open").forEach(function (panel) { panel.classList.remove("open"); });
    document.querySelectorAll(".nav-item[data-nav-panel].active").forEach(function (item) { item.classList.remove("active"); });
  }

  document.querySelectorAll(".nav-item[data-nav-panel]").forEach(function (item) {
    item.addEventListener("click", function () {
      var panel = document.getElementById(item.getAttribute("data-nav-panel"));
      var estavaAberto = panel.classList.contains("open");
      fecharPaineisLaterais();
      if (!estavaAberto) {
        panel.classList.add("open");
        item.classList.add("active");
        if (panel.id === "navAddCable") renderSidebarPanels();
      }
    });
  });

  document.querySelectorAll("[data-nav-close]").forEach(function (button) {
    button.addEventListener("click", fecharPaineisLaterais);
  });

  document.getElementById("navEquipForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var nome = document.getElementById("navEquipNome").value.trim();
    if (!nome) return;
    var arquivo = document.getElementById("navEquipImagem").files[0];
    var tipo = document.getElementById("navEquipTipo").value.trim();
    var iconeInformado = document.getElementById("navEquipIcone").value.trim();
    var novoEquipamento = { id: novoId(), nome: nome, modelo: document.getElementById("navEquipModelo").value.trim(), tipo: tipo, icone: iconeInformado || iconePorTipo(tipo), imagem: "", corFonte: "#16323D" };
    function concluir(imagem) {
      novoEquipamento.imagem = imagem || "";
      estado.equipamentos.push(novoEquipamento);
      renderTudo();
      renderSidebarPanels();
      event.target.reset();
      fecharPaineisLaterais();
      esconderErro();
    }
    if (!arquivo) { concluir(""); return; }
    var leitor = new FileReader();
    leitor.onload = function () { concluir(leitor.result); };
    leitor.readAsDataURL(arquivo);
  });

  document.getElementById("navCableForm").addEventListener("submit", function (event) {
    event.preventDefault();
    var de = document.getElementById("navCableDe").value;
    var para = document.getElementById("navCablePara").value;
    var mensagem = document.getElementById("navCableMessage");
    if (!de || !para) { mensagem.textContent = "Cadastre dois equipamentos primeiro."; return; }
    if (de === para) { mensagem.textContent = "Origem e destino precisam ser diferentes."; return; }
    estado.conexoes.push({
      de: de, para: para, tipo: document.getElementById("navCableTipo").value.trim(),
      cor: document.getElementById("navCableCor").value, grossura: Number(document.getElementById("navCableGrossura").value || 2),
      estilo: document.getElementById("navCableEstilo").value, saida: document.getElementById("navCableSaida").value.trim(), chegada: document.getElementById("navCableChegada").value.trim(), potencia: document.getElementById("navCablePotencia").value
    });
    renderTudo();
    event.target.reset();
    document.getElementById("navCableCor").value = "#5A7284";
    document.getElementById("navCableGrossura").value = "2";
    mensagem.textContent = "";
    fecharPaineisLaterais();
    esconderErro();
  });

  document.addEventListener("click", function (event) {
    var action = event.target.getAttribute("data-sidebar-action");
    if (action === "remove-equip") {
      var equipIndex = Number(event.target.getAttribute("data-index"));
      var idRemovido = estado.equipamentos[equipIndex].id;
      estado.equipamentos.splice(equipIndex, 1);
      estado.conexoes = estado.conexoes.filter(function (c) { return c.de !== idRemovido && c.para !== idRemovido; });
      renderTudo();
    }
    if (action === "remove-cable") {
      estado.conexoes.splice(Number(event.target.getAttribute("data-index")), 1);
      renderTudo();
    }
    var navAction = event.target.getAttribute("data-nav-action");
    if (navAction === "generate-diagram") btnGerar.click();
    if (navAction === "export-diagram") btnBaixar.click();
  });

  document.addEventListener("click", function (event) {
    var action = event.target.getAttribute("data-action");
    if (!action) return;

    if (action === "cancelar-equip" || action === "fechar-form-equip") {
      fecharFormularioEquipamento();
    }

    if (action === "cancelar-cab" || action === "fechar-form-cab") {
      fecharFormularioCabemamento();
    }

    if (action === "salvar-equip") {
      var nome = document.getElementById("novoEquipNome").value.trim();
      var tipo = document.getElementById("novoEquipTipo").value.trim();
      var modelo = document.getElementById("novoEquipModelo").value.trim();
      var cor = document.getElementById("novoEquipCor").value || "#16323D";
      if (!nome) {
        mostrarErro("Informe o nome do equipamento.");
        return;
      }
      estado.equipamentos.push({ id: novoId(), nome: nome, modelo: modelo, tipo: tipo, icone: iconePorTipo(tipo), imagem: "", corFonte: cor });
      renderTudo();
      fecharFormularioEquipamento();
      esconderErro();
    }

    if (action === "salvar-cab") {
      var cabNome = document.getElementById("novoCabNome").value.trim();
      var de = document.getElementById("novoCabDe").value;
      var para = document.getElementById("novoCabPara").value;
      var cor = document.getElementById("novoCabCor").value || "#5A7284";
      var grossura = Number(document.getElementById("novoCabGrossura").value || 2);
      if (!de || !para || !cabNome) {
        mostrarErro("Informe nome, origem e destino do cabeamento.");
        return;
      }
      if (de === para) {
        mostrarErro("Origem e destino do cabeamento precisam ser diferentes.");
        return;
      }
      estado.conexoes.push({
        de: de, para: para, tipo: cabNome, cor: cor, grossura: grossura,
        saida: document.getElementById("novoCabSaida").value.trim(),
        chegada: document.getElementById("novoCabChegada").value.trim(),
        potencia: document.getElementById("novoCabPotencia").value,
        estilo: document.getElementById("novoCabEstilo").value
      });
      renderTudo();
      fecharFormularioCabemamento();
      esconderErro();
    }
  });

  elListaConex.addEventListener("input", function (e) {
    var campo = e.target.getAttribute("data-field");
    if (!campo) return;
    var row = e.target.closest(".conex-row");
    var idx = parseInt(row.getAttribute("data-idx"), 10);
    estado.conexoes[idx][campo] = e.target.value;
    salvarLocal();
    atualizarJsonAvancado();
    solicitarAtualizacaoDiagrama();
  });

  elListaConex.addEventListener("click", function (e) {
    if (e.target.getAttribute("data-action") === "remover-conex") {
      var row = e.target.closest(".conex-row");
      var idx = parseInt(row.getAttribute("data-idx"), 10);
      estado.conexoes.splice(idx, 1);
      renderTudo();
    }
  });

  document.getElementById("btnAddConex").addEventListener("click", function () {
    if (estado.equipamentos.length < 2) {
      mostrarErro("Adicione ao menos dois equipamentos antes de criar uma conexão.");
      return;
    }
    abrirFormularioCabemamento();
  });

  document.getElementById("arquivoCsv").addEventListener("change", function (event) {
    var arquivo = event.target.files && event.target.files[0];
    if (!arquivo) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        estado = importarCsv(leitor.result);
        renderTudo();
        esconderErro();
      } catch (erroCsv) { mostrarErro("Não foi possível importar o CSV.\nDetalhe: " + erroCsv.message); }
      event.target.value = "";
    };
    leitor.readAsText(arquivo, "UTF-8");
  });

  document.getElementById("btnAplicarJson").addEventListener("click", function () {
    try {
      var novo = JSON.parse(elJsonAvancado.value);
      validarDados(novo);
      novo.equipamentos.forEach(function (eq) { if (!eq.icone) eq.icone = ""; if (!eq.imagem) eq.imagem = ""; });
      estado = novo;
      renderEquipamentos(); renderConexoes(); salvarLocal();
      esconderErro();
    } catch (e) { mostrarErro("Não foi possível aplicar o JSON.\nDetalhe: " + e.message); }
  });
  document.getElementById("btnAtualizarJson").addEventListener("click", atualizarJsonAvancado);

  function esconderErro() { elErro.style.display = "none"; elErro.textContent = ""; }
  function mostrarErro(msg) { elErro.style.display = "block"; elErro.textContent = msg; }

  function validarDados(dados) {
    if (!dados || typeof dados !== "object") throw new Error('O JSON precisa ser um objeto com "equipamentos" e "conexoes".');
    if (!Array.isArray(dados.equipamentos) || dados.equipamentos.length === 0) throw new Error('Inclua ao menos um item em "equipamentos".');
    if (!Array.isArray(dados.conexoes)) throw new Error('Inclua a chave "conexoes" como lista (pode ser vazia: []).');
    var ids = {};
    dados.equipamentos.forEach(function (eq, i) {
      if (!eq.id) throw new Error('O equipamento na posição ' + i + ' está sem "id".');
      if (ids[eq.id]) throw new Error('O id "' + eq.id + '" está duplicado.');
      ids[eq.id] = true;
    });
    dados.conexoes.forEach(function (c, i) {
      if (!c.de || !c.para) throw new Error('A conexão na posição ' + i + ' precisa de "de" e "para".');
      if (!ids[c.de] || !ids[c.para]) throw new Error('A conexão na posição ' + i + ' referencia um id inexistente.');
    });
  }

  function gerarDot(dados, direcao) {
    var contagemPortas = {};
    dados.equipamentos.forEach(function (eq) { contagemPortas[eq.id] = 0; });
    dados.conexoes.forEach(function (c) {
      if (contagemPortas[c.de] != null) contagemPortas[c.de]++;
      if (contagemPortas[c.para] != null) contagemPortas[c.para]++;
    });
    var maiorQtdPortas = Math.max.apply(null, [1].concat(Object.keys(contagemPortas).map(function (id) { return contagemPortas[id]; })));
    var ranksepAuto = Math.max(1.15, Math.min(4.5, 0.95 + maiorQtdPortas * 0.16));
    var linhas = ["digraph G {", '  rankdir=' + direcao + ';', '  splines=ortho;', '  concentrate=false;', '  overlap=false;', '  nodesep=0.45;', '  ranksep=' + ranksepAuto.toFixed(2) + ';', '  pad=0;', '  margin=0;', '  bgcolor="transparent";',
      '  node [shape=box, style="filled", fontname="Helvetica", fontsize=10, margin="0.02,0.02", color="#547184", penwidth=1.1];',
      '  edge [fontname="Helvetica", fontsize=8, color="#263746", fontcolor="#344D61", penwidth=1.5, arrowhead=none, labeldistance=1.25, labelangle=0, labelfontname="Helvetica", labelfontsize=8];'];
    var portasPorEquipamento = {};
    dados.equipamentos.forEach(function (eq) { portasPorEquipamento[eq.id] = { entrada: [], saida: [] }; });
    dados.conexoes.forEach(function (c, indice) {
      if (portasPorEquipamento[c.de]) portasPorEquipamento[c.de].saida.push({ id: "out_" + indice, nome: c.saida || "P1" });
      if (portasPorEquipamento[c.para]) portasPorEquipamento[c.para].entrada.push({ id: "in_" + indice, nome: c.chegada || "P2" });
    });

    var CONFIG_PORTA = { largura: 52, alturaMaxima: 24, alturaMinima: 14, fonteMaxima: 10, fonteMinima: 7, paddingMaximo: 3, paddingMinimo: 1, fundo: "#FFFFFF", borda: "#202020", texto: "#111111", maxCaracteres: 11 };
    var ALTURA_BASE_EQUIPAMENTO = 92;

    function calcularFontePorta(altura) {
      if (altura >= 24) return 10;
      if (altura >= 20) return 9;
      return Math.max(CONFIG_PORTA.fonteMinima, 8);
    }

    function calcularPaddingPorta(altura) {
      if (altura >= 24) return CONFIG_PORTA.paddingMaximo;
      if (altura >= 20) return 2;
      return CONFIG_PORTA.paddingMinimo;
    }

    function calcularLayoutPortas(totalPortas) {
      totalPortas = Math.max(Number(totalPortas) || 1, 1);
      var alturaIdeal = ALTURA_BASE_EQUIPAMENTO / totalPortas;
      var alturaPorta = Math.max(CONFIG_PORTA.alturaMinima, Math.min(CONFIG_PORTA.alturaMaxima, alturaIdeal));
      var alturaEquipamento = Math.max(ALTURA_BASE_EQUIPAMENTO, totalPortas * alturaPorta);
      return { alturaPorta: Math.round(alturaPorta), alturaEquipamento: Math.ceil(alturaEquipamento), fonte: calcularFontePorta(alturaPorta), padding: calcularPaddingPorta(alturaPorta) };
    }

    function limitarNomePorta(nome) {
      nome = String(nome || "PORTA").trim();
      if (nome.length > CONFIG_PORTA.maxCaracteres) return nome.substring(0, CONFIG_PORTA.maxCaracteres - 1) + "…";
      return nome;
    }

    function celulaPorta(porta, lado) {
      var layout = arguments[2] || calcularLayoutPortas(1);
      var nome = escaparHtmlDot(limitarNomePorta(porta.nome));
      return '<TD PORT="' + porta.id + '" BORDER="1" COLOR="' + CONFIG_PORTA.borda + '" BGCOLOR="' + CONFIG_PORTA.fundo + '" WIDTH="' + CONFIG_PORTA.largura + '" HEIGHT="' + layout.alturaPorta + '" FIXEDSIZE="TRUE" CELLPADDING="' + layout.padding + '" ALIGN="CENTER" VALIGN="MIDDLE"><FONT FACE="Helvetica" POINT-SIZE="' + layout.fonte + '" COLOR="' + CONFIG_PORTA.texto + '">' + nome + '</FONT></TD>';
    }

    function linhaEquipamento(eq) {
      var prefixo = eq.icone ? eq.icone + " " : "";
      var status = eq.status || "ativo";
      var corStatus = corPorStatus(status);
      var corFonte = eq.corFonte || "#16323D";
      var nome = escaparHtmlDot(eq.nome || eq.id);
      var modelo = escaparHtmlDot(eq.modelo || "");
      var tipo = escaparHtmlDot(eq.tipo || "Equipamento");
      var corCabecalho = corPorTipo(eq.tipo);
      var portas = portasPorEquipamento[eq.id] || { entrada: [], saida: [] };
      var totalPortas = Math.max(portas.entrada.length, portas.saida.length, 1);
      var layoutPortas = calcularLayoutPortas(totalPortas);
      var linhasPortas = "";
      for (var portaIndice = 0; portaIndice < totalPortas; portaIndice++) {
        var entrada = portas.entrada[portaIndice];
        var saida = portas.saida[portaIndice];
        linhasPortas += '<TR>' +
          (entrada ? celulaPorta(entrada, "entrada", layoutPortas) : '<TD BORDER="0" WIDTH="' + CONFIG_PORTA.largura + '" HEIGHT="' + layoutPortas.alturaPorta + '" FIXEDSIZE="TRUE"></TD>') +
          (portaIndice === 0 ? '<TD BORDER="0" CELLPADDING="0" WIDTH="120" HEIGHT="' + layoutPortas.alturaEquipamento + '" ROWSPAN="' + totalPortas + '" ALIGN="CENTER" VALIGN="MIDDLE"></TD>' : '') +
          (saida ? celulaPorta(saida, "saida", layoutPortas) : '<TD BORDER="0" WIDTH="' + CONFIG_PORTA.largura + '" HEIGHT="' + layoutPortas.alturaPorta + '" FIXEDSIZE="TRUE"></TD>') +
          '</TR>';
      }
      var rotulo = '<<TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0" CELLPADDING="0">' +
        '<TR><TD COLSPAN="3" CELLPADDING="3" ALIGN="CENTER"><FONT FACE="Helvetica" POINT-SIZE="11" COLOR="#14212B"><B>' + nome + '</B></FONT><BR/>' +
        (modelo ? '<FONT FACE="Helvetica" POINT-SIZE="9" COLOR="#14212B">' + modelo + '</FONT><BR/>' : "") +
        '<FONT FACE="Helvetica" POINT-SIZE="8" COLOR="#405363">' + tipo + '</FONT></TD></TR>' +
        linhasPortas +
        '<TR><TD COLSPAN="3" CELLPADDING="4" ALIGN="CENTER"><FONT FACE="Helvetica" POINT-SIZE="9" COLOR="' + corStatus + '"><B>' + escaparHtmlDot(marcadorStatus(status) + " " + status.toUpperCase()) + '</B></FONT></TD></TR>' +
        '</TABLE>>';
      return '    "' + escapar(eq.id) + '" [label=' + rotulo + ', shape=plain, color="transparent", fontcolor="' + corFonte + '"];';
    }
    var grupos = {};
    dados.equipamentos.forEach(function (eq) {
      var grupo = String(eq.grupo || "").trim();
      if (!grupo) { linhas.push(linhaEquipamento(eq).replace(/^    /, "  ")); return; }
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(eq);
    });
    Object.keys(grupos).forEach(function (grupo) {
      var grupoId = grupo.replace(/[^a-zA-Z0-9_]/g, "_");
      linhas.push('  subgraph "cluster_' + grupoId + '" {');
      linhas.push('    label="' + escapar(grupo) + '";');
      linhas.push('    color="#6C8292"; style="rounded,dashed"; penwidth=1.0; fontname="Helvetica"; fontsize=9;');
      grupos[grupo].forEach(function (eq) { linhas.push(linhaEquipamento(eq)); });
      linhas.push("  }");
    });
    dados.conexoes.forEach(function (c, indice) {
      var corConexao = c.cor || "#5A7284";
      var grossura = c.grossura || 2;
      var estilo = c.estilo && c.estilo !== "solid" ? ', style="' + escapar(c.estilo) + '"' : "";
      var portaDirecao = direcao === "TB" ? ', tailport="n", headport="s"' : ', tailport="e", headport="w"';
      var portas = ', tailport="out_' + indice + '", headport="in_' + indice + '"';
      if (direcao === "TB") portas = portaDirecao;
      if (direcao !== "TB") portas = portaDirecao;
      var capacidade = c.potencia ? " · " + c.potencia : "";
      var rotuloTexto = c.tipo ? c.tipo + capacidade : capacidade.replace(/^ · /, "");
      var rotulo = ' [id="edge_' + indice + '", label="' + escapar(rotuloTexto) + '", color="' + corConexao + '", fontcolor="#34495A", penwidth=' + Math.max(1, grossura) + estilo + portas + ']';
      linhas.push('  "' + escapar(c.de) + '" -> "' + escapar(c.para) + '"' + rotulo + ';');
    });
    linhas.push("}");
    return linhas.join("\n");
  }

  function atualizarLegenda(dados) {
    var tipos = {};
    dados.equipamentos.forEach(function (eq) { tipos[eq.tipo || "outro"] = true; });
    elLegenda.innerHTML = "";
    Object.keys(tipos).forEach(function (tipo) {
      var span = document.createElement("span");
      var i = document.createElement("i"); i.style.background = corPorTipo(tipo);
      span.appendChild(i); span.appendChild(document.createTextNode(tipo));
      elLegenda.appendChild(span);
    });
  }

  function aplicarImagensNoSvg(dados) {
    var svgEl = elCanvas.querySelector("svg");
    if (!svgEl) return;

    var porId = {};
    dados.equipamentos.forEach(function (eq) {
      var imagem = eq.imagem || imagemDoIcone(eq.icone);
      if (imagem) porId[eq.id] = imagem;
    });

    function bboxSeguro(elemento) {
      try { return elemento && elemento.getBBox ? elemento.getBBox() : null; }
      catch (e) { return null; }
    }

    function normalizarTexto(valor) {
      return String(valor || "").replace(/\s+/g, " ").trim();
    }

    svgEl.querySelectorAll("g.node").forEach(function (g) {
      var titulo = g.querySelector("title");
      if (!titulo) return;

      var id = titulo.textContent;
      var origemImagem = porId[id];
      if (!origemImagem) return;

      var equipamento = dados.equipamentos.find(function (eq) { return eq.id === id; });
      if (!equipamento) return;

      try {
        g.querySelectorAll("image[data-equip-img='1']").forEach(function (imagemAntiga) {
          imagemAntiga.remove();
        });

        var bboxNode = g.getBBox();
        var textos = Array.prototype.slice.call(g.querySelectorAll("text"));
        var nomeEsperado = normalizarTexto(equipamento.nome || equipamento.id);
        var modeloEsperado = normalizarTexto(equipamento.modelo || "");
        var tipoEsperado = normalizarTexto(equipamento.tipo || "Equipamento");
        var statusEsperado = normalizarTexto((marcadorStatus(equipamento.status || "ativo") + " " + (equipamento.status || "ativo").toUpperCase()));

        var cabecalho = textos.filter(function (texto) {
          var valor = normalizarTexto(texto.textContent);
          return valor === nomeEsperado || (modeloEsperado && valor === modeloEsperado) || valor === tipoEsperado;
        });
        var statusTexto = textos.find(function (texto) {
          return normalizarTexto(texto.textContent) === statusEsperado;
        });

        var fundoCabecalho = bboxNode.y + Math.min(36, bboxNode.height * 0.28);
        cabecalho.forEach(function (texto) {
          var box = bboxSeguro(texto);
          if (box) fundoCabecalho = Math.max(fundoCabecalho, box.y + box.height);
        });

        var topoStatus = bboxNode.y + bboxNode.height - Math.min(22, bboxNode.height * 0.18);
        var boxStatus = bboxSeguro(statusTexto);
        if (boxStatus) topoStatus = boxStatus.y;

        var areaTopo = fundoCabecalho + 5;
        var areaBaixo = topoStatus - 5;
        var areaAltura = Math.max(16, areaBaixo - areaTopo);

        var ehCatalogo = !!imagemDoIcone(equipamento.icone);
        var tamanhoDesejado = ehCatalogo ? 84 : 48;
        var tam = Math.max(12, Math.min(tamanhoDesejado, areaAltura - 4, 108));

        var centroX = bboxNode.x + bboxNode.width / 2;
        var x = centroX - tam / 2;
        var y = areaTopo + (areaAltura - tam) / 2;

        var urlImagem = resolverUrlRelativa(origemImagem);
        var img = document.createElementNS("http://www.w3.org/2000/svg", "image");
        img.setAttribute("data-equip-img", "1");
        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", urlImagem);
        img.setAttribute("href", urlImagem);
        img.setAttribute("x", x);
        img.setAttribute("y", y);
        img.setAttribute("width", tam);
        img.setAttribute("height", tam);
        img.setAttribute("preserveAspectRatio", "xMidYMid meet");
        img.setAttribute("pointer-events", "none");

        var clipId = "clip-" + id.replace(/[^a-zA-Z0-9]/g, "") + "-equip";
        var defs = svgEl.querySelector("defs");
        if (!defs) {
          defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
          svgEl.insertBefore(defs, svgEl.firstChild);
        }
        var clipAntigo = defs.querySelector("#" + clipId);
        if (clipAntigo) clipAntigo.remove();

        var clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clip.setAttribute("id", clipId);
        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", tam);
        rect.setAttribute("height", tam);
        rect.setAttribute("rx", 3);
        clip.appendChild(rect);
        defs.appendChild(clip);
        img.setAttribute("clip-path", "url(#" + clipId + ")");

        var primeiroTexto = g.querySelector("text");
        if (primeiroTexto) g.insertBefore(img, primeiroTexto);
        else g.appendChild(img);
      } catch (err) {}
    });
  }

  function obterDirecaoConexaoPorPosicao(conexao) {
    var origem = estado.equipamentos.find(function (eq) { return eq.id === conexao.de; });
    var destino = estado.equipamentos.find(function (eq) { return eq.id === conexao.para; });
    if (!origem || !destino) return (selDirecao && selDirecao.value) || "LR";

    var posA = origem.deslocamento || { x: 0, y: 0 };
    var posB = destino.deslocamento || { x: 0, y: 0 };
    var diferencaX = posB.x - posA.x;
    var diferencaY = posB.y - posA.y;

    if (Math.abs(diferencaX) > Math.abs(diferencaY)) return "LR";
    if (Math.abs(diferencaY) > Math.abs(diferencaX)) return "TB";
    return (selDirecao && selDirecao.value) || "LR";
  }

  function organizarDiagramaAutomaticamente(opcoes) {
    if (!estado.equipamentos.length) return;

    var config = Object.assign({ passoX: 260, passoY: 180, folga: 70 }, opcoes || {});

    var vizinhos = {};
    var fila = [];
    var camadas = {};
    var profundidade = {};

    estado.equipamentos.forEach(function (eq) {
      vizinhos[eq.id] = [];
      profundidade[eq.id] = Number.MAX_SAFE_INTEGER;
    });

    estado.conexoes.forEach(function (conexao) {
      if (vizinhos[conexao.de]) vizinhos[conexao.de].push(conexao.para);
      if (vizinhos[conexao.para]) vizinhos[conexao.para].push(conexao.de);
    });

    var raiz = estado.equipamentos[0].id;
    profundidade[raiz] = 0;
    fila.push(raiz);
    while (fila.length) {
      var atual = fila.shift();
      var camadaAtual = profundidade[atual] || 0;
      if (!camadas[camadaAtual]) camadas[camadaAtual] = [];
      camadas[camadaAtual].push(atual);

      (vizinhos[atual] || []).forEach(function (vizinho) {
        if (profundidade[vizinho] === undefined || profundidade[vizinho] > camadaAtual + 1) {
          profundidade[vizinho] = camadaAtual + 1;
          fila.push(vizinho);
        }
      });
    }

    var posicoes = {};
    Object.keys(camadas).forEach(function (chaveCamada) {
      var camada = camadas[chaveCamada].slice().sort(function (a, b) {
        var grauA = (vizinhos[a] || []).length;
        var grauB = (vizinhos[b] || []).length;
        return grauB - grauA || String(a).localeCompare(String(b));
      });

      camada.forEach(function (id, indice) {
        posicoes[id] = {
          x: Number(chaveCamada) * config.passoX,
          y: (indice - (camada.length - 1) / 2) * config.passoY
        };
      });
    });

    estado.equipamentos.forEach(function (eq) {
      if (!eq.deslocamento || !Number.isFinite(eq.deslocamento.x) || !Number.isFinite(eq.deslocamento.y)) {
        eq.deslocamento = { x: 0, y: 0 };
      }
      var base = posicoes[eq.id] || { x: 0, y: 0 };
      var manual = eq.deslocamento || { x: 0, y: 0 };
      var x = base.x + manual.x * 0.25;
      var y = base.y + manual.y * 0.25;
      posicoes[eq.id] = { x: x, y: y };
    });

    var chaves = Object.keys(posicoes);
    for (var iteracao = 0; iteracao < 8; iteracao++) {
      for (var i = 0; i < chaves.length; i++) {
        for (var j = i + 1; j < chaves.length; j++) {
          var a = chaves[i];
          var b = chaves[j];
          var pa = posicoes[a];
          var pb = posicoes[b];
          var dx = pb.x - pa.x;
          var dy = pb.y - pa.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < config.folga) {
            var ajuste = (config.folga - dist) / 2;
            var ex = dx / dist;
            var ey = dy / dist;
            pa.x -= ex * ajuste;
            pa.y -= ey * ajuste;
            pb.x += ex * ajuste;
            pb.y += ey * ajuste;
          }
        }
      }
    }

    estado.equipamentos.forEach(function (eq) {
      var pos = posicoes[eq.id] || { x: 0, y: 0 };
      eq.deslocamento = { x: Number(pos.x), y: Number(pos.y) };
    });

    renderTudo();
    if (estado.equipamentos.length) gerar();
  }

  window.organizarDiagramaAutomaticamente = organizarDiagramaAutomaticamente;
  window.obterDirecaoConexaoPorPosicao = obterDirecaoConexaoPorPosicao;

  function gerar() {
    window.clearTimeout(atualizacaoDiagramaPendente);
    esconderErro();
    try { validarDados(estado); } catch (e) { mostrarErro(e.message); return; }

    var dot = gerarDot(estado, selDirecao.value);
    ultimoDot = dot;
    elDotCode.textContent = dot;

    try {
      var svg = Viz(dot, "svg");
      elCanvas.classList.remove("vazio");
      elCanvas.innerHTML = svg;
      aplicarCanvasView();
      aplicarPosicoesEquipamentos();
      rotearCabosOrtogonalmente();
      ativarArrasteDosEquipamentos();
      aplicarImagensNoSvg(estado);
      atualizarLegenda(estado);
      btnCopiar.disabled = false;
      btnBaixar.disabled = false;
      btnBaixarPng.disabled = false;
      salvarLocal();
    } catch (e) {
      mostrarErro("Não foi possível desenhar o diagrama.\nDetalhe: " + e.message);
    }
  }

  window.gerar = gerar;

  btnGerar.addEventListener("click", gerar);
  btnOrganizar.addEventListener("click", function () { organizarDiagramaAutomaticamente(); });

  btnCopiar.addEventListener("click", function () {
    if (!ultimoDot) return;
    try {
      navigator.clipboard.writeText(ultimoDot);
      var original = btnCopiar.textContent;
      btnCopiar.textContent = "Copiado!";
      setTimeout(function () { btnCopiar.textContent = original; }, 1400);
    } catch (e) {}
  });

  function blobParaDataUrl(blob) {
    return new Promise(function (resolver, rejeitar) {
      var leitor = new FileReader();
      leitor.onload = function () { resolver(leitor.result); };
      leitor.onerror = rejeitar;
      leitor.readAsDataURL(blob);
    });
  }

  async function fonteImagemComoDataUrl(origem, imagemViva) {
    if (!origem) return "";
    if (/^data:/i.test(origem)) return origem;

    var absoluta;
    try { absoluta = new URL(origem, document.baseURI).href; }
    catch (e) { absoluta = origem; }

    try {
      var resposta = await fetch(absoluta, { cache: "force-cache" });
      if (!resposta.ok && resposta.status !== 0) throw new Error("HTTP " + resposta.status);
      return await blobParaDataUrl(await resposta.blob());
    } catch (erroFetch) {}

    if (imagemViva) {
      try {
        var bbox = imagemViva.getBBox();
        var largura = Math.max(1, Math.ceil(bbox.width || Number(imagemViva.getAttribute("width")) || 1));
        var altura = Math.max(1, Math.ceil(bbox.height || Number(imagemViva.getAttribute("height")) || 1));
        var canvasTmp = document.createElement("canvas");
        canvasTmp.width = largura * 2;
        canvasTmp.height = altura * 2;
        var ctxTmp = canvasTmp.getContext("2d");
        ctxTmp.drawImage(imagemViva, 0, 0, canvasTmp.width, canvasTmp.height);
        return canvasTmp.toDataURL("image/png");
      } catch (erroCanvas) {}
    }

    return absoluta;
  }

  async function prepararSvgParaExportacao(svgEl, removerImagens) {
    var copia = svgEl.cloneNode(true);
    copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copia.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    copia.style.transform = "none";
    copia.style.transformOrigin = "";

    var imagensVivas = Array.prototype.slice.call(svgEl.querySelectorAll("image"));
    var imagensCopia = Array.prototype.slice.call(copia.querySelectorAll("image"));

    await Promise.all(imagensCopia.map(async function (imagem, indice) {
      if (removerImagens) {
        imagem.remove();
        return;
      }

      var origem = imagem.getAttribute("href") || imagem.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!origem && imagensVivas[indice]) {
        origem = imagensVivas[indice].getAttribute("href") || imagensVivas[indice].getAttributeNS("http://www.w3.org/1999/xlink", "href");
      }

      if (!origem) return;

      try {
        var dataUrl = await fonteImagemComoDataUrl(origem, imagensVivas[indice]);
        if (!dataUrl) return;
        var urlFinal = resolverUrlRelativa(dataUrl);
        imagem.setAttribute("href", urlFinal);
        imagem.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", urlFinal);
      } catch (erroImagem) {
        console.warn("Não foi possível incorporar imagem na exportação:", origem, erroImagem);
      }
    }));

    return copia;
  }

  function baixarBlob(blob, nome) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function carregarImagemParaCanvas(origem) {
    return new Promise(async function (resolver, rejeitar) {
      var fonte = origem;
      try { fonte = await fonteImagemComoDataUrl(origem, null); } catch (e) {}

      var img = new Image();
      img.onload = function () { resolver(img); };
      img.onerror = function () { rejeitar(new Error("Falha ao carregar imagem: " + origem)); };
      img.src = fonte;
    });
  }

  async function desenharImagensDosEquipamentosNoPng(contexto, svgEl, escala, viewBox) {
    var imagensSvg = Array.prototype.slice.call(svgEl.querySelectorAll("image"));

    for (var i = 0; i < imagensSvg.length; i++) {
      var imagemSvg = imagensSvg[i];
      var origem = imagemSvg.getAttribute("href") || imagemSvg.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!origem) continue;

      var raster = null;
      try {
        raster = imagemSvg;
        var teste = document.createElement("canvas");
        teste.width = 1;
        teste.height = 1;
        teste.getContext("2d").drawImage(imagemSvg, 0, 0, 1, 1);
      } catch (e) {
        raster = await carregarImagemParaCanvas(origem);
      }

      var x = numeroSvg(imagemSvg.getAttribute("x"));
      var y = numeroSvg(imagemSvg.getAttribute("y"));
      var largura = numeroSvg(imagemSvg.getAttribute("width"));
      var altura = numeroSvg(imagemSvg.getAttribute("height"));
      if (!largura || !altura) continue;

      var matriz = imagemSvg.getCTM();
      if (!matriz) continue;

      contexto.save();
      contexto.setTransform(
        escala * matriz.a,
        escala * matriz.b,
        escala * matriz.c,
        escala * matriz.d,
        escala * (matriz.e - viewBox.x),
        escala * (matriz.f - viewBox.y)
      );

      contexto.beginPath();
      var raio = Math.min(3, largura / 2, altura / 2);
      if (contexto.roundRect) {
        contexto.roundRect(x, y, largura, altura, raio);
      } else {
        contexto.rect(x, y, largura, altura);
      }
      contexto.clip();

      contexto.drawImage(raster, x, y, largura, altura);
      contexto.restore();
    }
  }

  btnBaixar.addEventListener("click", async function () {
    if (!ultimoDot) return;
    var svgEl = elCanvas.querySelector("svg");
    if (!svgEl) return;

    try {
      var svgExportavel = await prepararSvgParaExportacao(svgEl, false);
      var svgText = new XMLSerializer().serializeToString(svgExportavel);

      if (downloadsCap) {
        try {
          await downloadsCap.save({ filename: "diagrama-interligacao.svg", data: svgText });
          return;
        } catch (e) {}
      }

      baixarBlob(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }), "diagrama-interligacao.svg");
    } catch (e) {
      mostrarErro("Não foi possível exportar o SVG.\nDetalhe: " + e.message);
    }
  });

  async function prepararSvgSeguroParaPng(svgEl) {
    var copia = svgEl.cloneNode(true);
    copia.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copia.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    copia.style.transform = "none";
    copia.style.transformOrigin = "";

    var imagensOriginais = Array.prototype.slice.call(svgEl.querySelectorAll("image"));
    var imagensCopia = Array.prototype.slice.call(copia.querySelectorAll("image"));
    var imagensIgnoradas = 0;

    for (var i = 0; i < imagensCopia.length; i++) {
      var imagem = imagensCopia[i];
      var origem = imagem.getAttribute("href") || imagem.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!origem && imagensOriginais[i]) {
        origem = imagensOriginais[i].getAttribute("href") || imagensOriginais[i].getAttributeNS("http://www.w3.org/1999/xlink", "href");
      }

      if (!origem) {
        imagem.remove();
        imagensIgnoradas++;
        continue;
      }

      if (/^data:/i.test(origem)) {
        imagem.setAttribute("href", origem);
        imagem.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", origem);
        continue;
      }

      try {
        var absoluta = resolverUrlRelativa(origem);
        var resposta = await fetch(absoluta, { cache: "force-cache" });
        if (!resposta.ok && resposta.status !== 0) throw new Error("HTTP " + resposta.status);
        var dataUrl = await blobParaDataUrl(await resposta.blob());
        var urlFinal = resolverUrlRelativa(dataUrl);
        imagem.setAttribute("href", urlFinal);
        imagem.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", urlFinal);
      } catch (erroImagemPng) {
        console.warn("Imagem ignorada somente na exportação PNG para evitar canvas bloqueado:", origem, erroImagemPng);
        imagem.remove();
        imagensIgnoradas++;
      }
    }

    return { svg: copia, imagensIgnoradas: imagensIgnoradas };
  }

  function carregarSvgSerializadoComoImagem(svgText) {
    return new Promise(function (resolver, rejeitar) {
      var blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var imagem = new Image();

      imagem.onload = function () {
        resolver({ imagem: imagem, url: url });
      };

      imagem.onerror = function () {
        URL.revokeObjectURL(url);
        rejeitar(new Error("O navegador não conseguiu rasterizar o SVG do diagrama."));
      };

      imagem.src = url;
    });
  }

  function canvasParaPngBlob(canvas) {
    return new Promise(function (resolver, rejeitar) {
      try {
        canvas.toBlob(function (blob) {
          if (!blob) {
            rejeitar(new Error("O navegador retornou um PNG vazio."));
            return;
          }
          resolver(blob);
        }, "image/png");
      } catch (erro) {
        rejeitar(erro);
      }
    });
  }

  btnBaixarPng.addEventListener("click", async function () {
    var svgEl = elCanvas.querySelector("svg");
    if (!svgEl) {
      mostrarErro("Gere o diagrama antes de baixar o PNG.");
      return;
    }

    var carregado = null;
    var textoOriginalBotao = btnBaixarPng.textContent;
    btnBaixarPng.disabled = true;
    btnBaixarPng.textContent = "Gerando PNG...";

    try {
      var preparado = await prepararSvgSeguroParaPng(svgEl);
      var svgText = new XMLSerializer().serializeToString(preparado.svg);
      carregado = await carregarSvgSerializadoComoImagem(svgText);

      var vb = svgEl.viewBox && svgEl.viewBox.baseVal;
      var largura = vb && vb.width ? vb.width : (parseFloat(svgEl.getAttribute("width")) || carregado.imagem.naturalWidth || carregado.imagem.width);
      var altura = vb && vb.height ? vb.height : (parseFloat(svgEl.getAttribute("height")) || carregado.imagem.naturalHeight || carregado.imagem.height);

      if (!largura || !altura) throw new Error("Não foi possível determinar o tamanho do diagrama.");

      var escala = 2;
      var canvasPng = document.createElement("canvas");
      canvasPng.width = Math.max(1, Math.ceil(largura * escala));
      canvasPng.height = Math.max(1, Math.ceil(altura * escala));

      var contexto = canvasPng.getContext("2d");
      if (!contexto) throw new Error("Canvas 2D não está disponível neste navegador.");

      contexto.save();
      contexto.setTransform(1, 0, 0, 1, 0, 0);
      contexto.fillStyle = getComputedStyle(elCanvas).backgroundColor || "#ffffff";
      contexto.fillRect(0, 0, canvasPng.width, canvasPng.height);
      contexto.restore();

      contexto.drawImage(carregado.imagem, 0, 0, canvasPng.width, canvasPng.height);

      var pngBlob = await canvasParaPngBlob(canvasPng);
      baixarBlob(pngBlob, "diagrama-grafo.png");

      if (preparado.imagensIgnoradas > 0) {
        console.warn(preparado.imagensIgnoradas + " imagem(ns) externa(s) não puderam ser incorporadas no PNG. O download foi mantido para não travar a exportação.");
      }

      esconderErro();
    } catch (e) {
      mostrarErro("Não foi possível exportar o diagrama como PNG.\nDetalhe: " + e.message);
    } finally {
      if (carregado && carregado.url) URL.revokeObjectURL(carregado.url);
      btnBaixarPng.disabled = false;
      btnBaixarPng.textContent = textoOriginalBotao;
    }
  });

  (async function initDownloads() {
    try {
      if (window.claude && window.claude.use) { downloadsCap = await window.claude.use("downloads"); }
    } catch (e) { downloadsCap = null; }
    if (ultimoDot) btnBaixar.disabled = false;
  })();

  projetos = carregarProjetos();
  projetoAtual = localStorage.getItem("grafo-projeto-atual") || Object.keys(projetos)[0] || "Projeto principal";
  if (!projetos[projetoAtual]) projetoAtual = Object.keys(projetos)[0] || "Projeto principal";
  if (!projetos[projetoAtual]) projetos[projetoAtual] = projetoVazio();
  estado = clonarDados(projetos[projetoAtual]);
  ultimoEstadoHistorico = JSON.stringify(estado);
  atualizarBotoesHistorico();
  renderProjetos();
  renderTudo();
  if (estado.equipamentos.length) gerar(); else limparDiagrama();
})();
