/**
 * Generate a random username (e.g. user-adc123)
 */

export const genUsername = (): string => {
  const usernamePrefix = 'user-';
  const randomChars = Math.random().toString(36).slice(2);

  const username = usernamePrefix + randomChars;

  return username;
};

export const genSlug = (title: string): string => {
  const slug = title
    .toLocaleLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const randomChars = Math.random().toString(36).slice(2);
  const uniqueSlug = `${slug}-${randomChars}`;
  return uniqueSlug;
};
