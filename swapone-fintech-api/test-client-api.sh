#!/bin/bash

echo "🧪 Testando API Cliente - Todos os Endpoints"
echo "=============================================="
echo ""

TOKEN=$1

if [ -z "$TOKEN" ]; then
    echo "❌ Token não fornecido. Faça login primeiro:"
    echo "curl -X POST 'http://localhost:5002/api/auth/login' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"email\":\"admin@swapone.com\",\"password\":\"admin123\"}'"
    exit 1
fi

echo "✅ Token: ${TOKEN:0:50}..."
echo ""

FAILED=0

echo "📋 1. TESTE: GET Beneficiários"
echo "==============================="
RESPONSE=$(curl -s -X GET "http://localhost:5002/api/beneficiaries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ PASSOU"
else
    echo "❌ FALHOU"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "📋 2. TESTE: FX Trade - Cotação (amount=1)"
echo "============================================"
RESPONSE=$(curl -s -X POST "http://localhost:5002/api/client/quotation/quote" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currency":"USDT","amount":1,"side":"buy"}')
echo "$RESPONSE" | jq '.'
QUOTATION_ID=$(echo "$RESPONSE" | jq -r '.data.quotation_id')
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ PASSOU"
    echo "📝 Quotation ID: $QUOTATION_ID"
else
    echo "❌ FALHOU"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "📋 3. TESTE: FX Trade - Executar (amount=1)"
echo "============================================"
RESPONSE=$(curl -s -X POST "http://localhost:5002/api/client/execute-fx-trade" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quotation_id":"'$QUOTATION_ID'","currency":"USDT","amount":1,"side":"buy","final_rate":"5.43","total":"5.43"}')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ PASSOU"
else
    echo "❌ FALHOU"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "📋 4. TESTE: Arbitragem - Rates (amount=1)"
echo "============================================"
RESPONSE=$(curl -s -X POST "http://localhost:5002/api/public/arbitrage/rates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency":"USD","toCurrencies":["EUR","GBP"]}')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ PASSOU"
else
    echo "❌ FALHOU"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "📋 5. TESTE: Arbitragem - Calcular (amount=1)"
echo "================================================"
RESPONSE=$(curl -s -X POST "http://localhost:5002/api/public/arbitrage/calculate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromCurrency":"USD","toCurrency":"EUR","amount":1}')
echo "$RESPONSE" | jq '.'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ PASSOU"
else
    echo "❌ FALHOU"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "📋 6. TESTE: Transações"
echo "======================="
RESPONSE=$(curl -s -X GET "http://localhost:5002/api/client/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$RESPONSE" | jq '.data | length'
if echo "$RESPONSE" | jq -e '.success == true' > /dev/null; then
    echo "✅ PASSOU"
else
    echo "❌ FALHOU"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "=============================================="
echo "🧪 RESUMO DOS TESTES"
echo "=============================================="
echo "❌ Falharam: $FAILED testes"
echo "✅ Sucesso: $((6 - FAILED)) testes"
echo ""
if [ $FAILED -eq 0 ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
else
    echo "⚠️  ALGUNS TESTES FALHARAM"
fi


