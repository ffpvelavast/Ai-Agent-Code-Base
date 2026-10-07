<div id="custom-code-UrUj96vP59__custom-code"
     class="custom-code-container ccustom-code-UrUj96vP59">

  <div class="device-showcase-wrapper">

    <div class="mobile-phone-frame">

      <div
        class="phone-screen"
        id="phone-screen-container"
      >

        <!-- =====================================================
             WEBSITE
             ===================================================== -->

        <div class="phone-viewport-container">

          <!-- Loading Overlay -->
          <div id="ghl-iframe-loader" class="ghl-loader-overlay">
            <div class="ghl-modern-spinner">
              <div></div><div></div><div></div><div></div>
            </div>
          </div>

          <iframe
            id="ghl-dynamic-iframe"
            title="Live Mobile Demo"
            loading="eager"
            scrolling="yes"
            allow="microphone *; camera *; display-capture *"
            allowfullscreen>
          </iframe>

        </div>


        <!-- =====================================================
             GHL AGENT WIDGET LOADER

             The widget is loaded by GHL page itself.
             It is NOT injected by Cloudflare.
             ===================================================== -->

        <div id="agent-widget-loader"></div>

      </div>


      <!-- Phone Home Bar -->

      <div class="phone-home-bar"></div>

    </div>

  </div>

</div>


<script>

