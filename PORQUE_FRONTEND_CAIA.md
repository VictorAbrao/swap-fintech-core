# 🔍 Por que o Frontend Estava Caindo Tanto?

## ❌ Problemas Identificados

### 1. **WebSocket HMR em Conflito**
- **Problema**: O Vite estava configurado para usar WebSocket HMR (Hot Module Replacement) na porta 443 com protocolo WSS
- **Erro**: `WebSocket server error: Port is already in use`
- **Causa**: Múltiplas instâncias ou conflito com o nginx
- **Solução**: **Desabilitado HMR** no `vite.config.ts` (`hmr: false`)

### 2. **Processos Duplicados**
- **Problema**: Múltiplos processos `npm run dev` e `vite` rodando simultaneamente
- **Causa**: Quando o monitoramento reiniciava, não limpava todos os processos antigos
- **Solução**: Melhorada a limpeza de processos no script de monitoramento

### 3. **Limpeza Insuficiente de Portas**
- **Problema**: Porta 5001 às vezes ficava presa mesmo após matar processos
- **Solução**: Adicionado `lsof -ti:5001 | xargs kill -9` para forçar limpeza

## ✅ Correções Aplicadas

### 1. Configuração do Vite (`vite.config.ts`)
```typescript
server: {
  host: "0.0.0.0",
  port: 5001,
  strictPort: true,        // ✅ Não permite porta alternativa
  allowedHosts: true,
  hmr: false,              // ✅ HMR desabilitado (sem WebSocket)
}
```

### 2. Script de Monitoramento Melhorado (`monitor-services.sh`)
- ✅ Limpeza mais agressiva de processos antes de reiniciar
- ✅ Força limpeza de portas presas com `lsof`
- ✅ Tempo de espera aumentado para 8 segundos (frontend demora mais para iniciar)

## 📊 Resultado Esperado

Com essas correções, o frontend deve:
- ✅ Não tentar abrir WebSocket desnecessariamente
- ✅ Ser reiniciado corretamente quando necessário
- ✅ Não deixar portas presas
- ✅ Ter monitoramento mais robusto

## 🔄 Próximos Passos

Se o frontend ainda cair, verificar:
1. Logs em `/tmp/frontend.log`
2. Logs do monitoramento em `/tmp/services-monitor.log`
3. Processos duplicados: `ps aux | grep vite | grep swapone-fintech`
4. Uso de memória: `free -h`

