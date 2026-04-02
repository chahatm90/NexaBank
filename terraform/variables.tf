variable "project" {
  description = "Project name prefix"
  type        = string
  default     = "nexabank"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "primary_location" {
  description = "Primary Azure region"
  type        = string
  default     = "eastus"
}

variable "secondary_location" {
  description = "Secondary Azure region for HA"
  type        = string
  default     = "westus2"
}

variable "sql_admin_login" {
  description = "SQL Server admin login"
  type        = string
  default     = "bankingadmin"
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Server admin password"
  type        = string
  sensitive   = true
}

variable "app_service_sku" {
  description = "App Service Plan SKU"
  type        = string
  default     = "P1v3"
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Project     = "NexaBank"
    ManagedBy   = "Terraform"
    Environment = "prod"
  }
}
