import 'server-only';
import { cookies } from 'next/headers';

const DARK_MODE_COOKIE = 'darkMode';

export async function getServerDarkMode() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(DARK_MODE_COOKIE)?.value === 'true';
  } catch {
    return false;
  }
}

export { DARK_MODE_COOKIE };
