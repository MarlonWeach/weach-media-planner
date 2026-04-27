# Segmentos Weach
Weach Pricing and Media Recommender

Este arquivo lista os segmentos de mercado utilizados no sistema, com uma descricao simples e exemplos de clientes.  
Ele serve de referencia conceitual e tambem pode ser usado como seed de tabela de segmentos.

============================================================
1. LISTA DE SEGMENTOS
============================================================

Segmento ID: automotivo
Nome: Automotivo
Descricao: Montadoras, concessionarias, locadoras, servicos automotivos.
Exemplos: marcas de carros, motos, caminhões, seminovos.

Segmento ID: financeiro
Nome: Financeiro
Descricao: Bancos, fintechs, consorcios, cartoes de credito, investimentos.
Exemplos: bancos digitais, plataformas de investimento, financeiras.

Segmento ID: varejo
Nome: Varejo
Descricao: Redes de lojas fisicas, ecommerces, fashion, mercado, eletro.
Exemplos: varejo de moda, supermercados, lojas de departamento.

Segmento ID: imobiliario
Nome: Imobiliario
Descricao: Construtoras, incorporadoras, imobiliarias, lancamentos residenciais e comerciais.
Exemplos: lancamentos de apartamentos, loteamentos, salas comerciais.

Segmento ID: saude
Nome: Saude
Descricao: Hospitais, laboratorios, clinicas, planos de saude, estetica.
Exemplos: clinicas de estetica, hospitais privados, laboratorios.

Segmento ID: educacao
Nome: Educacao
Descricao: Escolas, universidades, cursos livres, edtechs.
Exemplos: faculdades privadas, cursos de especializacao, cursos online.

Segmento ID: telecom
Nome: Telecom e Tecnologia
Descricao: Operadoras de telefonia, internet, cloud, SaaS, hardware.
Exemplos: provedores de banda larga, apps SaaS B2B, fabricantes.

Segmento ID: servicos
Nome: Servicos em geral
Descricao: Seguros, consultorias, servicos B2B, servicos pessoais.
Exemplos: seguradoras, contabilidade, consultorias, servicos domesticos.

Segmento ID: outros
Nome: Outros
Descricao: Qualquer vertical que nao se encaixe diretamente nas categorias acima.
Exemplos: eventos, entretenimento, terceiro setor.

============================================================
2. ORIENTACAO DE USO
============================================================

- Estes IDs de segmento devem ser usados no backend e na interface (dropdowns).
- Para CPL e CPI, cada segmento pode ter sua propria politica de preco, conforme arquivo pricing-table-base.
- Novos segmentos podem ser adicionados desde que sigam o mesmo padrao: id simples em minusculas, nome legivel e descricao clara.