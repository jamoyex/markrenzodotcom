// Local-only credential pairing. Never deployed as part of the website.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile, lstat, writeFile, rename, chmod } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const port = 4391;
const origin = `http://127.0.0.1:${port}`;
const envPath = resolve(process.cwd(), ".env.local");
const nonce = randomBytes(24).toString("hex");
let pairing = null;
let configured = false;
let busy = false;
let lastError = "";
let stopping = false;
const shutdown = new AbortController();

async function telegram(token, method, body = {}) {
  let response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(12000)]),
      redirect: "error",
    });
  } catch {
    throw new Error("Telegram could not be reached. Please try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok)
    throw new Error(
      response.status === 401
        ? "That bot token was not accepted by Telegram."
        : response.status === 409
          ? "This bot is in use by another connection. Use a dedicated portfolio bot."
          : "Telegram could not complete that request. Please try again.",
    );
  return data.result;
}

async function saveConfiguration(values) {
  const stat = await lstat(envPath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (stat?.isSymbolicLink() || (stat && !stat.isFile()))
    throw new Error(
      "The environment destination must be a regular local file.",
    );
  let tracked = false;
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", ".env.local"], {
      stdio: "ignore",
    });
    tracked = true;
  } catch {}
  if (tracked) throw new Error("Refusing to save a secret to a tracked file.");
  let content = await readFile(envPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=.*$`, "m");
    content = pattern.test(content)
      ? content.replace(pattern, () => line)
      : `${content.trimEnd()}\n${line}\n`;
  }
  const temp = `${envPath}.telegram-${randomBytes(6).toString("hex")}`;
  await writeFile(temp, content, { mode: 0o600, flag: "wx" });
  await rename(temp, envPath);
  await chmod(envPath, 0o600);
}

async function pollPairing() {
  if (!pairing || busy || configured || stopping) return;
  busy = true;
  try {
    if (Date.now() > pairing.expiresAt) {
      pairing = null;
      lastError = "Pairing expired. Enter the token again to reconnect.";
      return;
    }
    const updates = await telegram(pairing.token, "getUpdates", {
      offset: pairing.offset,
      timeout: 0,
      allowed_updates: ["message"],
    });
    if (stopping) return;
    for (const update of updates) {
      pairing.offset = Math.max(pairing.offset, update.update_id + 1);
      const message = update.message;
      if (
        message?.chat?.type !== "private" ||
        message.from?.is_bot ||
        message.from?.id !== message.chat.id ||
        message.text !== `/start ${pairing.code}` ||
        message.date * 1000 < pairing.startedAt - 2000
      )
        continue;
      await saveConfiguration({
        TELEGRAM_BOT_TOKEN: pairing.token,
        TELEGRAM_OWNER_CHAT_ID: String(message.chat.id),
        TELEGRAM_OWNER_USER_ID: String(message.from.id),
        TELEGRAM_WEBHOOK_SECRET: randomBytes(32).toString("hex"),
      });
      configured = true;
      try {
        await telegram(pairing.token, "sendMessage", {
          chat_id: message.chat.id,
          text: "Your Mark Renzo portfolio bot is paired. I’ll send questions the site’s AI can’t answer here. Reply with a self-contained answer to answer the visitor and save a public knowledge note. Start a reply with /private to keep it out of the knowledge base, or /skip to decline.",
        });
      } catch {
        /* Configuration succeeded; confirmation delivery can be retried in the app. */
      }
      pairing.token = "";
      console.log(
        "Telegram paired. Credentials saved to .env.local; no secrets printed.",
      );
      break;
    }
  } catch (error) {
    lastError =
      error instanceof Error ? error.message : "Pairing could not finish.";
  } finally {
    busy = false;
  }
}

const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect your portfolio to Telegram</title>
<style>body{background:#f6f5ef;color:#20211e;font:16px/1.6 system-ui;margin:0;padding:6vh 22px}main{max-width:620px;margin:auto}small{font:12px monospace;letter-spacing:2px}h1{font-size:48px;line-height:1.05;letter-spacing:-2px}a{color:#2453ff}section{border:1px solid #20211e;border-radius:20px;padding:28px;margin-top:30px;background:white}label{display:block;font-weight:600}input{box-sizing:border-box;width:100%;font:16px monospace;padding:16px;border:1px solid #bbb;border-radius:10px;margin:10px 0}button,.button{display:inline-block;border:0;background:#2453ff;color:white;border-radius:50px;padding:14px 22px;font:600 15px system-ui;text-decoration:none;cursor:pointer}button:disabled{opacity:.5}p{color:#56584f}.note{font-size:13px}#status{background:#ddef8b;padding:20px;border-radius:12px}#error{color:#9b2121}.hidden{display:none}</style>
<main><small>MARK RENZO · CONNECT THE HUMAN</small><h1>A direct line.<br>When AI needs you.</h1><p>Create a dedicated bot with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a> using <strong>/newbot</strong>. Then connect it here.</p>
<section id="form-section"><form id="connect"><label for="bot-token">Telegram bot token</label><input id="bot-token" type="password" autocomplete="off" spellcheck="false" required placeholder="Paste the token from BotFather"><p class="note">This form runs only on your computer. The token is sent to Telegram for verification and saved in this project’s ignored <strong>.env.local</strong> after you pair your account. It is never displayed or sent to OpenAI.</p><button id="submit">Connect & save locally →</button></form><p id="error" role="alert"></p></section>
<section id="pair" class="hidden"><h2>Meet your new bot.</h2><p>Open the bot below, then press <strong>Start</strong> in Telegram to pair your account. Only this account can answer visitor questions and update your knowledge.</p><a id="bot-link" class="button" target="_blank" rel="noreferrer">Open Telegram →</a><p id="status" role="status">Waiting for you to press Start…</p><p class="note">Normal replies become public knowledge. Use <strong>/private</strong> for a visitor-only reply, or <strong>/skip</strong> to decline.</p></section></main>
<script nonce="${nonce}">const auth=${JSON.stringify(nonce)};let interval;
document.getElementById('connect').addEventListener('submit',async e=>{e.preventDefault();const button=document.getElementById('submit');button.disabled=true;document.getElementById('error').textContent='';const token=document.getElementById('bot-token').value;document.getElementById('bot-token').value='';try{const r=await fetch('/connect',{method:'POST',headers:{'Content-Type':'application/json','X-Setup-Key':auth},body:JSON.stringify({token})});const data=await r.json();if(!r.ok)throw new Error(data.error);document.getElementById('form-section').classList.add('hidden');document.getElementById('pair').classList.remove('hidden');document.getElementById('bot-link').href=data.url;interval=setInterval(check,2000);check();}catch(err){document.getElementById('error').textContent=err.message;}finally{button.disabled=false;}});
async function check(){try{const r=await fetch('/status',{headers:{'X-Setup-Key':auth}});const data=await r.json();if(data.configured){clearInterval(interval);document.getElementById('status').textContent='Connected. Your Telegram credentials are saved. You can return to the portfolio.';document.getElementById('bot-link').classList.add('hidden');}else if(data.error){document.getElementById('status').textContent=data.error;}}catch{document.getElementById('status').textContent='Connection interrupted. Keep this local setup running and try again.';}}
</script></html>`;

const server = createServer(async (request, response) => {
  const json = (status, body) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(body));
  };
  if (
    request.headers.host !== `127.0.0.1:${port}` ||
    !["127.0.0.1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress)
  )
    return json(403, { error: "Local setup only." });
  if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
      "Referrer-Policy": "no-referrer",
    });
    response.end(html);
    return;
  }
  if (request.headers["x-setup-key"] !== nonce)
    return json(403, { error: "Reopen the local connection page." });
  if (request.method === "GET" && request.url === "/status")
    return json(200, { configured, error: lastError || undefined });
  if (
    request.method !== "POST" ||
    request.url !== "/connect" ||
    request.headers.origin !== origin ||
    !request.headers["content-type"]?.startsWith("application/json")
  )
    return json(403, { error: "Use the local connection form." });
  if (configured || pairing || busy)
    return json(409, {
      error:
        "Pairing is already in progress. Restart this setup to change bots.",
    });
  busy = true;
  try {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 2048) throw new Error("The token is too long.");
    }
    let token;
    try {
      token = JSON.parse(body).token?.trim();
    } catch {
      throw new Error("Enter a valid bot token.");
    }
    if (
      typeof token !== "string" ||
      !/^\d{5,15}:[A-Za-z0-9_-]{25,100}$/.test(token)
    )
      throw new Error("Enter the bot token supplied by BotFather.");
    const bot = await telegram(token, "getMe");
    const webhook = await telegram(token, "getWebhookInfo");
    if (webhook.url)
      throw new Error(
        "This bot already has a webhook. Create a dedicated portfolio bot to preserve its existing connection.",
      );
    if (!bot.is_bot || !/^[A-Za-z0-9_]+$/.test(bot.username))
      throw new Error("Telegram did not return a usable bot.");
    const code = randomBytes(24).toString("hex");
    pairing = {
      token,
      code,
      offset: 0,
      startedAt: Date.now(),
      expiresAt: Date.now() + 15 * 60000,
    };
    lastError = "";
    json(200, { url: `https://t.me/${bot.username}?start=${code}` });
  } catch (error) {
    json(400, {
      error:
        error instanceof Error ? error.message : "Could not connect Telegram.",
    });
  } finally {
    busy = false;
  }
});
const timer = setInterval(pollPairing, 2000);
server.listen(port, "127.0.0.1", () =>
  console.log(`Secure local Telegram setup: ${origin}`),
);
server.on("error", () => {
  console.error(
    "Local Telegram setup could not start. Port 4391 may already be in use.",
  );
  clearInterval(timer);
  process.exitCode = 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    stopping = true;
    shutdown.abort();
    clearInterval(timer);
    server.close(() => {
      if (pairing) pairing.token = "";
    });
  });
