export interface IHamatNewEmployeeProps {
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  EmployeeTitle: string;
  EmployeeList: string;
  selectedColumns: string[];
  context: any; // Replace with proper type (e.g., WebPartContext for SharePoint)
  startJobWithinDays: number;
  enableAutoSwitch?: boolean;
  itemsPerPage?: Number | string;
  switchInterval?: Number | string;
  SeeAllEmployees: boolean;
  NewEmployeeWebpartHeight: any;
  emailColumnKey?: string; // New prop for email column
  TextForNoEmployee: string;
  EmailBody: string;
  EmailSubject: string;
  backgroundColor?: string;
  themeColorForFont?:string;
  userEmail?:string;
}