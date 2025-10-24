#!/bin/bash

# Script para commit automático do SwapOne Fintech Core
# Este script deve ser executado após cada requisição/desenvolvimento

echo "🚀 SwapOne Fintech Core - Auto Commit Script"
echo "=============================================="

# Verificar se há mudanças
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Nenhuma mudança detectada. Nada para commitar."
    exit 0
fi

# Adicionar todas as mudanças
echo "📁 Adicionando arquivos modificados..."
git add .

# Fazer commit com timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="feat: Update SwapOne Fintech Core - $TIMESTAMP"

echo "💾 Fazendo commit: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Push para o repositório remoto
echo "🌐 Enviando para GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Commit realizado com sucesso!"
    echo "🔗 Repositório: https://github.com/VictorAbrao/swap-fintech-core"
else
    echo "❌ Erro ao fazer push. Verifique a conexão."
    exit 1
fi

echo "=============================================="
echo "🎉 Processo concluído!"
