export interface BirthdayStatus {
  isToday: boolean;
  isBelated: boolean;
  isYesterday: boolean;
  isUpcoming: boolean;
  isExpired: boolean; // True if the 2-day wishing window has closed
  daysDiff: number; // positive = days until birthday, negative = days past birthday, 0 = today
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  greetingTitle: string; // "Happy Birthday", "Belated Happy Birthday", "Early Birthday Wish"
  heroBadge: string;
  sharePrefix: string;
}

/**
 * Timezone-safe date parser for "YYYY-MM-DD" strings
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

/**
 * Calculates whether a birthday is:
 * - Day 0 (Today): Active, "Happy Birthday"
 * - Day 1 (Tomorrow / Belated): Active, "Belated Happy Birthday"
 * - Day 2+ (Expired): Wishes closed (2-day limit reached)
 * - Upcoming: Advance wish countdown
 */
export function getBirthdayStatus(
  birthdayDateStr?: string,
  createdAtStr?: string,
  referenceDate: Date = new Date()
): BirthdayStatus {
  const now = referenceDate;
  const currentYear = now.getFullYear();
  const todayMidnight = new Date(currentYear, now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;

  // Case 1: Birthday date is provided
  if (birthdayDateStr) {
    const parsed = parseDateString(birthdayDateStr);
    if (parsed) {
      const bdayThisYear = new Date(currentYear, parsed.month, parsed.day, 0, 0, 0, 0);
      const diffDays = Math.round((bdayThisYear.getTime() - todayMidnight.getTime()) / msPerDay);

      const isToday = diffDays === 0;
      const isYesterday = diffDays === -1;
      const isUpcoming = diffDays > 0;
      // 2-Day Rule: Active on Day 0 (Today) and Day 1 (Yesterday/Belated). Expired if 2+ days past.
      const isExpired = diffDays < -1;
      const isBelated = isYesterday || (diffDays < 0 && !isExpired);

      // Countdown calculations for upcoming
      let targetCountdownDate = bdayThisYear;
      if (diffDays < 0 && Math.abs(diffDays) > 30) {
        targetCountdownDate = new Date(currentYear + 1, parsed.month, parsed.day, 0, 0, 0, 0);
      }

      const exactDiffMs = targetCountdownDate.getTime() - now.getTime();
      let countdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      if (exactDiffMs > 0) {
        countdown = {
          days: Math.floor(exactDiffMs / msPerDay),
          hours: Math.floor((exactDiffMs / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((exactDiffMs / (1000 * 60)) % 60),
          seconds: Math.floor((exactDiffMs / 1000) % 60),
        };
      }

      let greetingTitle = 'Happy Birthday';
      let heroBadge = "🎉 You're Invited to Make Their Birthday Special! 🎉";
      let sharePrefix = 'HAPPY BIRTHDAY';

      if (isExpired) {
        greetingTitle = 'Celebration Concluded';
        heroBadge = '✨ 2-Day Birthday Wishing Window Concluded ✨';
        sharePrefix = 'HAPPY BIRTHDAY';
      } else if (isToday) {
        greetingTitle = 'Happy Birthday';
        heroBadge = "🥳 TODAY IS THE BIG DAY! Shower them with love! 🎉";
        sharePrefix = 'HAPPY BIRTHDAY';
      } else if (isYesterday) {
        greetingTitle = 'Belated Happy Birthday';
        heroBadge = "💝 Belated Celebration — Yesterday was their Birthday! Still time to wish! 🎂";
        sharePrefix = 'BELATED HAPPY BIRTHDAY';
      } else if (isUpcoming) {
        if (diffDays === 1) {
          greetingTitle = 'Advance Birthday Wish';
          heroBadge = "⏳ Tomorrow is their Birthday! Get your wish ready early! 🎈";
          sharePrefix = 'ADVANCE HAPPY BIRTHDAY';
        } else {
          greetingTitle = 'Advance Birthday Wish';
          heroBadge = `⏳ Birthday Countdown: ${diffDays} Days to go! 🎈`;
          sharePrefix = 'EARLY HAPPY BIRTHDAY';
        }
      }

      return {
        isToday,
        isBelated,
        isYesterday,
        isUpcoming,
        isExpired,
        daysDiff: diffDays,
        countdown,
        greetingTitle,
        heroBadge,
        sharePrefix,
      };
    }
  }

  // Case 2: No specific birthday date was set — use createdAt timestamp with 2-day limit
  if (createdAtStr) {
    try {
      const createdDate = new Date(createdAtStr);
      const createdMidnight = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate(), 0, 0, 0, 0);
      const elapsedDays = Math.round((todayMidnight.getTime() - createdMidnight.getTime()) / msPerDay);

      const isToday = elapsedDays === 0;
      const isYesterday = elapsedDays === 1;
      const isExpired = elapsedDays > 1; // Expired after 2 days (Day 0 + Day 1)
      const isBelated = isYesterday;

      let greetingTitle = isToday ? 'Happy Birthday' : isYesterday ? 'Belated Happy Birthday' : 'Celebration Concluded';
      let heroBadge = isToday
        ? "🥳 TODAY IS THE BIG DAY! Shower them with love! 🎉"
        : isYesterday
        ? "💝 Belated Celebration — Day 2 of Birthday Wishing! 🎂"
        : '✨ 2-Day Birthday Wishing Window Concluded ✨';

      return {
        isToday,
        isBelated,
        isYesterday,
        isUpcoming: false,
        isExpired,
        daysDiff: -elapsedDays,
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
        greetingTitle,
        heroBadge,
        sharePrefix: isYesterday ? 'BELATED HAPPY BIRTHDAY' : 'HAPPY BIRTHDAY',
      };
    } catch {}
  }

  // Default fallback (Active Day 0)
  return {
    isToday: true,
    isBelated: false,
    isYesterday: false,
    isUpcoming: false,
    isExpired: false,
    daysDiff: 0,
    countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    greetingTitle: 'Happy Birthday',
    heroBadge: "🎉 You're Invited to Make Their Birthday Special! 🎉",
    sharePrefix: 'HAPPY BIRTHDAY',
  };
}
