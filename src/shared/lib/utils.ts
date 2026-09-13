import { clsx, type ClassValue } from "clsx";
import { cx } from "../../../styled-system/css";

export function cn(...inputs: ClassValue[]) {
  return cx(clsx(inputs));
}
