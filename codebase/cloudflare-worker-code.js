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
              fullPage: true
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
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
              "Accept":
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
              "Accept-Language":
                "en-US,en;q=0.9",
              "Sec-Fetch-Dest":
                "document",
              "Sec-Fetch-Mode":
                "navigate",
              "Sec-Fetch-Site":
                "none",
              "Sec-Fetch-User":
                "?1",
              "Upgrade-Insecure-Requests":
                "1"
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
        
        // Strip ALL HTML tags, spaces, punctuation, and newlines to create a pure alphabetic string.
        // This makes it 100% bulletproof against any formatting or hidden tags (e.g. <b>ro</b>bot).
        const pureText = html.replace(/<[^>]+>/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();

        const antiBotDetected =
          // 1. Cloudflare specific challenge URLs or IDs
          /\/cdn-cgi\/challenge-platform\//i.test(html) ||
          /id="(cf-wrapper|challenge-running|cf-please-wait)"/i.test(html) ||
          // 2. Common anti-bot page titles
          /<title>(Just a moment\.\.\.|Attention Required!.*|Security Challenge.*)<\/title>/i.test(html) ||
          // 3. Other Major WAF Signatures (Incapsula, PerimeterX, DataDome, AWS)
          /\/_Incapsula_Resource/i.test(html) ||
          /incap_sess_/i.test(html) ||
          /_pxCaptcha/i.test(html) ||
          /client\.perimeterx\.net/i.test(html) ||
          /captcha-delivery\.com/i.test(html) ||
          /aws-waf-captcha/i.test(html) ||
          // 4. Bulletproof pure-text phrase matching
          pureText.includes('checkingyourbrowserbeforeaccessing') ||
          pureText.includes('pleasecompletethesecuritychecktoaccess') ||
          pureText.includes('verifyyouareahuman') ||
          pureText.includes('verifyyouarehuman') ||
          pureText.includes('enablejavascriptandcookies') ||
          pureText.includes('completeacaptcha') ||
          pureText.includes('systemthinksyoumightbearobot') ||
          pureText.includes('retypethecaptchacode') ||
          pureText.includes('proveyoureahuman') ||
          pureText.includes('pleasetypeintherequiredcaptcha') ||
          pureText.includes('enteringtheletters') ||
          pureText.includes('entertheletters') ||
          pureText.includes('typecharacters') ||
          pureText.includes('enterthecharacters') ||
          pureText.includes('entertheword') ||
          pureText.includes('fillthecaptcha') ||
          pureText.includes('verifythecaptcha') ||
          // 5. Broad word combos (if it mentions captcha AND robot/human)
          (/captcha/i.test(html) && /robot|human|security check/i.test(html)) ||
          // 6. Any explicit HTTP block status (if proxy is blocked, fallback to screenshot)
          response.status === 403 || 
          response.status === 429 ||
          response.status === 401 ||
          response.status === 503 ||
          response.status === 202;

        if (antiBotDetected) {
          // --- CLEAN 3-STEP ARCHITECTURE: CLOUDFLARE LIVE -> FIRECRAWL FULLPAGE (CACHED) -> PREVIEW PROTECTED ---
          const firecrawlApiKey = (env && env.FIRECRAWL_API_KEY) || "fc-cad8b1c85f79450b999018184285a75d";
          let screenshotUrl = null;

          // Step 2A: Check Global Cloudflare KV first (if bound in worker settings)
          if (env && env.SCREENSHOT_KV) {
            try {
              screenshotUrl = await env.SCREENSHOT_KV.get(parsedTarget.origin);
              if (screenshotUrl) {
                console.log("[Worker] Served Firecrawl fullpage screenshot from Cloudflare KV (0 credits used!)");
              }
            } catch (kvReadErr) {
              console.warn("[Worker] KV read error/quota:", kvReadErr.message);
            }
          }

          // Step 2B: Check Cloudflare Edge Cache (caches.default) if not found in KV
          const cache = caches.default;
          const cacheKey = new Request(`https://cached-screenshot.internal/${encodeURIComponent(parsedTarget.origin)}`, { method: "GET" });
          
          if (!screenshotUrl) {
            try {
              const cachedMatch = await cache.match(cacheKey);
              if (cachedMatch) {
                const cachedData = await cachedMatch.json();
                if (cachedData && cachedData.screenshotUrl) {
                  screenshotUrl = cachedData.screenshotUrl;
                  console.log("[Worker] Served Firecrawl fullpage screenshot from Cloudflare Edge Cache (0 credits used!)");
                }
              }
            } catch (cacheErr) {
              console.warn("[Worker] Cache read error:", cacheErr.message);
            }
          }

          // Step 2C: If not cached anywhere, call Firecrawl API for fullPage screenshot
          if (!screenshotUrl && firecrawlApiKey) {
            try {
              const fcController = new AbortController();
              const fcTimeout = setTimeout(() => fcController.abort(), 15000); // 15s timeout for fullPage

              const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${firecrawlApiKey}`
                },
                body: JSON.stringify({
                  url: parsedTarget.href,
                  formats: ["screenshot@fullPage"],
                  waitFor: 2000,
                  mobile: true
                }),
                signal: fcController.signal
              });
              clearTimeout(fcTimeout);

              if (fcResponse.ok) {
                const fcData = await fcResponse.json();
                if (fcData && fcData.data && fcData.data.screenshot) {
                  screenshotUrl = fcData.data.screenshot;
                  console.log("[Worker] Fetched fresh fullPage screenshot from Firecrawl API");

                  // 1. Save to Global KV (7-day persistence, auto-expires)
                  if (env && env.SCREENSHOT_KV) {
                    try {
                      await env.SCREENSHOT_KV.put(parsedTarget.origin, screenshotUrl, {
                        expirationTtl: 86400 * 7 // 7 days in seconds
                      });
                    } catch (kvWriteErr) {
                      console.warn("[Worker] KV write error/quota reached:", kvWriteErr.message);
                    }
                  }

                  // 2. Also save to Cloudflare Edge Cache (24-hour backup)
                  try {
                    const cacheResponse = new Response(JSON.stringify({ screenshotUrl }), {
                      headers: {
                        "Content-Type": "application/json",
                        "Cache-Control": "public, max-age=86400, s-maxage=86400"
                      }
                    });
                    await cache.put(cacheKey, cacheResponse);
                  } catch (putErr) {
                    console.warn("[Worker] Edge cache write error:", putErr.message);
                  }
                }
              } else {
                console.warn(`[Worker] Firecrawl returned status ${fcResponse.status} (Credits exhausted or API error). Falling back to Preview Protected screen.`);
              }
            } catch (fcErr) {
              console.warn("[Worker] Firecrawl fetch error/timeout:", fcErr.message);
            }
          }

          const hasScreenshot = Boolean(screenshotUrl);

          return new Response(
            `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <title>Preview</title>
              <style>
                * { box-sizing: border-box; }
                html, body {
                  margin: 0; padding: 0;
                  width: 100%; min-height: 100%;
                  background: #0f1117;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #e2e8f0;
                  overflow-x: hidden;
                  overflow-y: auto;
                  -webkit-overflow-scrolling: touch;
                }
                .website-preview-wrap {
                  width: 100%;
                  min-height: 100vh;
                  position: relative;
                  background: #ffffff;
                }
                .screenshot-img {
                  display: block;
                  width: 100%;
                  height: auto;
                  min-height: 480px;
                  background: #f8fafc;
                }
                
                /* Sleek Branded Notice Screen when screenshots fail, are blocked, or credits are exhausted */
                .security-notice-container {
                  display: none;
                  min-height: 100vh;
                  background: linear-gradient(180deg, #0b0f19 0%, #151d2f 100%);
                  padding: 48px 24px 120px 24px;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  text-align: center;
                }
                .security-notice-container.active {
                  display: flex;
                }
                .security-badge-icon {
                  width: 64px;
                  height: 64px;
                  border-radius: 50%;
                  background: rgba(59, 130, 246, 0.12);
                  border: 1px solid rgba(59, 130, 246, 0.35);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 24px;
                  box-shadow: 0 0 32px rgba(59, 130, 246, 0.2);
                }
                .security-badge-icon svg {
                  width: 32px;
                  height: 32px;
                  stroke: #60a5fa;
                }
                .security-title {
                  font-size: 20px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0 0 12px 0;
                  letter-spacing: -0.02em;
                }
                .security-site-pill {
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  padding: 4px 12px;
                  border-radius: 999px;
                  background: rgba(255, 255, 255, 0.08);
                  border: 1px solid rgba(255, 255, 255, 0.12);
                  font-size: 13px;
                  color: #94a3b8;
                  margin-bottom: 20px;
                  word-break: break-all;
                }
                .security-desc {
                  font-size: 14px;
                  line-height: 1.6;
                  color: #94a3b8;
                  max-width: 310px;
                  margin: 0 0 28px 0;
                }
                .security-card-highlight {
                  width: 100%;
                  max-width: 320px;
                  background: rgba(16, 185, 129, 0.08);
                  border: 1px solid rgba(16, 185, 129, 0.25);
                  border-radius: 12px;
                  padding: 16px;
                  text-align: left;
                  margin-bottom: 20px;
                }
                .highlight-header {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 13px;
                  font-weight: 600;
                  color: #34d399;
                  margin-bottom: 6px;
                }
                .highlight-body {
                  font-size: 12px;
                  line-height: 1.5;
                  color: #cbd5e1;
                }
                .interaction-hint {
                  font-size: 12px;
                  color: #64748b;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                }
              </style>
            </head>
            <body>
              <div class="website-preview-wrap" id="previewWrap" style="${hasScreenshot ? '' : 'display: none;'}">
                ${hasScreenshot ? `<img id="screenshotTarget" class="screenshot-img" src="${screenshotUrl}" alt="Website preview" onerror="handleScreenshotError(this)" />` : ''}
              </div>

              <!-- Sleek Reassuring Fallback Screen -->
              <div id="securityNotice" class="security-notice-container ${hasScreenshot ? '' : 'active'}" style="${hasScreenshot ? 'display: none;' : 'display: flex;'}">
                <div class="security-badge-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                
                <h2 class="security-title">Preview Protected</h2>
                <div class="security-site-pill">
                  <span>🔒</span>
                  <span>${parsedTarget.hostname}</span>
                </div>

                <p class="security-desc">
                  This website has strict anti-bot and iframe security protocols active. Live embedding was securely isolated.
                </p>

                <div class="security-card-highlight">
                  <div class="highlight-header">
                    <span>✓</span>
                    <span>AI Employee Ready</span>
                  </div>
                  <div class="highlight-body">
                    Your AI Agent has successfully ingested your business knowledge. Test conversations and booking workflows directly in the widget below.
                  </div>
                </div>

                <div class="interaction-hint">
                  <span>👇</span>
                  <span>Tap the chat bubble to begin</span>
                </div>
              </div>

              <script>
                function handleScreenshotError(img) {
                  const wrap = document.getElementById('previewWrap');
                  const notice = document.getElementById('securityNotice');
                  if (wrap) wrap.style.display = 'none';
                  if (notice) {
                    notice.classList.add('active');
                    notice.style.display = 'flex';
                  }
                }

                // Force the GHL widget to render in mobile mode
                Object.defineProperty(navigator, 'userAgent', {
                  get: function () {
                    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
                  }
                });

                // Cross-origin iframe GHL Autofill
                (function() {
                  const firstName = "${url.searchParams.get('first_name') || ''}";
                  const email = "${url.searchParams.get('email') || ''}";
                  const phone = "${url.searchParams.get('phone') || ''}";
                  const company = "${url.searchParams.get('company') || ''}";
                  if (!firstName && !email && !phone && !company) return;

                  let attempts = 0;
                  const autofillInterval = setInterval(() => {
                    attempts++;
                    
                    function findAllInputsDeep(node, found = []) {
                      if (!node) return found;
                      if (node.tagName === 'INPUT') found.push(node);
                      if (node.shadowRoot) findAllInputsDeep(node.shadowRoot, found);
                      let child = node.firstChild;
                      while (child) {
                        findAllInputsDeep(child, found);
                        child = child.nextSibling;
                      }
                      return found;
                    }
                    
                    const allDeepInputs = findAllInputsDeep(document);
                    
                    // ONLY look at inputs that belong to the GHL widget to avoid accidentally filling client website forms!
                    const ghlInputs = allDeepInputs.filter(i => {
                      const c = i.className || '';
                      const id = i.id || '';
                      return (typeof c === 'string' && c.includes('lc_text-widget')) || (typeof id === 'string' && id.includes('msgsndr'));
                    });
                    
                    let filled = false;
                    const nameInput = ghlInputs.find(i => i.name === 'name' || i.id === 'msgsndr_1');
                    const emailInput = ghlInputs.find(i => i.name === 'email' || i.id === 'msgsndr_3');
                    const phoneInput = ghlInputs.find(i => i.type === 'tel' || i.name === 'phone' || i.id === 'msgsndr_2');
                    const companyInput = ghlInputs.find(i => {
                      const n = (i.name || '').toLowerCase();
                      const id = (i.id || '').toLowerCase();
                      const p = (i.placeholder || '').toLowerCase();
                      const a = (i.getAttribute('aria-label') || '').toLowerCase();
                      return n.includes('company') || id.includes('company') || p.includes('company') || a.includes('company');
                    });
                    
                    const setReactValue = (input, value) => {
                      if (!input || !value) return;
                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                      if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(input, value);
                      } else {
                        input.value = value;
                      }
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                    };

                    if (nameInput && firstName && !nameInput.value) { setReactValue(nameInput, firstName); filled = true; }
                    if (emailInput && email && !emailInput.value) { setReactValue(emailInput, email); filled = true; }
                    if (phoneInput && phone && !phoneInput.value) { setReactValue(phoneInput, phone); filled = true; }
                    if (companyInput && company && !companyInput.value) { setReactValue(companyInput, company); filled = true; }

                    if (attempts > 7200) clearInterval(autofillInterval);
                  }, 500);
                })();
              </script>
              <script
                src="https://widgets.leadconnectorhq.com/loader.js"
                data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
                data-widget-id="6aaccce19d58142ef9ac2d87">
              </script>
            </body>
            </html>
            `,
            {
              status: 200,
              headers: {
                "Content-Type": "text/html; charset=UTF-8",
                "Cache-Control": "public, max-age=3600",
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

        const firstName = url.searchParams.get('first_name') || '';
        const email = url.searchParams.get('email') || '';
        const phone = url.searchParams.get('phone') || '';
        const company = url.searchParams.get('company') || '';

        const ghlScript = `
<script>
  // Force the GHL widget to render in mobile mode by overriding the User Agent
  Object.defineProperty(navigator, 'userAgent', {
    get: function () {
      return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
    }
  });

  // Cross-origin iframe GHL Autofill
  (function() {
    const firstName = "${firstName}";
    const email = "${email}";
    const phone = "${phone}";
    const company = "${company}";
    if (!firstName && !email && !phone && !company) return;

    let attempts = 0;
    const autofillInterval = setInterval(() => {
      attempts++;
      
      function findAllInputsDeep(node, found = []) {
        if (!node) return found;
        if (node.tagName === 'INPUT') found.push(node);
        if (node.shadowRoot) findAllInputsDeep(node.shadowRoot, found);
        let child = node.firstChild;
        while (child) {
          findAllInputsDeep(child, found);
          child = child.nextSibling;
        }
        return found;
      }
      
      const allDeepInputs = findAllInputsDeep(document);
      
      // ONLY look at inputs that belong to the GHL widget to avoid accidentally filling client website forms!
      const ghlInputs = allDeepInputs.filter(i => {
        const c = i.className || '';
        const id = i.id || '';
        return (typeof c === 'string' && c.includes('lc_text-widget')) || (typeof id === 'string' && id.includes('msgsndr'));
      });
      
      let filled = false;
      const nameInput = ghlInputs.find(i => i.name === 'name' || i.id === 'msgsndr_1');
      const emailInput = ghlInputs.find(i => i.name === 'email' || i.id === 'msgsndr_3');
      const phoneInput = ghlInputs.find(i => i.type === 'tel' || i.name === 'phone' || i.id === 'msgsndr_2');
      const companyInput = ghlInputs.find(i => {
        const n = (i.name || '').toLowerCase();
        const id = (i.id || '').toLowerCase();
        const p = (i.placeholder || '').toLowerCase();
        const a = (i.getAttribute('aria-label') || '').toLowerCase();
        return n.includes('company') || id.includes('company') || p.includes('company') || a.includes('company');
      });
      
      const setReactValue = (input, value) => {
        if (!input || !value) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      if (nameInput && firstName && !nameInput.value) { setReactValue(nameInput, firstName); filled = true; }
      if (emailInput && email && !emailInput.value) { setReactValue(emailInput, email); filled = true; }
      if (phoneInput && phone && !phoneInput.value) { setReactValue(phoneInput, phone); filled = true; }
      if (companyInput && company && !companyInput.value) { setReactValue(companyInput, company); filled = true; }

      if (attempts > 7200) clearInterval(autofillInterval);
    }, 500);
  })();
</script>
<script
  src="https://widgets.leadconnectorhq.com/loader.js"
  data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
  data-widget-id="6aaccce19d58142ef9ac2d87"
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