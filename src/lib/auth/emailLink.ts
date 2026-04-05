export function normalizeMagicLinkEmail(email: string): string {
  return email.trim();
}

export function getMagicLinkErrorMessage(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";

  if (message.includes("auth/invalid-email")) {
    return "The email address did not match the sign-in link. Re-enter the same email you used when requesting it.";
  }

  if (message.includes("auth/invalid-action-code")) {
    return "This sign-in link is invalid or has already been used. Request a new magic link and try again.";
  }

  if (message.includes("auth/expired-action-code")) {
    return "This sign-in link has expired. Request a new magic link and try again.";
  }

  return message || "Sign-in failed";
}

export function shouldPromptForMagicLinkEmail(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";

  return message.includes("auth/invalid-email");
}
