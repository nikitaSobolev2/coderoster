# Production deployment on Ubuntu 24.04 (CodeRoster / «Кодиум»)

This guide is a **step-by-step runbook**: run the sections **in order** unless you already completed an earlier step. It matches the stack in [product-analysis-ru.md](./product-analysis-ru.md).

**Production compose file:** [`docker-compose.vm-prod.yml`](../docker-compose.vm-prod.yml) (not `docker-compose.yml`, which is for local dev).

**Environment file:** this runbook assumes **`/opt/coderoster/.env.prod`**. Create it from [`.env.example`](../.env.example) or copy your prepared file; see [§6](#6-environment-file-envprod-before-you-compose).

**Convention:** before every `docker compose` block, you should be in the app directory:

```bash
cd /opt/coderoster
```

---

## 0. One-time placeholders (fill before you start)

| Placeholder         | What it is                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `YOUR_GIT_REPO_URL` | HTTPS or SSH clone URL of this monorepo                                                                                                                                                        |
| `APP_DOMAIN`        | Public hostname for the site (e.g. `learn.example.com`) — **DNS A/AAAA → VM**                                                                                                                  |
| `FILES_DOMAIN`      | Optional separate hostname for MinIO/browser uploads (e.g. `files.example.com`) — **DNS → same VM**; if you skip, you must still make `S3_PUBLIC_URL` in `.env.prod` match how you proxy MinIO |

### Example (this deployment): `codium.space`

Point DNS at the VM (**IPv4 `95.85.235.154`**):

| Record     | Type | Value           |
| ---------- | ---- | --------------- |
| `@` (apex) | A    | `95.85.235.154` |
| `files`    | A    | `95.85.235.154` |

Then **`APP_DOMAIN=codium.space`**, **`FILES_DOMAIN=files.codium.space`**. In `.env.prod`: **`NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://codium.space/callback`**, **`S3_PUBLIC_URL=https://files.codium.space/coderoster-uploads`**.

Create Caddy config:

```bash
APP_DOMAIN="codium.space"
FILES_DOMAIN="files.codium.space"

sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
${APP_DOMAIN} {
	reverse_proxy 127.0.0.1:3000
}

${FILES_DOMAIN} {
	reverse_proxy 127.0.0.1:9000
}
EOF

sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

WorkOS AuthKit: add redirect **`https://codium.space/callback`** (and any required Site URL / allowed origins for **`https://codium.space`**).

---

## 1. Base system

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates
```

---

## 2. Install Docker Engine + Compose plugin (official Docker `apt` repo)

```bash
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "${VERSION_CODENAME:-$VERSION}") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable Docker and verify:

```bash
sudo systemctl enable --now docker
docker --version
docker compose version
```

**Optional — non-root user** (skip if you deploy as `root`):

```bash
sudo usermod -aG docker "$USER"
```

Log out and SSH back in, then `docker ps` should work without `sudo`.

**Note:** **`worker-code-exec`** uses **`/var/run/docker.sock`** from the host; the daemon must stay available on that socket.

---

## 3. Firewall (`ufw`)

Allow SSH (adjust if you use a non-default SSH port), HTTP, HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

Do **not** open Postgres, Redis, RabbitMQ, or MinIO to the public internet. The VM compose binds app and MinIO to **127.0.0.1**; only the reverse proxy should face the world.

---

## 4. Reverse proxy + TLS (Caddy)

Install Caddy stable:

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

Write **`/etc/caddy/Caddyfile`** with real FQDNs (**DNS must already point at this VM**) so Caddy can obtain certificates:

**App + MinIO on separate hostnames:**

```bash
APP_DOMAIN="learn.example.com"
FILES_DOMAIN="files.example.com"

sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
${APP_DOMAIN} {
	reverse_proxy 127.0.0.1:3000
}

${FILES_DOMAIN} {
	reverse_proxy 127.0.0.1:9000
}
EOF
```

**App only** (add `FILES_DOMAIN` later when uploads need a public MinIO URL):

```bash
APP_DOMAIN="learn.example.com"

sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
${APP_DOMAIN} {
	reverse_proxy 127.0.0.1:3000
}
EOF
```

