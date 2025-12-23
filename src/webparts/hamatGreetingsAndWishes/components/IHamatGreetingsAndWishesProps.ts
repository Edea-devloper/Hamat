export interface IHamatGreetingsAndWishesProps {
  GreetingsAndWishes: string;
  context: any;
  congratsAndGreetingList: string;
  hamatEmployeeList: string;
  currentUserEmail: string;
  enableAutoSwitch: boolean;
  switchInterval: string | number | any;
  itemsPerPage: string | number | any;
  selectedColumns: string[];
  greetingWebpartHeight: number;
  SeeAllEmployees: boolean;
  backgroundColor?: string;
  emailSubject: string;
  emailBody: string;
  themeColorForFont: string;
}
