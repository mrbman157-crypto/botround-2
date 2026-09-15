Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var startedAt = Date.now();
  var firstKeyAt = 0;
  var lastKeyAt = 0;
  var keydownCount = 0;
  var pasteCount = 0;
  var backspaceCount = 0;
  var intervals = [];

  function setField(name, value) {
    Qualtrics.SurveyEngine.setEmbeddedData(name, String(value == null ? "" : value));
  }

  function textInput() {
    var root = question.getQuestionContainer();
    return root.querySelector("textarea, input[type='text']");
  }

  function median(values) {
    if (!values.length) return "";
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  function writeTelemetry() {
    var input = textInput();
    var value = input ? input.value : "";
    var trimmed = value.trim();
    var duration = Math.max(0, Date.now() - startedAt);
    var meanIki = intervals.length
      ? Math.round(intervals.reduce(function (sum, value) { return sum + value; }, 0) / intervals.length)
      : "";

    setField("typing_duration_ms", duration);
    setField("typing_keydown_count", keydownCount);
    setField("typing_paste_count", pasteCount);
    setField("typing_backspace_count", backspaceCount);
    var wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    setField("typing_word_count", wordCount);
    setField("typing_word_count_in_range", wordCount >= 15 && wordCount <= 30 ? "true" : "false");
    setField("typing_char_count", value.length);
    setField("typing_first_key_latency_ms", firstKeyAt ? firstKeyAt - startedAt : "");
    setField("typing_mean_interkey_ms", meanIki);
    setField("typing_median_interkey_ms", median(intervals));
  }

  var input = textInput();
  if (input) {
    input.addEventListener("keydown", function (event) {
      var now = Date.now();
      keydownCount += 1;
      if (!firstKeyAt) firstKeyAt = now;
      if (lastKeyAt) intervals.push(now - lastKeyAt);
      lastKeyAt = now;
      if (event.key === "Backspace") backspaceCount += 1;
    });
    input.addEventListener("paste", function () {
      pasteCount += 1;
    });
  }

  Qualtrics.SurveyEngine.addOnUnload(writeTelemetry);
});
