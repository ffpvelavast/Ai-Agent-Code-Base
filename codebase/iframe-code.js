<div id="custom-code-UrUj96vP59__custom-code" class="custom-code-container ccustom-code-UrUj96vP59">

  <div class="device-showcase-wrapper">

    <!-- Realistic Mobile Phone Frame -->
    <div class="mobile-phone-frame">

      <!-- Screen Viewport -->
      <div class="phone-screen">

        <div class="phone-viewport-container">

          <!-- Proxied Mobile Viewport Iframe -->
          <iframe
            id="ghl-dynamic-iframe"
            title="Live Mobile Demo"
            loading="eager"
            allowfullscreen>
          </iframe>

        </div>

        <!-- GHL Agent Widget -->
        <div id="agent-widget-loader"></div>

      </div>

      <!-- Home Bar -->
      <div class="phone-home-bar"></div>

    </div>

  </div>

</div>


<script>
(function () {

  /* ============================================================
     CONFIGURATION
     ============================================================ */

  const WORKER_PROXY_URL =
    "https://mobile-iframe-proxy.ffp-digimarketing.workers.dev/?url=";

  const DEFAULT_WEBSITE =
    "https://stripe.com";

  const AGENT_WIDGET_ID =
    "6a8c69110916f988385fa4de";


  /* ============================================================
     CLEAN / VALIDATE WEBSITE URL
     ============================================================ */

  function cleanUrl(url) {

    if (!url) return null;

    let cleaned = url
      .trim()
      .replace(/["']/g, "");

    if (
      !cleaned.startsWith("http://") &&
      !cleaned.startsWith("https://")
    ) {
      cleaned = "https://" + cleaned;
    }

    try {

      const parsed = new URL(cleaned);

      return parsed.href;

    } catch (e) {

      console.error("Invalid website URL:", url);

      return null;

    }

  }


  /* ============================================================
     GET SUBMITTED WEBSITE
     ============================================================ */

  function getSubmittedWebsite() {

    const fullSearch =
      decodeURIComponent(window.location.search);

    const urlParams =
      new URLSearchParams(window.location.search);


    let target =
      urlParams.get("website") ||
      urlParams.get("company_website") ||
      urlParams.get("contact.website") ||
      urlParams.get("url");


    /* ------------------------------------------------------------
       FALLBACK: SEARCH URL STRING
       ------------------------------------------------------------ */

    if (!target && window.location.search) {

      const matches =
        fullSearch.match(
          /(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s&]*)?/gi
        );


      if (matches && matches.length > 0) {

        const filtered =
          matches.filter(function (u) {

            return (
              !u.includes("leadconnectorhq.com") &&
              !u.includes("gohighlevel") &&
              !u.includes("services.leadconnectorhq")
            );

          });


        if (filtered.length > 0) {

          target = filtered[0];

        }

      }

    }


    /* ------------------------------------------------------------
       SAVE VALID WEBSITE
       ------------------------------------------------------------ */

    if (target) {

      const validated =
        cleanUrl(target);

      const usercompany =
        urlParams.get("company");


      if (validated) {

        sessionStorage.setItem(
          "user_submitted_website",
          validated
        );

        if (usercompany) {

          sessionStorage.setItem(
            "user_submitted_company",
            usercompany
          );

        }

        return validated;

      }

    }


    /* ------------------------------------------------------------
       USE PREVIOUSLY STORED WEBSITE
       ------------------------------------------------------------ */

    const storedTarget =
      sessionStorage.getItem(
        "user_submitted_website"
      );


    if (storedTarget) {

      return storedTarget;

    }


    return DEFAULT_WEBSITE;

  }


  /* ============================================================
     LOAD WEBSITE INTO MOBILE PHONE
     ============================================================ */

  function updatePhoneIframe() {

    const iframe =
      document.getElementById(
        "ghl-dynamic-iframe"
      );


    const rawUrl =
      getSubmittedWebsite();


    const cleanTarget =
      cleanUrl(rawUrl) ||
      DEFAULT_WEBSITE;


    if (!iframe) {

      console.error(
        "Mobile website iframe not found"
      );

      return;

    }


    const finalProxiedUrl =
      WORKER_PROXY_URL +
      encodeURIComponent(cleanTarget);


    if (iframe.src !== finalProxiedUrl) {

      console.log(
        "Loading target website into proxy:",
        cleanTarget
      );


      iframe.src =
        finalProxiedUrl;

    }

  }


  /* ============================================================
     NOTIFY PROGRESS BAR THAT WIDGET IS READY
     ============================================================ */

  function notifyWidgetReady() {

    if (window.__agentWidgetReady) {

      return;

    }


    window.__agentWidgetReady = true;


    console.log(
      "======================================"
    );

    console.log(
      "GHL AGENT WIDGET IS READY"
    );

    console.log(
      "Sending completion event..."
    );

    console.log(
      "======================================"
    );


    /*
       Send a custom event that the progress-bar
       code can listen for.
    */

    window.dispatchEvent(
      new CustomEvent(
        "agent-widget-ready"
      )
    );


    /*
       Also store the state globally.
       This helps if the progress-bar script
       loads after this script.
    */

    window.agentWidgetReady = true;

  }


  /* ============================================================
     WATCH FOR GHL CHAT WIDGET
     ============================================================ */

  function watchForWidget() {

    console.log(
      "Watching for GHL chat widget..."
    );


    let attempts = 0;

    const maxAttempts = 120;


    const widgetWatcher =
      setInterval(function () {

        attempts++;


        /*
           GHL normally creates a custom
           <chat-widget> element.
        */

        const chatWidget =
          document.querySelector(
            "chat-widget"
          );


        /*
           Also check inside the agent
           loader container.
        */

        const loader =
          document.getElementById(
            "agent-widget-loader"
          );


        const widgetInsideLoader =
          loader
            ? loader.querySelector(
                "chat-widget"
              )
            : null;


        if (
          chatWidget ||
          widgetInsideLoader
        ) {

          clearInterval(
            widgetWatcher
          );


          console.log(
            "GHL chat-widget detected."
          );


          /*
             Give the widget a small amount
             of time to finish rendering.
          */

          setTimeout(
            function () {

              notifyWidgetReady();

            },
            800
          );


          return;

        }


        /*
           Stop checking after approximately
           2 minutes.
        */

        if (attempts >= maxAttempts) {

          clearInterval(
            widgetWatcher
          );


          console.error(
            "GHL widget was not detected within 2 minutes."
          );


          /*
             IMPORTANT:
             We do NOT mark the widget as ready
             here because we don't want the progress
             bar to falsely reach 100%.
          */

        }

      }, 1000);

  }


  /* ============================================================
     LOAD GHL AGENT WIDGET
     ============================================================ */

  function loadAgentWidget() {

    if (window.agentWidgetLoaded) {

      console.log(
        "Agent widget already loaded."
      );

      watchForWidget();

      return;

    }


    const loaderContainer =
      document.getElementById(
        "agent-widget-loader"
      );


    if (!loaderContainer) {

      console.error(
        "Agent widget container not found."
      );

      return;

    }


    console.log(
      "Starting GHL Agent Widget..."
    );


    window.agentWidgetLoaded = true;


    const script =
      document.createElement("script");


    script.src =
      "https://widgets.leadconnectorhq.com/loader.js";


    script.setAttribute(
      "data-resources-url",
      "https://widgets.leadconnectorhq.com/chat-widget/loader.js"
    );


    script.setAttribute(
      "data-widget-id",
      AGENT_WIDGET_ID
    );


    script.onload =
      function () {

        console.log(
          "GHL Agent loader script loaded."
        );


        /*
           The loader script itself being loaded
           does NOT mean the widget is ready.

           Therefore we start watching for
           <chat-widget>.
        */

        watchForWidget();

      };


    script.onerror =
      function () {

        console.error(
          "Failed to load GHL Agent Widget."
        );


        window.agentWidgetLoaded =
          false;

      };


    loaderContainer.appendChild(
      script
    );

  }


  /* ============================================================
     INITIALIZE EVERYTHING
     ============================================================ */

  function initialize() {

    console.log(
      "Initializing mobile website + AI agent..."
    );


    /*
       1. Load submitted website immediately
    */

    updatePhoneIframe();


    /*
       2. Start GHL widget immediately.

       NO 15 SECOND DELAY.
    */

    loadAgentWidget();

  }


  /* ============================================================
     DOM READY
     ============================================================ */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  } else {

    initialize();

  }


})();
</script>


