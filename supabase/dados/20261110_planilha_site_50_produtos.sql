-- Importa os 50 produtos da planilha do site (julianapradoacessorios.com, coletados em 10/11/2026).
-- Produto que já existe (mesmo nome, ignorando acento, "dourada/dourado" e "cores/colors") é ATUALIZADO;
-- os demais são criados. Fotos: link do site (o app pede o tamanho certo, em WebP).
-- Depois, produtos sem foto (vindos só dos prints do Bubble) ficam INATIVOS (não apagados).
create temporary table planilha (n int, nome text, cat text, sub text, preco numeric, img text, novidade boolean) on commit drop;
insert into planilha values
(1, 'Brinco Argola Coração com Cristal', 'Brincos', 'Argolas', 109.90, 'https://julianapradoacessorios.com/cdn/shop/files/5c12b61aa50dacf3946d345cecace097.png?v=1788371986', false),
(2, 'Brinco Argola Coração Dourado', 'Brincos', 'Argolas', 59.90, 'https://julianapradoacessorios.com/cdn/shop/files/7770ec30324f78edc8bcc25a22f32fab.png?v=1788372022', false),
(3, 'Brinco Argola Cravejada com Zircônia', 'Brincos', 'Argolas', 249.90, 'https://julianapradoacessorios.com/cdn/shop/files/c7d49854bc0079ced8842bd32242d2e9.png?v=1788371933', false),
(4, 'Brinco Coração Banhado a Ouro 18k', 'Brincos', 'Corações', 49.90, 'https://julianapradoacessorios.com/cdn/shop/files/c0757dcc1978e85dd4f13c09b7bcb207.png?v=1788372012', false),
(5, 'Trio de Brincos Eloa Dourado', 'Brincos', 'Duos e trios', 69.90, 'https://julianapradoacessorios.com/cdn/shop/files/ed22dd832aad0b12fad55657ad62acce.jpg?v=1790694985', false),
(6, 'Brinco Ponto de Luz Cristal Dourado', 'Brincos', 'Ponto de luz', 119.90, 'https://julianapradoacessorios.com/cdn/shop/files/e1cd8d37ae17539c09a813e3906d78bf_3ee62145-3922-458c-a690-e6a140348e7c.jpg?v=1788546781', false),
(7, 'Brinco Argola Dourada Moderna', 'Brincos', 'Argolas', 99.90, 'https://julianapradoacessorios.com/cdn/shop/files/aca8638a8158b7214000922d5161b51a.png?v=1788371928', false),
(8, 'Brinco Triângulo Cravejado de Zircônia', 'Brincos', 'Cravejados', 49.90, 'https://julianapradoacessorios.com/cdn/shop/files/d1156a1026a8273f25506ea8e148d7ab.png?v=1788371990', false),
(9, 'Brinco Argola Coração Rosé', 'Brincos', 'Argolas', 99.90, 'https://julianapradoacessorios.com/cdn/shop/files/4ce03635e7ce8f59b09dfaaca9913014.png?v=1788371981', false),
(10, 'Brinco Pietra Cravejado', 'Brincos', 'Cravejados', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/A11327B6-DA8A-44EA-882D-1DF2A1DE248D.png?v=1792598876', true),
(11, 'Brinco de Folha Rustico', 'Brincos', 'Lisos e orgânicos', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/D351769D-D239-4BCD-B481-52603A8B1F65.png?v=1792595266', true),
(12, 'Brinco Mary Colors Dourado', 'Brincos', 'Pedras coloridas', 79.90, 'https://julianapradoacessorios.com/cdn/shop/files/BrincoMaryColorsdourado-Roxo1.png?v=1792173925', false),
(13, 'Brinco Gota Colors Dourado', 'Brincos', 'Gotas', 99.90, 'https://julianapradoacessorios.com/cdn/shop/files/3_9c06a2da-8854-45ca-8b8b-f6f941503c7c.png?v=1792631392', true),
(14, 'Brinco Jade Colors Dourado', 'Brincos', 'Pedras coloridas', 59.90, 'https://julianapradoacessorios.com/cdn/shop/files/93A95065-B01B-4043-9728-1CAF687B8402_4564c13f-712a-460a-9efd-bc9aa44fdce1.png?v=1792629135', true),
(15, 'Colar Clarissa Blue Dourado', 'Colares', 'Pedras coloridas', 199.90, 'https://julianapradoacessorios.com/cdn/shop/files/2FBB8E97-4B61-4116-8D0D-FD96DC34984C.png?v=1792604971', true),
(16, 'Colar Duo Esmeralda Dourado', 'Colares', 'Pedras coloridas', 279.90, 'https://julianapradoacessorios.com/cdn/shop/files/8F06163A-978C-4472-B9BB-C2F965239A2D.png?v=1792593970', true),
(17, 'Colar Camille Dourado', 'Colares', 'Ponto de luz', 219.90, 'https://julianapradoacessorios.com/cdn/shop/files/A695B3DD-B772-48B5-A159-E2980B9F7E77.png?v=1792602431', true),
(18, 'Colar Eliane Colors Dourado', 'Colares', 'Pedras coloridas', 149.90, 'https://julianapradoacessorios.com/cdn/shop/files/03B5C9F8-9640-4BDE-9BA9-E057F8CD5D19.png?v=1792647882', true),
(19, 'Colar Gota Colors Dourado', 'Colares', 'Gotas', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/C7D3AEDB-7A7B-4CEB-A031-2592B8F99D23.png?v=1792614782', true),
(20, 'Colar Adrielle Dourado', 'Colares', 'Pedras coloridas', 219.90, 'https://julianapradoacessorios.com/cdn/shop/files/ColarAdrielledourado1.png?v=1792173633', false),
(21, 'Colar Ponto de Luz Colors Dourado', 'Colares', 'Ponto de luz', 259.90, 'https://julianapradoacessorios.com/cdn/shop/files/WhatsApp_Image_2021116-10-20_at_5.33.00_PM.jpg?v=1792589435', true),
(22, 'Colar São Bento Dourado', 'Colares', 'Religiosos', 419.90, 'https://julianapradoacessorios.com/cdn/shop/files/5b95169b375fb8ca5cbca29f32ba44a0.jpg?v=1790695950', false),
(23, 'Colar Religioso Dourado', 'Colares', 'Religiosos', 149.90, 'https://julianapradoacessorios.com/cdn/shop/files/a2c85803b6dfc03b1d6c2a3171ee86a5.jpg?v=1790695943', false),
(24, 'Colar Longo Cruz com Zircônias Dourado', 'Colares', 'Religiosos', 499.90, 'https://julianapradoacessorios.com/cdn/shop/files/436506b8ce7e5359f5a2097d940091a5.jpg?v=1790695933', false),
(25, 'Choker Gotas Dourada Marrom e Verde', 'Choker', 'Pedras coloridas', 169.90, 'https://julianapradoacessorios.com/cdn/shop/files/F1C3364E-348D-4392-BB45-BD3661911DA2.png?v=1792611664', true),
(26, 'Choker Luara Colors Dourada', 'Choker', 'Pedras coloridas', 349.90, 'https://julianapradoacessorios.com/cdn/shop/files/dc077f78793ad15155ac5aca3d8a9641_57bce201-6d71-4a42-a8f7-2f545ae65cf2.png?v=1792084609', false),
(27, 'Choker Fé e Cruz Dourado', 'Choker', 'Religiosos', 169.90, 'https://julianapradoacessorios.com/cdn/shop/files/094.jpg?v=1790728105', false),
(28, 'Choker Gotas Rosa Dourado', 'Choker', 'Pedras coloridas', 149.90, 'https://julianapradoacessorios.com/cdn/shop/files/0a022172f9fd2836404067292126176e.jpg?v=1790695083', false),
(29, 'Choker Serena Dourado', 'Choker', 'Correntes e aros', 159.90, 'https://julianapradoacessorios.com/cdn/shop/files/125_74a2c115-551d-44a0-8fde-4f27dda609e0.jpg?v=1790871883', false),
(30, 'Choker Elo Português Dourado', 'Choker', 'Correntes e aros', 119.90, 'https://julianapradoacessorios.com/cdn/shop/files/132.jpg?v=1790869846', false),
(31, 'Choker Beatriz Dourado', 'Choker', 'Correntes e aros', 199.90, 'https://julianapradoacessorios.com/cdn/shop/files/b5bb8c2b8469f70f4d1fb880d45c9d09.jpg?v=1790695063', false),
(32, 'Choker Corações 40 cm Dourado', 'Choker', 'Corações', 229.90, 'https://julianapradoacessorios.com/cdn/shop/files/f23a6eddd2786c71766ee419ab65b4a4.jpg?v=1790695059', false),
(33, 'Choker Coração Pérolas', 'Choker', 'Pérolas', 119.90, 'https://julianapradoacessorios.com/cdn/shop/files/f13910606762efc86a09de2159b8313e.png?v=1788372005', false),
(34, 'Pulseira Regulável Eliane Colors Dourada', 'Pulseiras', 'Pedras coloridas', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/E24CE73D-C3B7-4812-B5E6-AA942180444F.png?v=1792649075', true),
(35, 'Pulseira Regulável Oval Colors Dourada', 'Pulseiras', 'Pedras coloridas', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/415F796B-FB6C-4B72-B4D6-88092C5E5B1E.png?v=1792645979', true),
(36, 'Pulseira Espírito Santo Dourado', 'Pulseiras', 'Berloques e pingentes', 119.90, 'https://julianapradoacessorios.com/cdn/shop/files/e60ad3de2b37b75c7849b1f49d09cacb.jpg?v=1790695954', false),
(37, 'Pulseira Coração Nossa Senhora Dourado', 'Pulseiras', 'Corações', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/83d608588ba2eed50ea83244fb97b2c7.jpg?v=1790695937', false),
(38, 'Pulseira Dupla Ponto de Luz Dourado', 'Pulseiras', 'Com pedras', 109.90, 'https://julianapradoacessorios.com/cdn/shop/files/1F928854-9728-47A4-B326-5AEFDAE47670.png?v=1790790921', false),
(39, 'Pulseira Riviera Cristais Dourado', 'Pulseiras', 'Cravejadas', 169.90, 'https://julianapradoacessorios.com/cdn/shop/files/4871e6d1b3afc8bef17fffa45c97539c.jpg?v=1788550689', false),
(40, 'Anel Vitória Dourado', 'Anéis', 'Lisos', 129.90, 'https://julianapradoacessorios.com/cdn/shop/files/ddb07398a5acba3519d11ca9a2a030c3.jpg?v=1788549231', false),
(41, 'Anel Natalia Dourado', 'Anéis', 'Lisos', 89.90, 'https://julianapradoacessorios.com/cdn/shop/files/b6e15e779b6183daa349320d059458c6.jpg?v=1788537045', false),
(42, 'Anel Coração Dourado', 'Anéis', 'Corações e patinhas', 69.90, 'https://julianapradoacessorios.com/cdn/shop/files/b747f1e5b19e7c743564d558ebc68901.jpg?v=1788371869', false),
(43, 'Anel Cruz Dourado', 'Anéis', 'Lisos', 109.90, 'https://julianapradoacessorios.com/cdn/shop/files/e60c4fe47ba64128b92dd7bdfa26b797.jpg?v=1788371855', false),
(44, 'Conjunto Leticia Dourado', 'Conjuntos', 'Com pedras', 279.90, 'https://julianapradoacessorios.com/cdn/shop/files/e3fa5d4f79673a9516c884c1a6d1e3f3.jpg?v=1788554207', false),
(45, 'Conjunto Julia Dourado', 'Conjuntos', 'Com pedras', 159.90, 'https://julianapradoacessorios.com/cdn/shop/files/d1ae09d30ab4217143e28e0e24a9ae5c.jpg?v=1788554203', false),
(46, 'Conjunto Gota Colors Dourado', 'Conjuntos', 'Com pedras', 199.90, 'https://julianapradoacessorios.com/cdn/shop/files/F7ADD23D-8EFC-46F1-8444-7FE98DBACEFC_51ed8f0b-e6bb-45db-945c-f207bbda13f9.png?v=1790714499', false),
(47, 'Conjunto Ponto de Luz Dourado', 'Conjuntos', 'Ponto de luz', 159.90, 'https://julianapradoacessorios.com/cdn/shop/files/04f901caaa79083be4397b83aa2cab63_8f15635f-9ed6-4890-a60a-07fa9e0502c6.png?v=1788910543', false),
(48, 'Bracelete Aurora Zircônia Dourado', 'Braceletes', 'Cravejados', 399.90, 'https://julianapradoacessorios.com/cdn/shop/files/2ccb2378ce108e81bbba88a54a296928.jpg?v=1788554383', false),
(49, 'Bracelete Laura Dourado', 'Braceletes', 'Lisos', 199.90, 'https://julianapradoacessorios.com/cdn/shop/files/a41116285285fb3ed091b2083e356905.jpg?v=1788554237', false),
(50, 'Bracelete Bianca Dourado', 'Braceletes', 'Lisos', 89.90, 'https://julianapradoacessorios.com/cdn/shop/files/60229ccc7bccba5abcfb6365d3a68f40.jpg?v=1788554218', false);

insert into public.categorias (nome, ordem)
select distinct p.cat, 20 from planilha p
 where not exists (select 1 from public.categorias c where public.sem_acento(c.nome) = public.sem_acento(p.cat));

create temporary table chave_nome on commit drop as
select n, regexp_replace(regexp_replace(public.sem_acento(nome), '\mdourada\M', 'dourado', 'g'), '\mcores\M', 'colors', 'g') as chave from planilha;

update public.produtos pr
   set nome = p.nome, preco = p.preco, preco_promocional = null, subcategoria = p.sub,
       imagem_principal = p.img, imagens = array[p.img], novidade = p.novidade, ativo = true,
       categoria_id = (select id from public.categorias c where public.sem_acento(c.nome) = public.sem_acento(p.cat))
  from planilha p join chave_nome k on k.n = p.n
 where regexp_replace(regexp_replace(public.sem_acento(pr.nome), '\mdourada\M', 'dourado', 'g'), '\mcores\M', 'colors', 'g') = k.chave;

insert into public.produtos (nome, preco, subcategoria, imagem_principal, imagens, novidade, categoria_id, ordem)
select p.nome, p.preco, p.sub, p.img, array[p.img], p.novidade,
       (select id from public.categorias c where public.sem_acento(c.nome) = public.sem_acento(p.cat)), p.n
  from planilha p
 where not exists (select 1 from public.produtos pr where pr.imagem_principal = p.img);

update public.produtos set ativo = false where imagem_principal is null and ativo;

-- Destaques escolhidos entre as peças de maior valor/visual.
update public.produtos set destaque = (nome in (
  'Colar São Bento Dourado', 'Brinco Argola Cravejada com Zircônia', 'Choker Luara Colors Dourada',
  'Bracelete Aurora Zircônia Dourado', 'Colar Clarissa Blue Dourado', 'Colar Duo Esmeralda Dourado'));
-- Zera as "vendas" de demonstração: "Mais vendidas" passa a refletir pedidos reais.
update public.produtos set vendas = 0;
-- Ordem das categorias na vitrine.
update public.categorias set ordem = case public.sem_acento(nome)
  when 'brincos' then 1 when 'colares' then 2 when 'choker' then 3 when 'pulseiras' then 4
  when 'aneis' then 5 when 'conjuntos' then 6 when 'braceletes' then 7 else 20 end;

select (select count(*) from public.produtos where ativo) ativos,
       (select count(*) from public.produtos where not ativo) inativos,
       (select count(*) from public.produtos where ativo and imagem_principal is null) ativos_sem_foto,
       (select string_agg(c.nome || ':' || (select count(*) from public.produtos p where p.categoria_id = c.id and p.ativo), ', ' order by c.ordem) from public.categorias c) por_categoria;
