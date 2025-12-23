import * as React from 'react';
import styles from './CurrencyDisplay.module.scss';
import type { ICurrencyDisplayProps } from './ICurrencyDisplayProps';
import { HttpClient } from '@microsoft/sp-http';
import ReactCountryFlag from "react-country-flag";
import { getListItems, syncCountriesWithList, saveCurrencyData, cleanOldCurrencyRecords } from '../Utility/utils';

interface ICurrency {
  code: string;
  rate: number;
  changePercent: number;
}

interface ICurrencyDisplayState {
  currencies: ICurrency[];
  countries: { countryName: string; countryCode: string }[];
}

export default class CurrencyDisplay extends React.Component<ICurrencyDisplayProps, ICurrencyDisplayState> {
  private timerId?: number;

  // Step 2: Constructor initializes state from props.
  constructor(props: ICurrencyDisplayProps) {
    super(props);
    this.state = {
      currencies: [],
      countries: props.countries || []
    };
  }

  // Step 3: Lifecycle method to sync countries and fetch data on mount.
  public async componentDidMount(): Promise<void> {
    // Sync property pane countries with SharePoint list.
    const syncedCountries = await syncCountriesWithList(
      this.props.context,
      this.props.countries || [],
      this.props.apiKey,
      this.props.CurrencyList
    );

    // Update state with synced countries, filtering out invalid entries.
    const validCountries = syncedCountries
      .filter(c => c && (c.CountryName || c.countryName))
      .map(c => ({
        countryName: c.CountryName || c.countryName,
        countryCode: c.CountryCode || c.countryCode || 'US'
      }));

    this.setState({
      countries: validCountries,
      currencies: []
    }, () => {
      // After updating countries, fetch currency data if countries exist.
      if (validCountries.length > 0) {
        this.fetchCurrencyData();
      }
    });

    // Refresh data every 24 hours.
    this.timerId = window.setInterval(() => this.fetchCurrencyData(), 24 * 60 * 60 * 1000);
  }

  // Step 4: Cleanup interval on unmount to prevent memory leaks.
  public componentWillUnmount(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
  }

