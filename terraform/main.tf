locals {
  prefix   = "${var.project}-${var.environment}"
  services = ["api-gateway", "user-service", "account-service", "transaction-service", "notification-service", "frontend"]
}

# ── Resource Group ────────────────────────────────────────────
resource "azurerm_resource_group" "primary" {
  name     = "${local.prefix}-primary-rg"
  location = var.primary_location
  tags     = var.tags
}

# ── Application Insights ──────────────────────────────────────
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.prefix}-law"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_application_insights" "main" {
  name                = "${local.prefix}-appinsights"
  location            = azurerm_resource_group.primary.location
  resource_group_name = azurerm_resource_group.primary.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = var.tags
}

# ── Key Vault ─────────────────────────────────────────────────
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = "${local.prefix}-kv"
  location                   = azurerm_resource_group.primary.location
  resource_group_name        = azurerm_resource_group.primary.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = var.tags

  access_policy {
    tenant_id          = data.azurerm_client_config.current.tenant_id
    object_id          = data.azurerm_client_config.current.object_id
    secret_permissions = ["Get", "List", "Set", "Delete", "Purge"]
  }

  access_policy {
    tenant_id          = "dee031d3-1542-40e9-acdf-313377dc424f"
    object_id          = "bf4d9924-9ae6-4c52-8a08-4c725368f0e6"
    secret_permissions = ["Get", "List", "Set", "Delete", "Purge"]
  }
}

resource "azurerm_key_vault_secret" "sql_password" {
  name         = "sql-admin-password"
  value        = var.sql_admin_password
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "appinsights_key" {
  name         = "appinsights-instrumentation-key"
  value        = azurerm_application_insights.main.instrumentation_key
  key_vault_id = azurerm_key_vault.main.id
}

# ── SQL Server ────────────────────────────────────────────────
resource "azurerm_mssql_server" "primary" {
  name                         = "${local.prefix}-sqlsvr"
  resource_group_name          = azurerm_resource_group.primary.name
  location                     = "westus2"
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
  tags                         = var.tags
}

resource "azurerm_mssql_database" "banking" {
  name           = "banking"
  server_id      = azurerm_mssql_server.primary.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = 2
  sku_name       = "S0"
  zone_redundant = false
  tags           = var.tags
}

# ── App Service Plan ──────────────────────────────────────────
resource "azurerm_service_plan" "primary" {
  name                = "${local.prefix}-asp-primary"
  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  os_type             = "Linux"
  sku_name            = "F1"
  tags                = var.tags
}

# ── App Services ──────────────────────────────────────────────
resource "azurerm_linux_web_app" "services_primary" {
  for_each = toset(local.services)

  name                = "${local.prefix}-${each.key}"
  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  service_plan_id     = azurerm_service_plan.primary.id

  site_config {
    always_on = false
    application_stack {
      java_server         = each.key != "frontend" ? "JAVA" : null
      java_server_version = each.key != "frontend" ? "17" : null
      java_version        = each.key != "frontend" ? "17" : null
      node_version        = each.key == "frontend" ? "20-lts" : null
    }
    health_check_path = each.key != "frontend" ? "/actuator/health" : "/"
  }

  app_settings = {
    SPRING_DATASOURCE_URL          = "jdbc:sqlserver://${azurerm_mssql_server.primary.fully_qualified_domain_name}:1433;database=banking;encrypt=true;trustServerCertificate=false"
    SPRING_DATASOURCE_USERNAME     = var.sql_admin_login
    SPRING_DATASOURCE_PASSWORD     = var.sql_admin_password
    APPINSIGHTS_INSTRUMENTATIONKEY = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=appinsights-instrumentation-key)"
    USER_SERVICE_URL               = "https://${local.prefix}-user-service.azurewebsites.net"
    ACCOUNT_SERVICE_URL            = "https://${local.prefix}-account-service.azurewebsites.net"
    TRANSACTION_SERVICE_URL        = "https://${local.prefix}-transaction-service.azurewebsites.net"
    NOTIFICATION_SERVICE_URL       = "https://${local.prefix}-notification-service.azurewebsites.net"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# ── Azure Front Door ──────────────────────────────────────────
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${local.prefix}-afd"
  resource_group_name = azurerm_resource_group.primary.name
  sku_name            = "Standard_AzureFrontDoor"
  tags                = var.tags
}

resource "azurerm_cdn_frontdoor_endpoint" "frontend" {
  name                     = "${local.prefix}-frontend"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  tags                     = var.tags
}

resource "azurerm_cdn_frontdoor_origin_group" "frontend" {
  name                     = "frontend-og"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  health_probe {
    interval_in_seconds = 30
    path                = "/"
    protocol            = "Https"
    request_type        = "GET"
  }

  load_balancing {
    additional_latency_in_milliseconds = 0
    sample_size                        = 4
    successful_samples_required        = 2
  }

  session_affinity_enabled = false
}

resource "azurerm_cdn_frontdoor_origin" "frontend_primary" {
  name                           = "frontend-primary"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.frontend.id
  enabled                        = true
  host_name                      = azurerm_linux_web_app.services_primary["frontend"].default_hostname
  origin_host_header             = azurerm_linux_web_app.services_primary["frontend"].default_hostname
  priority                       = 1
  weight                         = 1000
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_route" "frontend" {
  name                          = "frontend-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.frontend.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.frontend_primary.id]
  supported_protocols           = ["Http", "Https"]
  patterns_to_match             = ["/*"]
  forwarding_protocol           = "HttpsOnly"
  https_redirect_enabled        = true
}

# ── Key Vault access for App Services ────────────────────────
resource "azurerm_key_vault_access_policy" "app_services" {
  for_each = azurerm_linux_web_app.services_primary

  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = each.value.identity[0].tenant_id
  object_id    = each.value.identity[0].principal_id

  secret_permissions = ["Get", "List"]
}
