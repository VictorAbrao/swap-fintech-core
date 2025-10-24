#!/bin/bash

# Script para monitorar o frontend
echo "🔍 Monitorando frontend na porta 5001..."

while true; do
    # Verificar se a porta 5001 está sendo usada
    if ! netstat -tlnp | grep -q :5001; then
        echo "❌ Frontend caiu! Tentando subir novamente..."
        
        # Matar processos Node.js antigos
        pkill -f "vite"
        pkill -f "npm run dev"
        
        # Aguardar um pouco
        sleep 2
        
        # Subir o frontend novamente
        cd /root/swapone-fintech-one/swapone-fintech-front
        nohup npm run dev > /tmp/frontend.log 2>&1 &
        
        echo "✅ Frontend reiniciado!"
        echo "📝 Logs em: /tmp/frontend.log"
    else
        echo "✅ Frontend rodando normalmente"
    fi
    
    # Aguardar 30 segundos antes da próxima verificação
    sleep 30
done
