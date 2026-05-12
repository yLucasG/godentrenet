import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('2.24.84.175', username='root', password='N2nl.tkd123456')

# Find the DB user
stdin, stdout, stderr = ssh.exec_command('cd /root/godentrenet && docker compose exec -T db psql -U godentrenet -d godentrenet -c "\\du" 2>&1', timeout=15)
print('Users:', stdout.read().decode()[:300])

# Run migration with correct user
cmd = 'cd /root/godentrenet && docker compose exec -T db psql -U godentrenet -d godentrenet < prisma/migrations/20260512000001_add_orders/migration.sql 2>&1'
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
print('Migration:', stdout.read().decode()[:500])
print('Err:', stderr.read().decode()[:200])

ssh.close()
