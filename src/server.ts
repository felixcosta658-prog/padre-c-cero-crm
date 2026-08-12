import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler,
} from "@tanstack/react-start/server";
import type { HandlerCallback } from "@tanstack/router-core/ssr/server";
import { isSsrResponse } from "@tanstack/router-core/ssr/server";
import type { AnyRouter, Register } from "@tanstack/react-router";

import { renderErrorPageHtml } from "./lib/error-page";
import { consumeLastCapturedError } from "./lib/error-capture";

const normalizeCatastrophicSsrResponse = (response: Response) => {
  if (response.status !== 500) return Promise.resolve(response);
  return response
    .clone()
    .json()
    .then((body: unknown) => {
      const b = body as { unhandled?: boolean; message?: string } | null;
      if (b?.unhandled === true && b?.message === "HTTPError") {
        return new Response(renderErrorPageHtml(consumeLastCapturedError()?.stack ?? ""), {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return response;
    })
    .catch(() => response);
};

const handler: HandlerCallback<AnyRouter> = async (ctx) => {
  try {
    const result = await defaultStreamHandler(ctx);
    const response = isSsrResponse(result) ? result.response : result;
    return await normalizeCatastrophicSsrResponse(response);
  } catch (err) {
    console.error(err);
    return new Response(renderErrorPageHtml(consumeLastCapturedError()?.stack ?? String(err)), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
};

const fetch = createStartHandler(handler);

export default { fetch } satisfies { fetch: RequestHandler<Register> };
