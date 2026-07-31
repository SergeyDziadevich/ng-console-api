# Application Architecture

This diagram illustrates the overall system architecture, including the Angular frontend, NestJS backend API, data stores, messaging system, and observability tools, along with new features such as real-time WebSockets, Stripe Payments, Google Drive Integration, and Vector DB for RAG.

```mermaid
flowchart TD
    User([User]) -->|HTTP/Web| Frontend["Angular Frontend<br/>(ng-console)"]
    
    subgraph ApplicationStack [Application Stack]
        Frontend
        
        subgraph Backend [NestJS Backend API]
            Gateway[API Gateway / Controllers]
            
            mAuth[Auth Module]
            mUsers[Users Module]
            mTickets[Tickets Module]
            mChat[Chat & WS Module]
            mPayments[Payments Module]
            mDocs[Documents Module]
            mIntegration[Integrations Module]
            mAI[AI Module]
            mEmail[Email Module]
            
            Gateway --> mAuth & mUsers & mTickets & mChat & mPayments & mDocs & mIntegration & mAI & mEmail
        end
    end

    Frontend -->|HTTP/REST| Gateway
    Frontend -->|WebSocket| mChat

    subgraph ExternalServices [External Services]
        GenAI["Google GenAI"]
        SMTP["SMTP Service"]
        Stripe["Stripe API"]
        GoogleDrive["Google Drive API"]
    end
    
    mAI --> GenAI
    mEmail --> SMTP
    mPayments --> Stripe
    mIntegration --> GoogleDrive

    subgraph DataAndStorage [Data & Storage]
        Redis[("Redis")]
        Mongo[("MongoDB")]
        Postgres[("PostgreSQL")]
        VectorDB[("Vector DB")]
    end
    
    mChat --> Redis
    mUsers --> Mongo
    mDocs --> Mongo
    mDocs -.-> VectorDB
    mTickets --> Postgres
    mAI --> VectorDB
    
    subgraph EventStreaming [Event Streaming]
        Kafka["Kafka Broker"]
        Zookeeper["Zookeeper"]
        KafkaUI["Kafka UI"] -.->|Monitor| Kafka
    end
    
    mTickets -->|Pub/Sub| Kafka
    mEmail -->|Listen| Kafka
    Kafka --> Zookeeper
    
    subgraph Observability
        Prometheus["Prometheus"]
        Grafana["Grafana"]
    end
    
    Prometheus -->|Scrape| Gateway
    Grafana -->|Visualize| Prometheus
```
