export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // ============================================================
    // CORS HEADERS
    // ============================================================

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };


    // ============================================================
    // HANDLE CORS PREFLIGHT REQUEST
    // ============================================================

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });

    }


    // ============================================================
    // CRAWL STATUS ENDPOINT
    // ============================================================

    if (url.pathname === "/crawl-status") {

      const locationId =
        url.searchParams.get("locationId");

      const knowledgeBaseId =
        url.searchParams.get("knowledgeBaseId");

      const operationId =
        url.searchParams.get("operationId");


      // ----------------------------------------------------------
      // Validate location ID
      // ----------------------------------------------------------

      if (!locationId) {

        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing locationId"
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      }


      // ----------------------------------------------------------
      // Validate knowledge base ID
      // ----------------------------------------------------------

      if (!knowledgeBaseId) {

        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing knowledgeBaseId"
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      }


      // ----------------------------------------------------------
      // Check HighLevel token
      // ----------------------------------------------------------

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
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      }


      try {

        // ========================================================
        // HIGHLEVEL STATUS URL
        // ========================================================

        const ghlUrl = new URL(
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


        console.log(
          "Calling HighLevel:",
          ghlUrl.toString()
        );


        // ========================================================
        // CALL HIGHLEVEL
        // ========================================================

        const response = await fetch(
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


        console.log(
          "HighLevel status:",
          response.status
        );


        console.log(
          "HighLevel response:",
          text
        );


        // ========================================================
        // HIGHLEVEL ERROR
        // ========================================================

        if (!response.ok) {

          return new Response(
            JSON.stringify({
              success: false,
              error: "HighLevel API error",
              statusCode: response.status,
              details: text
            }),
            {
              status: response.status,

              headers: {
                "Content-Type":
                  "application/json",

                ...corsHeaders
              }
            }
          );

        }


        // ========================================================
        // PARSE RESPONSE
        // ========================================================

        let data;

        try {

          data = JSON.parse(text);

        }
        catch (error) {

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "HighLevel returned invalid JSON",
              raw: text
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


        // ========================================================
        // SUCCESS RESPONSE
        // ========================================================

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


    // ============================================================
    // MOBILE WEBSITE PROXY
    // ============================================================

    const targetUrl =
      url.searchParams.get("url");


    if (!targetUrl) {

      return new Response(
        "Missing URL parameter",
        {
          status: 400
        }
      );

    }


    try {

      // ----------------------------------------------------------
      // Fetch target website as iPhone Safari
      // ----------------------------------------------------------

      const response =
        await fetch(
          targetUrl,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            }
          }
        );


      // ----------------------------------------------------------
      // Copy response headers
      // ----------------------------------------------------------

      const newHeaders =
        new Headers(
          response.headers
        );


      // Remove framing restrictions

      newHeaders.delete(
        "x-frame-options"
      );

      newHeaders.delete(
        "content-security-policy"
      );


      // Enable CORS

      newHeaders.set(
        "Access-Control-Allow-Origin",
        "*"
      );


      const contentType =
        response.headers.get(
          "content-type"
        ) || "";


      // ----------------------------------------------------------
      // HTML PROCESSING
      // ----------------------------------------------------------

      if (
  contentType.includes(
    "text/html"
  )
) {
  let html =
    await response.text();

  const originUrl =
    new URL(
      targetUrl
    ).origin;

  // ============================================================
  // FORCE MOBILE PAGE SCROLLING
  // ============================================================

  const scrollFix = `
    <style id="cloudflare-mobile-scroll-fix">
      html {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        height: auto !important;
        min-height: 100% !important;
      }

      body {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        height: auto !important;
        min-height: 100% !important;
        position: relative !important;
        -webkit-overflow-scrolling: touch !important;
      }

      #SITE_CONTAINER,
      #site-root,
      [data-mesh-id],
      [data-testid="site-root"] {
        max-height: none !important;
        overflow: visible !important;
      }
    </style>
  `;

  // Add base URL + scrolling fix
  if (/<head[^>]*>/i.test(html)) {

    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1>
        <base href="${originUrl}/">
        ${scrollFix}
      `
    );

  } else {

    html =
      scrollFix +
      html;

  }

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


      // ----------------------------------------------------------
      // STATIC ASSETS
      // ----------------------------------------------------------

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
          status: 500
        }
      );

    }

  }
};