/** Vercel serverless entrypoint.
 *
 *  Vercel runs the app as a serverless function rather than a long-lived server,
 *  so instead of `app.listen()` we export the Express app as the request handler.
 *  An Express app is itself a `(req, res) => void` function, which is exactly the
 *  signature Vercel's Node runtime expects.
 */
import "dotenv/config";
import { createApp } from "../app.js";

const app = createApp();

export default app;
