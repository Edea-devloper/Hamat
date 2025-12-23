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
import HamatEventsCalendar from './components/HamatEventsCalendar';
import { IHamatEventsCalendarProps } from './components/IHamatEventsCalendarProps';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import { getEventSP, getGraph } from './Utility/getSP';

export interface IPropertyControlsTestWebPartProps {
  lists: string | string[]; // Stores the list ID(s)
}

export interface IHamatEventsCalendarWebPartProps {
  eventList: any;
  employeePermissionList: any;
  upcomingDays: any;
  previousDays: any;
  showAllCompany: string;
  displayMode: DisplayMode;
}

export default class HamatEventsCalendarWebPart extends BaseClientSideWebPart<IHamatEventsCalendarWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IHamatEventsCalendarProps> = React.createElement(
      HamatEventsCalendar,
      {
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        // List
        eventList: this.properties.eventList,
        employeePermissionList: this.properties.employeePermissionList,
        // upcomingDays and previousDays
        previousDays: this.properties.previousDays,
        upcomingDays: this.properties.upcomingDays,
        showAllCompany: this.properties.showAllCompany,
        displayMode: this.displayMode,
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected async onInit(): Promise<void> {
    await super.onInit();
    getEventSP(this.context);
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

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: ""
          },
          groups: [
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
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
