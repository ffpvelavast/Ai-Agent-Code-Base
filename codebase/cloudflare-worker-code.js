export default {

  async fetch(request, env) {

    const url = new URL(request.url);


    /* ============================================================
       CORS
       ============================================================ */

    const corsHeaders = {

      "Access-Control-Allow-Origin": "*",

      "Access-Control-Allow-Methods":
        "GET, OPTIONS",

      "Access-Control-Allow-Headers":
        "Content-Type, Authorization",

      "Access-Control-Max-Age":
        "86400"

    };


    /* ============================================================
       OPTIONS
       ============================================================ */

    if (
      request.method === "OPTIONS"
    ) {

      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders
        }
      );

    }


    /* ============================================================
       CRAWL STATUS ENDPOINT
       ============================================================ */

    if (
      url.pathname === "/crawl-status"
    ) {

      const locationId =
        url.searchParams.get(
          "locationId"
        );


      const knowledgeBaseId =
        url.searchParams.get(
          "knowledgeBaseId"
        );


      const operationId =
        url.searchParams.get(
          "operationId"
        );


      /* ----------------------------------------------------------
         VALIDATE LOCATION ID
         ---------------------------------------------------------- */

      if (!locationId) {

        return new Response(

          JSON.stringify({

            success: false,

            error:
              "Missing locationId"

          }),

          {

            status: 400,

            headers: {

              "Content-Type":
                "application/json",

              ...corsHeaders

            }

          }

        );

      }


      /* ----------------------------------------------------------
         VALIDATE KNOWLEDGE BASE ID
         ---------------------------------------------------------- */

      if (!knowledgeBaseId) {

        return new Response(

          JSON.stringify({

            success: false,

            error:
              "Missing knowledgeBaseId"

          }),

          {

            status: 400,

            headers: {

              "Content-Type":
                "application/json",

              ...corsHeaders

            }

          }

        );

      }


      /* ----------------------------------------------------------
         CHECK TOKEN
         ---------------------------------------------------------- */

      if (!env.HIGHLEVEL_TOKEN) {

        return new Response(

          JSON.stringify({

            success: false,

            error:
              "HIGHLEVEL_TOKEN secret is not configured in Cloudflare."

          }),

          {

            status: 500,

            headers: {

              "Content-Type":
                "application/json",

              ...corsHeaders

            }

          }

        );

      }


      try {

        /* --------------------------------------------------------
           HIGHLEVEL STATUS URL
           -------------------------------------------------------- */

        const ghlUrl =
          new URL(
            "https://services.leadconnectorhq.com/knowledge-bases/crawler/status"
          );


        ghlUrl.searchParams.set(
          "locationId",
          locationId
        );


        ghlUrl.searchParams.set(
          "knowledgeBaseId",
          knowledgeBaseId
        );


        if (operationId) {

          ghlUrl.searchParams.set(
            "operationId",
            operationId
          );

        }


        /* --------------------------------------------------------
           CALL HIGHLEVEL
           -------------------------------------------------------- */

        const response =
          await fetch(
            ghlUrl.toString(),
            {

              method: "GET",

              headers: {

                "Authorization":
                  `Bearer ${env.HIGHLEVEL_TOKEN}`,

                "Version":
                  "2021-07-28",

                "Accept":
                  "application/json"

              }

            }
          );


        const text =
          await response.text();


        /* --------------------------------------------------------
           HIGHLEVEL ERROR
           -------------------------------------------------------- */

        if (!response.ok) {

          return new Response(

            JSON.stringify({

              success: false,

              error:
                "HighLevel API error",

              statusCode:
                response.status,

              details:
                text

            }),

            {

              status:
                response.status,

              headers: {

                "Content-Type":
                  "application/json",

                ...corsHeaders

              }

            }

          );

        }


        /* --------------------------------------------------------
           PARSE JSON
           -------------------------------------------------------- */

        let data;


        try {

          data =
            JSON.parse(text);

        } catch (error) {

          return new Response(

            JSON.stringify({

              success: false,

              error:
                "HighLevel returned invalid JSON",

              raw:
                text

            }),

            {

              status: 500,

              headers: {

                "Content-Type":
                  "application/json",

                ...corsHeaders

              }

            }

          );

        }


        /* --------------------------------------------------------
           RETURN
           -------------------------------------------------------- */

        return new Response(

          JSON.stringify(data),

          {

            status: 200,

            headers: {

              "Content-Type":
                "application/json",

              "Cache-Control":
                "no-store, no-cache, must-revalidate",

              ...corsHeaders

            }

          }

        );

      }

      catch (error) {

        console.error(
          "Crawl status error:",
          error
        );


        return new Response(

          JSON.stringify({

            success: false,

            error:
              "Failed to contact HighLevel",

            details:
              error.message

          }),

          {

            status: 500,

            headers: {

              "Content-Type":
                "application/json",

              ...corsHeaders

            }

          }

        );

      }

    }


    /* ============================================================
       SCREENSHOT ENDPOINT
       ============================================================ */

    if (url.pathname === "/screenshot") {

      const targetUrl = url.searchParams.get("url");

      if (!targetUrl) {
        return new Response(
          "Missing URL parameter",
          { status: 400, headers: corsHeaders }
        );
      }

      let parsedTarget;
      try {
        parsedTarget = new URL(targetUrl);
      } catch (error) {
        return new Response(
          "Invalid target URL",
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        if (!env.BROWSER) {
          return new Response(
            "Browser Rendering binding is not configured.",
            { status: 500, headers: corsHeaders }
          );
        }

        const screenshot = await env.BROWSER.quickAction(
          "screenshot",
          {
            url: parsedTarget.href,
            screenshotOptions: {
              type: "png",
              fullPage: false
            },
            viewport: {
              width: 375,
              height: 680,
              deviceScaleFactor: 2
            },
            gotoOptions: {
              waitUntil: "networkidle2",
              timeout: 30000
            }
          }
        );

        return new Response(screenshot, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=60",
            ...corsHeaders
          }
        });

      } catch (error) {
        console.error("Screenshot error:", error);
        return new Response(
          "Unable to generate website preview.",
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "text/plain"
            }
          }
        );
      }
    }


    /* ============================================================
       WEBSITE PROXY
       ============================================================ */

    const targetUrl =
      url.searchParams.get(
        "url"
      );


    if (!targetUrl) {

      return new Response(

        "Missing URL parameter",

        {

          status: 400,

          headers: corsHeaders

        }

      );

    }


    /* ============================================================
       VALIDATE TARGET URL
       ============================================================ */

    let parsedTarget;


    try {

      parsedTarget =
        new URL(
          targetUrl
        );

    }

    catch (error) {

      return new Response(

        "Invalid target URL",

        {

          status: 400,

          headers: corsHeaders

        }

      );

    }


    /* ============================================================
       FETCH WEBSITE
       ============================================================ */

    try {

      const response =
        await fetch(

          parsedTarget.toString(),

          {

            method: "GET",

            headers: {

              "User-Agent":
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",

              "Accept":
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"

            }

          }

        );


      /* ==========================================================
         COPY RESPONSE HEADERS
         ========================================================== */

      const newHeaders =
        new Headers(
          response.headers
        );


      newHeaders.delete(
        "x-frame-options"
      );


      newHeaders.delete(
        "content-security-policy"
      );


      newHeaders.delete(
        "content-security-policy-report-only"
      );


      newHeaders.delete(
        "frame-options"
      );

      newHeaders.delete(
        "cross-origin-embedder-policy"
      );

      newHeaders.delete(
        "cross-origin-opener-policy"
      );

      newHeaders.delete(
        "cross-origin-resource-policy"
      );

      newHeaders.delete(
        "permissions-policy"
      );

      newHeaders.delete(
        "x-xss-protection"
      );

      newHeaders.set(
        "Access-Control-Allow-Origin",
        "*"
      );


      newHeaders.set(
        "Cache-Control",
        "no-store"
      );


      const contentType =
        response.headers.get(
          "content-type"
        ) || "";


      /* ==========================================================
         PROCESS HTML
         ========================================================== */

      if (
        contentType.includes(
          "text/html"
        )
      ) {

        let html = await response.text();
        
        // Strip out any Content-Security-Policy meta tags that might block our widget from loading
        html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, "");

        /* ========================================================
           CAPTCHA DETECTION & FALLBACK
           ======================================================== */
        const antiBotDetected =
          // 1. Cloudflare specific challenge URLs or IDs
          /\/cdn-cgi\/challenge-platform\//i.test(html) ||
          /id="(cf-wrapper|challenge-running|cf-please-wait)"/i.test(html) ||
          // 2. Common anti-bot page titles
          /<title>(Just a moment\.\.\.|Attention Required!.*|Security Challenge.*)<\/title>/i.test(html) ||
          // 3. Common phrases on CAPTCHA / block pages
          /checking your browser before accessing|please complete the security check to access|please verify you are (a )?human|enable javascript and cookies to continue|why do i have to complete a captcha/i.test(html) ||
          // 4. Any explicit HTTP block status (if proxy is blocked, fallback to screenshot)
          response.status === 403 || 
          response.status === 429;

        if (antiBotDetected) {
          // Use a reliable third-party screenshot API so it works out of the box
          const screenshotUrl = `https://image.thum.io/get/width/400/crop/800/${parsedTarget.href}`;

          return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                html, body {
                  margin: 0; padding: 0;
                  width: 100%; height: 100%;
                  overflow: hidden;
                  background: #ffffff;
                }
                .website-preview {
                  width: 100%; height: 100%;
                  display: flex;
                  align-items: flex-start; justify-content: center;
                  overflow: hidden;
                  background: #ffffff;
                }
                .website-preview img {
                  display: block;
                  width: 100%; height: auto;
                  min-height: 100%;
                  object-fit: cover; object-position: top center;
                }
                .fallback-msg {
                  display: none;
                  font-family: sans-serif;
                  text-align: center;
                  padding: 40px 20px;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="website-preview">
                <img src="${screenshotUrl}" alt="Website preview" onerror="this.style.display='none'; document.getElementById('fallback').style.display='block';">
                <div id="fallback" class="fallback-msg">
                  <h3>Preview Unavailable</h3>
                  <p>We could not load a preview of this website.</p>
                  <p style="font-size: 12px; color: #999;">(Make sure Cloudflare Browser Rendering is enabled and bound to BROWSER in your Worker settings)</p>
                </div>
              </div>
              <script>
                // Force the GHL widget to render in mobile mode
                Object.defineProperty(navigator, 'userAgent', {
                  get: function () {
                    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
                  }
                });
              </script>
              <script
                src="https://widgets.leadconnectorhq.com/loader.js"
                data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
                data-widget-id="6a8c69110916f988385fa4de">
              </script>
            </body>
            </html>
            `,
            {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=UTF-8",
                "Cache-Control": "no-store",
                ...corsHeaders
              }
            }
          );
        }

        // Force all http:// links/assets to https:// to prevent Mixed Content errors
        html = html.replace(/http:\/\//gi, "https://");

        const originUrl = parsedTarget.origin.replace("http://", "https://");

        /* ========================================================
           BASE URL & HTTPS UPGRADE
           ======================================================== */

        const baseTag = `
<base href="${originUrl}/">
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
`;


        /* ========================================================
           MOBILE SCROLL FIX
           ======================================================== */

        const scrollFix = `

<style id="ffp-mobile-scroll-fix">

html {

  width: 100% !important;

  min-height: 100% !important;

  height: auto !important;

  overflow-x: hidden !important;

  overflow-y: auto !important;

  margin: 0 !important;

  padding: 0 !important;

}


html body {

  width: 100% !important;

  min-height: 100% !important;

  height: auto !important;

  overflow-x: hidden !important;

  overflow-y: auto !important;

  margin: 0 !important;

  padding: 0 !important;

}


body {

  position: relative !important;

  -webkit-overflow-scrolling: touch !important;

  overscroll-behavior-y: auto !important;

  touch-action: pan-y !important;

}


/* ============================================================
   COMMON WEBSITE CONTAINERS
   ============================================================ */

#SITE_CONTAINER,

#site-root,

[data-mesh-id],

[data-testid="site-root"] {

  max-height: none !important;

  min-height: 100% !important;

  height: auto !important;

  overflow: visible !important;

}


/* ============================================================
   PREVENT FIXED BODY CONTAINERS
   ============================================================ */

body > div {

  max-height: none !important;

}


/* ============================================================
   WIX / WEBSITE SCROLLING
   ============================================================ */

body {

  overscroll-behavior:
    auto !important;

}


/* ============================================================
   PREVENT HORIZONTAL SCROLL
   ============================================================ */

html,
body {

  overflow-x:
    hidden !important;

}


/* ============================================================
   IMPORTANT

   NO GHL WIDGET IS INJECTED HERE.

   The GHL widget is loaded from the
   outer GoHighLevel page instead.
   ============================================================ */

</style>

`;


        /* ========================================================
           INJECT HEAD
           ======================================================== */

        if (
          /<head[^>]*>/i.test(
            html
          )
        ) {

          html =
            html.replace(

              /<head([^>]*)>/i,

              `<head$1>
${baseTag}
${scrollFix}
`

            );

        }

        else {

          html =
            baseTag +
            scrollFix +
            html;

        }


        /* ========================================================
           INJECT GHL SCRIPT & FORCE MOBILE
           ======================================================== */

        const ghlScript = `
<script>
  // Force the GHL widget to render in mobile mode by overriding the User Agent
  Object.defineProperty(navigator, 'userAgent', {
    get: function () {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
    }
  });
</script>
<script
  src="https://widgets.leadconnectorhq.com/loader.js"
  data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
  data-widget-id="6a8c69110916f988385fa4de"
  async defer>
</script>
`;

        if (
          /<\/body[^>]*>/i.test(
            html
          )
        ) {
          html = html.replace(
            /<\/body([^>]*)>/i,
            `${ghlScript}\n</body$1>`
          );
        } else {
          html += ghlScript;
        }

        /* ========================================================
           RETURN HTML
           ======================================================== */

        return new Response(

          html,

          {

            status:
              response.status,

            headers:
              newHeaders

          }

        );

      }


      /* ==========================================================
         STATIC ASSETS
         ========================================================== */

      return new Response(

        response.body,

        {

          status:
            response.status,

          headers:
            newHeaders

        }

      );

    }

    catch (error) {

      console.error(
        "Proxy error:",
        error
      );


      return new Response(

        "Error proxying target URL",

        {

          status: 500,

          headers:
            corsHeaders

        }

      );

    }

  }

};