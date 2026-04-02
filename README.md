# NexaBank — Digital Banking Management System

A production-ready, cloud-native digital banking platform built with React, Spring Boot microservices, PostgreSQL (local) / Azure SQL (cloud), deployed on Azure App Service with full CI/CD.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Front Door (CDN + Failover)        │
└───────────────────────┬─────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │  Primary Region (EastUS)  │   Secondary Region (WestUS2)
          │                           │
          │  ┌─────────────────────┐  │
          │  │  React Frontend     │  │   (mirrored)
          │  │  (App Service)      │  │
          │  └──────────┬──────────┘  │
          │             │             │
          │  ┌──────────▼──────────┐  │
          │  │   API Gateway       │  │
          │  │ (Spring Cloud GW)   │  │
          │  └──┬───┬────┬────┬───┘  │
          │     │   │    │    │       │
          │  User  Acct  Txn  Notif  │
          │  Svc   Svc   Svc  Svc    │
          │     └───┴────┴────┘      │
          │             │             │
          │  ┌──────────▼──────────┐  │
          │  │   Azure SQL DB      │◄─┼─── Geo-Replication
          │  │ (Failover Group)    │  │
          │  └─────────────────────┘  │
          └───────────────────────────┘
```

### Microservices

| Service | Port | Responsibility |
|---------|------|---------------|
| API Gateway | 8080 | Routing, CORS, logging |
| User Service | 8081 | Customer profiles, onboarding |
| Account Service | 8082 | Account creation, balance management |
| Transaction Service | 8083 | Deposits, withdrawals, transfers |
| Notification Service | 8084 | Event logging, email simulation |
| React Frontend | 3000/80 | Banking dashboard UI |

---

## Quick Start — Local (Docker)

### Prerequisites
- Docker Desktop 4.x+
- Docker Compose v2+
- 8 GB RAM recommended

### 1. Clone & Start

```bash
git clone <your-repo>
cd digital-banking

# Start everything (first run ~5 min to build images)
chmod +x scripts/start-local.sh
./scripts/start-local.sh docker
```

### 2. Access the application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | **React Frontend (Banking UI)** |
| http://localhost:8080 | API Gateway |
| http://localhost:8081/swagger-ui.html | User Service API docs |
| http://localhost:8082/swagger-ui.html | Account Service API docs |
| http://localhost:8083/swagger-ui.html | Transaction Service API docs |

### 3. Run API smoke tests

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

### 4. Stop everything

```bash
docker compose down          # keep data
docker compose down -v       # reset database
```

---

## Quick Start — Local (No Docker)

### Prerequisites
- Java 17
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+ running locally

### 1. Setup database

```bash
psql -U postgres -c "CREATE USER banking WITH PASSWORD 'banking123';"
psql -U postgres -c "CREATE DATABASE banking OWNER banking;"
psql -U banking -d banking -f scripts/init-db.sql
```

### 2. Start all services

```bash
./scripts/start-local.sh local
```

---

## Manual API Examples

### Create a customer
```bash
curl -X POST http://localhost:8080/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@bank.com",
    "phone": "+1-555-0100"
  }'
```

### Create an account
```bash
curl -X POST http://localhost:8080/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "<customer-id>",
    "accountType": "CHECKING",
    "initialDeposit": 1000.00
  }'
```

### Deposit funds
```bash
curl -X POST http://localhost:8080/api/v1/transactions/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "<account-id>",
    "amount": 500.00,
    "description": "Salary"
  }'
```

### Transfer money
```bash
curl -X POST http://localhost:8080/api/v1/transactions/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "<from-id>",
    "destinationAccountId": "<to-id>",
    "amount": 200.00,
    "description": "Rent payment"
  }'
```

---

## Cloud Deployment (Azure)

### Prerequisites
- Azure CLI
- Terraform 1.6+
- Azure subscription

### 1. Create Terraform backend storage

```bash
az group create --name banking-tfstate-rg --location eastus
az storage account create \
  --name bankingtfstate \
  --resource-group banking-tfstate-rg \
  --sku Standard_LRS
az storage container create \
  --name tfstate \
  --account-name bankingtfstate
```

### 2. Deploy infrastructure

```bash
cd terraform
terraform init
terraform plan -var="sql_admin_password=<YourStrongP@ss123>"
terraform apply -var="sql_admin_password=<YourStrongP@ss123>"
```

### 3. Configure GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_CREDENTIALS` | `az ad sp create-for-rbac --sdk-auth` output |
| `ARM_CLIENT_ID` | Service principal client ID |
| `ARM_CLIENT_SECRET` | Service principal secret |
| `ARM_SUBSCRIPTION_ID` | Azure subscription ID |
| `ARM_TENANT_ID` | Azure tenant ID |
| `SQL_ADMIN_PASSWORD` | SQL server password |

### 4. Push to trigger CI/CD

```bash
git push origin main
# GitHub Actions will build, test, and deploy automatically
```

---

## Project Structure

```
digital-banking/
├── docker-compose.yml           # Local dev orchestration
├── scripts/
│   ├── init-db.sql              # Database schema + seed data
│   ├── start-local.sh           # One-command local startup
│   ├── stop-local.sh            # Stop local services
│   └── test-api.sh              # API smoke tests
├── frontend/                    # React 18 + Recharts banking UI
│   ├── src/
│   │   ├── pages/               # Dashboard, Accounts, Transactions, Transfer, Customers
│   │   ├── components/common/   # Layout, UI components
│   │   └── services/api.js      # Axios API client
│   ├── Dockerfile
│   └── nginx.conf
├── services/
│   ├── api-gateway/             # Spring Cloud Gateway
│   ├── user-service/            # Customer management
│   ├── account-service/         # Account management
│   ├── transaction-service/     # Deposits/withdrawals/transfers
│   └── notification-service/    # Event notifications
├── terraform/
│   ├── main.tf                  # Full Azure infrastructure
│   ├── variables.tf
│   ├── outputs.tf
│   └── providers.tf
└── .github/workflows/
    └── ci-cd.yml                # Full CI/CD pipeline
```

---

## High Availability & Failover

- **Azure Front Door** routes traffic globally; if primary region fails, traffic auto-routes to secondary
- **SQL Failover Group** with 60-minute automatic failover (read-write endpoint stays the same)  
- **Active-Passive** deployment: primary handles all traffic; secondary is warm standby
- **Health probes** on all App Services detect failures within 30 seconds

## Security

- Secrets stored in **Azure Key Vault**, referenced via `@Microsoft.KeyVault()` in App Settings
- **Managed Identity** assigned to each App Service for passwordless Key Vault access
- HTTPS-only enforced at Front Door layer
- Per-schema database isolation between microservices

## Monitoring

- **Application Insights** captures all service telemetry
- Spring Boot Actuator `/health` endpoints for readiness/liveness
- Log Analytics Workspace retains 30 days of logs

---

## Seed Data

The database ships with 3 demo customers and 4 accounts:

| Customer | Email | Accounts |
|----------|-------|----------|
| John Doe | john.doe@example.com | Checking ($15k), Savings ($50k) |
| Jane Smith | jane.smith@example.com | Checking ($8.5k) |
| Michael Johnson | michael.j@example.com | Savings ($125k) |
