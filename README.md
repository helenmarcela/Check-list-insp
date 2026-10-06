Requisitos de um Sistema de Checklist
1. Requisitos Funcionais
Os requisitos funcionais descrevem o que o sistema deve fazer.
Código
Requisito funcional
RF01
O sistema deve permitir o cadastro de usuários.
RF02
O sistema deve permitir que o usuário faça login utilizando e-mail e senha.
RF03
O sistema deve permitir criar um novo checklist.
RF04
O sistema deve permitir adicionar itens ao checklist.
RF05
O sistema deve permitir editar ou excluir itens do checklist.
RF06
O sistema deve permitir marcar um item como concluído ou pendente.
RF07
O sistema deve permitir visualizar o progresso do checklist.
RF08
O sistema deve permitir salvar automaticamente as alterações realizadas.
RF09
O sistema deve permitir editar um checklist já criado.
RF10
O sistema deve permitir excluir um checklist.
RF11
O sistema deve permitir consultar checklists já cadastrados.
RF12
O sistema deve permitir pesquisar um checklist pelo nome.
RF13
O sistema deve permitir finalizar um checklist quando todos os itens forem concluídos.
RF14
O sistema deve informar ao usuário quando houver itens pendentes.
RF15
O sistema deve permitir gerar um relatório do checklist concluído.
2. Requisitos Não Funcionais
Os requisitos não funcionais descrevem como o sistema deve funcionar, principalmente em relação à qualidade, segurança, desempenho e facilidade de uso.
Código
Requisito não funcional
RNF01
O sistema deve possuir uma interface simples e fácil de utilizar.
RNF02
O sistema deve apresentar as informações de forma clara e organizada.
RNF03
O sistema deve responder às ações do usuário em poucos segundos.
RNF04
O sistema deve proteger os dados dos usuários por meio de autenticação.
RNF05
As senhas dos usuários devem ser armazenadas de forma segura.
RNF06
O sistema deve funcionar corretamente em computadores e dispositivos móveis.
RNF07
O sistema deve manter os dados salvos mesmo após o usuário fechar o sistema.
RNF08
O sistema deve possuir disponibilidade adequada para que os usuários possam acessá-lo quando necessário.
RNF09
O sistema deve evitar a perda de informações durante seu funcionamento.
RNF10
O sistema deve apresentar mensagens de erro compreensíveis ao usuário.
3. Diferença entre requisitos funcionais e não funcionais
Requisito funcional
Define o que o sistema faz.
Exemplo: O sistema deve permitir marcar um item do checklist como concluído.
Requisito não funcional
Define como o sistema deve funcionar ou quais características deve possuir.
Exemplo: O sistema deve ser fácil de utilizar e responder rapidamente aos comandos.
4. Resumo
RF (Requisito Funcional): define as funcionalidades que o sistema deve oferecer.
RNF (Requisito Não Funcional): define características de qualidade, desempenho, segurança, usabilidade e outras condições do sistema.

Implementação do projeto
Este repositório contém uma aplicação web simples para cadastro de usuários, criação e gestão de checklists, itens, progresso, autenticação e geração de relatório.

Como executar
1. Abra o terminal na pasta do projeto.
2. Execute: python3 -m http.server 8080
3. Acesse: http://localhost:8080
4. Cadastre um usuário e comece a criar checklists.

Funcionalidades incluídas
- Cadastro e login com autenticação local
- Criação, edição e exclusão de checklists
- Adição, edição e remoção de itens
- Avaliação de cada item como conforme ou não conforme, com opção de manter pendente
- Progresso do checklist em tempo real
- Pesquisa por nome de checklist
- Finalização após avaliar todos os itens
- Exportação de relatório .txt com itens conformes, não conformes e pendentes
- Persistência em localStorage
- Tema claro/escuro com preferência salva
- Layout responsivo com CSS puro