'use strict';

async function hasCurrentMusicAnalyticsAccess(db, user) {
  if (!user?.uid || user.staff !== true || !Array.isArray(user.staffPages)
    || !user.staffPages.includes('music-analytics')) return false;
  const snapshot = await db.collection('falowenStaffAccess').doc(user.uid).get();
  const staff = snapshot?.exists === false ? null : snapshot?.data?.();
  return staff?.active === true && Array.isArray(staff.pages)
    && staff.pages.includes('music-analytics');
}

module.exports = { hasCurrentMusicAnalyticsAccess };
