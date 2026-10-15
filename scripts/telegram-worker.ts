import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { getStore, type PortfolioStore } from "../src/lib/server/store";
import {
  callTelegram,
  getTelegramConfig,
  handleTelegramUpdate,
  TelegramServiceError,
} from "../src/lib/server/telegram";

// The npm command loads .env.local explicitly. Imports themselves load no env files.
// Run one polling worker OR a webhook, never both. This script never removes a webhook.
async function main(): Promise<void> {
  const config = getTelegramConfig();
  if (!config) {
    console.error(
      "Telegram is not paired. Run npm run telegram:connect first.",
    );
    process.exitCode = 1;
    return;
  }

  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const holder = randomUUID();
  let store: PortfolioStore | undefined;

  try {
    const webhook = await callTelegram<{ url?: unknown }>(
      "getWebhookInfo",
      {},
      { config, signal: controller.signal },
    );
    if (!webhook || typeof webhook.url !== "string")
      throw new TelegramServiceError();
    if (webhook.url) {
      console.error(
        "Polling was not started because this bot already has a webhook. Leave that webhook in place, or deliberately change the delivery setup first.",
      );
      process.exitCode = 1;
      return;
    }

    store = getStore();
    if (!store.acquireLease("telegram-poller", holder, 90_000)) {
      console.error(
        "Another Telegram worker is already using this local data directory.",
      );
      process.exitCode = 1;
      return;
    }

    console.info(
      "Telegram worker is listening for paired-owner replies. Press Ctrl+C to stop.",
    );
    let failures = 0;
    while (!controller.signal.aborted) {
      if (!store.acquireLease("telegram-poller", holder, 90_000)) {
        console.error(
          "Telegram worker lease was lost. Stopping to avoid competing pollers.",
        );
        process.exitCode = 1;
        break;
      }
      try {
        const updates = await callTelegram<unknown>(
          "getUpdates",
          {
            offset: store.getTelegramOffset(),
            timeout: 25,
            limit: 50,
            allowed_updates: ["message"],
          },
          { config, signal: controller.signal, timeoutMs: 35_000 },
        );
        if (!Array.isArray(updates)) throw new TelegramServiceError();
        for (const update of updates) {
          if (controller.signal.aborted) break;
          if (
            !update ||
            typeof update !== "object" ||
            !("update_id" in update) ||
            !Number.isSafeInteger(update.update_id) ||
            update.update_id < 0
          )
            throw new TelegramServiceError();
          const result = await handleTelegramUpdate(update, { config, store });
          if (result.reason && result.feedback !== "duplicate") {
            // Reasons are fixed enums, never message bodies, Telegram IDs, or secrets.
            console.info(`Telegram update ignored: ${result.reason}.`);
          }
          if (result.feedback === "failed") {
            console.error(
              "Telegram feedback delivery could not be confirmed. Saved question state is unchanged.",
            );
          }
          // Commit only after processing. A crash before this line safely replays the update.
          store.setTelegramOffset(update.update_id + 1);
        }
        failures = 0;
      } catch (error) {
        if (controller.signal.aborted) break;
        if (
          error instanceof TelegramServiceError &&
          (error.status === 409 || error.status === 401)
        ) {
          console.error(
            error.status === 409
              ? "Telegram reports a competing poller or webhook. Stopping without changing the bot setup."
              : "Telegram rejected the bot credentials. Run the local pairing setup again.",
          );
          process.exitCode = 1;
          break;
        }
        failures += 1;
        if (failures === 1)
          console.error(
            "Telegram is temporarily unavailable. Retrying without changing any configuration.",
          );
        await delay(
          Math.min(30_000, 1_000 * 2 ** Math.min(failures - 1, 5)),
          undefined,
          { signal: controller.signal },
        ).catch(() => undefined);
      }
    }
  } catch {
    if (!controller.signal.aborted) {
      console.error(
        "Telegram worker could not start. Check the local pairing and network connection.",
      );
      process.exitCode = 1;
    }
  } finally {
    if (store) {
      store.releaseLease("telegram-poller", holder);
      store.close();
    }
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }
}

void main();
