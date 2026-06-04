import paramiko, time, sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('2.24.84.175', username='root', password='N2nl.tkd123456')

print("Pulling latest...")
stdin, stdout, stderr = ssh.exec_command('cd /root/godentrenet && git pull origin main 2>&1', timeout=60)
print(stdout.read().decode('utf-8', errors='replace')[:300])

print("Building web container...")
stdin, stdout, stderr = ssh.exec_command('cd /root/godentrenet && docker compose build web 2>&1', timeout=600)
out = stdout.read().decode('utf-8', errors='replace')
# Print last portion to see result
lines = out.split('\n')
for line in lines[-40:]:
    print(line)

print("\nRunning DB migrations (idempotent)...")
migration_sql = (
    "DO $body$ BEGIN "
    "CREATE TYPE \"StoreType\" AS ENUM ('FOOD','RETAIL','SERVICES','GAS_WATER','GENERAL'); "
    "EXCEPTION WHEN duplicate_object THEN null; END $body$; "
    "ALTER TABLE \"Store\" ADD COLUMN IF NOT EXISTS \"type\" \"StoreType\" NOT NULL DEFAULT 'GENERAL';"
)
import tempfile, os as _os
# Write SQL via SFTP to avoid shell quoting issues
sftp = ssh.open_sftp()
with sftp.open('/tmp/entrenet_mig.sql', 'w') as _f:
    _f.write(migration_sql)
sftp.close()
stdin_m, stdout_m, _ = ssh.exec_command(
    'docker cp /tmp/entrenet_mig.sql godentrenet_db:/tmp/mig.sql && '
    'docker exec godentrenet_db psql -U godentrenet -d godentrenet -f /tmp/mig.sql 2>&1',
    timeout=20
)
print(stdout_m.read().decode('utf-8', errors='replace').strip())

print("\nRestarting web container...")
stdin2, stdout2, stderr2 = ssh.exec_command('cd /root/godentrenet && docker compose up -d web 2>&1', timeout=60)
print(stdout2.read().decode('utf-8', errors='replace')[:300])

time.sleep(5)

print("\nContainer status:")
stdin3, stdout3, stderr3 = ssh.exec_command('cd /root/godentrenet && docker compose ps 2>&1', timeout=15)
print(stdout3.read().decode('utf-8', errors='replace')[:500])

ssh.close()
