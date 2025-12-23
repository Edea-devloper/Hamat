import { SPFI } from "@pnp/sp";
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
import "@pnp/graph/calendars";
import { BodyType } from "@microsoft/microsoft-graph-types";

import { getEventSP, getGraph } from "./getSP";
import { IEventItem, IUserProfile } from "./ISPInterface";
import { IEventData } from "../components/CalendarEvent";
import { WebPartContext } from "@microsoft/sp-webpart-base";


export const getListData = async (listId: any, startDate?: Date, endDate?: Date): Promise<any[]> => {
  try {
    const sp: SPFI | null = getEventSP();
    if (!sp) {
      console.error("SP context is not initialized.");
      return [];
    }

    let query = sp.web.lists.getById(listId).items
      .select(
        "Id",
        "Title",
        "Subject",
        "StartDate",
        "EndDate",
        "Location",
        "AllDayEvent",
        "Category",
        "Details",
        "Link",
        "Company",
        "Created",
        "Author/Title",
        "ColorCode/Id",
        "ColorCode/ColorName",
        "ColorCode/ColorNumber"
      )
      .expand("Author", "ColorCode");

    // Add date filtering if dates are provided
    if (startDate && endDate) {
      // Filter events that either start within range OR are ongoing during the range
      const startDateISO = startDate.toISOString();
      const endDateISO = endDate.toISOString();

      query = query.filter(
        `(StartDate ge datetime'${startDateISO}' and StartDate le datetime'${endDateISO}') or ` +
        `(EndDate ge datetime'${startDateISO}' and EndDate le datetime'${endDateISO}') or ` +
        `(StartDate le datetime'${startDateISO}' and EndDate ge datetime'${endDateISO}')`
      );
    }

    const items: IEventItem[] = await query.orderBy("StartDate", true).top(5000)(); // Order by StartDate instead of Created

    return items;
  } catch (error) {
    console.error("Error fetching event list data:", error);
    return [];
  }
};

export const getCurrentUserPermission = async (context: WebPartContext, listId: string): Promise<IUserProfile[]> => {
  try {
    const sp: SPFI | null = getEventSP();
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
    const items: IUserProfile[] = await sp.web.lists
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

// Add Event On User Calendar
export const addToPersonalCalendar = async (event: IEventData) => {
  const graph = getGraph();

  if (!graph) {
    console.error("Graph not initialized");
    return [];
  }

  const timeZone = 'Asia/Jerusalem';
  // const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const newEvent = {
    subject: event.title,
    body: {
      contentType: "html" as BodyType,
      content: event.description || event.subject || ""
    },
    isAllDay: event.allDayEvent,
    start: event.allDayEvent
      ? {
        dateTime: `${event.start!.toISOString().split("T")[0]}T00:00:00.0000000`,
        timeZone,
      }
      : {
        dateTime: event.start!.toISOString(),
        timeZone,
      },
    end: event.allDayEvent
      ? {
        // +1 day because Graph treats end as exclusive
        dateTime: `${new Date(
          event.end!.getTime() + 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]}T00:00:00.0000000`,
        timeZone,
      }
      : {
        dateTime: event.end!.toISOString(),
        timeZone,
      },
    location: {
      displayName: event.location,
    },
    categories: [`${event.id}`],
  };

  await graph.me.events.add(newEvent);
};

// Get Event from Current user calendar
export const getUserCalendarEvents = async () => {
  try {
    const graph = getGraph();
    if (!graph) throw new Error("Graph not initialized");

    // Get events for the current user
    const events = await graph.me.events.select(
      "subject,start,end,location,categories"
    ).top(5000)();

    return events;

  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};