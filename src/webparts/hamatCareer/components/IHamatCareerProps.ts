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
  ShareBtnText: string;
  ApplyBtnText: string;
  DetailsBtnText: string;
  applyJobEmailSubject: string;
  applyJobEmailBody: string;
  shareJobEmailSubject: string;
  shareJobEmailBody: string;
  flowAPIUrl: string;
}
