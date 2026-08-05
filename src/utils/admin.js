/** Comma-separated admin emails from VITE_ADMIN_EMAILS (client-safe allowlist). */
export const getAdminEmails = () =>
  (import.meta.env.VITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (user) => {
  const admins = getAdminEmails();
  return Boolean(user?.email && admins.length > 0 && admins.includes(user.email.toLowerCase()));
};
