import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('2.24.84.175', username='root', password='N2nl.tkd123456')

stdin, stdout, stderr = ssh.exec_command('cd /root/godentrenet && docker compose ps 2>&1', timeout=15)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
