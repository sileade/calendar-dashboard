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
        ansible_ssh_private_key_file: ${ssh_key_path}
        ansible_python_interpreter: /usr/bin/python3
        timezone: "${timezone}"
        enable_monitoring: ${enable_monitoring}
        loki_url: "${loki_url}"
        grafana_url: "${grafana_url}"
