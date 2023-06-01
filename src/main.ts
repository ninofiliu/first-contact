import { debug } from "./debug";
import { live } from "./live";
import { tv } from "./tv";

const sp = new URLSearchParams(location.search);
switch (sp.get("program")) {
  case "tv":
    tv();
    break;
  case "live":
    live();
    break;
  case "debug":
    debug();
    break;
  default: {
    const ul = document.createElement("ul");
    for (const programName of ["tv", "live", "debug"]) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      const url = new URL(location.href);
      url.searchParams.set("program", programName);
      a.href = url.href;
      a.innerHTML = programName;
      li.append(a);
      ul.append(li);
    }
    document.body.append(ul);
  }
}
