import { DisplayMode } from "@microsoft/sp-core-library";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IHamatUpcomingEventProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  eventList: any;
  eventDisplayTitle: string;
  employeePermissionList: any;
  upcomingDays: any;
  previousDays: any;
  showAllCompany: string;
  displayMode: DisplayMode;
  context: WebPartContext;
  defaultColor: string;
}
