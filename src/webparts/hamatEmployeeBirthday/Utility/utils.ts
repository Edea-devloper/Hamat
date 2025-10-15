import { getSP } from "./getSP";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import { WebPartContext } from "@microsoft/sp-webpart-base";

export const getListItems = async (
  selectedList: any,
  context: WebPartContext,
  seeAllEmployees: boolean = false
): Promise<any[]> => {
  try {
    const _sp = getSP(context);
    
    // Clean the list ID
    const listId = selectedList?.replace(/[{}]/g, "");

    // STEP 1: Get all fields to identify Person columns
    const fields = await _sp?.web?.lists
      ?.getById(listId)
      ?.fields
      ?.select("InternalName,TypeAsString,FieldTypeKind")();

    // STEP 2: Identify Person/Group columns (FieldTypeKind = 20)
    const personColumns = fields
      ?.filter((f: any) => f?.FieldTypeKind === 20)
      ?.map((f: any) => f?.InternalName) ?? [];

    // STEP 3: Build select and expand strings dynamically
    const selectFields = ["*", "AttachmentFiles"];
    const expandFields = ["AttachmentFiles"];

    // Add Person column fields to select and expand
    personColumns?.forEach((colName: string) => {
      if (colName) {
        selectFields.push(`${colName}/Title`);
        selectFields.push(`${colName}/EMail`);
        selectFields.push(`${colName}/Id`);
        expandFields.push(colName);
      }
    });

    const selectString = selectFields?.join(",") ?? "";
    const expandString = expandFields?.join(",") ?? "";

    // STEP 4: Fetch items with dynamic expansion
    const items = await _sp?.web?.lists
      ?.getById(listId)
      ?.items
      ?.select(selectString)
      ?.expand(expandString)
      ?.top(5000)();

    // If SeeAllEmployees is ON, return all items without filtering
    if (seeAllEmployees) {
      return items ?? [];
    }

    // Otherwise, return items as-is (filtering will be done in component)
    return items ?? [];
  } catch (error) {
    console.error(`Error fetching items from list:`, error);
    throw error;
  }
};