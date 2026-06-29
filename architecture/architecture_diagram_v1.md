# NestJS Backend Architecture Diagram

This diagram visualizes the high-level architecture of your Cloud Console NestJS backend. It illustrates the primary modules, how they interact, and their connections to external infrastructure dependencies.

```mermaid
flowchart TD
    %% Client Layer
    Client([Frontend Clients / ng-console])
    
    %% API Layer
    subgraph APILayer [API Layer]
        REST["REST API (Controllers)"]
        GQL["GraphQL API (Resolvers)"]
        WS["WebSockets (Socket.IO Gateways)"]
    end
    
    Client -- HTTP --> REST
    Client -- HTTP --> GQL
    Client -- WS --> WS

    %% Core Application Layer
    subgraph CoreApp [NestJS Application Core]
        Auth["Auth Module (JWT/Google OAuth/2FA)"]
        Users["Users Module"]
        Posts["Posts Module"]
        Tickets["Tickets Module"]
        Chat["Chat Module"]
        AI["AI Module (Firebase Genkit)"]
        Notifications["Notifications Module"]
        
        %% Kafka Integration
        subgraph KafkaApp [Event Streaming]
            KafkaProducer["Kafka Producer Service"]
            KafkaConsumer["Kafka Consumer Service"]
            EmailModule["Email Module (Nodemailer)"]
        end
    end
    
    REST --> Auth
    REST --> Users
    REST --> Tickets
    REST --> AI
    GQL --> Posts
    GQL --> Users
    WS --> Chat
    WS --> Notifications
    
    Auth --> Users
    Tickets --> KafkaProducer
    KafkaConsumer --> EmailModule
    
    %% External Infrastructure
    subgraph Infrastructure [External Infrastructure]
        MongoDB[(MongoDB)]
        Postgres[(PostgreSQL)]
        Redis[(Redis)]
        KafkaBroker[[Apache Kafka]]
        Zookeeper[[Zookeeper]]
        SMTP[("SMTP / Email Provider")]
    end
    
    %% Connections
    Users -- "Mongoose" --> MongoDB
    Posts -- "Mongoose" --> MongoDB
    Tickets -- "TypeORM" --> Postgres
    
    Chat -- "Pub/Sub" --> Redis
    Notifications -- "Pub/Sub / Caching" --> Redis
    
    KafkaProducer -- "Publishes to 'email.notification'" --> KafkaBroker
    KafkaBroker -- "Consumes from 'email.notification'" --> KafkaConsumer
    
    KafkaBroker -.- Zookeeper
    EmailModule -- "Sends Mail" --> SMTP
    
    %% Styling
    classDef api fill:#4a90e2,stroke:#333,stroke-width:2px,color:#fff;
    classDef module fill:#e0234e,stroke:#333,stroke-width:2px,color:#fff;
    classDef infra fill:#3b3b3b,stroke:#333,stroke-width:2px,color:#fff;
    classDef event fill:#8e44ad,stroke:#333,stroke-width:2px,color:#fff;
    
    class REST,GQL,WS api;
    class Auth,Users,Posts,Tickets,Chat,AI,Notifications module;
    class MongoDB,Postgres,Redis,Zookeeper,SMTP infra;
    class KafkaBroker,KafkaProducer,KafkaConsumer,EmailModule event;
```

> [!NOTE]
> - **Red Nodes**: NestJS Core Modules
> - **Purple Nodes**: Kafka-driven Event Streaming & Modules
> - **Blue Nodes**: API Ingress points
> - **Dark Nodes**: External Infrastructure and Databases
