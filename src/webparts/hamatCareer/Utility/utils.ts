import { SPFI } from "@pnp/sp";
import { getCareerSP } from "./getSP";
import { ICareerUserProfile, IJob } from "./ISPInterface";

import "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";
import "@pnp/sp/items";
import "@pnp/sp/attachments";
import "@pnp/sp/site-users/web";
import "@pnp/sp/site-groups";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export const getcareerListData = async (listId: string): Promise<IJob[]> => {
  try {
    const sp: SPFI | null = getCareerSP();
    if (!sp) {
      console.error("SP context is not initialized.");
      return [];
    }

    const items: IJob[] = await sp.web.lists
      .getById(listId)
      .items.select(
        "Id",
        "Title",
        "JobTitle",
        "Details",
        "JobRequirements",
        "Company",
        "Location",
        "Experience",
        "JobTime",
        "UntilDate",
        "Created",
        "Modified",
        "HRMailId",
        "HRMailStringId",
        // "HREmail",
        "Author/Title",
        "HRMail/Id",
        "HRMail/Title",
        "HRMail/EMail",
        "Attachments", "AttachmentFiles"
      )
      .expand("Author", "HRMail", "AttachmentFiles")
      .orderBy("Created", false).top(5000)();

    return items;
  } catch (error) {
    console.error("Error fetching career list data:", error);
    return [];
  }
};

export const getCurrentUserPermission = async (context: WebPartContext, listId: string): Promise<ICareerUserProfile[]> => {
  try {
    const sp: SPFI | null = getCareerSP();
    if (!sp) {
      console.error("SP context is not initialized.");
      return [];
    }

    const userEmail = context.pageContext.user?.email?.toLowerCase();

    if (!userEmail) {
      console.warn("Current user email is not available.");
      return [];
    }

    // Query list for items where UserMail == current user email
    const items: ICareerUserProfile[] = await sp.web.lists
      .getById(listId)
      .items.select("Id", "*", "UserMail", "Created", "Author/Title")
      .expand("Author")
      .filter(`UserMail eq '${userEmail}'`)
      .orderBy("Created", false).top(5000)();

    return items;
  } catch (error) {
    console.error("Error fetching user permission data:", error);
    return [];
  }
};