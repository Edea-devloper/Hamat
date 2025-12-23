import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'HamatUpcomingEventWebPartStrings';
import HamatUpcomingEvent from './components/HamatUpcomingEvent';
import { IHamatUpcomingEventProps } from './components/IHamatUpcomingEventProps';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls';
import { getEventSP, getGraph } from './Utility/getSP';
import { PropertyFieldColorPicker, PropertyFieldColorPickerStyle } from '@pnp/spfx-property-controls/lib/PropertyFieldColorPicker';

export interface IHamatUpcomingEventWebPartProps {
  eventList: any;
  employeePermissionList: any;
  upcomingDays: any;
  previousDays: any;
  showAllCompany: string;
  eventDisplayTitle: string;
  displayMode: DisplayMode;
  defaultColor: string;
}

export default class HamatUpcomingEventWebPart extends BaseClientSideWebPart<IHamatUpcomingEventWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IHamatUpcomingEventProps> = React.createElement(
      HamatUpcomingEvent,
      {
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        // List
        eventList: this.properties.eventList,
        eventDisplayTitle: this.properties.eventDisplayTitle,
        employeePermissionList: this.properties.employeePermissionList,
        // upcomingDays and previousDays
        previousDays: this.properties.previousDays,
        upcomingDays: this.properties.upcomingDays,
        showAllCompany: this.properties.showAllCompany,
        displayMode: this.displayMode,
        context: this.context,
        defaultColor: this.properties.defaultColor,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
      // set default value 
      this.properties.eventDisplayTitle =
        (typeof this.properties.eventDisplayTitle === 'string' && this.properties.eventDisplayTitle.trim())
          ? this.properties.eventDisplayTitle.trim()
          : 'אירועים';

      // set default value  defaultColor
      if (!this.properties.defaultColor) {
        this.properties.defaultColor = "#9c27b0";
      }

      getEventSP(this.context);
      getGraph(this.context);
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
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

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: ""
          },
          groups: [
            {
              groupName: "Event Display Title",
              groupFields: [
                PropertyPaneTextField('eventDisplayTitle', {
                  label: 'Event Display Title',
                  description: 'Enter the title to display above the event cards.',
                  value: 'אירועים'
                })
              ]
            },
            {
              groupName: "Event Configuration",
              groupFields: [
                PropertyFieldListPicker('eventList', {
                  label: 'Select a Event list',
                  selectedList: this.properties.eventList,
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
                PropertyPaneToggle('showAllCompany', {
                  label: 'Show All Company',
                  onText: 'Visible',
                  offText: 'Hidden'
                }),

                PropertyPaneTextField('previousDays', {
                  label: 'Previous Days',
                  description: 'Number of days in the past to show events (e.g., 7 = shows events from last 7 days). Enter 0 to show only future events.',
                  placeholder: '7'
                }),
                PropertyPaneTextField('upcomingDays', {
                  label: 'Upcoming Days',
                  description: 'Number of days in the future to show events (e.g., 30 = shows events for next 30 days)',
                  placeholder: '30'
                }),
                PropertyFieldColorPicker('defaultColor', {
                  label: 'Select Default Color',
                  selectedColor: this.properties.defaultColor,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  debounce: 1000,
                  isHidden: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Full,
                  iconName: 'Precipitation',
                  key: 'colorFieldId',
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
