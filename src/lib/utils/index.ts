import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type CamelCase<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${P}${Capitalize<CamelCase<Q>>}`
  : S;

type SnakeToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends Record<string, unknown>
    ? SnakeToCamelCase<T[K]>
    : T[K];
};

export function toCamelCase<T extends Record<string, unknown>>(obj: T): SnakeToCamelCase<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj as SnakeToCamelCase<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as SnakeToCamelCase<T>;
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey as keyof SnakeToCamelCase<T>] = value as SnakeToCamelCase<T>[keyof SnakeToCamelCase<T>];
    return acc;
  }, {} as SnakeToCamelCase<T>);
}