- If you **only** use one hostname for now, align **`S3_PUBLIC_URL`** in `.env.prod` once MinIO is reachable under **`FILES_DOMAIN`** (separate hostname is simpler than path-based routing).
- **Do not** publish MinIO console `9001` to the internet unless you protect it.

Validate and reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

Check TLS and upstream (after the app is up):

```bash
curl -sI "https://APP_DOMAIN" | head -n5
```

---

## 5. Clone the application

```bash
sudo mkdir -p /opt/coderoster
sudo chown -R "$USER:$USER" /opt/coderoster
cd /opt/coderoster
git clone YOUR_GIT_REPO_URL .
```

---

## 6. Environment file (`.env.prod`) before you `compose`

Put **`/opt/coderoster/.env.prod`** next to `docker-compose.vm-prod.yml`. From your laptop you can run:

```bash
scp .env.prod root@YOUR_SERVER_IP:/opt/coderoster/.env.prod
```

On the server, edit:

```bash
cd /opt/coderoster
nano .env.prod
```

**Must match your public URLs and Caddy:**

| Variable                                      | Set to                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI`             | `https://APP_DOMAIN/callback`                                                        |
| `S3_PUBLIC_URL`                               | `https://FILES_DOMAIN/coderoster-uploads` (or your chosen public URL for the bucket) |
| `USE_FAKE_DATA` / `NEXT_PUBLIC_USE_FAKE_DATA` | `false`                                                                              |

**Must be stable across restarts:**

| Variable                             | Notes                                          |
| ------------------------------------ | ---------------------------------------------- |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Long random string; **do not rotate** casually |

**Secrets:** strong `POSTGRES_*`, `RABBITMQ_*`, `S3_*`, `WORKOS_*`. Use production WorkOS keys when you go live (not `sk_test_*` unless you intend test mode).

Reference: [`.env.example`](../.env.example).

Generate a secret on the server (optional):

```bash
openssl rand -hex 32
```

---

## 7. First start (build + up)

```bash
cd /opt/coderoster
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml build
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml up -d
```

Watch the **app** container until migrations finish and Next.js is listening:

```bash
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml logs -f app
```

Stop following logs with **Ctrl+C** (containers keep running).

List services:

```bash
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml ps
```

---

## 8. WorkOS dashboard (manual step)

1. Open the WorkOS AuthKit app for this environment.
2. Set **Redirect URI** to exactly **`NEXT_PUBLIC_WORKOS_REDIRECT_URI`** from `.env.prod` (e.g. `https://APP_DOMAIN/callback`).
3. Ensure allowed origins / logout URLs include **`https://APP_DOMAIN`** as required by WorkOS.

---

## 9. Smoke checks (commands + browser)

```bash
curl -sI "https://APP_DOMAIN" | head -n10
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml ps
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml logs --tail=80 worker-code-exec
```

In the browser:

1. Open **`https://APP_DOMAIN`**, sign in with WorkOS.
2. Open a lesson, **Run** and **Submit** code — verifies RabbitMQ, outbox, **worker-code-exec**, and result consumer.
3. Trigger a flow that uploads to S3 — verifies MinIO and **`S3_PUBLIC_URL`**.

---

## 10. Daily ops: logs and restart

```bash
cd /opt/coderoster
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml logs --tail=200 -f
```

Restart everything after an env change:

```bash
cd /opt/coderoster
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml up -d
```

Restart one service:

```bash
cd /opt/coderoster
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml restart app
```

---

## 11. Updates (new release)

```bash
cd /opt/coderoster
git fetch origin
git checkout main
git pull --ff-only
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml build --pull
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml logs --tail=100 app
```

Use a **tag** instead of `main` if you release by tag: `git checkout v1.2.3`.

**Rollback** (only safe if DB migrations have not moved forward irreversibly):

```bash
cd /opt/coderoster
git checkout PREVIOUS_TAG_OR_COMMIT
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml build
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml up -d
```

---

## 12. Backups (Postgres example)

