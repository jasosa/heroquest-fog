import { createContext } from "react";

// Deliberately defaults to null so useI18n() can detect "no provider in tree".
export const LocaleContext = createContext(null);
