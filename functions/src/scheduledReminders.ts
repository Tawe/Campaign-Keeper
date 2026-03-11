/**
 * Firebase Cloud Function — calls the Next.js cron endpoint daily to send session reminders.
 *
 * Setup:
 *   1. cd functions && npm install firebase-functions firebase-admin
 *   2. Set env vars in Firebase:
 *        firebase functions:config:set app.url="https://yourdomain.com" app.cron_secret="<your-secret>"
 *   3. Deploy: firebase deploy --only functions
 */

import * as functions from "firebase-functions";

export const sendDailyReminders = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("UTC")
  .onRun(async () => {
    const appUrl = functions.config().app?.url;
    const cronSecret = functions.config().app?.cron_secret;

    if (!appUrl || !cronSecret) {
      console.error("Missing app.url or app.cron_secret in Firebase config");
      return;
    }

    try {
      const res = await fetch(`${appUrl}/api/cron/send-reminders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${cronSecret}` },
      });
      const body = await res.json();
      console.log("Reminder run complete:", body);
    } catch (err) {
      console.error("Failed to call reminder endpoint:", err);
    }
  });
