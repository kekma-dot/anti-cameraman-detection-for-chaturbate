# Anti Operator Detection for Chaturbate

[Русский](README.md) · **English**

![A cartoon chat operator taking a mallet to the Chaturbate logo](assets/operator-vs-typing.png)

You're working the chat. Three little dots have already snitched.

“Nobody will know it's your boyfriend chatting for you.”

A Chrome extension that blocks outgoing typing notifications in Chaturbate private messages.

The name is ambitious; the feature is specific: suppress the typing indicator. This extension doesn't hide who's at the keyboard or guarantee that an operator can't be identified in other ways.

## Install

1. Download the [source ZIP](https://github.com/kekma-dot/anti-operator-detection-for-chaturbate/archive/refs/heads/main.zip) and extract it.
2. Open `chrome://extensions/` in the Chrome profile used for the model account.
3. Enable Developer mode and click Load unpacked.
4. Select the **`extension`** folder inside the extracted project. Not the project root or the ZIP.

There's no separate extension button. The rule stays active while the extension is enabled in Chrome. Disable it on the same page to restore typing notifications.

## What the mallet hits

One request:

```text
POST https://chaturbate.com/api/messaging/typing/
```

The rule allows query parameters and matches `fetch`/XHR requests. Message sending uses a different endpoint, `/api/messaging/publish/`, which this rule doesn't block.

The extension contains a Manifest V3 file and one static Chrome `declarativeNetRequest` rule. It has no executable scripts. It doesn't read messages, access cookies, or send conversations to an external server. Its only permission is `declarativeNetRequest`.

## Where the mallet won't help

- Blocking applies to every recipient in the installed profile. PM/DM share the endpoint; you can't select a single conversation.
- The rule targets one exact URL on `chaturbate.com`. Other hosts, paths, and typing-notification transports aren't covered.
- If the site changes its typing mechanism, the extension will need an update. This isn't a promise of permanent invisibility.
- The site may report a network error for the blocked request. The extension doesn't fake a successful response.

Use two accounts to check it: type on one and watch for the indicator on the other. Then verify that a normal message still arrives. Don't accidentally send an old draft while fighting the dots.

## Checks

Prototype `0.1.0`: 18 cases passed in Node and Chromium 153's native rule engine. Tests cover permissions, exact URL matching, and exclusions for message sending and other requests.

Manual checks also passed: the project owner confirmed that the extension works as expected.

Run the dependency-free check:

```sh
node tests/check.mjs
```

The optional native Chromium check uses an existing Playwright installation and a separate temporary profile:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
node tests/chrome.mjs
```

You can omit `CHROMIUM_EXECUTABLE` if the browser expected by your Playwright installation is already installed. The temporary test companion extension isn't included in the `extension` folder and isn't needed for normal use.

## About the artwork and name

The mallet was drawn with GPT Image. Only the sign got hurt.

This project isn't affiliated with or endorsed by Chaturbate. The Chaturbate name and logo belong to their respective owners and appear here as part of the parody artwork. This extension doesn't grant permission to bypass the platform's rules.
