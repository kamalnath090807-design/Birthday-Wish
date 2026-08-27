import { nanoid } from 'nanoid';

export function createSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const rand = nanoid(5).toLowerCase();
  return `${base || 'birthday'}-${rand}`;
}
