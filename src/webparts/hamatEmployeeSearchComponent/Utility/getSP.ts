import { spfi, SPFI } from "@pnp/sp";
import { SPFx } from "@pnp/sp";

let _sp: SPFI | any = null;

export const getSP = (context?: any): SPFI => {
  if (context) {
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};
