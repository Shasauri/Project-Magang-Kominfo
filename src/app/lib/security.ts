export const isSafeExternalUrl = (value: string | null | undefined): value is string =>
  typeof value === "string" && /^https?:\/\//i.test(value);
