#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/swapone-fintech-api"
FRONT_DIR="$SCRIPT_DIR/swapone-fintech-front"

show_help() {
    echo "🚀 SwapOne Fintech - Server Manager"
    echo ""
    echo "Uso: ./manage-server.sh [comando]"
    echo ""
    echo "Comandos:"
    echo "  start       - Iniciar servidores (backend e frontend)"
    echo "  stop        - Parar servidores"
    echo "  restart     - Reiniciar servidores"
    echo "  status      - Ver status dos servidores"
    echo "  backend     - Gerenciar apenas o backend"
    echo "  frontend    - Gerenciar apenas o frontend"
    echo "  logs        - Ver logs dos servidores"
    echo "  help        - Mostrar esta ajuda"
}

stop_servers() {
    echo "🛑 Parando servidores..."
    
    BACKEND_PID=$(ps aux | grep "node.*swapone-fintech-api" | grep -v grep | awk '{print $2}')
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Parando backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        sleep 2
        kill -9 $BACKEND_PID 2>/dev/null || true
    fi
    
    FRONTEND_PID=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Parando frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        sleep 2
        kill -9 $FRONTEND_PID 2>/dev/null || true
    fi
    
    echo "✅ Servidores parados"
}

start_backend() {
    echo "🚀 Iniciando backend..."
    cd "$API_DIR"
    npm start &
    BACKEND_PID=$!
    echo "✅ Backend iniciado (PID: $BACKEND_PID)"
}

start_frontend() {
    echo "🚀 Iniciando frontend..."
    cd "$FRONT_DIR"
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"
}

start_servers() {
    echo "🚀 Iniciando servidores..."
    start_backend
    sleep 3
    start_frontend
    echo ""
    echo "✅ Servidores iniciados!"
    echo "Backend: http://localhost:5002"
    echo "Frontend: http://localhost:5001"
}

status() {
    echo "📊 Status dos Servidores"
    echo ""
    
    BACKEND_PID=$(ps aux | grep "node.*swapone-fintech-api" | grep -v grep | awk '{print $2}')
    if [ ! -z "$BACKEND_PID" ]; then
        echo "✅ Backend rodando (PID: $BACKEND_PID)"
        echo "   URL: http://localhost:5002"
    else
        echo "❌ Backend não está rodando"
    fi
    
    echo ""
    
    FRONTEND_PID=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "✅ Frontend rodando (PID: $FRONTEND_PID)"
        echo "   URL: http://localhost:5001"
    else
        echo "❌ Frontend não está rodando"
    fi
    
    echo ""
    
    PORT_5001=$(netstat -tlnp | grep :5001 || echo "")
    PORT_5002=$(netstat -tlnp | grep :5002 || echo "")
    
    if [ ! -z "$PORT_5001" ]; then
        echo "Port 5001: $PORT_5001"
    fi
    
    if [ ! -z "$PORT_5002" ]; then
        echo "Port 5002: $PORT_5002"
    fi
}

restart() {
    echo "🔄 Reiniciando servidores..."
    stop_servers
    sleep 2
    start_servers
}

show_logs() {
    echo "📋 Logs dos Servidores"
    echo ""
    echo "Backend:"
    ps aux | grep "node.*swapone-fintech-api" | grep -v grep || echo "Backend não está rodando"
    echo ""
    echo "Frontend:"
    ps aux | grep "vite" | grep -v grep || echo "Frontend não está rodando"
}

case "$1" in
    start)
        start_servers
        ;;
    stop)
        stop_servers
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    backend)
        if [ "$2" == "start" ]; then
            start_backend
        elif [ "$2" == "stop" ]; then
            echo "Parando backend..."
            BACKEND_PID=$(ps aux | grep "node.*swapone-fintech-api" | grep -v grep | awk '{print $2}')
            [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID && echo "✅ Backend parado"
        elif [ "$2" == "restart" ]; then
            echo "Reiniciando backend..."
            stop_servers
            sleep 2
            start_backend
        else
            show_help
        fi
        ;;
    frontend)
        if [ "$2" == "start" ]; then
            start_frontend
        elif [ "$2" == "stop" ]; then
            echo "Parando frontend..."
            FRONTEND_PID=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
            [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID && echo "✅ Frontend parado"
        elif [ "$2" == "restart" ]; then
            echo "Reiniciando frontend..."
            stop_servers
            sleep 2
            start_frontend
        else
            show_help
        fi
        ;;
    logs)
        show_logs
        ;;
    help|*)
        show_help
        ;;
esac

