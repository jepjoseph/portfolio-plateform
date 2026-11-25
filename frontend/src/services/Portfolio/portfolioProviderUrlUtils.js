const EMAIL_PROVIDERS = new Map([
  ["gmail.com", "g"],
  ["googlemail.com", "g"],
  ["yahoo.com", "y"],
  ["ymail.com", "y"],
  ["icloud.com", "i"],
  ["me.com", "i"],
  ["mac.com", "i"],
  ["outlook.com", "o"],
  ["hotmail.com", "o"],
  ["live.com", "o"],
  ["msn.com", "o"],
]);

export const PUBLIC_PORTFOLIO_ORIGIN =
  "https://portfolio.motich.com";

export function getProviderUrlPreview(user) {
  if (
    !user?.emailVerifiedAt ||
    !Number.isFinite(
      new Date(user.emailVerifiedAt).getTime()
    )
  ) {
    return {
      url: "",
      error: "A verified email address is required.",
    };
  }

  const email =
    typeof user.email === "string"
      ? user.email.trim().toLowerCase()
      : "";

  const parts = email.split("@");

  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1]
  ) {
    return {
      url: "",
      error: "A valid email address is required.",
    };
  }

  const [username, domain] = parts;
  const provider = EMAIL_PROVIDERS.get(domain);

  if (!provider) {
    return {
      url: "",
      error: "This email provider is unsupported. Use a custom URL.",
    };
  }

  const validUsername =
    username.length <= 198 &&
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/
      .test(username) &&
    !username.includes("..");

  if (!validUsername) {
    return {
      url: "",
      error: "This email address requires a custom Portfolio URL.",
    };
  }

  return {
    url: `${PUBLIC_PORTFOLIO_ORIGIN}/${provider}/${username}`,
    error: "",
  };
}