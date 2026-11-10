const fs = require('fs');
const { iniciar, capturar, BASE } = require('./motor');
(async () => {
  const fases = process.argv.slice(2);
  const { browser, page, erros } = await iniciar();
  const saida = `${process.env.S}/demo/telas.json`;
  let todas = fs.existsSync(saida) ? JSON.parse(fs.readFileSync(saida)) : [];
  try {
    for (const f of fases) {
      const telas = await require(`./${f}`)(page, capturar, BASE);
      const ids = new Set(telas.map((t) => t.id));
      todas = todas.filter((t) => !ids.has(t.id)).concat(telas);
      fs.writeFileSync(saida, JSON.stringify(todas, null, 1));
    }
  } finally {
    console.log('ERROS DA PÁGINA:', JSON.stringify(erros.slice(0, 5)));
    await browser.close();
  }
})();
