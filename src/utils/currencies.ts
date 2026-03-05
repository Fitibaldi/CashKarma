export interface Currency {
  code: string;   // ISO 4217 code, e.g. "EUR"
  symbol: string; // Sign/symbol, e.g. "€"
  name: string;   // Display name, e.g. "Euro"
}

export const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CAD', symbol: '$',  name: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$',  name: 'Australian Dollar' },
  { code: 'NZD', symbol: '$',  name: 'New Zealand Dollar' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩',  name: 'South Korean Won' },
  { code: 'HKD', symbol: '$',  name: 'Hong Kong Dollar' },
  { code: 'SGD', symbol: '$',  name: 'Singapore Dollar' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'THB', symbol: '฿',  name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱',  name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫',  name: 'Vietnamese Dong' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei',name: 'Romanian Leu' },
  { code: 'TRY', symbol: '₺',  name: 'Turkish Lira' },
  { code: 'RUB', symbol: '₽',  name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$',  name: 'Mexican Peso' },
  { code: 'ARS', symbol: '$',  name: 'Argentine Peso' },
  { code: 'CLP', symbol: '$',  name: 'Chilean Peso' },
  { code: 'COP', symbol: '$',  name: 'Colombian Peso' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand' },
  { code: 'EGP', symbol: '£',  name: 'Egyptian Pound' },
  { code: 'AED', symbol: 'د.إ',name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal' },
  { code: 'ILS', symbol: '₪',  name: 'Israeli Shekel' },
  { code: 'MKD', symbol: 'ден',name: 'Macedonian Denar' },
  { code: 'RSD', symbol: 'din',name: 'Serbian Dinar' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
  { code: 'UAH', symbol: '₴',  name: 'Ukrainian Hryvnia' },
  { code: 'GEL', symbol: '₾',  name: 'Georgian Lari' },
];

/** Returns the Currency object for a given symbol, or undefined. */
export function getCurrencyBySymbol(symbol: string): Currency | undefined {
  return CURRENCIES.find(c => c.symbol === symbol);
}

/** Returns the Currency object for a given ISO code, or undefined. */
export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code);
}

/** Default currency symbol used across the app. */
export const DEFAULT_CURRENCY = '€';
