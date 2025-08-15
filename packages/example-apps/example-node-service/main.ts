import {parse} from "cookie";

export default {
    async fetch(request): Promise<Response> {
        // The name of the cookie
        const COOKIE_NAME = "session";
        const cookie = parse(request.headers.get("Cookie") || "");
        if (cookie[COOKIE_NAME] != null) {
            // Respond with the cookie value
            return new Response(`
                <html>
                    <body>
                        <h1>Cookie Status</h1>
                        <p>Cookie '${COOKIE_NAME}' exists with value: ${cookie[COOKIE_NAME]}</p>
                    </body>
                </html>
            `, {
                headers: {
                    "Content-Type": "text/html"
                }
            });
        }
        return new Response(`
            <html>
                <body>
                    <h1>Cookie Status</h1>
                    <p>No cookie found <w></w>ith name: ${COOKIE_NAME}</p>
                </body>
            </html>
        `, {
            headers: {
                "Content-Type": "text/html"
            }
        });
    },
} satisfies ExportedHandler;