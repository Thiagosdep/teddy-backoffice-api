# 🚀 Teddy Backoffice API

Uma aplicação backend moderna em NestJS para gerenciamento de operações de backoffice com TypeORM, PostgreSQL, autenticação JWT e observabilidade completa.

## 📋 Estrutura do Projeto

### 🛠️ Tecnologias Utilizadas

- **[NestJS](https://nestjs.com/)** (v11) - Framework Node.js progressivo
- **[TypeORM](https://typeorm.io/)** - ORM para TypeScript e JavaScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional poderoso e de código aberto
- **[JWT](https://jwt.io/)** - JSON Web Token para autenticação segura
- **[Swagger](https://swagger.io/)** - Documentação de API
- **[Jest](https://jestjs.io/)** - Framework de testes
- **[Winston](https://github.com/winstonjs/winston)** - Biblioteca de logging
- **[Loki](https://grafana.com/oss/loki/)** - Sistema de agregação de logs
- **[Prometheus](https://prometheus.io/)** - Sistema de monitoramento e alerta
- **[Grafana](https://grafana.com/)** - Plataforma de visualização e análise

### 📊 Diagrama de Relação entre Entidades

```mermaid
classDiagram
    note "Entidades do Sistema"

    AdminUserEntity <|-- UserEntity : "Admin gerencia"
    UserEntity "1" -- "0..*" UserCompanyEntity : "possui"

    class AdminUserEntity {
        +string id
        +string login
        +string password
    }

    class UserEntity {
        +string id
        +string name
        +string email
        +number ownRemuneration
        +Date createdAt
        +Date updatedAt
        +Date deletedAt
        +UserCompanyEntity[] userCompanies
    }

    class UserCompanyEntity {
        +string id
        +string name
        +boolean active
        +number companyValue
        +string userId
        +Date createdAt
        +Date updatedAt
        +Date deletedAt
        +UserEntity user
    }
```

### 🏗️ Arquitetura e Princípios de Design

- **Arquitetura Limpa** - Implementação de camadas bem definidas com separação clara de responsabilidades
- **Injeção de Dependência** - Utilização do container DI nativo do NestJS para acoplamento fraco
- **Padrão DTO** - Objetos de Transferência de Dados para validação robusta e segurança de tipos
- **Padrão Repository** - Abstração elegante para operações de banco de dados
- **Configuração Multi-ambiente** - Gerenciamento flexível de configurações via arquivos `.env`
- **Sistema de Migração** - Controle de versão de banco de dados com migrações automatizadas
- **Versionamento de API** - Estratégia de versionamento baseada em URI para evolução contínua
- **Validação Global** - Sistema abrangente de validação usando class-validator
- **Soft Delete** - Implementação de exclusão lógica para auditoria e recuperação de dados
- **Observabilidade Completa** - Logs estruturados, métricas e rastreamento distribuído

## 📊 Observabilidade

O projeto implementa uma stack completa de observabilidade que inclui:

### 📝 Logging (Winston + Loki)

- Logs estruturados em JSON
- Integração com Loki para armazenamento e consulta de logs
- Visualização de logs no Grafana
- Níveis de log configuráveis (info, warn, error, debug)
- Contexto de logs para facilitar a depuração

### 📈 Métricas (Prometheus)

- Métricas padrão do sistema (CPU, memória, etc.)
- Métricas personalizadas de aplicação:
  - Contagem total de requisições HTTP
  - Duração das requisições
  - Requisições em andamento
  - Contagem de erros
- Endpoint `/metrics` para coleta pelo Prometheus
- Dashboards no Grafana para visualização

## 📬 Envio de Notificações com RabbitMQ e BullMQ

A aplicação utiliza RabbitMQ e BullMQ para gerenciar o envio de notificações de forma eficiente e escalável. A seguir, uma visão geral de como esses componentes funcionam juntos.

### RabbitMQ

RabbitMQ é um sistema de mensageria que permite a comunicação assíncrona entre diferentes partes da aplicação. Ele é utilizado para enviar mensagens de notificação que podem ser processadas em segundo plano. A configuração do RabbitMQ na aplicação inclui:

- **Exchange**: Um exchange chamado `user.notifications` é criado para gerenciar as mensagens de notificação.
- **Queue**: As mensagens são enviadas para uma fila chamada `email-notifications`, onde são armazenadas até serem processadas.

### BullMQ

BullMQ é uma biblioteca de gerenciamento de filas para Node.js que permite o processamento de trabalhos em segundo plano. Na aplicação, BullMQ é utilizado para processar as notificações que são enfileiradas pelo RabbitMQ. As principais características incluem:

- **Processamento de Trabalhos**: Quando uma notificação é enviada, ela é adicionada à fila `user-notifications` e processada por um worker que executa a lógica de envio (por exemplo, envio de e-mails).
- **Gerenciamento de Retries**: BullMQ permite configurar tentativas automáticas para o envio de notificações em caso de falhas, garantindo que as mensagens sejam entregues mesmo em situações de erro temporário.
- **Monitoramento de Estatísticas**: A aplicação pode coletar estatísticas sobre o processamento de notificações, como o número de trabalhos pendentes, ativos e concluídos.

### Exemplo de Uso

Para enviar uma notificação, a aplicação chama o método `sendNotification` do serviço `UserNotificationService`, que publica a mensagem no RabbitMQ e a adiciona à fila BullMQ. O worker do BullMQ processa a notificação e executa a ação apropriada (como enviar um e-mail).

### Benefícios

- **Escalabilidade**: O uso de RabbitMQ e BullMQ permite que a aplicação escale horizontalmente, processando múltiplas notificações simultaneamente.
- **Desacoplamento**: A separação entre a lógica de envio de notificações e o restante da aplicação melhora a manutenibilidade e a clareza do código.
- **Resiliência**: Com a capacidade de reprocessar mensagens em caso de falhas, a aplicação se torna mais robusta e confiável.

Com essa arquitetura, a aplicação é capaz de gerenciar notificações de forma eficiente, garantindo que os usuários recebam as informações necessárias em tempo hábil.

## 🐳 Implantação com Docker

Nossa configuração Docker oferece um ambiente isolado e reproduzível para execução da aplicação, incluindo toda a stack de observabilidade.

### Passo a Passo Inicial

1. **Instalar Dependências**:

   ```bash
   npm install
   ```

2. **Iniciar os Contêineres**:

   ```bash
   docker compose up
   ```

3. **Executar as Migrations**:
   ```bash
   docker exec teddy-backoffice-api npm run migration:run
   ```

### Recursos Disponíveis

Após iniciar os contêineres com `docker compose up`, você pode acessar:

- **API:** http://localhost:4000
- **Documentação Swagger:** http://localhost:4000/swagger
- **Grafana:** http://localhost:3001 (usuário: admin, senha: admin)
- **Prometheus:** http://localhost:9090

### Configurando o Grafana

Após iniciar os contêineres, você pode configurar dashboards no Grafana:

1. Acesse http://localhost:3001 e faça login com usuário `admin` e senha `admin`
2. Vá para "Dashboards" > "New" > "New Dashboard"
3. Adicione painéis usando as fontes de dados Prometheus e Loki

#### Exemplos de consultas Prometheus:

- Total de requisições: `http_requests_total`
- Duração média das requisições: `rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])`
- Requisições por segundo: `rate(http_requests_total[1m])`
- Taxa de erros: `rate(http_request_errors_total[5m])`

#### Exemplos de consultas Loki:

- Todos os logs: `{app="teddy-backoffice-api"}`
- Logs de erro: `{app="teddy-backoffice-api"} |= "error"`
- Logs de um serviço específico: `{app="teddy-backoffice-api", context="UserService"}`
- Logs de requisições HTTP: `{app="teddy-backoffice-api", context="HttpRequest"}`

## 🔍 Monitoramento e Depuração

### Visualizando Logs

Os logs são enviados para o console e para o Loki. Para visualizar os logs:

1. **Console:** Visíveis diretamente no terminal onde a aplicação está sendo executada
2. **Grafana:** Acesse http://localhost:3001, vá para "Explore" e selecione a fonte de dados "Loki"

### Monitorando Métricas

As métricas da aplicação podem ser visualizadas de várias formas:

1. **Endpoint de Métricas:** Acesse http://localhost:4000/metrics para ver as métricas brutas
2. **Prometheus:** Acesse http://localhost:9090 para consultar e visualizar métricas
3. **Grafana:** Acesse http://localhost:3001 para visualizar dashboards com métricas

### Analisando Traces

Para visualizar e analisar traces de requisições:

1. Acesse a UI do Jaeger em http://localhost:16686
2. Selecione o serviço "teddy-backoffice-api" no menu suspenso
3. Defina os filtros desejados e clique em "Find Traces"
4. Clique em um trace para ver detalhes e spans individuais

## 🔒 Autenticação

A API usa JWT para autenticação. Rotas protegidas requerem um token JWT válido no cabeçalho Authorization:

```
Authorization: Bearer <seu_token_jwt>
```

Para obter um token, use o endpoint de login de administrador:

```
POST /admin/auth
{
  "login": "admin",
  "password": "password123"
}
```

Para criar um usuário admin, você pode usar a seguinte rota:

```
POST /admin
{
  "login": "admin",
  "password": "password123"
}
```

> 💡 **Nota:** Esta rota foi liberada por se tratar de um repositório de teste, permitindo a criação de usuários admins para facilitar o desenvolvimento e testes.

## 🧪 Executando Testes

```bash
# Testes unitários
npm run test

# Cobertura de testes
npm run test:cov

# TODO: Testes E2E
npm run test:e2e
```

## 📝 Documentação da API

Quando executada no modo de desenvolvimento ou local, a documentação Swagger está disponível em:

```
http://localhost:4000/swagger
```

## 🚀 Desenvolvimento de Painel Administrativo

### Estimativa de Tempo e Recursos

1. **Quanto tempo levaria?**

   - **Fase inicial (MVP)**: 2-3 meses
   - **Desenvolvimento completo**: +3-6 meses
   - **Refinamento e estabilização**: +2-3 meses
   - **Total**: +7-12 meses para uma solução robusta e escalável

   É importante lembrar que o tempo de desenvolvimento pode variar dependendo da complexidade das funcionalidades e das decisões técnicas, além de outros fatores como a experiência do time de desenvolvimento, a comunicação com o cliente e a definição dos requisitos que muitas vezes não são claros no início do projeto e mudam constantemente.

2. **Quantos desenvolvedores?**

   - 1 Tech Lead (responsável pela arquitetura e decisões técnicas, além da parceira com o time de produto para refinar os requisitos e priorizações)
   - 1 Desenvolvedor Sênior/Especialista (para implementações complexas e auxiliar os demais. Também responsável por refinar os requisitos e priorizações)
   - 2 Desenvolvedores Júnior/Pleno (para implementação de features e crescimento técnico)
   - Total: 4 desenvolvedores

3. **Qual a senioridade dos desenvolvedores?**
   - **Tech Lead**: Para um tech lead, além do bom conhecimento técnico, é importante que ele tenha experiência em liderança técnica, gerenciamento de equipes e comunicação com o cliente e produto. É uma maturidade que, na minha visão, pode ser conquistada a partir de 4-5 anos de experiência.
   - **Desenvolvedor Sênior/Especialista**: 4+ anos de experiência, com profundo conhecimento nos pilares da programação. Que tenha bom conhecimento em arquitetura de sistemas, padrões de design e boas práticas de desenvolvimento e, além disso, que consiga transmitir conhecimento e capacitar os demais.
   - **Desenvolvedores Júnior/Pleno**: 1-3 anos de experiência, com conhecimento básico/intermediário em alguma área de desenvolvimento.

Esta estrutura permite que os desenvolvedores mais experientes compartilhem conhecimento com os mais juniores, criando um ambiente de aprendizado contínuo. À medida que o projeto cresce com novas entidades, meios de pagamento e integrações, esta equipe poderá se adaptar e escalar conforme necessário, mantendo a qualidade e a consistência do código.
