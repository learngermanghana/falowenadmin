"use strict";

const { isStudioOwner } = require("./hoerenStudioApi");

async function canUseMusicStudio(db, user, runtimeConfig, language) {
  if (!["german", "swahili"].includes(language)) return false;
  if (isStudioOwner(user.uid, runtimeConfig)) return true;
  if (!(user.staff === true || ["staff", "tutor"].includes(user.role))
    || !Array.isArray(user.staffPages) || !user.staffPages.includes("music-studio")
    || !Array.isArray(user.staffLanguages) || !user.staffLanguages.includes(language)) return false;
  const access = (await db.collection("falowenStaffAccess").doc(user.uid).get()).data();
  return access?.active === true && access.pages?.includes("music-studio") && access.languages?.includes(language);
}

function createTimingAccessHandler({ db, verifyToken, runtimeConfig }) {
  return async (req, res) => {
    res.set("Cache-Control", "no-store");
    let user;
    try {
      user = await verifyToken(String(req.headers.authorization || "").replace(/^Bearer /, ""));
    } catch {
      return res.status(401).json({ ok: false });
    }
    try {
      const allowed = await canUseMusicStudio(db, user, runtimeConfig, req.body?.language);
      return res.status(allowed ? 200 : 403).json({ ok: allowed });
    } catch {
      return res.status(503).json({ ok: false });
    }
  };
}

module.exports = { canUseMusicStudio, createTimingAccessHandler };
