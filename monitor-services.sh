#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/swapone-fintech-api"
FRONT_DIR="$SCRIPT_DIR/swapone-fintech-front"
LOG_FILE="/tmp/services-monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_port() {
    netstat -tlnp | grep -q ":$1"
}

check_service_health() {
    local port=$1
    local health_endpoint=$2
    
    if [ -z "$health_endpoint" ]; then
        curl -s --max-time 5 "http://localhost:$port" > /dev/null 2>&1
    else
        curl -s --max-time 5 "http://localhost:$port$health_endpoint" > /dev/null 2>&1
    fi
}

start_backend() {
    log "🧹 Limpando processos do backend..."
    pkill -9 -f "swapone-fintech-api.*node src/server.js" 2>/dev/null
    pkill -9 -f "swapone-fintech-api.*npm start" 2>/dev/null
    
    sleep 2
    
    if check_port 5002; then
        log "⚠️  Porta 5002 ainda em uso. Forçando limpeza..."
        lsof -ti:5002 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    log "🚀 Iniciando backend..."
    cd "$API_DIR"
    nohup npm start > /tmp/backend.log 2>&1 &
    sleep 5
    
    if check_port 5002 && check_service_health 5002 "/health"; then
        log "✅ Backend iniciado com sucesso"
        return 0
    else
        log "❌ Falha ao iniciar backend"
        return 1
    fi
}

start_frontend() {
    log "🧹 Limpando processos do frontend..."
    pkill -9 -f "swapone-fintech-front.*vite" 2>/dev/null
    pkill -9 -f "swapone-fintech-front.*npm run dev" 2>/dev/null
    
    sleep 2
    
    if check_port 5001; then
        log "⚠️  Porta 5001 ainda em uso. Forçando limpeza..."
        lsof -ti:5001 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    log "🚀 Iniciando frontend..."
    cd "$FRONT_DIR"
    nohup npm run dev > /tmp/frontend.log 2>&1 &
    sleep 8
    
    if check_port 5001 && check_service_health 5001; then
        log "✅ Frontend iniciado com sucesso"
        return 0
    else
        log "❌ Falha ao iniciar frontend"
        return 1
    fi
}

log "🔍 Iniciando monitoramento de serviços..."

while true; do
    BACKEND_OK=false
    FRONTEND_OK=false
    
    if check_port 5002 && check_service_health 5002 "/health"; then
        BACKEND_OK=true
    else
        log "❌ Backend não está respondendo"
        start_backend
    fi
    
    if check_port 5001 && check_service_health 5001; then
        FRONTEND_OK=true
    else
        log "❌ Frontend não está respondendo"
        start_frontend
    fi
    
    if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
        log "✅ Ambos os serviços estão rodando normalmente"
    fi
    
    sleep 60
done




