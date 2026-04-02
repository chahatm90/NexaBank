locals {
  prefix = "${var.project}-${var.environment}"
  services = ["api-gateway", "user-service", "account-service", "transaction-service", "notification-service", "frontend"]
}

# ── Resource Groups ───────────────────────────────────────────
resource "azurerm_resource_group" "primary" {
  name     = "${local.prefix}-primary-rg"
  location = var.primary_location
  tags     = var.tags
}

resource "azurerm_resource_group" "secondary" {
  name     = "${local.prefix}-secondary-rg"
  location = var.secondary_location
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
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id
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
  name                         = "${local.prefix}-sql-primary"
  resource_group_name          = azurerm_resource_group.primary.name
  location                     = azurerm_resource_group.primary.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_login
  administrator_login_password = var.sql_admin_password
  tags                         = var.tags
}

resource "azurerm_mssql_server" "secondary" {
  name                         = "${local.prefix}-sql-secondary"
  resource_group_name          = azurerm_resource_group.secondary.name
  location                     = azurerm_resource_group.secondary.location
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
  max_size_gb    = 32
  sku_name       = "GP_Gen5_2"
  zone_redundant = false
  tags           = var.tags
}

resource "azurerm_mssql_failover_group" "banking" {
  name      = "${local.prefix}-fog"
  server_id = azurerm_mssql_server.primary.id
  databases = [azurerm_mssql_database.banking.id]

  partner_server {
    id = azurerm_mssql_server.secondary.id
  }

  read_write_endpoint_failover_policy {
    mode          = "Automatic"
    grace_minutes = 60
  }

  tags = var.tags
}

# ── App Service Plans ─────────────────────────────────────────
resource "azurerm_service_plan" "primary" {
  name                = "${local.prefix}-asp-primary"
  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = var.tags
}

resource "azurerm_service_plan" "secondary" {
  name                = "${local.prefix}-asp-secondary"
  resource_group_name = azurerm_resource_group.secondary.name
  location            = azurerm_resource_group.secondary.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku
  tags                = var.tags
}

# ── App Services (primary) ────────────────────────────────────
resource "azurerm_linux_web_app" "services_primary" {
  for_each = toset(local.services)

  name                = "${local.prefix}-${each.key}-primary"
  resource_group_name = azurerm_resource_group.primary.name
  location            = azurerm_resource_group.primary.location
  service_plan_id     = azurerm_service_plan.primary.id

  site_config {
    always_on = true
    application_stack {
      java_server         = each.key != "frontend" ? "JAVA" : null
      java_server_version = each.key != "frontend" ? "17" : null
      java_version        = each.key != "frontend" ? "17" : null
      node_version        = each.key == "frontend" ? "20-lts" : null
    }
    health_check_path = each.key != "frontend" ? "/actuator/health" : "/"
  }

  app_settings = {
    SPRING_DATASOURCE_URL      = "jdbc:sqlserver://${azurerm_mssql_failover_group.banking.name}.database.windows.net:1433;database=banking"
    SPRING_DATASOURCE_USERNAME = var.sql_admin_login
    APPINSIGHTS_INSTRUMENTATIONKEY = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=appinsights-instrumentation-key)"
    USER_SERVICE_URL           = "https://${local.prefix}-user-service-primary.azurewebsites.net"
    ACCOUNT_SERVICE_URL        = "https://${local.prefix}-account-service-primary.azurewebsites.net"
    TRANSACTION_SERVICE_URL    = "https://${local.prefix}-transaction-service-primary.azurewebsites.net"
    NOTIFICATION_SERVICE_URL   = "https://${local.prefix}-notification-service-primary.azurewebsites.net"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# ── App Services (secondary) ──────────────────────────────────
resource "azurerm_linux_web_app" "services_secondary" {
  for_each = toset(local.services)

  name                = "${local.prefix}-${each.key}-secondary"
  resource_group_name = azurerm_resource_group.secondary.name
  location            = azurerm_resource_group.secondary.location
  service_plan_id     = azurerm_service_plan.secondary.id

  site_config {
    always_on = true
    application_stack {
      java_server         = each.key != "frontend" ? "JAVA" : null
      java_server_version = each.key != "frontend" ? "17" : null
      java_version        = each.key != "frontend" ? "17" : null
      node_version        = each.key == "frontend" ? "20-lts" : null
    }
    health_check_path = each.key != "frontend" ? "/actuator/health" : "/"
  }

  app_settings = {
    SPRING_DATASOURCE_URL    = "jdbc:sqlserver://${azurerm_mssql_failover_group.banking.name}.database.windows.net:1433;database=banking"
    SPRING_DATASOURCE_USERNAME = var.sql_admin_login
    USER_SERVICE_URL         = "https://${local.prefix}-user-service-secondary.azurewebsites.net"
    ACCOUNT_SERVICE_URL      = "https://${local.prefix}-account-service-secondary.azurewebsites.net"
    TRANSACTION_SERVICE_URL  = "https://${local.prefix}-transaction-service-secondary.azurewebsites.net"
    NOTIFICATION_SERVICE_URL = "https://${local.prefix}-notification-service-secondary.azurewebsites.net"
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
  name                          = "frontend-primary"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id
  enabled                       = true
  host_name                     = azurerm_linux_web_app.services_primary["frontend"].default_hostname
  origin_host_header            = azurerm_linux_web_app.services_primary["frontend"].default_hostname
  priority                      = 1
  weight                        = 1000
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_origin" "frontend_secondary" {
  name                          = "frontend-secondary"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id
  enabled                       = true
  host_name                     = azurerm_linux_web_app.services_secondary["frontend"].default_hostname
  origin_host_header            = azurerm_linux_web_app.services_secondary["frontend"].default_hostname
  priority                      = 2
  weight                        = 1000
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_route" "frontend" {
  name                          = "frontend-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.frontend.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.frontend_primary.id, azurerm_cdn_frontdoor_origin.frontend_secondary.id]
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
