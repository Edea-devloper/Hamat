import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  PropertyPaneTextField,
  type IPropertyPaneConfiguration,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
import { IReadonlyTheme } from "@microsoft/sp-component-base";
import {
  PropertyFieldListPicker,
  PropertyFieldListPickerOrderBy,
} from "@pnp/spfx-property-controls/lib/PropertyFieldListPicker";
import * as strings from "HamatEmployeeSearchComponentWebPartStrings";
import HamatEmployeeSearchComponent from "./components/HamatEmployeeSearchComponent";
import { IHamatEmployeeSearchComponentProps } from "./components/IHamatEmployeeSearchComponentProps";
import {
  IColumnReturnProperty,
  IPropertyFieldRenderOption,
  PropertyFieldColorPicker,
  PropertyFieldColorPickerStyle,
  PropertyFieldColumnPicker,
  PropertyFieldColumnPickerOrderBy,
} from "@pnp/spfx-property-controls";
import { getSP } from "./Utility/getSP";
import { getListColumns } from "./Utility/utils";

export interface IHamatEmployeeSearchComponentWebPartProps {
  List: any;
  EmployeeList: any;
  context: any;
  selectedColumns: string[];
  selectedPhoneColumns: string[];
  selectedColumnsCard: string[];
  EmployeeSearchComponentTitle: string;
  EmployeeSearchComponentWebpartHeight: number;
  placeholderText: string;
  emailBody: string;
  emailSubject: string;
  backgroundColor?: string;
  themeColorForFont?: string;
}

let cols: any[] = [];
export default class HamatEmployeeSearchComponentWebPart extends BaseClientSideWebPart<IHamatEmployeeSearchComponentWebPartProps> {
  public render(): void {
    const element: React.ReactElement<IHamatEmployeeSearchComponentProps> =
      React.createElement(HamatEmployeeSearchComponent, {
        selectedColumns: this.properties.selectedColumns,
        selectedPhoneColumns: this.properties.selectedPhoneColumns,
        EmployeeList: this.properties.EmployeeList,
        context: this.context,
        Columns: cols as any,
        EmployeeSearchComponentTitle:
          this.properties.EmployeeSearchComponentTitle,
        EmployeeSearchComponentWebpartHeight:
          this.properties.EmployeeSearchComponentWebpartHeight,
        emailBody: this.properties.emailBody,
        emailSubject: this.properties.emailSubject,
        placeholderText: this.properties.placeholderText,
        backgroundColor: this.properties.backgroundColor,
       themeColorForFont: this.properties.themeColorForFont,
        userEmail: this.context.pageContext.user.email,
        userDisplayName: this.context.pageContext.user.displayName,
      });

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    getSP(this.context);

    if (this.properties.EmployeeList) {
      cols = await getListColumns(this.properties.EmployeeList?.title);
    }
    return super.onInit();
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
                PropertyPaneTextField("EmployeeSearchComponentTitle", {
                  label: "EmployeeSearchComponent Title",
                }),

                PropertyFieldListPicker("EmployeeList", {
                  label: "Select a List",
                  selectedList: this.properties.EmployeeList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: "listPickerFieldId",
                  includeListTitleAndUrl: true,
                  filter: "BaseTemplate eq 100",
                }),

                PropertyFieldColumnPicker("selectedColumns", {
                  label: "Select display columns",
                  context: this.context as any,
                  selectedColumn: this.properties.selectedColumns,
                  listId: this.properties.EmployeeList?.id,
                  disabled: false,
                  orderBy: PropertyFieldColumnPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  deferredValidationTime: 0,
                  key: "multiColumnPickerFieldId",
                  displayHiddenColumns: false,
                  columnReturnProperty: IColumnReturnProperty["Internal Name"],
                  multiSelect: true,
                  renderFieldAs:
                    IPropertyFieldRenderOption["Multiselect Dropdown"],
                  filter: "TypeAsString ne 'Test' or TypeAsString eq 'Boolean'",
                }),
                PropertyPaneTextField("EmployeeSearchComponentWebpartHeight", {
                  label: "Set height",
                  value:
                    this.properties.EmployeeSearchComponentWebpartHeight?.toString() ||
                    "",
                }),
                PropertyFieldColumnPicker("selectedPhoneColumns", {
                  label: "Select phone columns",
                  context: this.context as any,
                  selectedColumn: this.properties.selectedPhoneColumns,
                  listId: this.properties.EmployeeList?.id,
                  disabled: false,
                  orderBy: PropertyFieldColumnPickerOrderBy.Title,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  deferredValidationTime: 0,
                  key: "multiColumnPickerFieldId",
                  displayHiddenColumns: false,
                  columnReturnProperty: IColumnReturnProperty["Internal Name"],
                  multiSelect: true,
                  renderFieldAs:
                    IPropertyFieldRenderOption["Multiselect Dropdown"],
                  filter: "TypeAsString ne 'Test' or TypeAsString eq 'Boolean'",
                }),
                PropertyPaneTextField("placeholderText", {
                  label: "Add placeholder text",
                  value: this.properties.placeholderText || "",
                }),
                PropertyPaneTextField("emailSubject", {
                  label: "Employee Search Component Email Subject",
                  value: this.properties.emailSubject || "",
                }),
                PropertyPaneTextField("emailBody", {
                  label: "Employee Search Component Email Body",
                  value: this.properties.emailBody || "",
                  multiline: true,
                }),
                PropertyFieldColorPicker("backgroundColor", {
                  label: "Select Background Color",
                  selectedColor: this.properties.backgroundColor,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  key: "colorFieldId",
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
              ],
            },
          ],
        },
      ],
    };
  }
}