<style>

/* ==============================================================
   PHONE SCREEN
   ============================================================== */

.phone-screen {

  position: relative !important;

  width: 100% !important;

  height: 100% !important;

  background-color: #FFFFFF !important;

  border-radius: 36px !important;

  overflow: hidden !important;

}


/* ==============================================================
   GHL CHAT WIDGET
   ============================================================== */

.phone-screen chat-widget {

  position: absolute !important;

  inset: 0 !important;

  width: 100% !important;

  height: 100% !important;

  display: block !important;

  z-index: 999 !important;

  transform: translateZ(0) !important;

  overflow: hidden !important;

}


/* ==============================================================
   MOBILE WEBSITE VIEWPORT
   ============================================================== */

.phone-viewport-container {

  width: 100% !important;

  height: 100% !important;

  overflow: auto !important;

  -webkit-overflow-scrolling: touch !important;

  transform-origin: top center !important;
}


/* ==============================================================
   WEBSITE IFRAME
   ============================================================== */

.phone-viewport-container iframe {

 width: 100% !important;

  height: 100% !important;

  min-height: 100% !important;

  border: none !important;

  display: block !important;

  overflow: auto !important;

  -webkit-overflow-scrolling: touch !important;

}


/* ==============================================================
   PHONE MOCKUP
   ============================================================== */

.device-showcase-wrapper {

  display: flex !important;

  justify-content: center !important;

  align-items: center !important;

  padding: 20px 0 !important;

  width: 100% !important;

}


.mobile-phone-frame {

  position: relative !important;

  width: 400px !important;

  height: 690px !important;

  background: #0B0F17 !important;

  border-radius: 48px !important;

  padding: 10px !important;

  border: 4px solid #334155 !important;

  box-shadow:

    0 25px 50px -12px rgba(0, 0, 0, 0.7),

    0 0 30px rgba(56, 189, 248, 0.2),

    inset 0 0 10px rgba(255, 255, 255, 0.1) !important;

  box-sizing: border-box !important;

  margin: 0 auto !important;

}


/* ==============================================================
   HOME BAR
   ============================================================== */

.phone-home-bar {

  position: absolute !important;

  bottom: 20px !important;

  left: 50% !important;

  transform: translateX(-50%) !important;

  width: 120px !important;

  height: 4px !important;

  background-color: rgba(255, 255, 255, 0.6) !important;

  border-radius: 100px !important;

  z-index: 1000 !important;

}


/* ==============================================================
   SMALL SCREENS
   ============================================================== */

@media (max-width: 480px) {

  .mobile-phone-frame {

    width: 290px !important;

    height: 580px !important;

    border-radius: 40px !important;

  }


  .phone-viewport-container {

  overflow: auto !important;

  -webkit-overflow-scrolling: touch !important;

  }

}

</style>