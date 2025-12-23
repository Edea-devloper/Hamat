import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField, PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy
} from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import {
  PropertyFieldMultiSelect
} from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'HamatNewEmployeeWebPartStrings';
import HamatNewEmployee from './components/HamatNewEmployee';
import { IHamatNewEmployeeProps } from './components/IHamatNewEmployeeProps';
import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp";
import { PropertyFieldColorPicker, PropertyFieldColorPickerStyle } from '@pnp/spfx-property-controls';

export interface IHamatNewEmployeeWebPartProps {
  enableAutoSwitch: boolean | undefined;
  EmployeeTitle: string;
  EmployeeList: string;
  selectedColumns: string[];
  selectedColumnsCard: string[];
  startJobWithinDays: number;
  itemsPerPage: number;
  switchInterval: number;
  SeeAllEmployees: boolean;
  NewEmployeeWebpartHeight: any;
  TextForNoEmployee: string;
  EmailBody: string;
  EmailSubject: string;
  backgroundColor?: string;
  themeColorForFont?:string;
}

export default class HamatNewEmployeeWebPart extends BaseClientSideWebPart<IHamatNewEmployeeWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';
  private _listColumns: { key: string; text: string }[] = [];
  private _sp: SPFI;

  public render(): void {
    const element: React.ReactElement<IHamatNewEmployeeProps> = React.createElement(
      HamatNewEmployee,
      {
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        EmployeeTitle: this.properties.EmployeeTitle,
        EmployeeList: this.properties.EmployeeList,
        selectedColumns: this.properties.selectedColumns,
        context: this.context,
        startJobWithinDays: Number(this.properties.startJobWithinDays) || 30,
        enableAutoSwitch: this.properties.enableAutoSwitch,
        itemsPerPage: Number(this.properties.itemsPerPage) || 1,
        switchInterval: Number(this.properties.switchInterval) || 5,
        SeeAllEmployees: this.properties.SeeAllEmployees,
        NewEmployeeWebpartHeight: this.properties.NewEmployeeWebpartHeight,
        TextForNoEmployee: this.properties.TextForNoEmployee,
        EmailBody: this.properties.EmailBody,
        EmailSubject: this.properties.EmailSubject,
        backgroundColor: this.properties.backgroundColor,
        themeColorForFont:this.properties.themeColorForFont,
        userEmail: this.context.pageContext.user.email,
      }
    );

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

    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams':
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }
          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private async _loadColumns(listId: string): Promise<void> {
    try {
      const fields = await this._sp.web.lists.getById(listId).fields
        .select("InternalName,Title,Hidden,ReadOnlyField,FieldTypeKind")();

      // Define important system columns
      const importantSystemColumns = ["Created", "Author", "Modified", "Editor"];

      this._listColumns = fields
        .filter((f: any) =>
          // Include user-editable columns
          (!f.Hidden &&
            !f.ReadOnlyField &&
            [2, 3, 4, 6, 8, 9, 15, 20].includes(f.FieldTypeKind)) || // Added 15 (MultiChoice)
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



  protected async onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): Promise<void> {
    super.onPropertyPaneFieldChanged(propertyPath, oldValue, newValue);

    if (propertyPath === "EmployeeList" && newValue) {
      this.properties.selectedColumns = [];
      this.properties.selectedColumnsCard = [];

      await this._loadColumns(newValue);
      this.context.propertyPane.refresh();
    }

    this.render();
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('EmployeeTitle', {
                  label: 'New Employee Title'
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
                  label: "Select Columns",
                  options: this._listColumns,
                  selectedKeys: this.properties.selectedColumns || [],
                  disabled: this._listColumns.length === 0,
                }),
                PropertyPaneTextField('startJobWithinDays', {
                  label: 'New Employee within days',
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
                PropertyPaneTextField('TextForNoEmployee', {
                  label: 'Enter text to display when no new employees are found'
                }),
                PropertyPaneTextField('EmailSubject', {
                  label: 'New Employee Email Subject'
                }),
                PropertyPaneTextField('EmailBody', {
                  label: 'New Employee Email Body',
                  multiline: true,
                }),
                PropertyPaneTextField("NewEmployeeWebpartHeight", {
                  label: "Set height",
                  value: this.properties.NewEmployeeWebpartHeight?.toString() || "",
                }),
                PropertyFieldColorPicker('backgroundColor', {
                  label: 'Select Background Color',
                  selectedColor: this.properties.backgroundColor,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  key: 'colorFieldId'
                }),
                 PropertyFieldColorPicker("themeColorForFont", {
                  label: "Select Font Color",
                  selectedColor: this.properties.themeColorForFont,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  key: "colorFieldId",
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}