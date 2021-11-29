provider "azurerm" {
  features {}
}

locals {
  env  = "${var.env == "idam-preview" && var.product == "idam" ? "idam-dev" : var.env}"
  tags = "${merge(var.common_tags, map("environment", local.env))}"
}

data "azurerm_virtual_network" "idam" {
  name                = "core-infra-vnet-${var.env}"
  resource_group_name = "core-infra-${var.env}"
}

data "azurerm_subnet" "redis" {
  name                 = element(data.azurerm_virtual_network.idam.subnets, 3)
  virtual_network_name = data.azurerm_virtual_network.idam.name
  resource_group_name  = "core-infra-${var.env}"
}

data "azurerm_key_vault" "idam" {
  name                = local.vault_name
  resource_group_name = "idam-${var.env}"
}
