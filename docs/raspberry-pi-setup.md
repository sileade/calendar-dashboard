# Raspberry Pi Kiosk Mode Setup Guide

This comprehensive guide covers the complete process of deploying Calendar Dashboard on a Raspberry Pi as a wall-mounted kiosk display. The guide includes all necessary scripts, configurations, and automation tools for a production-ready deployment.

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Operating System Installation](#operating-system-installation)
3. [Initial System Configuration](#initial-system-configuration)
4. [Chromium Kiosk Setup](#chromium-kiosk-setup)
5. [Homer Integration](#homer-integration)
6. [Ansible Automation](#ansible-automation)
7. [Terraform Infrastructure](#terraform-infrastructure)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Troubleshooting](#troubleshooting)

## Hardware Requirements

The following table outlines the recommended hardware specifications for optimal performance:

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Raspberry Pi Model | Pi 3B+ | Pi 4 (4GB) or Pi 5 |
| Storage | 16GB microSD | 32GB+ microSD (A2 rated) |
| Display | 7" touchscreen | 10"+ touchscreen or HDMI monitor |
| Power Supply | 5V 2.5A | 5V 3A (official PSU) |
| Cooling | Passive heatsink | Active cooling for 24/7 operation |
| Case | Any | Wall-mountable enclosure |

For touchscreen displays, the official Raspberry Pi 7" touchscreen or any HDMI-connected monitor with a separate USB touch controller works well. The application supports both mouse and touch input.

## Operating System Installation

### Step 1: Download Raspberry Pi OS

Download Raspberry Pi OS Lite (64-bit) from the official website. The Lite version is recommended for kiosk deployments as it has a smaller footprint and faster boot times.

### Step 2: Flash the Image

Use Raspberry Pi Imager to flash the image to your microSD card. Before flashing, configure the following settings in the imager:

| Setting | Value |
|---------|-------|
| Hostname | `calendar-kiosk` |
| Enable SSH | Yes |
| Username | `pi` |
| Password | Your secure password |
| WiFi | Configure if not using Ethernet |
| Locale | Your timezone |

### Step 3: First Boot Configuration

Insert the microSD card and power on the Raspberry Pi. Connect via SSH:

```bash
ssh pi@calendar-kiosk.local
```

## Initial System Configuration

### System Update Script

Create and run the initial setup script:

```bash
#!/bin/bash
# File: /home/pi/scripts/initial-setup.sh

set -e

echo "=== Calendar Kiosk Initial Setup ==="

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt install -y \
    chromium-browser \
    xserver-xorg \
    x11-xserver-utils \
    xinit \
    openbox \
    lightdm \
    unclutter \
    xdotool \
    fonts-noto \
    fonts-liberation \
    plymouth \
    plymouth-themes \
    network-manager

# Install Node.js for local development (optional)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Configure automatic login
echo "Configuring automatic login..."
sudo raspi-config nonint do_boot_behaviour B4

# Disable screen blanking
echo "Disabling screen blanking..."
sudo raspi-config nonint do_blanking 1

# Set GPU memory
echo "Setting GPU memory..."
sudo raspi-config nonint do_memory_split 128

# Enable hardware acceleration
echo "Enabling hardware acceleration..."
if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/config.txt; then
    echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/config.txt
fi

echo "Initial setup complete. Reboot required."
echo "Run: sudo reboot"
```

Save this script and execute it:

```bash
chmod +x /home/pi/scripts/initial-setup.sh
/home/pi/scripts/initial-setup.sh
sudo reboot
```

### Display Configuration

For touchscreen displays, create the display configuration file:

```bash
# File: /etc/X11/xorg.conf.d/99-calibration.conf

Section "InputClass"
    Identifier "calibration"
    MatchProduct "FT5406 memory based driver"
    Option "Calibration" "0 800 0 480"
    Option "SwapAxes" "0"
EndSection
```

For HDMI displays with rotation:

```bash
# File: /boot/config.txt (append)

# Display rotation (0, 90, 180, 270)
display_rotate=0

# Force HDMI output
hdmi_force_hotplug=1
hdmi_group=2
hdmi_mode=82  # 1920x1080 60Hz
```

## Chromium Kiosk Setup

### Kiosk Startup Script

Create the main kiosk startup script:

```bash
#!/bin/bash
# File: /home/pi/scripts/kiosk.sh

set -e

# Configuration
CALENDAR_URL="${CALENDAR_URL:-https://your-calendar-dashboard.manus.space}"
HOMER_URL="${HOMER_URL:-http://homer.local:8080}"
KIOSK_ROTATION="${KIOSK_ROTATION:-0}"

# Export display
export DISPLAY=:0

# Wait for X server
while ! xdpyinfo >/dev/null 2>&1; do
    echo "Waiting for X server..."
    sleep 1
done

# Disable screen saver and power management
xset s off
xset s noblank
xset -dpms

# Hide cursor after 3 seconds of inactivity
unclutter -idle 3 -root &

# Rotate display if needed
if [ "$KIOSK_ROTATION" != "0" ]; then
    xrandr --output HDMI-1 --rotate $KIOSK_ROTATION 2>/dev/null || true
    xrandr --output DSI-1 --rotate $KIOSK_ROTATION 2>/dev/null || true
fi

# Clear Chromium crash flags
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' \
    /home/pi/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' \
    /home/pi/.config/chromium/Default/Preferences 2>/dev/null || true

# Start Chromium in kiosk mode
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --disable-component-update \
    --disable-background-networking \
    --disable-sync \
    --disable-translate \
    --disable-features=TranslateUI \
    --disable-default-apps \
    --disable-extensions \
    --disable-hang-monitor \
    --disable-popup-blocking \
    --disable-prompt-on-repost \
    --disable-background-timer-throttling \
    --disable-renderer-backgrounding \
    --disable-backgrounding-occluded-windows \
    --autoplay-policy=no-user-gesture-required \
    --check-for-update-interval=31536000 \
    --enable-features=OverlayScrollbar \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    --ignore-gpu-blocklist \
    --start-fullscreen \
    --start-maximized \
    --window-position=0,0 \
    --user-data-dir=/home/pi/.config/chromium-kiosk \
    "$CALENDAR_URL"
```

Make the script executable:

```bash
chmod +x /home/pi/scripts/kiosk.sh
```

### Openbox Autostart Configuration

Configure Openbox to start the kiosk automatically:

```bash
# File: /home/pi/.config/openbox/autostart

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Start kiosk
/home/pi/scripts/kiosk.sh &
```

Create the directory and file:

```bash
mkdir -p /home/pi/.config/openbox
cat > /home/pi/.config/openbox/autostart << 'EOF'
xset s off
xset s noblank
xset -dpms
/home/pi/scripts/kiosk.sh &
EOF
```

### Systemd Service

Create a systemd service for reliable kiosk management:

```ini
# File: /etc/systemd/system/calendar-kiosk.service

[Unit]
Description=Calendar Dashboard Kiosk
After=graphical.target
Wants=graphical.target

[Service]
Type=simple
User=pi
Group=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
Environment=CALENDAR_URL=https://your-calendar-dashboard.manus.space
Environment=HOMER_URL=http://homer.local:8080
ExecStart=/home/pi/scripts/kiosk.sh
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
```

Enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable calendar-kiosk.service
sudo systemctl start calendar-kiosk.service
```

### Environment Configuration

Create an environment file for easy configuration:

```bash
# File: /home/pi/.kiosk-env

# Calendar Dashboard URL
CALENDAR_URL=https://your-calendar-dashboard.manus.space

# Homer Dashboard URL (for swipe navigation)
HOMER_URL=http://homer.local:8080

# Display rotation (0, 90, 180, 270 or normal, left, right, inverted)
KIOSK_ROTATION=0

# Auto-refresh interval in minutes (0 to disable)
AUTO_REFRESH_INTERVAL=5

# Timezone
TZ=Europe/Moscow
```

Update the kiosk script to source this file:

```bash
# Add at the beginning of /home/pi/scripts/kiosk.sh
if [ -f /home/pi/.kiosk-env ]; then
    source /home/pi/.kiosk-env
fi
```

## Homer Integration

### Installing Homer

Homer can be installed on the same Raspberry Pi or a separate server. For local installation:

```bash
#!/bin/bash
# File: /home/pi/scripts/install-homer.sh

set -e

# Create Homer directory
mkdir -p /home/pi/homer
cd /home/pi/homer

# Download Homer
HOMER_VERSION="23.10.1"
wget -q "https://github.com/bastienwirtz/homer/releases/download/v${HOMER_VERSION}/homer.zip"
unzip -o homer.zip
rm homer.zip

# Create configuration
cat > config.yml << 'EOF'
title: "Home Dashboard"
subtitle: "Smart Home Control"
logo: "logo.png"

header: true
footer: false

columns: "3"
connectivityCheck: true

theme: default
colors:
  light:
    highlight-primary: "#007AFF"
    highlight-secondary: "#5856D6"
    highlight-hover: "#5AC8FA"
    background: "#f5f5f7"
    card-background: "#ffffff"
    text: "#1d1d1f"
    text-header: "#1d1d1f"
    text-title: "#1d1d1f"
    text-subtitle: "#86868b"
    card-shadow: rgba(0, 0, 0, 0.1)
    link: "#007AFF"
    link-hover: "#0056b3"
  dark:
    highlight-primary: "#0A84FF"
    highlight-secondary: "#5E5CE6"
    highlight-hover: "#64D2FF"
    background: "#1d1d1f"
    card-background: "#2d2d2f"
    text: "#f5f5f7"
    text-header: "#f5f5f7"
    text-title: "#f5f5f7"
    text-subtitle: "#86868b"
    card-shadow: rgba(0, 0, 0, 0.4)
    link: "#0A84FF"
    link-hover: "#409CFF"

services:
  - name: "Applications"
    icon: "fas fa-cloud"
    items:
      - name: "Calendar"
        logo: "assets/icons/calendar.png"
        subtitle: "Calendar Dashboard"
        url: "https://your-calendar-dashboard.manus.space"
        target: "_self"
      
      - name: "Home Assistant"
        logo: "assets/icons/home-assistant.png"
        subtitle: "Smart Home"
        url: "http://homeassistant.local:8123"
        
      - name: "Grafana"
        logo: "assets/icons/grafana.png"
        subtitle: "Monitoring"
        url: "http://grafana.local:3000"

  - name: "Media"
    icon: "fas fa-photo-video"
    items:
      - name: "Plex"
        logo: "assets/icons/plex.png"
        subtitle: "Media Server"
        url: "http://plex.local:32400"
        
      - name: "Jellyfin"
        logo: "assets/icons/jellyfin.png"
        subtitle: "Media Server"
        url: "http://jellyfin.local:8096"

  - name: "Network"
    icon: "fas fa-network-wired"
    items:
      - name: "Pi-hole"
        logo: "assets/icons/pihole.png"
        subtitle: "DNS & Ad Blocking"
        url: "http://pihole.local/admin"
        
      - name: "Router"
        logo: "assets/icons/router.png"
        subtitle: "Network Management"
        url: "http://192.168.1.1"
EOF

echo "Homer installed successfully!"
echo "Start with: python3 -m http.server 8080"
```

### Homer Systemd Service

Create a systemd service for Homer:

```ini
# File: /etc/systemd/system/homer.service

[Unit]
Description=Homer Dashboard
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/homer
ExecStart=/usr/bin/python3 -m http.server 8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable Homer:

```bash
sudo systemctl daemon-reload
sudo systemctl enable homer.service
sudo systemctl start homer.service
```

### Swipe Navigation Configuration

The Calendar Dashboard includes built-in support for three-finger swipe gestures. To configure:

1. Open the Calendar Dashboard in kiosk mode
2. Click the Monitor icon in the header
3. Enter your Homer URL (e.g., `http://localhost:8080`)
4. Enable "3-Finger Swipe Gestures"
5. Save settings

The swipe gesture works as follows:

| Gesture | Action |
|---------|--------|
| 3-finger swipe right | Navigate to Homer dashboard |
| 3-finger swipe left | Navigate back (browser history) |

## Ansible Automation

### Directory Structure

Create the Ansible project structure:

```
ansible/
├── inventory/
│   ├── hosts.yml
│   └── group_vars/
│       └── kiosks.yml
├── roles/
│   ├── common/
│   ├── kiosk/
│   └── homer/
├── playbooks/
│   ├── site.yml
│   ├── kiosk.yml
│   └── update.yml
└── ansible.cfg
```

### Inventory Configuration

```yaml
# File: ansible/inventory/hosts.yml

all:
  children:
    kiosks:
      hosts:
        calendar-kiosk-1:
          ansible_host: 192.168.1.100
        calendar-kiosk-2:
          ansible_host: 192.168.1.101
      vars:
        ansible_user: pi
        ansible_ssh_private_key_file: ~/.ssh/id_rsa_kiosk
```

### Group Variables

```yaml
# File: ansible/inventory/group_vars/kiosks.yml

# Calendar Dashboard Configuration
calendar_url: "https://your-calendar-dashboard.manus.space"
homer_url: "http://homer.local:8080"

# Display Configuration
kiosk_rotation: "0"
auto_refresh_interval: 5

# System Configuration
timezone: "Europe/Moscow"
locale: "ru_RU.UTF-8"

# Packages
required_packages:
  - chromium-browser
  - xserver-xorg
  - x11-xserver-utils
  - xinit
  - openbox
  - lightdm
  - unclutter
  - xdotool
  - fonts-noto
  - fonts-liberation
  - python3-pip

# Monitoring
enable_monitoring: true
grafana_url: "http://grafana.local:3000"
loki_url: "http://loki.local:3100"
```

### Main Playbook

```yaml
# File: ansible/playbooks/site.yml

---
- name: Deploy Calendar Kiosk
  hosts: kiosks
  become: yes
  
  vars_prompt:
    - name: calendar_url
      prompt: "Enter Calendar Dashboard URL"
      default: "https://your-calendar-dashboard.manus.space"
      private: no
    
    - name: homer_url
      prompt: "Enter Homer Dashboard URL"
      default: "http://homer.local:8080"
      private: no

  pre_tasks:
    - name: Update apt cache
      apt:
        update_cache: yes
        cache_valid_time: 3600

  roles:
    - common
    - kiosk
    - homer

  post_tasks:
    - name: Reboot if required
      reboot:
        msg: "Rebooting for kiosk setup"
        reboot_timeout: 300
      when: reboot_required | default(false)
```

### Kiosk Role

```yaml
# File: ansible/roles/kiosk/tasks/main.yml

---
- name: Install required packages
  apt:
    name: "{{ required_packages }}"
    state: present

- name: Create scripts directory
  file:
    path: /home/pi/scripts
    state: directory
    owner: pi
    group: pi
    mode: '0755'

- name: Deploy kiosk script
  template:
    src: kiosk.sh.j2
    dest: /home/pi/scripts/kiosk.sh
    owner: pi
    group: pi
    mode: '0755'
  notify: restart kiosk

- name: Deploy environment file
  template:
    src: kiosk-env.j2
    dest: /home/pi/.kiosk-env
    owner: pi
    group: pi
    mode: '0644'
  notify: restart kiosk

- name: Create Openbox config directory
  file:
    path: /home/pi/.config/openbox
    state: directory
    owner: pi
    group: pi
    mode: '0755'

- name: Deploy Openbox autostart
  template:
    src: openbox-autostart.j2
    dest: /home/pi/.config/openbox/autostart
    owner: pi
    group: pi
    mode: '0644'

- name: Deploy systemd service
  template:
    src: calendar-kiosk.service.j2
    dest: /etc/systemd/system/calendar-kiosk.service
    mode: '0644'
  notify:
    - reload systemd
    - restart kiosk

- name: Enable kiosk service
  systemd:
    name: calendar-kiosk
    enabled: yes
    state: started

- name: Configure automatic login
  command: raspi-config nonint do_boot_behaviour B4
  changed_when: false

- name: Disable screen blanking
  command: raspi-config nonint do_blanking 1
  changed_when: false
```

### Kiosk Script Template

```bash
# File: ansible/roles/kiosk/templates/kiosk.sh.j2

#!/bin/bash
set -e

# Load environment
source /home/pi/.kiosk-env

export DISPLAY=:0

# Wait for X server
while ! xdpyinfo >/dev/null 2>&1; do
    sleep 1
done

# Disable screen saver
xset s off
xset s noblank
xset -dpms

# Hide cursor
unclutter -idle 3 -root &

# Rotate display
{% if kiosk_rotation != "0" %}
xrandr --output HDMI-1 --rotate {{ kiosk_rotation }} 2>/dev/null || true
xrandr --output DSI-1 --rotate {{ kiosk_rotation }} 2>/dev/null || true
{% endif %}

# Clear crash flags
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' \
    /home/pi/.config/chromium/Default/Preferences 2>/dev/null || true

# Start Chromium
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --check-for-update-interval=31536000 \
    --start-fullscreen \
    --user-data-dir=/home/pi/.config/chromium-kiosk \
    "{{ calendar_url }}"
```

### Running Ansible

Execute the playbook:

```bash
# Install Ansible
pip3 install ansible

# Run playbook
cd ansible
ansible-playbook -i inventory/hosts.yml playbooks/site.yml

# Update specific host
ansible-playbook -i inventory/hosts.yml playbooks/site.yml --limit calendar-kiosk-1

# Only update kiosk configuration
ansible-playbook -i inventory/hosts.yml playbooks/site.yml --tags kiosk
```

## Terraform Infrastructure

For cloud-based deployments or managing multiple kiosks, Terraform can provision the infrastructure.

### Terraform Configuration

```hcl
# File: terraform/main.tf

terraform {
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
    name         = string
    ip_address   = string
    display_rotation = string
    calendar_url = string
    homer_url    = string
  }))
  default = [
    {
      name         = "calendar-kiosk-1"
      ip_address   = "192.168.1.100"
      display_rotation = "0"
      calendar_url = "https://your-calendar-dashboard.manus.space"
      homer_url    = "http://homer.local:8080"
    }
  ]
}

# Generate Ansible inventory
resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/templates/inventory.yml.tpl", {
    kiosks = var.kiosks
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
  })
  filename = "${path.module}/output/${each.key}.env"
}

output "kiosk_ips" {
  value = { for k in var.kiosks : k.name => k.ip_address }
}
```

### Inventory Template

```yaml
# File: terraform/templates/inventory.yml.tpl

all:
  children:
    kiosks:
      hosts:
%{ for kiosk in kiosks ~}
        ${kiosk.name}:
          ansible_host: ${kiosk.ip_address}
          calendar_url: "${kiosk.calendar_url}"
          homer_url: "${kiosk.homer_url}"
          kiosk_rotation: "${kiosk.display_rotation}"
%{ endfor ~}
      vars:
        ansible_user: pi
        ansible_ssh_private_key_file: ~/.ssh/id_rsa_kiosk
```

### Running Terraform

```bash
cd terraform

# Initialize
terraform init

# Plan changes
terraform plan

# Apply configuration
terraform apply

# Then run Ansible
cd ../ansible
ansible-playbook -i inventory/hosts.yml playbooks/site.yml
```

## Monitoring and Logging

### Grafana Loki Setup

Install Promtail for log collection:

```yaml
# File: ansible/roles/monitoring/tasks/main.yml

---
- name: Download Promtail
  get_url:
    url: "https://github.com/grafana/loki/releases/download/v2.9.0/promtail-linux-arm64.zip"
    dest: /tmp/promtail.zip

- name: Extract Promtail
  unarchive:
    src: /tmp/promtail.zip
    dest: /usr/local/bin/
    remote_src: yes

- name: Deploy Promtail config
  template:
    src: promtail.yml.j2
    dest: /etc/promtail/config.yml
  notify: restart promtail

- name: Deploy Promtail service
  template:
    src: promtail.service.j2
    dest: /etc/systemd/system/promtail.service
  notify:
    - reload systemd
    - restart promtail
```

### Promtail Configuration

```yaml
# File: ansible/roles/monitoring/templates/promtail.yml.j2

server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /var/lib/promtail/positions.yaml

clients:
  - url: {{ loki_url }}/loki/api/v1/push

scrape_configs:
  - job_name: kiosk
    static_configs:
      - targets:
          - localhost
        labels:
          job: calendar-kiosk
          host: {{ inventory_hostname }}
          __path__: /var/log/kiosk/*.log
    
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: system
          host: {{ inventory_hostname }}
          __path__: /var/log/syslog
```

### Health Check Script

```bash
#!/bin/bash
# File: /home/pi/scripts/health-check.sh

# Check if Chromium is running
if ! pgrep -x "chromium" > /dev/null; then
    echo "ERROR: Chromium not running"
    systemctl restart calendar-kiosk
    exit 1
fi

# Check display
if ! xdpyinfo -display :0 > /dev/null 2>&1; then
    echo "ERROR: Display not available"
    exit 1
fi

# Check network connectivity
if ! ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo "WARNING: No internet connectivity"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "WARNING: Disk usage above 90%"
fi

# Check memory
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt 90 ]; then
    echo "WARNING: Memory usage above 90%"
fi

echo "OK: All checks passed"
exit 0
```

Add to crontab:

```bash
# Run health check every 5 minutes
*/5 * * * * /home/pi/scripts/health-check.sh >> /var/log/kiosk/health.log 2>&1
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Black screen after boot | Check HDMI settings in `/boot/config.txt` |
| Touch not working | Verify touch driver and calibration |
| Chromium crashes | Clear cache: `rm -rf /home/pi/.config/chromium-kiosk` |
| No network | Check `/etc/NetworkManager/` configuration |
| Display rotation wrong | Adjust `display_rotate` in config.txt |

### Useful Commands

```bash
# View kiosk service status
sudo systemctl status calendar-kiosk

# View kiosk logs
sudo journalctl -u calendar-kiosk -f

# Restart kiosk
sudo systemctl restart calendar-kiosk

# Check display info
DISPLAY=:0 xdpyinfo

# Test touch input
DISPLAY=:0 xinput list

# Monitor system resources
htop

# Check GPU memory
vcgencmd get_mem gpu
```

### Recovery Mode

If the kiosk becomes unresponsive, SSH into the device and run:

```bash
# Stop kiosk
sudo systemctl stop calendar-kiosk

# Kill any remaining Chromium processes
pkill -9 chromium

# Clear Chromium data
rm -rf /home/pi/.config/chromium-kiosk

# Restart kiosk
sudo systemctl start calendar-kiosk
```

## References

1. [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
2. [Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
3. [Homer Dashboard](https://github.com/bastienwirtz/homer)
4. [Ansible Documentation](https://docs.ansible.com/)
5. [Terraform Documentation](https://www.terraform.io/docs)
6. [Grafana Loki](https://grafana.com/docs/loki/latest/)
