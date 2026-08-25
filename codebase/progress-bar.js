<!-- ============================================================
     CRAWL + WIDGET SYNCHRONIZED PROGRESS BAR
     ============================================================ -->

<div id="dynamic-progress-wrapper" style="width:100%; margin:20px 0;">

  <div class="progress-container">

    <div
      id="dynamic-progress-bar"
      class="progress-bar"
      style="width:0%;"
    >

      <span
        id="dynamic-progress-text"
        class="progress-text"
      >
        Initializing crawler...
      </span>

    </div>

  </div>

</div>


<style>

/* ============================================================
   PROGRESS CONTAINER
   ============================================================ */

.progress-container {

  width:100%;
  height:48px;

  background:#f3f4f6;

  border-radius:9999px;

  overflow:hidden;

  box-shadow:
    inset 0 1px 2px rgba(0,0,0,.05);

  position:relative;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;

}


/* ============================================================
   PROGRESS BAR
   ============================================================ */

.progress-bar {

  width:0%;

  height:100%;

  background-color:#3b82f6;

  background-image:
    linear-gradient(
      135deg,
      rgba(255,255,255,.25) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255,255,255,.25) 50%,
      rgba(255,255,255,.25) 75%,
      transparent 75%,
      transparent
    );

  background-size:1rem 1rem;

  border-radius:9999px;

  display:flex;

  align-items:center;

  justify-content:center;

  transition:
    width .6s ease,
    background-color .3s ease;

  animation:
    progress-stripe 1s linear infinite;

}


/* ============================================================
   TEXT
   ============================================================ */

.progress-text {

  color:#fff;

  font-size:13px;

  font-weight:600;

  letter-spacing:.2px;

  white-space:nowrap;

  padding:0 15px;

}


/* ============================================================
   ANIMATION
   ============================================================ */

@keyframes progress-stripe {

  0% {
    background-position:1rem 0;
  }

  100% {
    background-position:0 0;
  }

}


/* ============================================================
   COMPLETED
   ============================================================ */

.progress-bar.completed {

  background:#10b981 !important;

  background-image:none;

  animation:none;

}

</style>


<script>

