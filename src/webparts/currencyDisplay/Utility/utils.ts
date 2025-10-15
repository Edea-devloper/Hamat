import { getSP } from "./getSP";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { WebPartContext } from "@microsoft/sp-webpart-base";

// This is used to retrieve currency records for specific days.
export const getListItems = async (
  listId: string,
  context: WebPartContext,
  filterDate?: string
): Promise<any[]> => {
  try {
    const _sp = getSP(context); // Initialize SharePoint context.

    if (!listId) {
      console.error("Currency list not selected in web part properties.");
      return [];
    }

    let items = [];
    if (filterDate) {
      // If a date is provided, filter items to that specific day (start to end).
      const startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filterDate);
      endDate.setHours(23, 59, 59, 999);

      items = await _sp.web.lists
        .getById(listId)
        .items.filter(`Date ge datetime'${startDate.toISOString()}' and Date le datetime'${endDate.toISOString()}'`)
        .select("Id", "Title", "CountryName", "CountryCode", "Rate", "ChangePercent", "Date")();
    } else {
      // Otherwise, fetch up to 5000 recent items without date filter.
      items = await _sp.web.lists
        .getById(listId)
        .items.select("Id", "Title", "CountryName", "CountryCode", "Rate", "ChangePercent", "Date")
        .top(5000)();
    }

    return items;
  } catch (error) {
    console.error(`Error fetching items from list:`, error);
    throw error;
  }
};

// Step 2: Function to sync countries from property pane with SharePoint list.
// This ensures all configured countries exist in the list.
// FIXED: No longer adds blank records, only returns country metadata for component to handle.
export const syncCountriesWithList = async (
  context: WebPartContext,
  countries: any[],
  apiKey?: string,
  listId?: string
): Promise<any[]> => {
  try {
    const _sp = getSP(context); // Initialize SharePoint context.

    if (!listId) {
      console.error("Currency list not selected in web part properties.");
      return countries || [];
    }

    const list = _sp.web.lists.getById(listId);

    // Fetch all existing items to check which countries exist.
    const existingItems = await list.items
      .select("Id", "Title", "CountryName", "CountryCode", "Date")
      .orderBy("Date", true)();

    // Build a map of unique countries by Title (currency code).
    const uniqueCountries = new Map<string, any>();
    existingItems.forEach(item => {
      if (!uniqueCountries.has(item.Title) || !item.Date) {
        uniqueCountries.set(item.Title, item);
      }
    });

    const existingUniqueItems = Array.from(uniqueCountries.values());

    // REMOVED: No longer adds blank records here
    // The component will handle adding today's and yesterday's data via API

    // Return the property pane countries as-is
    // The component will detect missing countries and fetch their data
    return countries || [];
  } catch (error) {
    console.error("Error syncing countries:", error);
    return countries || [];
  }
};

// Step 3: REMOVED addCountriesToList function
// No longer needed since we don't add blank records

// Step 4: Function to save new currency data records to the SharePoint list.
// Used to persist fetched rates for today/yesterday.
export const saveCurrencyData = async (
  listId: string,
  context: WebPartContext,
  data: {
    Title: string;
    CountryName: string;
    CountryCode: string;
    Rate: number;
    ChangePercent: number;
    Date: string;
  }[]
): Promise<void> => {
  try {
    const _sp = getSP(context); // Initialize SharePoint context.

    if (!listId) {
      console.error("Currency list not selected in web part properties.");
      return;
    }

    const list = _sp.web.lists.getById(listId);

    // Add each data item to the list, formatting numbers.
    for (const item of data) {
      await list.items.add({
        Title: String(item.Title),
        CountryName: String(item.CountryName),
        CountryCode: String(item.CountryCode),
        Rate: item.Rate ? Number(item.Rate).toFixed(4) : "0",
        ChangePercent: item.ChangePercent ? Number(item.ChangePercent).toFixed(2) : "0",
        Date: new Date(item.Date).toISOString()
      });
    }
  } catch (error) {
    console.error("Error saving currency data:", error);
    throw error;
  }
};