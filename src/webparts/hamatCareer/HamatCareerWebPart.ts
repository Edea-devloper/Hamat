import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart, WebPartContext } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'HamatCareerWebPartStrings';
import HamatCareer from './components/HamatCareer';
import { IHamatCareerProps } from './components/IHamatCareerProps';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls';
import { getCareerSP, getGraph } from './Utility/getSP';

export interface IHamatCareerWebPartProps {
  Title: string;
  careerList: string;
  employeePermissionList: string;
  isApplyButtonVisible: string;
  showAllCompany: string;
  HREmail: string;
  context: WebPartContext;
  isPropertyPaneOpen: boolean;
  displayMode: DisplayMode;
}

export default class HamatCareerWebPart extends BaseClientSideWebPart<IHamatCareerWebPartProps> {

  private _isPropertyPaneOpen: boolean = false;

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IHamatCareerProps> = React.createElement(
      HamatCareer,
      {
        Title: this.properties.Title,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        // list 
        careerList: this.properties.careerList,
        employeePermissionList: this.properties.employeePermissionList,
        isApplyButtonVisible: this.properties.isApplyButtonVisible,
        showAllCompany: this.properties.showAllCompany,
        HREmail: this.properties.HREmail,
        context: this.context,
        isPropertyPaneOpen: this._isPropertyPaneOpen,
        displayMode: this.displayMode,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    getCareerSP(this.context)
    getGraph(this.context)
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

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

  // Trigger when property pane opens
  protected onPropertyPaneConfigurationStart(): void {
    this._isPropertyPaneOpen = true;
    this.render();
  }

  // Trigger when property pane closes
  protected onPropertyPaneConfigurationComplete(): void {
    this._isPropertyPaneOpen = false;
    this.render();
  }


  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('Title', {
                  label: 'Career Title'
                }),
                PropertyPaneTextField('HREmail', {
                  label: 'HR Email Address'
                }),

                PropertyPaneToggle('isApplyButtonVisible', {
                  label: 'Show Apply Button',
                  onText: 'Visible',
                  offText: 'Hidden'
                }),

                PropertyPaneToggle('showAllCompany', {
                  label: 'Show All Company',
                  onText: 'Visible',
                  offText: 'Hidden'
                }),

                PropertyFieldListPicker('careerList', {
                  label: 'Select a Career list',
                  selectedList: this.properties.careerList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'listPickerFieldId'
                }),
                PropertyFieldListPicker('employeePermissionList', {
                  label: 'Select a Employee Permission List ',
                  selectedList: this.properties.employeePermissionList,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context as any,
                  deferredValidationTime: 0,
                  key: 'listPickerFieldId'
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
