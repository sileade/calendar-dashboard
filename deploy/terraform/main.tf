terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

variable "kiosks" {
  description = "List of kiosk configurations"
  type = list(object({
    name             = string
    ip_address       = string
    display_rotation = string
    calendar_url     = string
    homer_url        = string
  }))
  default = [
    {
      name             = "calendar-kiosk-1"
      ip_address       = "192.168.1.100"
      display_rotation = "0"
      calendar_url     = "https://your-calendar-dashboard.manus.space"
      homer_url        = "http://homer.local:8080"
    }
  ]
}

variable "ssh_key_path" {
  description = "Path to SSH private key for Ansible"
  type        = string
  default     = "~/.ssh/id_rsa_kiosk"
}

variable "timezone" {
  description = "Timezone for kiosks"
  type        = string
  default     = "Europe/Moscow"
}

variable "enable_monitoring" {
  description = "Enable Grafana Loki monitoring"
  type        = bool
  default     = true
}

variable "loki_url" {
  description = "Grafana Loki URL"
  type        = string
  default     = "http://loki.local:3100"
}

variable "grafana_url" {
  description = "Grafana URL"
  type        = string
  default     = "http://grafana.local:3000"
}

# Generate Ansible inventory
resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/templates/inventory.yml.tpl", {
    kiosks           = var.kiosks
    ssh_key_path     = var.ssh_key_path
    timezone         = var.timezone
    enable_monitoring = var.enable_monitoring
    loki_url         = var.loki_url
    grafana_url      = var.grafana_url
  })
  filename = "${path.module}/../ansible/inventory/hosts.yml"
}

# Generate kiosk-specific configurations
resource "local_file" "kiosk_configs" {
  for_each = { for k in var.kiosks : k.name => k }
  
  content = templatefile("${path.module}/templates/kiosk-env.tpl", {
    calendar_url = each.value.calendar_url
    homer_url    = each.value.homer_url
    rotation     = each.value.display_rotation
    timezone     = var.timezone
  })
  filename = "${path.module}/output/${each.key}.env"
}

output "kiosk_ips" {
  description = "IP addresses of configured kiosks"
  value       = { for k in var.kiosks : k.name => k.ip_address }
}

output "ansible_command" {
  description = "Command to run Ansible playbook"
  value       = "cd ../ansible && ansible-playbook -i inventory/hosts.yml playbooks/site.yml"
}
