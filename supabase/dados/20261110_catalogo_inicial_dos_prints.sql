-- Catálogo inicial tirado dos prints do Bubble (10/11/2026), sem fotos.
-- Obs.: o Chrome traduziu parte dos dados no print ("Misturar Celina" = "Mix Celina", "Misturas" = "Mix").
-- A categoria "abas" ficou de fora até o dono confirmar o nome certo.
insert into public.categorias (nome, ordem) values
  ('Anéis', 1), ('Brincos', 2), ('Colares', 3), ('Pulseiras', 4), ('Conjuntos', 5),
  ('Pingentes', 6), ('Gargantilhas', 7), ('Piercings', 8), ('Infantil', 9), ('Mix', 10);

with c as (select id, nome from public.categorias)
insert into public.produtos (sku, nome, descricao, preco, categoria_id, destaque)
select v.sku, v.nome, v.descricao, v.preco, (select id from c where c.nome = v.cat), v.destaque
from (values
  ('42984', 'Pulseira Infantil Masculina Grumet Dourada', 'Corrente grumet clássica em versão infantil.', 89.90, 'Infantil', false),
  ('42767', 'Pulseira Infantil com Cristais Dourada', 'Cristais delicados no estilo riviera.', 99.90, 'Infantil', false),
  ('42903', 'Brinco Infantil com Laço Dourado', 'Brinco em formato de laço com detalhes delicados.', 39.90, 'Infantil', false),
  ('42897', 'Brinco Infantil Ponto de Luz Dourado', 'Pedra brilhante delicada em modelo ponto de luz.', 29.90, 'Infantil', false),
  ('42954', 'Colar Infantil com Ursinho Dourado', 'Pingente de ursinho com pedrinhas, cheio de brilho e fofura.', 139.90, 'Infantil', false),
  ('42905', 'Conjunto Estrelas Dourado', 'Conjunto infantil com estrelas.', 139.90, 'Infantil', false),
  ('MIX-1', 'Mix Celina', 'Look completo: brinco e colar Celina dourados. Brinco em argola oval alongada, lisa e polida.', 189.80, 'Mix', true),
  ('42790', 'Pingente São Bento Dourado (imagem)', 'Medalha redonda com a imagem de São Bento em relevo.', 89.90, 'Pingentes', false),
  ('42791', 'Pingente São Bento Dourado (cruz)', 'Medalha redonda com a cruz de São Bento e inscrições tradicionais.', 159.90, 'Pingentes', false),
  ('42854', 'Conjunto Coração Rosa Dourado', 'Aro dourado rígido com coração orgânico em tom rosado.', 399.90, 'Conjuntos', true),
  ('42735', 'Conjunto Corações Azul Dourado', 'Coração azul-claro cercado por zircônias.', 349.90, 'Conjuntos', false),
  ('42756', 'Conjunto Corações Amarelo Dourado', 'Corações amarelos cercados por zircônias para colo e orelhas.', 319.90, 'Conjuntos', false),
  ('42757', 'Conjunto Gota Cores Dourado', 'Gota rosada contornada por zircônias, no colo e nas orelhas.', 199.90, 'Conjuntos', false),
  ('42758', 'Conjunto Julia Dourado', 'Quadrado dourado polido de cantos arredondados no pingente e nos brincos.', 159.90, 'Conjuntos', false),
  ('42134', 'Pulseira Brenda Dourada', 'Pequenas bolinhas douradas espaçadas ao longo de uma corrente fina.', 89.90, 'Pulseiras', false),
  ('42983', 'Pulseira Rita Dourada', 'Peça delicada e sofisticada, versátil para diferentes momentos.', 89.90, 'Pulseiras', false),
  ('42888', 'Pulseira Gota Rosa Dourada', 'Corrente fina dourada com pequenas gotas de pedra rosa pendentes.', 89.90, 'Pulseiras', false),
  ('42890', 'Pulseira Clarice Dourada', 'Elegância para valorizar o pulso com delicadeza.', 129.90, 'Pulseiras', false),
  ('42887', 'Pulseira Dupla Ponto de Luz Dourada', 'Delicadeza e brilho em composição moderna com pontos de luz.', 109.90, 'Pulseiras', false),
  ('42889', 'Pulseira Espírito Santo Dourada', 'Símbolo de fé em uma joia delicada para diferentes momentos.', 119.90, 'Pulseiras', false),
  ('42891', 'Pulseira Coração Nossa Senhora Dourada', 'Delicadeza, fé e significado: coração com Nossa Senhora e acabamento dourado.', 129.90, 'Pulseiras', false),
  ('42881', 'Colar Eduardo Dourado', 'Pingente quadrado com pedra central cercada por zircônias. Moderno e elegante.', 109.90, 'Colares', false),
  ('42982', 'Colar Cruz com Zircônias Dourado', 'Simbolismo e brilho em uma peça clássica e delicada.', 139.90, 'Colares', false),
  ('42964', 'Colar Pai Nosso Dourado', 'Simbolismo e elegância em uma peça inspirada na oração.', 149.90, 'Colares', false),
  ('42968', 'Colar Terço de Pérolas Dourado', 'Tradição do terço com a preferida das pérolas.', 389.90, 'Colares', true),
  ('42971', 'Colar Nossa Senhora Aparecida Dourado', 'Devoção transformada em joia.', 289.90, 'Colares', false),
  ('AN-ISABELA', 'Anel Isabela Dourado', 'Anel com pedras verdes em formato de gota, contornadas em dourado.', 179.90, 'Anéis', true),
  ('AN-VITORIA', 'Anel Vitória Dourado', 'Anel ajustável com grande ponto de luz em zircônia.', 129.90, 'Anéis', true),
  ('AN-NATALIA', 'Anel Natalia Dourado', 'Anel chevalier oval, liso e polido.', 89.90, 'Anéis', false),
  ('AN-CORACAO', 'Anel Coração Dourado', 'Coração vazado cravejado de zircônias.', 69.90, 'Anéis', false),
  ('BR-FOLHAS', 'Brinco Folhas Dourado', 'Brinco em folhas douradas texturizadas.', 79.90, 'Brincos', false),
  ('BR-PONTOLUZ', 'Brinco Ponto de Luz Dourado', 'Brinco com zircônia em ponto de luz e pingente.', 89.90, 'Brincos', false)
) as v(sku, nome, descricao, preco, cat, destaque);

-- Anéis com tamanho de aro (exceto o Vitória, que é ajustável).
insert into public.produto_variacoes (produto_id, nome, ordem)
select p.id, 'Aro ' || a, a
  from public.produtos p cross join (values (12), (14), (16), (18), (20), (22)) x(a)
 where p.sku in ('AN-ISABELA', 'AN-NATALIA', 'AN-CORACAO');

-- Vendas iniciais só para a lista "Mais vendidos" não sair vazia na demonstração.
update public.produtos set vendas = 10 where sku in ('AN-ISABELA', 'AN-VITORIA', 'AN-NATALIA', 'AN-CORACAO');
