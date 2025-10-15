import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface ICurrencyDisplayProps {
  context: WebPartContext;
  countries: { countryName: string; countryCode: string }[];
  apiKey: string;
  CurrencyList: string;
  
  // Add preloaded data property
  preloadedData?: {
    todayRecords: any[];
    yesterdayRecords: any[];
    syncedCountries: any[];
    timestamp: number;
  } | null;
}