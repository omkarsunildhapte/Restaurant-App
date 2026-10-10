# Dograh (voice AI), local only

[Dograh](https://github.com/dograh-hq/dograh) is an open-source voice AI agent platform
(BSD-2-Clause), self-hosted for free. Here it runs **only on this computer**, for trying out
voice agents for Thaliyo (phone bookings and orders, sales calls) before anything is built
into the product.

| | |
|---|---|
| App | http://localhost:3010 |
| API | http://localhost:8000 (health: `/api/v1/health`) |
| Docker project | `thaliyo-dograh` (Postgres, Redis, MinIO, api, ui) |

## Local-only settings

- `docker-compose.override.yaml` (merged automatically) binds the app, API and MinIO to
  `127.0.0.1` and does not publish Postgres or Redis, so nothing is reachable from the network.
- The `tunnel` profile is **never** started. Dograh's own `start_docker.sh` runs it by
  default, which opens a public `*.trycloudflare.com` URL, so don't use that script to start.
- `.env` (git-ignored) holds the generated secrets, plus `ENABLE_TELEMETRY=false` and
  `COMPOSE_PROJECT_NAME=thaliyo-dograh`.
- A `no-tunnel` stand-in (busybox, private network only) answers the API's tunnel lookup at
  once. Without it every health check waits ~10 s for a tunnel that isn't there and the app
  shows "Backend health check timed out after 3000ms".
- Real phone calls need a public address for the telephony provider, so they are not
  possible in this setup. Test agents with the browser call in the app.

## Use

From this folder:

```bash
docker compose up -d          # start (first start downloads the images)
docker compose ps             # status
docker compose logs -f api    # API log
docker compose stop           # stop, keeps data
docker compose down           # remove containers, keeps data (volumes)
docker compose down -v        # remove everything, including agents and recordings
docker compose pull && docker compose up -d   # update to the latest images
```

The owner's account was created on 2026-10-10 and sign-up is closed (`ENABLE_SIGNUP=false`
in `.env`). To add someone later, set it to `true`, run `docker compose up -d`, let them sign
up, then set it back to `false` and run `docker compose up -d` again (a plain `restart`
doesn't read `.env` changes).

## Files

- `docker-compose.yaml`, `start_docker.sh`: unchanged copies from the Dograh repo (main branch),
  downloaded 2026-10-10. `start_docker.sh` was used once, only to generate `.env`.
- `docker-compose.override.yaml`: Thaliyo's local-only settings (above).