```bash
cd /opt/coderoster
docker compose --env-file .env.prod -f docker-compose.vm-prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$HOME/backup-coderoster-$(date -u +%Y%m%d-%H%M).sql"
```

Persist object storage volumes (`coderoster_minio_data`) via snapshots or `mc mirror` — see MinIO / storage docs.

---

## 13. Architecture (reference)

| Component                      | Role                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| **app**                        | Next.js 15 + tRPC; `next start`                                       |
| **outbox**                     | Publishes outbox events to RabbitMQ                                   |
| **result-consumer**            | Consumes execution results                                            |
| **worker-code-exec**           | Runs learner code in ephemeral containers (**Docker socket on host**) |
| **code-improve-worker**        | AI code-improve queue (optional)                                      |
| **account-deletion-consumer**  | Account deletion consumer                                             |
| **snapshot**                   | Activity snapshot cron job                                            |
| **db, redis, rabbitmq, minio** | Postgres, cache, AMQP, S3-compatible storage                          |

On **app** container start, **`infra/docker/app-entrypoint.sh`** runs **`prisma migrate deploy`** when migrations exist. Other Node services use `SKIP_MIGRATIONS=true`.

---

## 14. Server sizing (starting point)

| Profile     | vCPU | RAM    | Disk (SSD)                    |
| ----------- | ---- | ------ | ----------------------------- |
| Small pilot | 4    | 16 GB  | 80 GB+                        |
| Recommended | 8    | 32 GB  | 200 GB+                       |
| Growth      | 16+  | 64 GB+ | Separate DB/S3 or larger disk |

---

## 15. Optional hardening

- **SSH:** key-only login, disable password auth, `AllowUsers`, non-default port if you prefer.
- **Unattended upgrades:** `sudo apt-get install -y unattended-upgrades` and configure.
- **sshd package config prompt:** if `ucf` asks about **`/etc/ssh/sshd_config`**, compare diffs; keep your hardening. After changes: `sudo sshd -t && sudo systemctl reload ssh`.

---

## 16. Common failures

| Symptom                            | Likely cause                                                              |
| ---------------------------------- | ------------------------------------------------------------------------- |
| 502 from Caddy                     | App down; `docker compose … ps` and `logs app`                            |
| WorkOS redirect error              | Mismatch with dashboard; fix **`NEXT_PUBLIC_WORKOS_REDIRECT_URI`**        |
| Upload / image broken              | **`S3_PUBLIC_URL`** unreachable; Caddy **`FILES_DOMAIN`** / MinIO         |
| Code never finishes                | **worker-code-exec** or RabbitMQ; `logs worker-code-exec`                 |
| Server Actions broken after deploy | **`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`** changed — restore previous value |

---

## 17. Reference files

| File                                                                | Purpose             |
| ------------------------------------------------------------------- | ------------------- |
| [docker-compose.vm-prod.yml](../docker-compose.vm-prod.yml)         | Production VM stack |
| [docker-compose.yml](../docker-compose.yml)                         | Local dev           |
| [infra/docker/app-entrypoint.sh](../infra/docker/app-entrypoint.sh) | Migrations on boot  |
| [.env.example](../.env.example)                                     | Variable catalogue  |

Product behaviour: [product-analysis-ru.md](./product-analysis-ru.md).

---

## 18. Optional: nginx + Let’s Encrypt (instead of Caddy)

If you prefer **nginx**:

```bash
sudo apt-get install -y nginx
sudo apt-get install -y certbot python3-certbot-nginx
```

Point **`APP_DOMAIN`** at the server, create an nginx `server_name`, then:

```bash
sudo certbot --nginx -d APP_DOMAIN
```

Proxy **`location /`** to **`http://127.0.0.1:3000`**. Add a separate `server_name` for **`FILES_DOMAIN`** proxying **`http://127.0.0.1:9000`** for MinIO if that matches **`S3_PUBLIC_URL`**.

---

## 19. Optional: external managed Postgres / Redis / S3

You may set **`DATABASE_URL`**, **`REDIS_URL`**, and **`S3_*`** in `.env.prod` to managed services. You still need **RabbitMQ** reachable from all consumers; trimming `docker-compose.vm-prod.yml` is a custom fork.
