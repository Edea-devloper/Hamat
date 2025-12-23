import { WebPartContext } from "@microsoft/sp-webpart-base";
export interface IHamatEmployeeSearchComponentProps {
  EmployeeList: any;
  context?: WebPartContext;
  Columns: any;
  EmployeeSearchComponentTitle?: string;
  EmployeeSearchComponentWebpartHeight?: number;
  placeholderText?: string;
  emailBody?: string;
  emailSubject?: string;
  selectedPhoneColumns?: string[];
  backgroundColor?: string;
   themeColorForFont?:string;
  userEmail?:string;
  userDisplayName?:string;
} 
