# 🔍 Por que os Serviços Caem?

## ❌ Problema Identificado

Os serviços caem devido a **múltiplos processos rodando simultaneamente**:

1. **Processos duplicados**: Quando os serviços são reiniciados manualmente, os processos antigos não são totalmente limpos
2. **Conflito de porta**: Múltiplas instâncias tentam usar as mesmas portas (5001 e 5002)
3. **Sem monitoramento automático**: Não há um sistema que detecta e reinicia os serviços quando eles caem

## 🎯 Solução Implementada

Foi criado um script de monitoramento robusto: `monitor-services.sh`

### Características:
- ✅ Monitora **backend E frontend** simultaneamente
- ✅ Verifica **porta onboarding E health check**
- ✅ Limpa processos antigos antes de reiniciar
- ✅ Logs detalhados em `/tmp/services-monitor.log`

## 🚀 Como Usar

### Opção 1: Iniciar Monitoramento Manualmente
```bash
cd /root/swapone-fintech-one
./monitor-services.sh
```

### Opção 2: Rodar em Background
```bash
cd /root/swapone-fintech-one
nohup ./monitor-services.sh > /tmp/monitor.log 2>&1 &
```

### Opção 3: Configurar como Serviço systemd (Recomendado)

Criar arquivo: `/etc/systemd/system/swapone-monitor.service`
```ini
[Unit]
Description=SwapOne Services Monitor
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/swapone-fintech-one
ExecStart=/root/swapone-fintech-one/monitor-services.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Depois ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable swapone-monitor.service
sudo systemctl start swapone-monitor.service
sudo systemctl status swapone-monitor.service
```

## 📋 Comandos Úteis

### Verificar Status dos Serviços
```bash
# Ver portas
netstat -tlnp | grep -E "(:5001|:5002)"

# Ver processos
ps aux | grep -E "(swapone-fintech|vite)" | grep -v grep

# Testar serviços
curl http://localhost:5002/health
curl -I http://localhost:5001
```

### Limpar Processos Duplicados
```bash
# Matar todos os processos do backend
pkill -9 -f "swapone-fintech-api.*node src/server.js"

# Matar todos os processos do frontend
pkill -9 -f "swapone-fintech-front.*vite"

# Verificar se limpou
ps aux | grep -E "(swapone-fintech)" | grep -v grep
```

### Ver Logs
```bash
# Logs do monitoramento
tail -f /tmp/services-monitor.log

# Logs do backend
tail -f /tmp/backend.log

# Logs do frontend
tail -f /tmp/frontend.log
```

## 🔄 Reiniciar Serviços Manualmente

Se precisar reiniciar manualmente:

```bash
cd /root/swapone-fintech-one

# Opção 1: Usar script de gerenciamento
./manage-server.sh restart

# Opção 2: Manual
# Parar tudo
pkill -9 -f "swapone-fintech"
pkill - excessively-f "vite"

# Iniciar backend
cd swapone-fintech-api
nohup npm start > /tmp/backend.log 2>&1 &

# Iniciar frontend
cd ../swapone-fintech-front
nohup npm run dev > /tmp/frontend.log 2>&1 &
```

## ⚠️ Prevenção

Para evitar que os serviços caiam:

1. **Sempre usar o script de monitoramento** em produção
2. **Verificar processos duplicados** antes de iniciar novos
3. **Não matar processos manualmente** sem verificar se há outros rodando
4. **Configurar como serviço systemd** para reinício automático após reboot

## 📊 Status Atual

- ✅ Backend: Rodando na porta 5002
- ✅ Frontend: Rodando na porta 5001
- ✅ Monitoramento: Script criado e pronto para uso







