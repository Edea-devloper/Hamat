import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import { getSP } from "./getSP";


// Search items in a SharePoint list by query
export const getListItemsBySearch = async (
  listInfo: { id?: string; title?: string },
  searchQuery: string
): Promise<any[]> => {
  const _sp = getSP();

  if (!_sp) {
    console.error("SP context is not initialized.");
    return [];
  }

  if (!listInfo.id || !listInfo.title) {
    console.error("List is not initialized.");
    return [];
  }

  // Normalize search query
  const query = (searchQuery || "").toLowerCase().replace(/\//g, "-");

  // BLOCK ALL date-like input
  const dateLikePattern = /^\d{1,4}[-\/.]\d{1,2}([-/\.]\d{1,4})?$/;

  if (dateLikePattern.test(query)) {
    return []; // block ALL date formats
  }


  // Helper: format date as DD-MM-YYYY
  const formatDate = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  try {
    // Get all field names and user fields
    const fields = await _sp.web.lists
      .getById(listInfo?.id)
      .fields.select("InternalName", "FieldTypeKind")();

    const fieldNames: string[] = fields.map((f: any) => f.InternalName);

    const userFields = fields
      .filter((f: any) => f.FieldTypeKind === 20)
      .map((f: any) => f.InternalName);

    const expandedSelects = userFields.reduce((acc: string[], f: string) => {
      return acc.concat([`${f}/Id`, `${f}/Title`, `${f}/EMail`]);
    }, []);

    const items = await _sp.web.lists
      .getById(listInfo?.id)
      .items.select("*", ...expandedSelects)
      .expand(...userFields).top(5000)();

    // Filter items by search query
    const filtered = items.filter((item) =>
      fieldNames.some((f) => {
        const v = item[f];
        if (!v) return false;

        let strVal = "";

        if (typeof v === "object") {
          // If this is a Person field, only search Title or Name
          if (userFields.includes(f)) {
            strVal = v.Title || v.Name || "";
          } else {
            strVal = Object.values(v).join(" ");
          }
        }
        else {
          strVal = String(v);
        }

        // Normalize both strings for matching
        const normalized = strVal.toLowerCase().replace(/\//g, "-");
        return normalized.includes(query);
      })
    );

    filtered.sort((a, b) => {
      const nameA = (a?.UserName || "").toString().toLowerCase();
      const nameB = (b?.UserName || "").toString().toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    return filtered;
  } catch (err) {
    console.error(`Error fetching items from list "${listInfo.title}":`, err);
    return [];
  }
};


// Get all columns for a SharePoint list
export const getListColumns = async (libTitle: string): Promise<any[]> => {
  const sp = getSP();

  if (!sp) {
    console.error("SP context is not initialized.");
    return [];
  }

  if (!libTitle) {
    throw new Error("List title is empty or undefined.");
  }

  try {
    const fields = await sp.web.lists.getByTitle(libTitle).fields();
    return fields.map((c: any) => ({
      colInfo: c,
      key: c.EntityPropertyName?.split("_x003a_")[0] || c.InternalName,
      text: c.Title,
    }));
  } catch (err) {
    console.error(`Error fetching columns for list "${libTitle}":`, err);
    throw err;
  }
};
