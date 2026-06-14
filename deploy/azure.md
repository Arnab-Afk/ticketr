# Deploy ticketr to Azure with containers

This guide deploys **ticketr** to [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/) with **Azure Database for PostgreSQL** and **Azure Container Registry**.

## Architecture

```text
Internet → Azure Container Apps (ticketr image) → PostgreSQL Flexible Server
                    ↓
            Azure Container Registry (ACR)
```

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az`) logged in: `az login`
- [Docker](https://docs.docker.com/get-docker/) for building the image
- A domain or Azure-provided URL for `AUTH_URL` / `NEXT_PUBLIC_APP_URL`

## 1. Test locally with Docker

```bash
cp .env.example .env
# Generate a secret: openssl rand -base64 32
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Demo accounts are seeded on first run (`SEED_DATABASE=true` in compose).

## 2. Create Azure resources

Set variables (change names/region as needed):

```bash
RESOURCE_GROUP=ticketr-rg
LOCATION=eastus
ACR_NAME=ticketracr$RANDOM
APP_NAME=ticketr-app
ENV_NAME=ticketr-env
PG_SERVER=ticketr-pg-$RANDOM
PG_USER=ticketr
PG_PASSWORD="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)"
AUTH_SECRET="$(openssl rand -base64 32)"
```

Create the resource group and container registry:

```bash
az group create --name $RESOURCE_GROUP --location $LOCATION

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

Create PostgreSQL Flexible Server:

```bash
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --location $LOCATION \
  --admin-user $PG_USER \
  --admin-password "$PG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --public-access 0.0.0.0
```

Allow Azure services to reach Postgres (Container Apps egress):

```bash
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

Create the application database:

```bash
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $PG_SERVER \
  --database-name ticketr
```

Connection string:

```bash
DATABASE_URL="postgresql://${PG_USER}:${PG_PASSWORD}@${PG_SERVER}.postgres.database.azure.com:5432/ticketr?sslmode=require"
```

## 3. Build and push the image

```bash
az acr login --name $ACR_NAME

docker build -t $ACR_NAME.azurecr.io/ticketr:latest .
docker push $ACR_NAME.azurecr.io/ticketr:latest
```

## 4. Deploy to Container Apps

```bash
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

az containerapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image $ACR_NAME.azurecr.io/ticketr:latest \
  --registry-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_NAME \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --env-vars \
    DATABASE_URL="$DATABASE_URL" \
    AUTH_SECRET="$AUTH_SECRET" \
    SEED_DATABASE=true
```

After deploy, get the public URL:

```bash
FQDN=$(az containerapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" -o tsv)

echo "https://$FQDN"
```

Set the public URL on the app (required for auth links and emails):

```bash
az containerapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    AUTH_URL="https://$FQDN" \
    NEXT_PUBLIC_APP_URL="https://$FQDN" \
    SEED_DATABASE=false
```

> **Note:** Set `SEED_DATABASE=true` only on the first deployment. Turn it off afterward so restarts do not re-seed.

## 5. Optional: email, OAuth, attachments

Add secrets via Container Apps (preferred for production):

```bash
az containerapp secret set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --secrets zepto-key=YOUR_ZEPTO_KEY

az containerapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    ZEPTO_FROM_ADDRESS=support@yourdomain.com \
    ZEPTO_API_KEY=secretref:zepto-key
```

See `.env.example` for OAuth and R2 variables.

## 6. Updates

Rebuild and redeploy:

```bash
docker build -t $ACR_NAME.azurecr.io/ticketr:latest .
docker push $ACR_NAME.azurecr.io/ticketr:latest

az containerapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_NAME.azurecr.io/ticketr:latest
```

The container entrypoint runs `prisma db push` on startup to apply schema changes.

## Health checks

Azure Container Apps can probe `GET /api/health`. The Docker image includes a built-in health check on the same endpoint.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App crashes on start | Check logs: `az containerapp logs show -n $APP_NAME -g $RESOURCE_GROUP --follow` |
| Database connection failed | Verify `DATABASE_URL`, firewall rules, and `?sslmode=require` for Azure Postgres |
| Login redirect loop | Ensure `AUTH_URL` matches the public HTTPS URL exactly |
| Emails not sending | Configure ZeptoMail env vars; they are optional |

## Alternative: Azure App Service

App Service also supports custom containers. Use the same image from ACR, set port **3000**, and configure the same environment variables in **Configuration → Application settings**.