  // Checks list for today/yesterday rates, fetches missing via API, calculates changes.
  private fetchCurrencyData = async (): Promise<void> => {
    try {
      const { apiKey, CurrencyList, context } = this.props;
      const { countries } = this.state;

      if (!countries || countries.length === 0) {
        console.log("No countries configured");
        return;
      }

      const currencyCodes = countries.map((c) => c.countryName.toUpperCase());
      const symbols = ["ILS", ...currencyCodes].join(",");

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Step 5.1: Get today's records from the list.
      const todayRecords = await getListItems(CurrencyList, context, todayStr);

      // Create map of today's rates by code.
      const todayRates: { [key: string]: number } = {};
      todayRecords.forEach(record => {
        const code = (record.Title || record.CountryName).toUpperCase();
        todayRates[code] = record.Rate;
      });

      // Identify missing codes for today.
      const missingToday = currencyCodes.filter(code => todayRates[code] === undefined);

      // Step 5.2: If any missing for today, fetch from API and save missing.
      if (missingToday.length > 0 && apiKey) {
        console.log(`Missing today's data for ${missingToday.join(', ')}, calling API...`);
        const todayUrl = `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&symbols=${symbols}`;
        const todayResp = await context.httpClient.get(todayUrl, HttpClient.configurations.v1);
        const todayData = await todayResp.json();

        const ilsRate = todayData.rates["ILS"];

        // Prepare data to save for missing codes.
        const dataToSave = missingToday.map(code => ({
          Title: code,
          CountryName: code,
          CountryCode: countries.find(c => c.countryName.toUpperCase() === code)?.countryCode || 'US',
          Rate: ilsRate / todayData.rates[code],
          ChangePercent: 0,
          Date: new Date(todayStr).toISOString()
        }));

        // Save to SharePoint list.
        await saveCurrencyData(CurrencyList, context, dataToSave);

        // Update todayRates with new data.
        missingToday.forEach(code => {
          todayRates[code] = ilsRate / todayData.rates[code];
        });
      } else if (missingToday.length > 0) {
        console.warn("API key missing, cannot fetch rates for new countries.");
      }

      // Step 5.3: Get yesterday's records from the list.
      const yesterdayRecords = await getListItems(CurrencyList, context, yesterdayStr);

      // Create map of yesterday's rates by code.
      const yesterdayRates: { [key: string]: number } = {};
      yesterdayRecords.forEach(record => {
        const code = (record.Title || record.CountryName).toUpperCase();
        yesterdayRates[code] = record.Rate;
      });

      // Identify missing codes for yesterday.
      const missingYesterday = currencyCodes.filter(code => yesterdayRates[code] === undefined);

      // Step 5.4: If any missing for yesterday, fetch from API and save missing.
      if (missingYesterday.length > 0 && apiKey) {
        console.log(`Missing yesterday's data for ${missingYesterday.join(', ')}, calling API...`);
        const yesterdayUrl = `https://openexchangerates.org/api/historical/${yesterdayStr}.json?app_id=${apiKey}&symbols=${symbols}`;
        const yesterdayResp = await context.httpClient.get(yesterdayUrl, HttpClient.configurations.v1);
        const yesterdayData = await yesterdayResp.json();

        const ilsRate = yesterdayData.rates["ILS"];

        // Prepare data to save for missing codes.
        const dataToSave = missingYesterday.map(code => ({
          Title: code,
          // CountryName: code,
          CountryCode: countries.find(c => c.countryName.toUpperCase() === code)?.countryCode || 'US',
          Rate: ilsRate / yesterdayData.rates[code],
          ChangePercent: 0,
          Date: new Date(yesterdayStr).toISOString()
        }));

        // Save to SharePoint list.
        await saveCurrencyData(CurrencyList, context, dataToSave);

        // Update yesterdayRates with new data.
        missingYesterday.forEach(code => {
          yesterdayRates[code] = ilsRate / yesterdayData.rates[code];
        });
      } else if (missingYesterday.length > 0) {
        console.warn("API key missing, cannot fetch historical rates for new countries.");
      }

      // Step 5.5: Calculate change percentage and create currency array.
      const currencies: ICurrency[] = currencyCodes
        .map(code => {
          const rateToday = todayRates[code];
          const rateYesterday = yesterdayRates[code];

          if (rateToday === undefined) {
            console.warn(`Missing today's rate for ${code}`);
            return null;
          }

          const changePercent = rateYesterday !== undefined
            ? ((rateToday - rateYesterday) / rateYesterday) * 100 
            : 0;
          // If no yesterday, assume 0 change

          return {
            code,
            rate: rateToday,
            changePercent
          };
        })
        .filter(Boolean) as ICurrency[];

      this.setState({ currencies });

      // Cleanup old records after successfully updating today/yesterday data
      await cleanOldCurrencyRecords(CurrencyList, context);

      console.log("Currency data updated and old records cleaned.");

    } catch (error) {
      console.error("Error fetching exchange rates:", error);
    }
  };

  // Step 6: Render method to display currencies in a ticker format.
  public render(): React.ReactElement<ICurrencyDisplayProps> {
    const { currencies, countries } = this.state;

    return (
      <div className="dashboard-container">
        <div className={styles['currency-section']}>
          <div className={styles['ticker-scroll']}>
            <div className={styles['ticker-content']}>
              {currencies.map(c => {
                const isUp = c.changePercent >= 0;
                const country = countries?.find(ct => ct.countryName.toUpperCase() === c.code);
                const countryCode = country?.countryCode || 'US';

                return (
                  <div key={c.code} className={styles['currency-item']}>
                    <div>
                      <ReactCountryFlag
                        countryCode={countryCode}
                        svg
                        style={{ width: '1.5em', height: '1.5em' }}
                        title={c.code}
                      />
                    </div>
                    <div className={styles['currency-rate']}>
                      <div className={`${styles['rate-value']} ${isUp ? styles['positive'] : styles['negative']}`}>
                        {parseFloat(String(c.rate || "0")).toFixed(4)}
                      </div>
                      <div className={`${styles['rate-change']} ${isUp ? styles['positive'] : styles['negative']}`}>
                        <i className={`fas ${isUp ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                        {isUp ? '+' : ''}
                        {parseFloat(String(c.changePercent || "0")).toFixed(2)}%
                      </div>
                    </div>
                    <div className={styles['currency-flag']}>{c.code}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}