module.exports = async function entrar(page, BASE, email) {
  await page.goto(BASE + '/entrar');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('seuemail@exemplo.com').fill(email);
  await page.getByPlaceholder('Sua senha').fill(require('fs').readFileSync(process.env.S + '/senha-demo.txt', 'utf8').trim());
  await page.getByText('Entrar', { exact: true }).locator('visible=true').last().click();
  await page.waitForTimeout(3000);
};
