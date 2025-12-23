import { WebPartContext } from "@microsoft/sp-webpart-base";
import { spfi, SPFx, SPFI } from "@pnp/sp";
import { graphfi, GraphFI, SPFx as graphSPFx } from "@pnp/graph";
import "@pnp/graph/users";

import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/site-users";
import "@pnp/sp/site-groups";
import "@pnp/sp/folders";
import "@pnp/sp/attachments";

let _sp: SPFI | null = null;
let _graph: GraphFI | null = null;

export const getEventSP = (context?: WebPartContext): SPFI | null => {
  if (context) {
    _sp = spfi().using(SPFx(context));
  }
  return _sp;
};

export const getGraph = (context?: WebPartContext): GraphFI | null => {
  if (context) {
    _graph = graphfi().using(graphSPFx(context));
  }
  return _graph;
};
