// Infrastructural variables

variable "product" {}

variable "component" {}

variable "location" {
  default = "UK South"
}

variable "app" {
  default = "user-dashboard"
}

variable "env" {}

variable "subscription" {}

variable "deployment_namespace" {}

variable "common_tags" {
  type = map(string)
}
