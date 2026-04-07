terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
  }
  backend "azurerm" {
    resource_group_name  = "banking-tfstate-rg"
    storage_account_name = "bankingtfstate321"
    container_name       = "tfstate"
    key                  = "banking.terraform.tfstate"
  }
}
provider "azurerm" {
  features {}
}