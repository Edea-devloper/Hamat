import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy,
} from "@pnp/spfx-property-controls/lib/PropertyFieldListPicker";
import * as strings from "HamatGreetingsAndWishesWebPartStrings";
import HamatGreetingsAndWishes from "./components/HamatGreetingsAndWishes";
import { IHamatGreetingsAndWishesProps } from "./components/IHamatGreetingsAndWishesProps";
import { getCurrentUserEmail } from "./Utility/utils";
import { PropertyFieldMultiSelect, PropertyFieldNumber } from "@pnp/spfx-property-controls";
import { SPFI } from "@pnp/sp";
import { getSP } from "../hamatEmployeeBirthday/Utility/getSP";

export interface IHamatGreetingsAndWishesWebPartProps {
  GreetingsAndWishes: string;
  context: any;
  congratsAndGreetingList: string;
  hamatEmployeeList: string;
  currentUserEmail: string;
  enableAutoSwitch: boolean;
  switchInterval: string | number | any;
  itemsPerPage: string | number | any;
  selectedColumns: string[];
  greetingWebpartHeight: number;
  SeeAllEmployees: boolean;
}

export default class HamatGreetingsAndWishesWebPart extends BaseClientSideWebPart<IHamatGreetingsAndWishesWebPartProps> {
  private currentUserEmail: string = "";
  private _listColumns: { key: string; text: string }[] = [];
  private _sp: SPFI;

  public render(): void {
    const element: React.ReactElement<IHamatGreetingsAndWishesProps> =
      React.createElement(HamatGreetingsAndWishes, {
        GreetingsAndWishes: this.properties.GreetingsAndWishes,
        context: this.context,
        congratsAndGreetingList: this.properties.congratsAndGreetingList,
        hamatEmployeeList: this.properties.hamatEmployeeList,
        currentUserEmail: this.currentUserEmail,
        enableAutoSwitch: this.properties.enableAutoSwitch,
        switchInterval: this.properties.switchInterval || 4,
        itemsPerPage: this.properties.itemsPerPage || 1,
        selectedColumns: this.properties.selectedColumns,
        greetingWebpartHeight: this.properties.greetingWebpartHeight,
        SeeAllEmployees: this.properties.SeeAllEmployees
      });

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    this._sp = getSP(this.context);
    return this._getEnvironmentMessage().then(async (message) => {
      // Get current user email
      try {
        this.currentUserEmail = await getCurrentUserEmail(this.context);
      } catch (error) {
        console.error("Failed to get current user email:", error);
        // Fallback to context email if available
        this.currentUserEmail = this.context.pageContext.user.email || "";
      }
    });
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

    // this._isDarkTheme = !!currentTheme.isInverted;
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
  protected async onPropertyPaneConfigurationStart(): Promise<void> {
    if (this.properties.congratsAndGreetingList) {
      await this._loadColumns(this.properties.congratsAndGreetingList);
      this.context.propertyPane.refresh();
    }
  }

  protected async onPropertyPaneFieldChanged(
    propertyPath: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    if (propertyPath === "congratsAndGreetingList" && newValue) {
      this.properties.selectedColumns = [];
      await this._loadColumns(newValue);
      this.context.propertyPane.refresh();
    }

    this.render();
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  private async _loadColumns(listId: string): Promise<void> {
    try {
      const fields = await this._sp.web.lists
        .getById(listId)
        .fields.select(
          "InternalName,Title,Hidden,ReadOnlyField,FieldTypeKind"
        )();

      this._listColumns = fields
        .filter(
          (f: any) => !f.Hidden && (!f.ReadOnlyField || f.FieldTypeKind === 17)
        )
        .map((f: any) => ({
          key: f.InternalName,
          text: f.Title,
        }));
    } catch (err) {
      console.error("Error loading columns:", err);
      this._listColumns = [];
    }
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
                PropertyPaneTextField("GreetingsAndWishes", {
                  label: "GreetingsAndWishes Title",
                }),
                PropertyFieldListPicker("congratsAndGreetingList", {
                  label: "Select MazalTov List",
                  selectedList: this.properties.congratsAndGreetingList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "congratsAndGreetingList",
                }),
                PropertyFieldListPicker("hamatEmployeeList", {
                  label: "Select Employee List",
                  selectedList: this.properties.hamatEmployeeList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "hamatEmployeeList",
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
                PropertyFieldMultiSelect("selectedColumns", {
                  key: "multiSelectColumns",
                  label: "Select Columns to Display",
                  options: this._listColumns,
                  selectedKeys: this.properties.selectedColumns || [],
                  disabled: this._listColumns.length === 0,
                }),
                PropertyPaneTextField("greetingWebpartHeight", {
                  label: "Set height",
                  value: this.properties.greetingWebpartHeight?.toString() || "",
                }),
                PropertyPaneToggle("SeeAllEmployees", {
                  label: "See All Employees",
                  checked: this.properties.SeeAllEmployees,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
