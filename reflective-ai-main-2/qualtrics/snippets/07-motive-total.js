Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var message = document.createElement("div");
  message.style.marginTop = "8px";
  message.style.fontWeight = "600";
  message.style.color = "#8a1f11";
  question.getQuestionContainer().appendChild(message);

  function inputs() {
    return Array.prototype.slice.call(question.getQuestionContainer().querySelectorAll("input[type='text'], input[type='number']"));
  }

  function total() {
    return inputs().reduce(function (sum, input) {
      var value = Number(input.value);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function validate() {
    var values = inputs().map(function (input) {
      return input.value.trim();
    });
    var allFilled = values.every(function (value) {
      return value !== "";
    });
    var allValid = inputs().every(function (input) {
      var value = Number(input.value);
      return Number.isFinite(value) && value >= 0;
    });
    var currentTotal = total();
    Qualtrics.SurveyEngine.setEmbeddedData("motive_total", String(currentTotal));
    if (allFilled && allValid && currentTotal === 100) {
      message.textContent = "";
      question.showNextButton();
    } else {
      message.textContent = "Enter nonnegative numbers for all six reasons. The six entries must total exactly 100.";
      question.hideNextButton();
    }
  }

  inputs().forEach(function (input) {
    input.setAttribute("inputmode", "decimal");
    input.setAttribute("min", "0");
    input.addEventListener("input", validate);
  });
  validate();
});
