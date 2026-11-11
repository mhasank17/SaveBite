import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper replicate identical to client formatters
interface ParsedPickupWindow {
  date: string;
  startTime: string;
  endTime: string;
  displayText: string;
  expiresInSeconds: number;
}

const parseDealPickupWindow = (deal: {
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupWindowText?: string;
  pickupWindow?: {
    date?: string;
    startTime?: string;
    endTime?: string;
    displayText?: string;
    expiresInSeconds?: number;
  };
}): ParsedPickupWindow => {
  let startTime = deal.pickupStartTime || deal.pickupWindow?.startTime || '';
  let endTime = deal.pickupEndTime || deal.pickupWindow?.endTime || '';
  const windowText = deal.pickupWindowText || deal.pickupWindow?.displayText || '';

  if ((!startTime || !endTime) && windowText) {
    const m24 = windowText.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
    if (m24) {
      if (!startTime) startTime = m24[1];
      if (!endTime) endTime = m24[2];
    } else {
      const m12 = windowText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–—]\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
      if (m12) {
        if (!startTime) startTime = m12[1].trim();
        if (!endTime) endTime = m12[2].trim();
      }
    }
  }

  if (!startTime) startTime = '19:00';
  if (!endTime) endTime = '21:30';

  const parseHM = (timeStr: string) => {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const clean = timeStr.replace(/[^0-9:]/g, '');
    const parts = clean.split(':').map(Number);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return { hours: h, minutes: m };
  };

  const startHM = parseHM(startTime);
  const endHM = parseHM(endTime);

  const now = new Date();
  const closingDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    endHM.hours,
    endHM.minutes,
    0
  );

  let expiresInSeconds = Math.floor((closingDate.getTime() - now.getTime()) / 1000);

  if (expiresInSeconds <= 0) {
    const nextClosing = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      endHM.hours,
      endHM.minutes,
      0
    );
    expiresInSeconds = Math.floor((nextClosing.getTime() - now.getTime()) / 1000);
  }

  if (typeof deal.pickupWindow?.expiresInSeconds === 'number' && deal.pickupWindow.expiresInSeconds > 0) {
    expiresInSeconds = deal.pickupWindow.expiresInSeconds;
  }

  const to12h = (hm: { hours: number; minutes: number }) => {
    const period = hm.hours >= 12 ? 'PM' : 'AM';
    const h12 = hm.hours % 12 === 0 ? 12 : hm.hours % 12;
    return `${h12}:${String(hm.minutes).padStart(2, '0')} ${period}`;
  };

  const displayText =
    windowText && (windowText.includes('PM') || windowText.includes('AM'))
      ? windowText
      : `Tonight, ${to12h(startHM)} – ${to12h(endHM)}`;

  return {
    date: 'Today',
    startTime,
    endTime,
    displayText,
    expiresInSeconds: Math.max(0, expiresInSeconds),
  };
};

const CLOSING_SOON_THRESHOLD_SECONDS = 3.5 * 3600;

function partitionDeals(filteredDeals: any[]) {
  if (filteredDeals.length === 0) {
    return { nearYouDeals: [], pickupNowDeals: [] };
  }

  const approachingCandidates = filteredDeals.filter(
    (d) => (d.pickupWindow?.expiresInSeconds ?? 99999) <= CLOSING_SOON_THRESHOLD_SECONDS
  );

  const laterCandidates = filteredDeals.filter(
    (d) => (d.pickupWindow?.expiresInSeconds ?? 99999) > CLOSING_SOON_THRESHOLD_SECONDS
  );

  if (approachingCandidates.length > 0 && laterCandidates.length > 0) {
    const pickupTonight = [...approachingCandidates].sort(
      (a, b) =>
        (a.pickupWindow?.expiresInSeconds ?? 99999) -
        (b.pickupWindow?.expiresInSeconds ?? 99999)
    );
    const pickupTonightIds = new Set(pickupTonight.map((d) => d.id));

    const nearYou = [...laterCandidates]
      .filter((d) => !pickupTonightIds.has(d.id))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return { nearYouDeals: nearYou, pickupNowDeals: pickupTonight };
  }

  if (approachingCandidates.length > 0 && laterCandidates.length === 0) {
    if (approachingCandidates.length >= 3) {
      const sortedByUrgency = [...approachingCandidates].sort(
        (a, b) =>
          (a.pickupWindow?.expiresInSeconds ?? 99999) -
          (b.pickupWindow?.expiresInSeconds ?? 99999)
      );
      const urgentCount = Math.ceil(sortedByUrgency.length / 2);
      const pickupTonight = sortedByUrgency.slice(0, urgentCount);
      const pickupTonightIds = new Set(pickupTonight.map((d) => d.id));

      const nearYou = sortedByUrgency
        .slice(urgentCount)
        .filter((d) => !pickupTonightIds.has(d.id))
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return { nearYouDeals: nearYou, pickupNowDeals: pickupTonight };
    }

    const pickupTonight = [...approachingCandidates].sort(
      (a, b) =>
        (a.pickupWindow?.expiresInSeconds ?? 99999) -
        (b.pickupWindow?.expiresInSeconds ?? 99999)
    );
    return { nearYouDeals: [], pickupNowDeals: pickupTonight };
  }

  const nearYou = [...filteredDeals].sort((a, b) => a.distanceKm - b.distanceKm);
  return { nearYouDeals: nearYou, pickupNowDeals: [] };
}

