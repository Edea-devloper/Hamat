export interface IEventItem {
    Id: number;             // Internal ID
    ID: number;             // Duplicate, SP usually returns both
    Title: string;
    Subject: string;
    StartDate: string;      // ISO date string
    EndDate: string;        // ISO date string
    Location: string;
    AllDayEvent: boolean;
    Category: string;
    Details: string | null;
    Link: ILink;
    Company: string[];
    Created: string;        // ISO date string
    Author: {
        Title: string;        // User display name
    };
    ColorCode: {
        Id: number;
        ColorName: string;
        ColorNumber: string;  // Hex code
    };
}

interface ILink {
    Description: string,
    Url: string
}

export interface IUserProfile {
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

