Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;

  function selectedChoiceIds() {
    var root = question.getQuestionContainer();
    var checked = root.querySelectorAll("input[type='radio']:checked, input[type='checkbox']:checked");
    return Array.prototype.map.call(checked, function (input) {
      return String(input.id || input.value || "").split("~").pop();
    });
  }

  function writePassFlag() {
    var selected = selectedChoiceIds();
    var pass = selected.indexOf("2") !== -1;
    Qualtrics.SurveyEngine.setEmbeddedData("comprehension_pass", pass ? "true" : "false");
  }

  this.questionclick = writePassFlag;
  Qualtrics.SurveyEngine.addOnUnload(writePassFlag);
});
