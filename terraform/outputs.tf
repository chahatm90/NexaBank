output "frontend_url" {
  description = "Azure Front Door frontend URL"
  value       = "https://${azurerm_cdn_frontdoor_endpoint.frontend.host_name}"
}

output "primary_api_gateway_url" {
  description = "API Gateway URL"
  value       = "https://${azurerm_linux_web_app.services_primary["api-gateway"].default_hostname}"
}

output "sql_server_fqdn" {
  description = "SQL Server FQDN"
  value       = azurerm_mssql_server.primary.fully_qualified_domain_name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "app_insights_instrumentation_key" {
  description = "Application Insights key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "primary_service_urls" {
  description = "All service URLs"
  value = {
    for svc, app in azurerm_linux_web_app.services_primary :
    svc => "https://${app.default_hostname}"
  }
}