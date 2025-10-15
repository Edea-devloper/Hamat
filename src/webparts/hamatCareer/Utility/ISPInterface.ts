export interface ICareerUserProfile {
  Title: string | null;
  UserPersonId: number;
  UserName: string;
  UserMail: string;
  ManualUpdate: boolean;
  JobTitle: string | null;
  Department: string | null;
  HebrewName: string | null;
  CompanyName: string | null;
  Company: string | string[],
  MobilePhone: string | null;
  OfficePhone: string | null;
  StartJobDate: string | null;           // ISO date string
  BirthDayDate: string | null;           // ISO date string
  BirthDayDateCurrentYear: string | null;// ISO date string
  BirthDayDayofMonth: number | null;
  BirthDayMonthofYear: number | null;
  Modified: string;                      // ISO date string
  ID: number;
  Created: string;                       // ISO date string
  AuthorId: number;
  EditorId: number;
}


export interface IJob {
  Id: number;
  Title: string | null;
  JobTitle: string;
  Details: string;
  JobRequirements: string;
  Company: string;
  Location: string;
  Experience: string;
  JobTime: string;
  UntilDate: string | null;
  Created: string;
  Modified: string;

  // Author field
  Author: {
    Title: string;
  };

  // HR Mail (Person/Group field)
  HRMailId: number;
  HRMailStringId: string;
  // HREmail: string | null;
  HRMail?: {
    Id: number;
    Title: string;
    EMail: string;
  };

  // Attachments
  Attachments?: boolean; // true/false if item has attachments
  AttachmentFiles?: IAttachment[];
}

// Attachment interface
export interface IAttachment {
  FileName: string;
  FileNameAsPath?: {
    DecodedUrl: string;
  };
  ServerRelativePath?: {
    DecodedUrl: string;
  };
  ServerRelativeUrl: string;
}
