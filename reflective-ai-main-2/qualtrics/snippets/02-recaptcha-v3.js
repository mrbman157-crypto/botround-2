Qualtrics.SurveyEngine.addOnload(function () {
  var siteKey = "{{RECAPTCHA_SITE_KEY}}";
  var action = "study_overview";
  Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_action", action);

  function storeToken(token) {
    Qualtrics.SurveyEngine.setEmbeddedData("recaptcha_token", token || "");
  }

  function runRecaptcha() {
    if (!window.grecaptcha || !window.grecaptcha.ready) {
      storeToken("");
      return;
    }
    window.grecaptcha.ready(function () {
      window.grecaptcha.execute(siteKey, { action: action }).then(storeToken).catch(function () {
        storeToken("");
      });
    });
  }

  if (!siteKey || siteKey.indexOf("{{") === 0) {
    storeToken("");
    return;
  }

  if (window.grecaptcha) {
    runRecaptcha();
    return;
  }

  var script = document.createElement("script");
  script.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(siteKey);
  script.async = true;
  script.defer = true;
  script.onload = runRecaptcha;
  script.onerror = function () {
    storeToken("");
  };
  document.head.appendChild(script);
});
