import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IHamatEmployeeBirthdayProps {
  BirthDayTitle: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
  daysBefore: number;
  daysAfter: number;
  showAllCompanies: boolean;
  EmployeeList: string;
  selectedColumns: string[];
  enableAutoSwitch?: boolean;
  itemsPerPage?: number;
  switchInterval?: number;
  SeeAllEmployees: boolean; // Added
  decadeMessage: string;
  birthdayWebpartHeight: number;
  noBirthdaysText?: string;
  emailSubject?: string; 
  emailBody?:string;
  themeColorForBackground?:string
  themeColorForFont?:string;
  userEmail?:string;
}
