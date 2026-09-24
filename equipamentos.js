const TIPOS_INICIAIS = [
  { nome: 'OLT', icone: 'OLT.jpeg' },
  { nome: 'Switch', icone: 'SWITCH.jpeg' },
  { nome: 'Roteador', icone: 'MIROTIK.png' },
  { nome: 'MikroTik', icone: 'MIROTIK.png' },
  { nome: 'ONT', icone: '' },
  { nome: 'ONU', icone: '' },
  { nome: 'Firewall', icone: '' },
  { nome: 'Servidor', icone: '' },
  { nome: 'Antena', icone: '' },
  { nome: 'UPS', icone: 'NOBREAK.jpeg' },
  { nome: 'Nobreak', icone: 'NOBREAK.jpeg' },
  { nome: 'Camera IP', icone: '' },
  { nome: 'Rack', icone: '' }
];

let tiposAtuais = TIPOS_INICIAIS.map(function (tipo) {
  return { ...tipo };
});

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ tipos: tiposAtuais });
    return;
  }

  if (req.method === 'POST') {
    let body = {};

    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch (err) {
        res.status(400).json({ erro: 'JSON inválido.' });
        return;
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    var nome = String(body.nome || '').trim();
    var icone = String(body.icone || '').trim();

    if (!nome) {
      res.status(400).json({ erro: 'O campo nome é obrigatório.' });
      return;
    }

    var jaExiste = tiposAtuais.some(function (tipo) {
      return String(tipo.nome).trim().toLowerCase() === nome.toLowerCase();
    });

    if (jaExiste) {
      res.status(200).json({ ok: true, tipos: tiposAtuais, mensagem: 'Tipo já existente.' });
      return;
    }

    tiposAtuais.push({ nome: nome, icone: icone });
    res.status(201).json({ ok: true, tipos: tiposAtuais, mensagem: 'Tipo adicionado com sucesso.' });
    return;
  }

  res.status(405).json({ erro: 'Método não permitido.' });
};
