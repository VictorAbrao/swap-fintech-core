# USDC Support in FX Trade

## Overview
FX Trade now supports both USDT and USDC trading through Braza Bank integration.

## Environment Variables

Add the following environment variable to your `.env` file:

```bash
# Braza Product ID for USDT (default, used by USDT and other currencies)
BRAZA_PRODUCT_ID=182

# Braza Product ID for USDC
BRAZA_PRODUCT_ID_USDC=194
```

## How It Works

### Backend Changes

1. **brazaBankService.js**
   - Added `getProductId(currency)` method to dynamically select the correct product ID
   - USDC uses product ID 194
   - USDT and other currencies use product ID 182 (default)

2. **API Endpoints**
   - Updated `/api/public/quotation` to accept USDC
   - Updated `/api/public/clients/quotation` to accept USDC

### Frontend Changes

1. **User FX Trade Page** (`FXTrade.tsx`)
   - Added currency dropdown to select between USDT and USDC
   - Default currency is USDT

2. **Admin FX Trade Page** (`AdminMesaFXTrade.tsx`)
   - Added currency dropdown to select between USDT and USDC
   - Dynamic markup loading based on selected currency
   - Product ID is selected automatically based on currency

### Request Format

When requesting a quotation, the system automatically selects the correct product ID based on the currency:

**For USDT:**
```json
{
  "currency_amount": "USDT",
  "amount": 1,
  "currency": "USDT:BRL",
  "side": "buy",
  "product_id": 182
}
```

**For USDC:**
```json
{
  "currency_amount": "USDC",
  "amount": 1,
  "currency": "USDC:BRL",
  "side": "buy",
  "product_id": 194
}
```

## Notes

- Both currencies use the same market rate structure
- Markup can be set separately for USDT and USDC
- All other functionality remains the same for both currencies
