import { debug } from "./debug";
import { live } from "./live";
import { tv } from "./tv";

const PROGRAM = "debug" as "tv" | "live" | "debug";

if (PROGRAM === "tv") tv();
if (PROGRAM === "live") live();
if (PROGRAM === "debug") debug();
