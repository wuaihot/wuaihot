const normalizeEmail = (value) => {
  const email = String(value || "").trim();
  if (!email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
};

export const resolveRightsContactConfig = (env = {}) => {
  const email = normalizeEmail(env?.VITE_RIGHTS_CONTACT_EMAIL);

  return Object.freeze({
    enabled: Boolean(email),
    email,
    href: email ? `mailto:${email}` : "",
  });
};

const runtimeEnv = import.meta.env || {};
export const rightsContactConfig = resolveRightsContactConfig(runtimeEnv);
