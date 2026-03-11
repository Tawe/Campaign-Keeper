/** Field length limits enforced in server actions. */
export const MAX_NAME_LENGTH = 255;
export const MAX_SHORT_TEXT_LENGTH = 500;
export const MAX_LONG_TEXT_LENGTH = 100_000;

/** Array size limits — prevents quota-burn via unbounded bulk writes. */
export const MAX_ARRAY_ITEMS = 200;
export const MAX_TAG_ITEMS = 50;
export const MAX_PARTICIPANT_ITEMS = 50;

/** Throw if value exceeds max length. */
export function assertMaxLength(value: string, max: number, label: string): void {
  if (value.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer.`);
  }
}

/** Throw if array exceeds max item count. */
export function assertMaxItems<T>(arr: T[], max: number, label: string): void {
  if (arr.length > max) {
    throw new Error(`${label} must have ${max} items or fewer.`);
  }
}