describe('Customer Home Page Deduplication & Pickup Filtering', () => {
  it('1. accurately parses 24-hr pickup window times into hours, minutes and display text', () => {
    const parsed = parseDealPickupWindow({
      pickupStartTime: '18:30',
      pickupEndTime: '21:00',
    });
    assert.equal(parsed.startTime, '18:30');
    assert.equal(parsed.endTime, '21:00');
    assert.equal(parsed.displayText, 'Tonight, 6:30 PM – 9:00 PM');
    assert.ok(parsed.expiresInSeconds > 0);
  });

  it('2. accurately extracts pickup times from pickupWindowText when start/end missing', () => {
    const parsed = parseDealPickupWindow({
      pickupWindowText: 'Tonight, 8:00 PM – 9:45 PM',
    });
    assert.equal(parsed.displayText, 'Tonight, 8:00 PM – 9:45 PM');
    assert.ok(parsed.expiresInSeconds > 0);
  });

  it('3. partitions mixed closing deals without any duplicate deals across sections', () => {
    const testDeals = [
      { id: 'deal-1', distanceKm: 2.5, pickupWindow: { expiresInSeconds: 1800 } }, // 30m left
      { id: 'deal-2', distanceKm: 1.8, pickupWindow: { expiresInSeconds: 3600 } }, // 1h left
      { id: 'deal-3', distanceKm: 0.4, pickupWindow: { expiresInSeconds: 18000 } }, // 5h left
      { id: 'deal-4', distanceKm: 0.9, pickupWindow: { expiresInSeconds: 21600 } }, // 6h left
    ];

    const { nearYouDeals, pickupNowDeals } = partitionDeals(testDeals);

    // Verify Pickup Tonight has the approaching deals (deal-1, deal-2)
    assert.equal(pickupNowDeals.length, 2);
    assert.deepEqual(pickupNowDeals.map((d) => d.id), ['deal-1', 'deal-2']);

    // Verify Meals Near You has the remaining available deals (deal-3, deal-4 sorted by distance)
    assert.equal(nearYouDeals.length, 2);
    assert.deepEqual(nearYouDeals.map((d) => d.id), ['deal-3', 'deal-4']);

    // Check ZERO overlap: Intersection must be empty!
    const pickupIds = new Set(pickupNowDeals.map((d) => d.id));
    const duplicates = nearYouDeals.filter((d) => pickupIds.has(d.id));
    assert.equal(duplicates.length, 0);
  });

  it('4. partitions all-urgent deals with zero duplicates', () => {
    const testDeals = [
      { id: 'deal-a', distanceKm: 2.1, pickupWindow: { expiresInSeconds: 1200 } },
      { id: 'deal-b', distanceKm: 1.5, pickupWindow: { expiresInSeconds: 2400 } },
      { id: 'deal-c', distanceKm: 0.6, pickupWindow: { expiresInSeconds: 5400 } },
      { id: 'deal-d', distanceKm: 0.8, pickupWindow: { expiresInSeconds: 7200 } },
    ];

    const { nearYouDeals, pickupNowDeals } = partitionDeals(testDeals);

    assert.equal(pickupNowDeals.length, 2);
    assert.equal(nearYouDeals.length, 2);

    const pickupIds = new Set(pickupNowDeals.map((d) => d.id));
    const duplicates = nearYouDeals.filter((d) => pickupIds.has(d.id));
    assert.equal(duplicates.length, 0);
  });

  it('5. avoids duplication when only 1 urgent deal exists', () => {
    const testDeals = [
      { id: 'deal-single', distanceKm: 1.2, pickupWindow: { expiresInSeconds: 1800 } },
    ];

    const { nearYouDeals, pickupNowDeals } = partitionDeals(testDeals);

    assert.equal(pickupNowDeals.length, 1);
    assert.equal(nearYouDeals.length, 0); // No different deals available -> empty & hidden!

    const pickupIds = new Set(pickupNowDeals.map((d) => d.id));
    const duplicates = nearYouDeals.filter((d) => pickupIds.has(d.id));
    assert.equal(duplicates.length, 0);
  });

  it('6. avoids duplication when no deals are approaching closing time', () => {
    const testDeals = [
      { id: 'deal-x', distanceKm: 2.0, pickupWindow: { expiresInSeconds: 20000 } },
      { id: 'deal-y', distanceKm: 0.5, pickupWindow: { expiresInSeconds: 25000 } },
    ];

    const { nearYouDeals, pickupNowDeals } = partitionDeals(testDeals);

    assert.equal(pickupNowDeals.length, 0); // No deals closing soon -> empty & hidden!
    assert.equal(nearYouDeals.length, 2);
    assert.deepEqual(nearYouDeals.map((d) => d.id), ['deal-y', 'deal-x']); // Sorted by distance
  });
});
