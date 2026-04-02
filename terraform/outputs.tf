output "frontend_url" {
  description = "Azure Front Door frontend URL"
  value       = "https://${azurerm_cdn_frontdoor_endpoint.frontend.host_name}"
}

output "primary_api_gateway_url" {
  description = "Primary API Gateway URL"
  value       = "https://${azurerm_linux_web_app.services_primary["api-gateway"].default_hostname}"
}

output "secondary_api_gateway_url" {
  description = "Secondary API Gateway URL"
  value       = "https://${azurerm_linux_web_app.services_secondary["api-gateway"].default_hostname}"
}

output "sql_failover_group_fqdn" {
  description = "SQL Failover Group FQDN (read-write)"
  value       = "${azurerm_mssql_failover_group.banking.name}.database.windows.net"
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
  description = "All primary service URLs"
  value = {
    for svc, app in azurerm_linux_web_app.services_primary :
    svc => "https://${app.default_hostname}"
  }
}
