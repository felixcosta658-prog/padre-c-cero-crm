import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { HTTPError } from "h3-v2";

import { renderErrorPageHtml } from "./lib/error-page";
import { captureError, consumeLastCapturedError } from "./lib/error-capture";

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const errorMiddleware = createMiddleware({
  type: "request",
}).server(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof HTTPError && typeof err.statusCode === "number") {
      throw err;
    }
    captureError(err);
    return new Response(renderErrorPageHtml(consumeLastCapturedError()?.stack ?? ""), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
