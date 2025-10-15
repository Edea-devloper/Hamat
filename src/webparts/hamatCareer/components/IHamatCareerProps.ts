import { DisplayMode } from "@microsoft/sp-core-library";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IHamatCareerProps {
  Title: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  careerList: string;
  employeePermissionList: string;
  isApplyButtonVisible: string;
  HREmail: string;
  context: WebPartContext;
  showAllCompany: string;
  isPropertyPaneOpen: boolean;
  displayMode: DisplayMode;
}