(function () {

  /* ============================================================
     SEAMLESS AI CONTEXT INJECTOR (Fetch Interceptor)
     ============================================================ */
  const originalFetch = window.fetch;
  let contextInjected = false;
  let cachedTarget = null;
  let cachedCompany = null;
  
  window.fetch = async function(resource, options) {
    let url = '';
    if (typeof resource === 'string') url = resource;
    else if (resource && resource.url) url = resource.url;

    // Broadened to catch any GoHighLevel/LeadConnector message endpoints
    if (options && options.body && !contextInjected) {
      try {
        if (!cachedTarget) {
          const urlParams = new URLSearchParams(window.location.search);
          cachedTarget = urlParams.get("website") || urlParams.get("company_website") || urlParams.get("contact.website") || urlParams.get("url") || localStorage.getItem("user_submitted_website") || sessionStorage.getItem("user_submitted_website");
          cachedCompany = urlParams.get("company_name") || urlParams.get("company") || urlParams.get("first_name");
        }
        if (cachedTarget && typeof options.body === 'string') {
          let bodyObj = JSON.parse(options.body);
          // Only intercept if it's actually sending a chat message
          if (bodyObj.message !== undefined && (url.includes('leadconnector') || url.includes('chat-widget') || url.includes('msgsndr'))) {
            let injectNote = `\n\n[System Note: The user's website is ${cachedTarget}.`;
            if (cachedCompany) injectNote += ` The company name is ${cachedCompany}.`;
            injectNote += `]`;
            bodyObj.message = bodyObj.message + injectNote;
            options.body = JSON.stringify(bodyObj);
            contextInjected = true;
          }
        }
      } catch(e) {
        // Ignore JSON parse errors for non-JSON bodies
      }
    }
    return originalFetch.apply(this, arguments);
  };

  /* ============================================================
     SEAMLESS AI CONTEXT INJECTOR (XHR Interceptor)
     ============================================================ */
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    return originalXhrOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    if (body && typeof body === 'string' && !contextInjected) {
      try {
        if (!cachedTarget) {
          const urlParams = new URLSearchParams(window.location.search);
          cachedTarget = urlParams.get("website") || urlParams.get("company_website") || urlParams.get("contact.website") || urlParams.get("url") || localStorage.getItem("user_submitted_website") || sessionStorage.getItem("user_submitted_website");
          cachedCompany = urlParams.get("company_name") || urlParams.get("company") || urlParams.get("first_name");
        }
        if (cachedTarget) {
          let parsedBody = JSON.parse(body);
          if (parsedBody.message !== undefined && (this._url.includes('leadconnector') || this._url.includes('chat-widget') || this._url.includes('msgsndr'))) {
            let injectNote = `\n\n[System Note: The user's website is ${cachedTarget}.`;
            if (cachedCompany) injectNote += ` The company name is ${cachedCompany}.`;
            injectNote += `]`;
            parsedBody.message = parsedBody.message + injectNote;
            body = JSON.stringify(parsedBody);
            contextInjected = true;
          }
        }
      } catch(e) {
        // Ignore parsing errors
      }
    }
    return originalXhrSend.call(this, body);
  };

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
     CLEAN URL
     ============================================================ */

  function cleanUrl(url) {

    if (!url) {
      return null;
    }

    let cleaned =
      url
        .trim()
        .replace(/["']/g, "");

    if (
      !cleaned.startsWith("http://") &&
      !cleaned.startsWith("https://")
    ) {

      cleaned =
        "https://" + cleaned;
    }

    try {

      return new URL(cleaned).href;

    } catch (error) {

      console.error(
        "Invalid website URL:",
        url
      );

      return null;
    }
  }


  /* ============================================================
     GET WEBSITE
     ============================================================ */

  function getSubmittedWebsite() {

    const urlParams =
      new URLSearchParams(
        window.location.search
      );

    let target =
      urlParams.get("website") ||
      urlParams.get("company_website") ||
      urlParams.get("contact.website") ||
      urlParams.get("url");


    /* ----------------------------------------------------------
       FALLBACK SEARCH
       ---------------------------------------------------------- */

    if (
      !target &&
      window.location.search
    ) {

      const fullSearch =
        decodeURIComponent(
          window.location.search
        );

      const matches =
        fullSearch.match(
          /(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s&]*)?/gi
        );


      if (
        matches &&
        matches.length
      ) {

        const filtered =
          matches.filter(
            function (u) {

              return (
                !u.includes(
                  "leadconnectorhq.com"
                ) &&
                !u.includes(
                  "gohighlevel"
                ) &&
                !u.includes(
                  "services.leadconnectorhq"
                )
              );

            }
          );


        if (filtered.length) {

          target =
            filtered[0];
        }
      }
    }


    /* ----------------------------------------------------------
       SAVE WEBSITE
       ---------------------------------------------------------- */

    if (target) {

      const validated =
        cleanUrl(target);

      if (validated) {

        sessionStorage.setItem(
          "user_submitted_website",
          validated
        );

        return validated;
      }
    }


    /* ----------------------------------------------------------
       PREVIOUS WEBSITE
       ---------------------------------------------------------- */

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
     LOAD WEBSITE
     ============================================================ */

  function updatePhoneIframe() {

    const iframe =
      document.getElementById(
        "ghl-dynamic-iframe"
      );

    const loader =
      document.getElementById(
        "ghl-iframe-loader"
      );

    if (!iframe) {

      console.error(
        "Iframe not found."
      );

      return;
    }

    if (loader) {
      loader.style.opacity = "1";
      loader.style.visibility = "visible";
    }

    iframe.onload = function() {
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(function() {
          loader.style.visibility = "hidden";
        }, 500);
      }
    };


    const target =
      cleanUrl(
        getSubmittedWebsite()
      ) ||
      DEFAULT_WEBSITE;


    const urlParams = new URLSearchParams(window.location.search);
    const firstName = urlParams.get('first_name') || urlParams.get('name') || '';
    const email = urlParams.get('email') || '';
    const phone = urlParams.get('phone') || '';
    const company = urlParams.get('company') || '';

    let proxyUrl =
      WORKER_PROXY_URL +
      encodeURIComponent(target);

    // Pass the parameters to the Cloudflare worker proxy so it can inject the autofill script inside the iframe!
    if (firstName || email || phone || company) {
        proxyUrl += `&first_name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&company=${encodeURIComponent(company)}`;
    }

    console.log(
      "Loading website:",
      target
    );


    iframe.src =
      proxyUrl;
  }


  /* ============================================================
     WIDGET READY EVENT
     ============================================================ */

  function notifyWidgetReady() {

    if (
      window.__agentWidgetReady
    ) {

      return;
    }


    window.__agentWidgetReady =
      true;


    window.agentWidgetReady =
      true;


    window.dispatchEvent(
      new CustomEvent(
        "agent-widget-ready"
      )
    );


    console.log(
      "GHL Agent Widget READY"
    );
  }


  /* ============================================================
     MOVE WIDGET INTO PHONE
     ============================================================ */

  function moveWidgetIntoPhone(
    chatWidget
  ) {

    if (!chatWidget) {
      return false;
    }


    const phoneScreen =
      document.getElementById(
        "phone-screen-container"
      );


    if (!phoneScreen) {
      return false;
    }


    /*
     * IMPORTANT
     *
     * The widget is created by the GHL loader.
     *
     * GHL normally places <chat-widget>
     * somewhere under the page body.
     *
     * We physically move that SAME widget
     * into the phone screen.
     */

    if (
      chatWidget.parentElement !==
      phoneScreen
    ) {

      phoneScreen.appendChild(
        chatWidget
      );


      console.log(
        "GHL widget moved INSIDE phone screen."
      );
    }


    autoFillChatWidgetForm(
      chatWidget
    );

    styleGhlWidget(
      chatWidget
    );

    injectShadowDomFix(
      chatWidget
    );

    return true;
  }

  /* ============================================================
     STYLE OUTER GHL WIDGET
     ============================================================ */

  function styleGhlWidget(
    chatWidget
  ) {

    if (!chatWidget) {
      return;
    }


    /*
     * The host must NOT cover the iframe.
     *
     * It is positioned at the bottom-right
     * and only occupies the widget's area.
     */

    chatWidget.style.setProperty(
      "position",
      "absolute",
      "important"
    );


    chatWidget.style.setProperty(
      "top",
      "auto",
      "important"
    );


    chatWidget.style.setProperty(
      "left",
      "auto",
      "important"
    );


    chatWidget.style.setProperty(
      "right",
      "12px",
      "important"
    );


    chatWidget.style.setProperty(
      "bottom",
      "12px",
      "important"
    );


    chatWidget.style.setProperty(
      "width",
      "auto",
      "important"
    );


    chatWidget.style.setProperty(
      "height",
      "auto",
      "important"
    );


    chatWidget.style.setProperty(
      "max-width",
      "calc(100% - 24px)",
      "important"
    );


    chatWidget.style.setProperty(
      "max-height",
      "calc(100% - 24px)",
      "important"
    );


    chatWidget.style.setProperty(
      "min-width",
      "0",
      "important"
    );


    chatWidget.style.setProperty(
      "min-height",
      "0",
      "important"
    );


    chatWidget.style.setProperty(
      "margin",
      "0",
      "important"
    );


    chatWidget.style.setProperty(
      "padding",
      "0",
      "important"
    );


    chatWidget.style.setProperty(
      "box-sizing",
      "border-box",
      "important"
    );


    /*
     * VERY IMPORTANT
     *
     * Widget must be clickable.
     */

    chatWidget.style.setProperty(
      "pointer-events",
      "auto",
      "important"
    );


    chatWidget.style.setProperty(
      "z-index",
      "999999",
      "important"
    );


    /*
     * Prevent the host itself from creating
     * an unwanted full-screen scrolling layer.
     */

    chatWidget.style.setProperty(
      "overflow",
      "visible",
      "important"
    );
  }


  /* ============================================================
     GHL SHADOW DOM FIX
     ============================================================ */

  function injectShadowDomFix(
    chatWidget
  ) {

    if (!chatWidget) {
      return;
    }


    function applyFix() {

      const shadow =
        chatWidget.shadowRoot;


      if (!shadow) {
        return;
      }


      let style =
        shadow.querySelector(
          "#ffp-ghl-phone-style"
        );


      if (!style) {

        style =
          document.createElement(
            "style"
          );

        style.id =
          "ffp-ghl-phone-style";

        shadow.appendChild(
          style
        );
      }


      style.textContent = `

        /* ======================================================
           GHL HOST
           ====================================================== */

        :host {

          position: absolute !important;

          top: auto !important;

          left: auto !important;

          right: 12px !important;

          bottom: 12px !important;

          width: auto !important;

          height: auto !important;

          max-width: calc(100% - 24px) !important;

          max-height: calc(100% - 24px) !important;

          min-width: 0 !important;

          min-height: 0 !important;

          margin: 0 !important;

          padding: 0 !important;

          box-sizing: border-box !important;

          pointer-events: auto !important;

          overflow: visible !important;

          z-index: 999999 !important;

        }


        /* ======================================================
           MAIN WIDGET
           ====================================================== */

        #lc_text-widget,
        .lc_text-widget {

          box-sizing: border-box !important;

          max-width: 100% !important;

          max-height: 100% !important;

        }


        /* ======================================================
           CHAT BOX
           ====================================================== */

        #lc_text-widget--box,
        .lc_text-widget--box {

          box-sizing: border-box !important;

          max-width: 100% !important;

          max-height: 100% !important;

          overflow-x: hidden !important;

          overflow-y: auto !important;

          -webkit-overflow-scrolling: touch !important;

          scrollbar-width: thin !important;

        }


        /* ======================================================
           IMAGES
           ====================================================== */

        img {

          max-width: 100% !important;

          height: auto !important;

          box-sizing: border-box !important;

        }


        /* ======================================================
           BUTTONS
           ====================================================== */

        ion-button {

          max-width: 100% !important;

          box-sizing: border-box !important;

        }


        /* ======================================================
           HEADER
           ====================================================== */

        .lc_text-widget--header-wrapper {

          max-width: 100% !important;

          box-sizing: border-box !important;

        }


        /* ======================================================
           VOICE CHAT
           ====================================================== */

        .lc_text-widget--voice-chat-container {

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow-x: hidden !important;

        }


        .lc_text-widget--voice-initial-screen {

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow-x: hidden !important;

        }


        .lc_text-widget--voice-active-screen {

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow-x: hidden !important;

        }


        .lc_text-widget--voice-agent-profile {

          max-width: 100% !important;

          box-sizing: border-box !important;

        }


        .lc_text-widget--voice-agent-info {

          min-width: 0 !important;

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow: hidden !important;

        }


        .lc_text-widget--voice-agent-name {

          min-width: 0 !important;

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow: hidden !important;

          text-overflow: ellipsis !important;

        }


        /* ======================================================
           BRANDING
           ====================================================== */

        .lc_text-widget--agency-branding {

          width: 100% !important;

          max-width: 100% !important;

          min-width: 0 !important;

          box-sizing: border-box !important;

          overflow: hidden !important;

        }


        .lc_text-widget--agency-branding-inner {

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow: hidden !important;

          text-overflow: ellipsis !important;

          white-space: nowrap !important;

        }


        .lc_text-widget--agency-branding a {

          display: block !important;

          max-width: 100% !important;

          box-sizing: border-box !important;

          overflow: hidden !important;

          text-overflow: ellipsis !important;

          white-space: nowrap !important;

        }

      `;
    }


    applyFix();


    /*
     * GHL may recreate shadow DOM elements.
     * Keep applying the style.
     */

    if (
      chatWidget.__ffpShadowInterval
    ) {

      clearInterval(
        chatWidget.__ffpShadowInterval
      );
    }


    chatWidget.__ffpShadowInterval =
      setInterval(
        applyFix,
        1000
      );
  }


  /* ============================================================
     WATCH FOR GHL WIDGET
     ============================================================ */

  function watchForWidget() {

    console.log(
      "Watching for GHL widget..."
    );


    let attempts = 0;

    const maxAttempts = 120;


    const watcher =
      setInterval(
        function () {

          attempts++;


          const chatWidget =
            document.querySelector(
              "chat-widget"
            );


          if (chatWidget) {

            const moved =
              moveWidgetIntoPhone(
                chatWidget
              );


            if (moved) {

              clearInterval(
                watcher
              );


              setTimeout(
                function () {

                  notifyWidgetReady();
                  autoFillGhlForm();

                },
                1000
              );


              return;
            }
          }


          if (
            attempts >= maxAttempts
          ) {

            clearInterval(
              watcher
            );


            console.error(
              "GHL widget was not detected."
            );
          }

        },
        500
      );
  }

  /* ============================================================
     AUTO-FILL GHL WIDGET FORM FROM URL PARAMS
     ============================================================ */
  function autoFillGhlForm() {
    console.log("AutoFill is now handled natively by the Cloudflare Worker proxy.");
  }


  /* ============================================================
     CONTINUOUSLY WATCH FOR WIDGET
     
     This handles cases where GHL recreates the widget.
     ============================================================ */

  function observeWidget() {

    const observer =
      new MutationObserver(
        function () {

          const chatWidget =
            document.querySelector(
              "chat-widget"
            );


          if (chatWidget) {

            moveWidgetIntoPhone(
              chatWidget
            );
          }

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }


  /* ============================================================
     LOAD GHL AGENT WIDGET
     ============================================================ */

  function loadAgentWidget() {

    if (
      window.agentWidgetLoaded
    ) {

      watchForWidget();

      return;
    }


    const loader =
      document.getElementById(
        "agent-widget-loader"
      );


    if (!loader) {

      console.error(
        "Widget loader container missing."
      );

      return;
    }

    /*
     * INTERCEPT APPEND CHILD
     * 
     * GHL uses document.body.appendChild to add the widget.
     * Moving the widget AFTER it is added breaks Turnstile.
     * So we intercept appendChild and redirect it to phoneScreen.
     */
    const originalAppendChild = document.body.appendChild;
    document.body.appendChild = function(node) {
      if (node && node.tagName === 'CHAT-WIDGET') {
        const phoneScreen = document.getElementById("phone-screen-container");
        if (phoneScreen) {
          // Add it directly to phoneScreen instead of body
          const result = phoneScreen.appendChild(node);
          
          // Style it immediately
          styleGhlWidget(node);
          injectShadowDomFix(node);
          
          // Restore original appendChild
          document.body.appendChild = originalAppendChild;
          
          return result;
        }
      }
      return originalAppendChild.call(this, node);
    };


    const script =
      document.createElement(
        "script"
      );


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
          "GHL loader loaded."
        );


        watchForWidget();

      };


    script.onerror =
      function () {

        console.error(
          "GHL loader failed."
        );


        window.agentWidgetLoaded =
          false;
      };


    loader.appendChild(
      script
    );

    window.agentWidgetLoaded =
      true;
  }


  /* ============================================================
     INITIALIZE
     ============================================================ */

  function initialize() {

    console.log(
      "Initializing phone..."
    );


    updatePhoneIframe();
    autoFillGhlForm();

  }


  /* ============================================================
     DOM READY
     ============================================================ */

  if (
    document.readyState ===
    "loading"
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
   OUTER WRAPPER
   ============================================================== */

.device-showcase-wrapper {

  display: flex !important;

  justify-content: center !important;

  align-items: center !important;

  width: 100% !important;

  padding: 20px 0 !important;

  box-sizing: border-box !important;

}


/* ==============================================================
   PHONE
   ============================================================== */

.mobile-phone-frame {

  position: relative !important;

  width: 375px !important;

  height: 680px !important;

  padding: 12px !important;

  margin: 0 auto !important;

  box-sizing: border-box !important;

  display: block !important;

  background: #0B0F17 !important;

  border: 4px solid #334155 !important;

  border-radius: 44px !important;

  box-shadow:
    0 25px 50px -12px rgba(0,0,0,.7),
    0 0 30px rgba(56,189,248,.2),
    inset 0 0 10px rgba(255,255,255,.1) !important;

  overflow: hidden !important;

}


/* ==============================================================
   PHONE SCREEN
   ============================================================== */

.phone-screen {

  position: relative !important;

  width: 100% !important;

  height: 100% !important;

  background: #ffffff !important;

  border-radius: 32px !important;

  overflow: hidden !important;

  box-sizing: border-box !important;

  isolation: isolate !important;

}


/* ==============================================================
   WEBSITE CONTAINER
   ============================================================== */

.phone-viewport-container {

  position: absolute !important;

  inset: 0 !important;

  width: 100% !important;

  height: 100% !important;

  overflow: hidden !important;

  box-sizing: border-box !important;

  z-index: 1 !important;

}


/* ==============================================================
   WEBSITE IFRAME
   ============================================================== */

#ghl-dynamic-iframe {

  position: absolute !important;

  inset: 0 !important;

  width: 100% !important;

  height: 100% !important;

  min-width: 0 !important;

  min-height: 0 !important;

  max-width: none !important;

  max-height: none !important;

  border: 0 !important;

  display: block !important;

  background: #ffffff !important;

  pointer-events: auto !important;

  touch-action: auto !important;

  box-sizing: border-box !important;

}


/* ==============================================================
   GHL LOADER
   ============================================================== */

#agent-widget-loader {

  position: absolute !important;

  left: 0 !important;

  top: 0 !important;

  width: 1px !important;

  height: 1px !important;

  overflow: visible !important;

  pointer-events: none !important;

  z-index: 9998 !important;

}


/* ==============================================================
   GHL WIDGET HOST
   ============================================================== */

.phone-screen > chat-widget {

  position: absolute !important;

  top: auto !important;

  left: auto !important;

  right: 12px !important;

  bottom: 12px !important;

  width: auto !important;

  height: auto !important;

  max-width: calc(100% - 24px) !important;

  max-height: calc(100% - 24px) !important;

  min-width: 0 !important;

  min-height: 0 !important;

  margin: 0 !important;

  padding: 0 !important;

  z-index: 999999 !important;

  pointer-events: auto !important;

  box-sizing: border-box !important;

  overflow: visible !important;

}


/* ==============================================================
   HOME BAR
   ============================================================== */

.phone-home-bar {

  position: absolute !important;

  left: 50% !important;

  bottom: 18px !important;

  transform: translateX(-50%) !important;

  width: 120px !important;

  height: 4px !important;

  background: rgba(255,255,255,.6) !important;

  border-radius: 100px !important;

  z-index: 1000000 !important;

  pointer-events: none !important;

}


/* ==============================================================
   MOBILE
   ============================================================== */

@media (max-width: 480px) {

  .mobile-phone-frame {

    width: 320px !important;

    height: 580px !important;

    padding: 8px !important;

    border-radius: 36px !important;

  }


  .phone-screen {

    border-radius: 28px !important;

  }


  .phone-home-bar {

    width: 100px !important;

    bottom: 14px !important;

  }

}

/* ==============================================================
   HIDE OUTER GHL WIDGET
   ============================================================== */

chat-widget {
  display: none !important;
}

/* ==============================================================
   LOADER
   ============================================================== */

.ghl-loader-overlay {
  position: absolute !important;
  inset: 0 !important;
  background: #ffffff !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  z-index: 10 !important;
  transition: opacity 0.5s ease, visibility 0.5s ease !important;
}

.ghl-modern-spinner {
  display: inline-block !important;
  position: relative !important;
  width: 80px !important;
  height: 80px !important;
}

.ghl-modern-spinner div {
  box-sizing: border-box !important;
  display: block !important;
  position: absolute !important;
  width: 64px !important;
  height: 64px !important;
  margin: 8px !important;
  border: 4px solid #155EEF !important;
  border-radius: 50% !important;
  animation: ghl-modern-spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite !important;
  border-color: #155EEF transparent transparent transparent !important;
}

.ghl-modern-spinner div:nth-child(1) { animation-delay: -0.45s !important; }
.ghl-modern-spinner div:nth-child(2) { animation-delay: -0.3s !important; }
.ghl-modern-spinner div:nth-child(3) { animation-delay: -0.15s !important; }

@keyframes ghl-modern-spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

</style>