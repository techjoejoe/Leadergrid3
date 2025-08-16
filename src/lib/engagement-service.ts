
'use client';

import { db } from './firebase';
import {
  doc,
  getDoc,
  writeBatch,
  Timestamp,
  collection,
  increment,
  arrayUnion,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { startOfWeek, isSameDay } from 'date-fns';

const LEADERBOARD_VIEW_POINTS = 5;

/**
 * Awards points to a user for viewing the leaderboard, with daily and weekly limits.
 * Also adds points to the active class if one is provided.
 * @param userId The ID of the user to award points to.
 * @param displayName The display name of the user.
 * @param activeClassId The ID of the currently active class, if any.
 * @returns A promise that resolves to a toast-like object if points were awarded, otherwise null.
 */
export async function awardLeaderboardViewPoints(
  userId: string,
  displayName: string,
  activeClassId: string | null
): Promise<{ title: string; description: string } | null> {
  const now = new Date();
  const engagementRef = doc(
    db,
    'users',
    userId,
    'engagement_awards',
    'leaderboard_view'
  );

  try {
    const engagementSnap = await getDoc(engagementRef);
    const awardData = engagementSnap.data();
    const timestamps: Timestamp[] = awardData?.awardedTimestamps || [];

    // 1. Check daily limit: Has the user already been awarded points today?
    const alreadyAwardedToday = timestamps.some((ts) =>
      isSameDay(ts.toDate(), now)
    );
    if (alreadyAwardedToday) {
      return null; // Already awarded today, do nothing.
    }

    // 2. Check weekly limit: Has the user been awarded 5 times this week?
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday as start of week
    const awardsThisWeek = timestamps.filter(
      (ts) => ts.toDate() >= weekStart
    ).length;
    if (awardsThisWeek >= 5) {
      return null; // Weekly limit reached, do nothing.
    }

    // 3. Award points
    const batch = writeBatch(db);

    // Update user's lifetime points
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      lifetimePoints: increment(LEADERBOARD_VIEW_POINTS),
    });

    // If an active class is passed, update its points too
    if (activeClassId) {
      const rosterRef = doc(
        db,
        'classes',
        activeClassId,
        'roster',
        userId
      );
      batch.update(rosterRef, {
        classPoints: increment(LEADERBOARD_VIEW_POINTS),
      });
    }

    // Add a record to point history
    const historyRef = doc(collection(db, 'point_history'));
    batch.set(historyRef, {
      studentId: userId,
      studentName: displayName,
      points: LEADERBOARD_VIEW_POINTS,
      reason: 'Viewed Leaderboard',
      type: 'engagement',
      classId: activeClassId,
      timestamp: Timestamp.fromDate(now),
    });

    // Update the engagement tracking document
    if (engagementSnap.exists()) {
      batch.update(engagementRef, {
        awardedTimestamps: arrayUnion(Timestamp.fromDate(now)),
      });
    } else {
      batch.set(engagementRef, {
        awardedTimestamps: [Timestamp.fromDate(now)],
      });
    }

    await batch.commit();

    // Return a message for the toast
    return {
      title: 'Point Bonus!',
      description: `You earned ${LEADERBOARD_VIEW_POINTS} points for checking the leaderboard!`,
    };
  } catch (error) {
    console.error('Error awarding leaderboard view points:', error);
    return null; // Fail silently to not disrupt user experience
  }
}
