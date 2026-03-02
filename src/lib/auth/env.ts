export function isAuthBypassEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.DISABLE_AUTH === "true";
}
