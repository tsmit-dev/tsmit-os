// src/lib/status-colors.ts

import { cn } from "./utils";

export const STATUS_COLORS = {
  gray:    { label: "Cinza",   classes: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" },
  blue:    { label: "Azul",    classes: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  yellow:  { label: "Amarelo", classes: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800" },
  green:   { label: "Verde",   classes: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  red:     { label: "Vermelho",classes: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  orange:  { label: "Laranja", classes: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" },
  purple:  { label: "Roxo",    classes: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" },
};

export type StatusColor = keyof typeof STATUS_COLORS;

export function getStatusColorClasses(color: StatusColor | string | undefined | null): string {
    const defaultClasses = STATUS_COLORS.gray.classes;
    if (!color || !Object.keys(STATUS_COLORS).includes(color)) {
        return defaultClasses;
    }
    return STATUS_COLORS[color as StatusColor].classes;
}
