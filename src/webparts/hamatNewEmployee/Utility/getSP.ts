import { spfi, SPFI, SPFx } from "@pnp/sp";
// import { spfi, SPFI, SPFx } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";
import "@pnp/sp/fields";
 
 
let _sp: SPFI | any = null;
 
export const getSP = (context?: any): SPFI => {
  if (context) {
    //You must add the @pnp/logging package to include the PnPLogging behavior it is no longer a peer dependency
    // The LogLevel set's at what level a message will be written to the console
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};
 
 