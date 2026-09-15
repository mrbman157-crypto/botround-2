Qualtrics.SurveyEngine.addOnload(function () {
  var question = this;
  var root = question.getQuestionContainer();
  var democratLeft = Math.random() < 0.5;
  var leftLabel = democratLeft ? "Democrat" : "Republican";
  var rightLabel = democratLeft ? "Republican" : "Democrat";

  root.innerHTML = [
    "<p>Earlier in this survey, you told us about your political views.</p>",
    "<p>In this part, you will make a real decision that affects the payment of two other participants.</p>",
    "<p>You have <strong>$4.00</strong> to allocate between two other participants in this study. One of them is a Democrat, and the other is a Republican. You will not allocate any money to yourself.</p>",
    "<p>You must allocate the full $4.00 between the two participants. The minimum you can give to each is $0.50. Amounts are in $0.50 increments.</p>",
    "<p><strong>How payment works.</strong> At the end of the study, we will randomly select 1 in every 10 participants. If you are selected, your decision on this page will be implemented: the two participants you allocated to will each receive the amount you chose, added to their study payment. Whether you are selected is decided by chance and does not depend on what you choose here. You yourself will not receive money from this decision; the money goes to the two other participants.</p>",
    "<p>Allocate $4.00 between the two by choosing the amount assigned to the party shown on the left.</p>",
    "<div id='allocation-widget' style='display:grid;gap:12px;max-width:640px'>",
    "<div style='display:flex;justify-content:space-between;font-weight:700'><span>" + leftLabel + "</span><span>" + rightLabel + "</span></div>",
    "<input id='allocation-left' type='range' min='0.5' max='3.5' step='0.5' value='2.0' aria-label='Allocation to left label'>",
    "<div id='allocation-values' style='display:flex;justify-content:space-between'></div>",
    "</div>"
  ].join("");

  var slider = root.querySelector("#allocation-left");
  var values = root.querySelector("#allocation-values");
  var interacted = false;

  function money(value) {
    return "$" + Number(value).toFixed(2);
  }

  function writeAllocation() {
    var leftAmount = Number(slider.value);
    var rightAmount = 4 - leftAmount;
    var democratAmount = democratLeft ? leftAmount : rightAmount;
    var republicanAmount = democratLeft ? rightAmount : leftAmount;

    values.innerHTML = "<span>" + money(leftAmount) + "</span><span>" + money(rightAmount) + "</span>";
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_label_order", democratLeft ? "democrat_left" : "republican_left");
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_democrat", democratAmount.toFixed(2));
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_republican", republicanAmount.toFixed(2));
    Qualtrics.SurveyEngine.setEmbeddedData("allocation_interacted", interacted ? "true" : "false");
    if (interacted) {
      question.showNextButton();
    } else {
      question.hideNextButton();
    }
  }

  slider.addEventListener("input", function () {
    interacted = true;
    writeAllocation();
  });
  slider.addEventListener("change", function () {
    interacted = true;
    writeAllocation();
  });
  writeAllocation();
});
