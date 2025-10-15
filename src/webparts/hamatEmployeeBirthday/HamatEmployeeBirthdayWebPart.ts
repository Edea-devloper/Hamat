import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";
import {
  BaseClientSideWebPart,
  WebPartContext,
} from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";

import * as strings from "HamatEmployeeBirthdayWebPartStrings";
import HamatEmployeeBirthday from "./components/HamatEmployeeBirthday";
import { IHamatEmployeeBirthdayProps } from "./components/IHamatEmployeeBirthdayProps";
import { SPComponentLoader } from "@microsoft/sp-loader";
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy,
  PropertyFieldMultiSelect,
} from "@pnp/spfx-property-controls";
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp";

export interface IHamatEmployeeBirthdayWebPartProps {
  BirthDayTitle: string;
  daysBefore: number;
  daysAfter: number;
  showAllCompanies: boolean;
  EmployeeList: string;
  selectedColumns: string[];
  enableAutoSwitch: boolean | undefined;
  itemsPerPage: number;
  switchInterval: number;
  SeeAllEmployees: boolean; // Added
  decadeMessage: string;
  birthdayWebpartHeight: number;
}

export default class HamatEmployeeBirthdayWebPart extends BaseClientSideWebPart<IHamatEmployeeBirthdayWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = "";
  private _listColumns: { key: string; text: string }[] = [];
  private _sp: SPFI;

  public render(): void {
    const element: React.ReactElement<IHamatEmployeeBirthdayProps> =
      React.createElement(HamatEmployeeBirthday, {
        BirthDayTitle: this.properties.BirthDayTitle,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        context: this.context,
        daysBefore: this.properties.daysBefore,
        daysAfter: this.properties.daysAfter,
        showAllCompanies: this.properties.showAllCompanies,
        EmployeeList: this.properties.EmployeeList,
        selectedColumns: this.properties.selectedColumns,
        enableAutoSwitch: this.properties.enableAutoSwitch,
        itemsPerPage: Number(this.properties.itemsPerPage) || 1,
        switchInterval: Number(this.properties.switchInterval) || 5,
        SeeAllEmployees: this.properties.SeeAllEmployees, // Added
        decadeMessage: this.properties.decadeMessage,
        birthdayWebpartHeight: this.properties.birthdayWebpartHeight
      });

    ReactDom.render(element, this.domElement);
  }

  protected async onPropertyPaneConfigurationStart(): Promise<void> {
    if (this.properties.EmployeeList) {
      await this._loadColumns(this.properties.EmployeeList);
      this.context.propertyPane.refresh();
    }
  }

  protected async onInit(): Promise<void> {
    if (!this.context) {
      console.error("WebPart context is not available.");
      return Promise.reject("Context not available");
    }

    this._sp = spfi().using(SPFx(this.context));

    SPComponentLoader.loadCss(
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    );

    return this._getEnvironmentMessage().then((message) => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app
        .getContext()
        .then((context) => {
          let environmentMessage: string = "";
          switch (context.app.host.name) {
            case "Office":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOffice
                : strings.AppOfficeEnvironment;
              break;
            case "Outlook":
              environmentMessage = this.context.isServedFromLocalhost
                ? strings.AppLocalEnvironmentOutlook
                : strings.AppOutlookEnvironment;
              break;
            case "Teams":
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

    this._isDarkTheme = !!currentTheme.isInverted;
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

  // get columns for select columns dropdown
  private async _loadColumns(listId: string): Promise<void> {
    try {
      const fields = await this._sp.web.lists.getById(listId).fields
        .select("InternalName,Title,Hidden,ReadOnlyField,FieldTypeKind")();

      // Define important system columns
      const importantSystemColumns = ["Created", "Author", "Modified", "Editor"];

      this._listColumns = fields
        .filter((f: any) =>
          // Include user-editable columns
          (!f.Hidden && !f.ReadOnlyField &&
            [2, 3, 4, 6, 8, 9, 20, 15 ].includes(f.FieldTypeKind))
          ||
          // Include important system columns
          importantSystemColumns.includes(f.InternalName)
        )
        .map((f: any) => ({
          key: f.InternalName,
          text: `${f.Title}`
        }));

    } catch (err) {
      console.error("Error loading columns:", err);
      this._listColumns = [];
    }
  }

  protected async onPropertyPaneFieldChanged(
    propertyPath: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    if (propertyPath === "EmployeeList" && newValue) {
      this.properties.selectedColumns = [];
      await this._loadColumns(newValue);
      this.context.propertyPane.refresh();
    }

    this.render();
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
                PropertyPaneTextField("BirthDayTitle", {
                  label: "Birth Day Title",
                }),
                PropertyFieldListPicker("EmployeeList", {
                  label: "Select Employee List",
                  selectedList: this.properties.EmployeeList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "EmployeeListPicker",
                }),
                PropertyFieldMultiSelect("selectedColumns", {
                  key: "multiSelectColumns",
                  label: "Select Columns to Display",
                  options: this._listColumns,
                  selectedKeys: this.properties.selectedColumns || [],
                  disabled: this._listColumns.length === 0,
                }),
                PropertyPaneTextField("daysBefore", {
                  label: "Days Before Today",
                  description:
                    "Enter how many days before today to show birthdays",
                  value: this.properties.daysBefore?.toString(),
                }),
                PropertyPaneTextField("daysAfter", {
                  label: "Days After Today",
                  description:
                    "Enter how many days after today to show birthdays",
                  value: this.properties.daysAfter?.toString(),
                }),
                PropertyPaneToggle("enableAutoSwitch", {
                  label: "Enable/Disable Auto Switch",
                  checked: this.properties.enableAutoSwitch,
                }),
                PropertyPaneTextField("itemsPerPage", {
                  label: "Number of items per page",
                  disabled: !this.properties.enableAutoSwitch,
                }),
                PropertyPaneTextField("switchInterval", {
                  label: "Switch Interval (seconds)",
                  disabled: !this.properties.enableAutoSwitch,
                }),
                PropertyPaneToggle("SeeAllEmployees", {
                  label: "See All Employees",
                  checked: this.properties.SeeAllEmployees,
                }),
                PropertyPaneTextField("decadeMessage", {
                  label: "Decade Birthday Message",
                  value: this.properties.decadeMessage,
                }),
                PropertyPaneTextField("birthdayWebpartHeight", {
                  label: "Set height",
                  value: this.properties.birthdayWebpartHeight?.toString() || "",
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
