#!/usr/bin/env bash
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║        NexaBank — Local Dev Environment          ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${NC}\n"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Prerequisites check ───────────────────────────────────────
info "Checking prerequisites..."
MISSING=0
for cmd in docker docker-compose java mvn node npm; do
  if command -v "$cmd" &>/dev/null; then
    log "$cmd found: $(command -v $cmd)"
  else
    if [ "$cmd" = "docker-compose" ]; then
      # Try docker compose (v2)
      if docker compose version &>/dev/null 2>&1; then
        log "docker compose (v2) found"
      else
        err "$cmd not found"
        MISSING=$((MISSING+1))
      fi
    else
      warn "$cmd not found — may be needed for non-Docker mode"
    fi
  fi
done

MODE=${1:-docker}

if [ "$MODE" = "docker" ]; then
  echo -e "\n${BOLD}▶ Mode: Docker Compose (recommended)${NC}\n"

  info "Stopping any existing containers..."
  docker compose down --remove-orphans 2>/dev/null || true

  info "Building all images (this takes ~3-5 minutes on first run)..."
  docker compose build --parallel

  info "Starting all services..."
  docker compose up -d

  echo -e "\n${BOLD}Waiting for services to be healthy...${NC}"
  sleep 5

  # Wait for postgres
  info "Waiting for PostgreSQL..."
  for i in $(seq 1 30); do
    if docker compose exec -T postgres pg_isready -U banking &>/dev/null; then
      log "PostgreSQL ready"
      break
    fi
    sleep 2
    echo -n "."
  done

  # Wait for services
  declare -A SERVICES=(
    ["API Gateway"]="http://localhost:8080/actuator/health"
    ["User Service"]="http://localhost:8081/actuator/health"
    ["Account Service"]="http://localhost:8082/actuator/health"
    ["Transaction Service"]="http://localhost:8083/actuator/health"
    ["Notification Service"]="http://localhost:8084/actuator/health"
    ["Frontend"]="http://localhost:3000"
  )

  echo ""
  ALL_UP=true
  for name in "${!SERVICES[@]}"; do
    url="${SERVICES[$name]}"
    for i in $(seq 1 20); do
      if curl -sf "$url" &>/dev/null; then
        log "$name is UP → $url"
        break
      fi
      if [ "$i" -eq 20 ]; then
        warn "$name not responding yet (may still be starting)"
        ALL_UP=false
      fi
      sleep 3
    done
  done

elif [ "$MODE" = "local" ]; then
  echo -e "\n${BOLD}▶ Mode: Local (no Docker — requires Java 17, Maven, Node 20, PostgreSQL)${NC}\n"

  warn "Make sure PostgreSQL is running locally on port 5432"
  warn "Run: psql -U banking -d banking -f scripts/init-db.sql"
  echo ""

  info "Building Java services..."
  for svc in user-service account-service transaction-service notification-service api-gateway; do
    echo -n "  Building $svc... "
    cd "services/$svc"
    mvn clean package -DskipTests -q
    log "done"
    cd "$SCRIPT_DIR"
  done

  info "Starting services in background..."
  declare -A PORTS=(
    ["user-service"]="8081"
    ["account-service"]="8082"
    ["transaction-service"]="8083"
    ["notification-service"]="8084"
    ["api-gateway"]="8080"
  )

  mkdir -p logs
  for svc in notification-service user-service account-service transaction-service api-gateway; do
    PORT="${PORTS[$svc]}"
    echo "  Starting $svc on :$PORT..."
    cd "services/$svc"
    SERVER_PORT=$PORT \
    SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/banking" \
    SPRING_DATASOURCE_USERNAME="banking" \
    SPRING_DATASOURCE_PASSWORD="banking123" \
    java -jar target/*.jar > "$SCRIPT_DIR/logs/$svc.log" 2>&1 &
    echo $! > "$SCRIPT_DIR/logs/$svc.pid"
    cd "$SCRIPT_DIR"
    sleep 2
  done

  info "Starting React frontend..."
  cd frontend
  npm install --silent
  REACT_APP_API_URL=http://localhost:8080 npm start &
  echo $! > "$SCRIPT_DIR/logs/frontend.pid"
  cd "$SCRIPT_DIR"

else
  err "Unknown mode: $MODE. Use 'docker' or 'local'"
  exit 1
fi

# ── Print access info ─────────────────────────────────────────
echo -e "\n${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║              🎉 NexaBank is Running!             ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo -e ""
echo -e "  ${BOLD}Frontend${NC}           →  http://localhost:3000"
echo -e "  ${BOLD}API Gateway${NC}        →  http://localhost:8080"
echo -e "  ${BOLD}User Service${NC}       →  http://localhost:8081/swagger-ui.html"
echo -e "  ${BOLD}Account Service${NC}    →  http://localhost:8082/swagger-ui.html"
echo -e "  ${BOLD}Transaction Svc${NC}    →  http://localhost:8083/swagger-ui.html"
echo -e "  ${BOLD}Notification Svc${NC}   →  http://localhost:8084"
echo -e "  ${BOLD}PostgreSQL${NC}         →  localhost:5432 (banking/banking123)"
echo -e ""
echo -e "  ${CYAN}Quick test:${NC}"
echo -e "  curl http://localhost:8081/api/v1/customers"
echo -e "  curl http://localhost:8082/api/v1/accounts"
echo -e ""
if [ "$MODE" = "docker" ]; then
  echo -e "  ${YELLOW}Logs:${NC}   docker compose logs -f [service-name]"
  echo -e "  ${YELLOW}Stop:${NC}   docker compose down"
  echo -e "  ${YELLOW}Reset:${NC}  docker compose down -v  (clears database)"
else
  echo -e "  ${YELLOW}Logs:${NC}   tail -f logs/<service>.log"
  echo -e "  ${YELLOW}Stop:${NC}   ./stop-local.sh"
fi
echo ""
