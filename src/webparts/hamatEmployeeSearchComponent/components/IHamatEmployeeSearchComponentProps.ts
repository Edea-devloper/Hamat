import { WebPartContext } from "@microsoft/sp-webpart-base";
export interface IHamatEmployeeSearchComponentProps {
  EmployeeList: any;
  context?: WebPartContext;
  Columns: any;
  EmployeeSearchComponentTitle?: string;
  EmployeeSearchComponentWebpartHeight?: number;
  selectedPhoneColumns?: string[];
} 
