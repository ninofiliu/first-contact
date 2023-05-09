import { live } from "./live";
import { tv } from "./tv";

const PROGRAM = "tv" as "tv" | "live";

if (PROGRAM === "tv") tv();
if (PROGRAM === "live") live();
