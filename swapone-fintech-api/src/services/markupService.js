class MarkupService {
  constructor() {
    this.markup = {
      USDT: 0.5,
      USD: 0.5
    };
  }

  getMarkup(currency) {
    return this.markup[currency] || 0.5;
  }

  setMarkup(currency, percentage) {
    if (percentage < 0 || percentage > 10) {
      throw new Error('Markup must be between 0 and 10%');
    }
    
    this.markup[currency] = percentage;
    console.log(`✅ Markup atualizado: ${currency} = ${percentage}%`);
    
    return {
      success: true,
      currency,
      markup: percentage
    };
  }

  getAllMarkups() {
    return this.markup;
  }

  applyMarkup(value, currency) {
    const markupPercentage = this.getMarkup(currency);
    const markupMultiplier = 1 + (markupPercentage / 100);
    const finalValue = parseFloat(value) * markupMultiplier;
    
    console.log(`💰 Aplicando markup de ${markupPercentage}% em ${currency}:`);
    console.log(`   Valor original: ${value}`);
    console.log(`   Multiplicador: ${markupMultiplier}`);
    console.log(`   Valor final: ${finalValue.toFixed(4)}`);
    
    return finalValue.toFixed(4);
  }
}

const markupService = new MarkupService();

module.exports = markupService;



