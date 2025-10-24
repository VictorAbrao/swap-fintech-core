# Exemplo de uso do Execute Order do Braza Bank

## 1. Obter uma cotação (Preview Quotation)
```bash
curl -X POST 'https://api.swapcambio.com/api/public/fx-rates/quote' \
  -H 'Content-Type: application/json' \
  -d '{
    "from_currency": "USDT",
    "to_currency": "BRL", 
    "amount": 100,
    "operation": "buy"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "from_currency": "USDT",
    "to_currency": "BRL",
    "amount": 100,
    "braza_rate": 5.4086,
    "base_rate": 5.4086,
    "markup_bps": 0,
    "spread_bps": 0,
    "final_rate": 5.4086,
    "converted_amount": 540.86,
    "operation": "buy",
    "braza_order_id": "c83664cc-0126-4ad2-b7bb-33d95e820bef",
    "braza_data": {
      "id": "c83664cc-0126-4ad2-b7bb-33d95e820bef",
      "fgn_qty_client": "100",
      "fgn_quantity": "100.00",
      "brl_quantity": "540.86",
      "quote": "5.4075",
      "final_quotation": "5.4086",
      "iof": "0.00",
      "iof_me": null,
      "iof_percentage": "0",
      "vet": "5.408600",
      "fees_amount": "0.00",
      "fees_amount_me": null,
      "mdr_payer": "0.0000",
      "gas_fee_payer": "0.0000",
      "parity": null
    }
  }
}
```

## 2. Criar uma operação FX Trade (armazenando o UUID do Braza)
```bash
curl -X POST 'https://api.swapcambio.com/api/admin/operations/internal' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "operation_type": "fx_trade",
    "source_currency": "USDT",
    "target_currency": "BRL",
    "source_amount": 100,
    "target_amount": 540.86,
    "exchange_rate": 5.4086,
    "base_rate": 5.4086,
    "spread_bps": 0,
    "side": "buy",
    "braza_order_id": "c83664cc-0126-4ad2-b7bb-33d95e820bef"
  }'
```

## 3. Executar a ordem no Braza Bank
```bash
curl -X POST 'https://api.swapcambio.com/api/admin/braza/execute-order' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "operationId": "OPERATION_ID_FROM_STEP_2",
    "brazaOrderId": "c83664cc-0126-4ad2-b7bb-33d95e820bef"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Order executed successfully in Braza Bank",
  "data": {
    "operationId": "OPERATION_ID_FROM_STEP_2",
    "brazaOrderId": "c83664cc-0126-4ad2-b7bb-33d95e820bef",
    "executeResult": {
      // Resposta do Braza Bank após execução
    }
  }
}
```

## 4. Verificar as requests do Braza Bank
```bash
curl 'https://api.swapcambio.com/api/admin/braza-requests?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Fluxo Completo Implementado:

1. **Preview Quotation**: Obtém cotação e UUID do Braza Bank
2. **Create Operation**: Cria operação armazenando o UUID do Braza
3. **Execute Order**: Executa a ordem no Braza Bank usando o UUID
4. **Logging**: Todas as requests são logadas automaticamente
5. **Status Update**: Operação é marcada como executada

## Campos Adicionados:

- **`braza_order_id`**: Campo na tabela `operations_history` para armazenar o UUID do Braza Bank
- **`execute_order`**: Novo tipo de request logado no sistema de logs do Braza Bank
- **`/api/admin/braza/execute-order`**: Novo endpoint para executar ordens

## Benefícios:

- ✅ **Rastreabilidade completa** das operações no Braza Bank
- ✅ **Logs detalhados** de todas as interações
- ✅ **UUID persistente** para execução posterior
- ✅ **Fluxo completo** preview → create → execute
- ✅ **Validação robusta** de dados obrigatórios
