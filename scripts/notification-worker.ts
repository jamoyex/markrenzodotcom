import { setTimeout as delay } from "node:timers/promises";
import {
  deliverNotification,
  getNotificationStore,
} from "../src/lib/server/notifications";
import { getTelegramConfig } from "../src/lib/server/telegram";

// Outbound queue only. Does not poll Telegram, process owner replies, or open the
// knowledge/preview stores. It works alongside either webhook or polling mode.
async function main() {
  const config = getTelegramConfig();
  if (!config) {
    console.error("Portfolio notifications need the paired Telegram bot.");
    process.exitCode = 1;
    return;
  }
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const store = getNotificationStore();
  console.info("Portfolio notification queue is listening.");
  try {
    while (!controller.signal.aborted) {
      try {
        await deliverNotification(undefined, { store, config });
      } catch {
        console.warn("portfolio_notification_queue_unavailable");
      }
      await delay(5000, undefined, { signal: controller.signal }).catch(
        () => {},
      );
    }
  } finally {
    store.close();
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}
void main().catch(() => {
  console.error("Portfolio notification queue could not start.");
  process.exitCode = 1;
});
