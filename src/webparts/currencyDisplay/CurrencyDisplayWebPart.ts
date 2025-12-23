import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import {
  BaseClientSideWebPart,
  WebPartContext,
} from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";

import * as strings from "CurrencyDisplayWebPartStrings";
import CurrencyDisplay from "./components/CurrencyDisplay";
import { ICurrencyDisplayProps } from "./components/ICurrencyDisplayProps";
import {
  CustomCollectionFieldType,
  PropertyFieldCollectionData,
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy,
} from "@pnp/spfx-property-controls";
import { get } from "@microsoft/sp-lodash-subset";
import { getSP } from "../hamatEmployeeBirthday/Utility/getSP";
import { getListItems } from '../hamatEmployeeBirthday/Utility/utils';

// Interface for preloaded data cache
interface IPreloadedData {
  todayRecords: any[];
  yesterdayRecords: any[];
  syncedCountries: any[];
  timestamp: number;
}

export interface ICurrencyDisplayWebPartProps {
  description: string;
  context: WebPartContext;
  apiKey: string;
  countries: { countryName: string; countryCode: string }[];
  CurrencyList: string;
}

export default class CurrencyDisplayWebPart extends BaseClientSideWebPart<ICurrencyDisplayWebPartProps> {
  // Class properties for data preloading
  private _preloadedData: IPreloadedData | null = null;
  private _dataLoadPromise: Promise<void> | null = null;

  public render(): void {
    const element: React.ReactElement<ICurrencyDisplayProps> =
      React.createElement(CurrencyDisplay, {
        context: this.context,
        apiKey: this.properties.apiKey,
        countries: this.properties.countries,
        CurrencyList: this.properties.CurrencyList,
        preloadedData: this._preloadedData  // Pass preloaded data to component
      });

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await this._getEnvironmentMessage();
    getSP(this.context);

    // Start preloading data immediately (runs in parallel)
    this._dataLoadPromise = this._preloadData();

    // Wait for preload to complete before rendering
    // Comment out the line below if you want the webpart to render immediately with loading state
    this._dataLoadPromise = this._preloadData().then(() => {
      this.render();
    });
    return Promise.resolve();

  }

  // Method to preload all necessary data in parallel
  private async _preloadData(): Promise<void> {
    try {
      const { CurrencyList, countries, apiKey } = this.properties;

      // Validate required properties
      if (!CurrencyList || !countries || countries.length === 0) {
        console.log('Cannot preload: Missing list or countries configuration');
        return;
      }

      const startTime = Date.now();

      // Get today and yesterday dates
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Parallel data loading for better performance (all 3 calls happen simultaneously)
      const [syncedCountries, todayRecords, yesterdayRecords] = await Promise.all([
        Promise.resolve(countries), // Just use the countries from properties directly
        getListItems(CurrencyList, this.context, false),
        getListItems(CurrencyList, this.context, false)
      ]);

      // Cache the preloaded data
      this._preloadedData = {
        todayRecords,
        yesterdayRecords,
        syncedCountries,
        timestamp: Date.now()
      };

      const loadTime = Date.now() - startTime;

    } catch (error) {
      console.error('Error preloading data:', error);
      this._preloadedData = null;
    }
  }

  // Handle property pane field changes
  protected async onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): Promise<void> {
    // If critical properties changed, invalidate cache and reload data
    if (propertyPath === 'countries' || propertyPath === 'CurrencyList' || propertyPath === 'apiKey') {
      // Invalidate cache
      this._preloadedData = null;

      // Reload data with new configuration
      this._dataLoadPromise = this._preloadData();
      await this._dataLoadPromise;
    }

    // Re-render the webpart with new data
    this.render();
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app
        .getContext()
        .then((context) => {
          let environmentMessage: string = "";
          switch (context.app.host.name) {
            case "Office": // running in Office
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOffice
                : strings.AppOfficeEnvironment;
              break;
            case "Outlook": // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOutlook
                : strings.AppOutlookEnvironment;
              break;
            case "Teams": // running in Teams
            case "TeamsModern":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentTeams
                : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(
      this.context.isServedFromLocalhost
        ? strings.AppLocalEnvironmentSharePoint
        : strings.AppSharePointEnvironment
    );
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty(
        "--bodyText",
        semanticColors.bodyText || null
      );
      this.domElement.style.setProperty("--link", semanticColors.link || null);
      this.domElement.style.setProperty(
        "--linkHovered",
        semanticColors.linkHovered || null
      );
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
                PropertyFieldListPicker("CurrencyList", {
                  label: "Select Currency List",
                  selectedList: this.properties.CurrencyList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "EmployeeListPicker",
                }),
                PropertyPaneTextField("apiKey", {
                  label: "Exchange Rate API Key",
                  value: this.properties.apiKey,
                }),
                PropertyFieldCollectionData("countries", {
                  key: "countries",
                  label: "Countries and Codes",
                  panelHeader: "Manage Countries",
                  manageBtnLabel: "Manage Countries",
                  value: this.properties.countries,
                  fields: [
                    {
                      id: "countryName",
                      title: "Country Name",
                      type: CustomCollectionFieldType.string,
                    },
                    {
                      id: "countryCode",
                      title: "Country Code (for Flag)",
                      type: CustomCollectionFieldType.string,
                    },
                  ],
                  disabled: false,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}