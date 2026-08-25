<script>
  (function () {
    // Clear old test data whenever Step 1 loads fresh
    sessionStorage.removeItem("user_submitted_website");

    function captureWebsiteInput() {
      // Find the website input field dynamically
      const websiteInput = document.querySelector('input[data-q="website"]') || 
                           document.querySelector('input[id="website"]') || 
                           document.querySelector('input[name="website"]') ||
                           document.querySelector('input[name*="website"]') ||
                           document.querySelector('input[placeholder*="yoursite"]') ||
                           document.querySelector('input[placeholder*="Website"]');

      if (websiteInput && websiteInput.value.trim() !== "") {
        const value = websiteInput.value.trim();
        sessionStorage.setItem("user_submitted_website", value);
        console.log("Updated sessionStorage with new website:", value);
      }
    }

    // Capture input live as the user types or clicks submit
    document.addEventListener("input", captureWebsiteInput, true);
    document.addEventListener("change", captureWebsiteInput, true);
    document.addEventListener("keyup", captureWebsiteInput, true);
    document.addEventListener("submit", captureWebsiteInput, true);
  })();
</script>