(function () {

  "use strict";


  /* ============================================================
     CONFIG
     ============================================================ */

  const STATUS_API =
    "https://mobile-iframe-proxy.ffp-digimarketing.workers.dev/crawl-status";


  const LOCATION_ID =
    "VU1vYA2ZpTbrXSZ2wwtg";


  const KNOWLEDGE_BASE_ID =
    "d8z7iwOimrS9bbpGE6Kw";


  const POLL_INTERVAL =
    3000;


  const SECTION_IDS = [

    "section-vMgeo5IkgS",

    "section-0cPjDbWDKr",

    "section-dpLuXJjcp5",

    "section-W5PRTMET50",

    "section-ax382MOCkt",

    "section-jkLGeDhLg2"

  ];


  let crawlCompleted = false;

  let widgetCompleted = false;

  let finalCompleted = false;

  let pollTimer = null;

  let observer = null;


  /* ============================================================
     DOM HELPERS
     ============================================================ */

  function getElement(id) {

    return document.getElementById(id);

  }


  /* ============================================================
     HIDE SECTION
     ============================================================ */

  function hideElement(el) {

    if (!el) return;

    el.style.setProperty(
      "display",
      "none",
      "important"
    );

    el.style.setProperty(
      "visibility",
      "hidden",
      "important"
    );

    el.style.setProperty(
      "opacity",
      "0",
      "important"
    );

    el.setAttribute(
      "data-crawl-hidden",
      "true"
    );

  }


  /* ============================================================
     SHOW SECTION
     ============================================================ */

  function showElement(el) {

    if (!el) return;

    el.style.removeProperty("display");

    el.style.removeProperty("visibility");

    el.style.removeProperty("opacity");

    el.removeAttribute(
      "data-crawl-hidden"
    );

  }


  /* ============================================================
     HIDE ALL SECTIONS
     ============================================================ */

  function hideSections() {

    SECTION_IDS.forEach(function (id) {

      const el = getElement(id);

      if (el) {

        hideElement(el);

      }

    });

  }


  /* ============================================================
     SHOW ALL SECTIONS
     ============================================================ */

  function showSections() {

    console.log(
      "Showing all sections..."
    );


    SECTION_IDS.forEach(function (id) {

      const el = getElement(id);

      if (el) {

        showElement(el);

        console.log(
          "Section revealed:",
          id
        );

      }

    });

  }


  /* ============================================================
     MUTATION OBSERVER
     
     This handles section-W5PRTMET50 because GHL may
     dynamically render it after our script starts.
     ============================================================ */

  function startSectionObserver() {

    if (observer) return;


    observer =
      new MutationObserver(
        function () {

          if (finalCompleted) {

            return;

          }


          SECTION_IDS.forEach(
            function (id) {

              const el =
                getElement(id);


              if (el) {

                hideElement(el);

              }

            }
          );

        }
      );


    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true
      }
    );

  }


  /* ============================================================
     PROGRESS UI
     ============================================================ */

  function setProgress(
    percentage,
    message
  ) {

    const bar =
      getElement(
        "dynamic-progress-bar"
      );


    const text =
      getElement(
        "dynamic-progress-text"
      );


    if (!bar || !text) {

      return;

    }


    percentage =
      Math.max(
        0,
        Math.min(
          100,
          percentage
        )
      );


    bar.style.width =
      percentage + "%";


    text.textContent =
      message;

  }


  /* ============================================================
     OPERATION ID
     ============================================================ */

  function getOperationId() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    return (

      params.get("operationId") ||

      params.get("opId") ||

      sessionStorage.getItem(
        "crawl_operation_id"
      )

    );

  }


  /* ============================================================
     SAVE OPERATION ID
     ============================================================ */

  function saveOperationId(id) {

    if (!id) return;


    sessionStorage.setItem(
      "crawl_operation_id",
      id
    );

  }


  /* ============================================================
     CHECK CRAWL
     ============================================================ */

  async function checkCrawl() {

    if (crawlCompleted) {

      return;

    }


    const operationId =
      getOperationId();


    const params =
      new URLSearchParams();


    params.set(
      "locationId",
      LOCATION_ID
    );


    params.set(
      "knowledgeBaseId",
      KNOWLEDGE_BASE_ID
    );


    if (operationId) {

      params.set(
        "operationId",
        operationId
      );

    }


    const url =
      STATUS_API +
      "?" +
      params.toString();


    console.log(
      "Checking crawl:",
      url
    );


    try {

      const response =
        await fetch(
          url,
          {
            method:"GET",
            cache:"no-store"
          }
        );


      if (!response.ok) {

        throw new Error(
          "HTTP " +
          response.status
        );

      }


      const data =
        await response.json();


      console.log(
        "Crawl response:",
        data
      );


      const details =
        data.operationDetails || {};


      if (details._id) {

        saveOperationId(
          details._id
        );

      }


      const status =
        String(
          details.status || ""
        ).toLowerCase();


      /* ========================================================
         CRAWL SUCCESS
         ======================================================== */

      if (

        status === "successful" ||

        status === "success" ||

        status === "completed"

      ) {

        crawlCompleted = true;


        console.log(
          "CRAWL COMPLETE."
        );


        /*
         * Stop polling.
         */

        if (pollTimer) {

          clearInterval(
            pollTimer
          );

          pollTimer = null;

        }


        /*
         * Crawl is complete,
         * but DON'T finish progress yet.
         *
         * Now we load the widget.
         */

        setProgress(
          90,
          "Website processed. Loading AI agent..."
        );


        loadAgentWidget();

        return;

      }


      /* ========================================================
         CRAWL FAILED
         ======================================================== */

      if (status === "failed") {

        setProgress(
          0,
          "Crawling failed. Please try again."
        );

        return;

      }


      /* ========================================================
         * CRAWL STILL RUNNING
         * ======================================================== */

      const discovered =
        Number(
          details.discoveredUrlsCount
        ) || 0;


      const trained =
        Number(
          details.trainedUrlsCount
        ) || 0;


      let progress = 10;


      if (discovered > 0) {

        progress = 35;

      }


      if (
        discovered > 0 &&
        trained > 0
      ) {

        const ratio =
          Math.min(
            trained / discovered,
            1
          );


        progress =
          Math.round(
            45 +
            ratio * 40
          );

      }


      /*
       * Never go above 89 until
       * the crawl actually succeeds.
       */

      progress =
        Math.min(
          progress,
          89
        );


      let message;


      if (progress < 20) {

        message =
          "Initializing site crawler...";

      }
      else if (progress < 40) {

        message =
          "Discovering & mapping website URLs...";

      }
      else if (progress < 70) {

        message =
          "Extracting website content & assets...";

      }
      else {

        message =
          "Processing website & training Knowledge Base...";

      }


      setProgress(
        progress,
        message
      );


    }
    catch (error) {

      console.error(
        "Crawl polling error:",
        error
      );

      /*
       * Keep polling.
       */

    }

  }


  /* ============================================================
     LOAD AGENT WIDGET
     ============================================================ */

  function loadAgentWidget() {

    if (widgetCompleted) {

      return;

    }


    /*
     * If already loaded,
     * check immediately.
     */

    if (window.agentWidgetLoaded) {

      console.log(
        "Agent widget already loaded."
      );

      waitForWidget();

      return;

    }


    const container =
      getElement(
        "agent-widget-loader"
      );


    if (!container) {

      console.error(
        "Agent widget container not found."
      );

      /*
       * Retry because GHL may not have
       * rendered the iframe section yet.
       */

      setTimeout(
        loadAgentWidget,
        1000
      );

      return;

    }


    console.log(
      "Loading AI agent widget..."
    );


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
      "6a8c69c3c041361bdc038c9b"
    );


    script.onload =
      function () {

        console.log(
          "Agent widget loader script loaded."
        );


        window.agentWidgetLoaded =
          true;


        waitForWidget();

      };


    script.onerror =
      function () {

        console.error(
          "Failed to load AI agent widget."
        );


        /*
         * Retry.
         */

        setTimeout(
          loadAgentWidget,
          2000
        );

      };


    container.appendChild(
      script
    );

  }


  /* ============================================================
     WAIT FOR ACTUAL WIDGET
     ============================================================ */

  function waitForWidget() {

    console.log(
      "Waiting for AI widget to actually appear..."
    );


    let attempts = 0;

    const maxAttempts = 60;


    const widgetTimer =
      setInterval(
        function () {

          attempts++;


          /*
           * Look for the actual GHL widget.
           *
           * GHL can render different elements depending
           * on the widget version, so we check multiple.
           */

          const widget =
            document.querySelector(
              "chat-widget"
            );


          const iframe =
            document.querySelector(
              "chat-widget iframe"
            );


          const widgetShadow =
            document.querySelector(
              "[data-widget-id='6a8c69c3c041361bdc038c9b']"
            );


          if (
            widget ||
            iframe ||
            widgetShadow
          ) {

            console.log(
              "AI widget detected."
            );


            clearInterval(
              widgetTimer
            );


            widgetCompleted =
              true;


            finishEverything();


            return;

          }


          /*
           * Some GHL widgets take a few seconds
           * to create their DOM.
           */

          if (
            attempts >= maxAttempts
          ) {

            clearInterval(
              widgetTimer
            );


            console.warn(
              "Widget element was not detected after waiting."
            );


            /*
             * We still mark the widget phase complete
             * because the loader itself successfully loaded.
             */

            widgetCompleted =
              true;


            finishEverything();

          }

        },
        500
      );

  }


  /* ============================================================
     EVERYTHING COMPLETE
     ============================================================ */

  function finishEverything() {

    if (finalCompleted) {

      return;

    }


    /*
     * Both conditions must be true.
     */

    if (
      !crawlCompleted ||
      !widgetCompleted
    ) {

      return;

    }


    finalCompleted =
      true;


    console.log(
      "================================="
    );


    console.log(
      "CRAWL + WIDGET COMPLETE"
    );


    console.log(
      "Showing final UI."
    );


    console.log(
      "================================="
    );


    /*
     * Progress goes to 100%.
     */

    setProgress(
      100,
      "AI Agent Ready! Loading dashboard..."
    );


    const bar =
      getElement(
        "dynamic-progress-bar"
      );


    if (bar) {

      bar.classList.add(
        "completed"
      );

    }


    /*
     * Stop MutationObserver.
     */

    if (observer) {

      observer.disconnect();

      observer = null;

    }


    /*
     * Give the user a short visual
     * confirmation of 100%.
     */

    setTimeout(
      function () {

        const wrapper =
          getElement(
            "dynamic-progress-wrapper"
          );


        if (wrapper) {

          wrapper.style.display =
            "none";

        }


        /*
         * Reveal every section.
         */

        showSections();


        console.log(
          "SUCCESS: Sections revealed."
        );

      },
      1200
    );

  }


  /* ============================================================
     INITIALIZE
     ============================================================ */

  function initialize() {

    console.log(
      "Initializing synchronized crawl UI..."
    );


    /*
     * Hide sections immediately.
     */

    hideSections();


    /*
     * Start observer so dynamically-created
     * GHL sections are also hidden.
     */

    startSectionObserver();


    /*
     * Initial progress.
     */

    setProgress(
      0,
      "Initializing crawler..."
    );


    /*
     * Start crawl polling.
     */

    checkCrawl();


    pollTimer =
      setInterval(
        checkCrawl,
        POLL_INTERVAL
      );

  }


  /* ============================================================
     START
     ============================================================ */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  }
  else {

    initialize();

  }

})();

</script>