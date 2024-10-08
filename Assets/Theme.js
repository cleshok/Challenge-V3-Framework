// Standard Dev

// This section only runs on the end of lab report
if (document.querySelector('link[href^="/css/exam-result/result.css"]') != null) {

    // Preemptively blank screen - un-blanked by both try and catch
    document.querySelector("body").style.display = "none";
  
    try {
      // Retrieve the text and continue on success.
      $.getScript("https://lodmanuals.blob.core.windows.net/lms/CLabsInstTemplate/EOLReport/CLabsEOL.js", function () {
  
        // Capture the flavor text
        var strings = window.strings
  
        // Parse the current text      
        var examData = parseReport();
  
        const colorOptions = strings.summary.filter(option => option.maxScore >= examData.skillometerScore && option.minScore <= examData.skillometerScore);
        examData.summaryColor = colorOptions[0].color;
  
        // Generate the report using the parsed data and replace the standard report with the result
        document.querySelector("body").innerHTML = generateReport(examData, strings);
  
        // Import dial library and set the options for the skillometer
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/jQuery-Knob/1.2.13/jquery.knob.min.js", function () {
          $(".dial").knob({
            'min': 0, 'max': 100,
            'readOnly': true,
            'angleArc': 240, 'angleOffset': -120,
            'fgColor': examData.summaryColor,
            'inputColor': examData.summaryColor,
            'width': 300, 'height': 240,
            'thickness': ".35",
            format: function (value) {
              return value + '%';
            }
          })
        });
  
        // Remove screen blanking
        document.querySelector("body").style.display = "block";
      });
    } catch {
      // Remove screen blanking - reveal standard report
      document.querySelector("body").style.display = "block";
    }
  
    // Parse the stock report
    function parseReport() {
      var examData = {};
      examData.labName = document.querySelector(".labName").innerHTML
      examData.labSeriesName = document.querySelector(".labSeriesName").innerHTML
      examData.labInstanceId = document.querySelector(".labInstanceId").innerHTML
      examData.duration = document.querySelector(".timeSpent").innerHTML
      examData.expectedDuration = document.querySelector(".labProfileDurationMinutes").innerHTML + " minutes"
      examData.totalAchievedScore = 0
      examData.maxScore = 0
      examData.activities = []
      examData.assessments = { preScore: null, preMax: null, postScore: null, postMax: null };
  
      // Account for variance in activity group naming
      const matchPreAssessment = new RegExp('pre[ -]*assessment', 'ig');
      const matchPostAssessment = new RegExp('post[ -]*assessment', 'ig');
  
      // Parse activities
      let activityGroupList = document.querySelectorAll(".activityGroupResult")
  
      activityGroupList.forEach((activity) => {
        let title = activity.querySelector(".activityGroupName").innerHTML
        let scoreString = activity.querySelector(".activityGroupScore").innerHTML
        let scoreAsFraction = scoreString.substring(scoreString.indexOf(":") + 2, scoreString.indexOf(","));
        let numerator = parseInt(scoreAsFraction.split('/')[0])
        let denominator = parseInt(scoreAsFraction.split('/')[1])
        let percentageString = scoreString.substring(scoreString.lastIndexOf(" ") + 1)
        let numericPercentage = percentageString.substring(0, percentageString.length - 1)
  
        // Look for assessments, collect their scores and exclude them from activities array
        if (matchPreAssessment.test(title)) { examData.assessments.preScore = scoreAsFraction; }
        else if (matchPostAssessment.test(title)) { examData.assessments.postScore = scoreAsFraction; }
        else {
          // not an assessment, must be an activity
          examData.totalAchievedScore += numerator;
          examData.maxScore += denominator;
  
          examData.activities.push({
            title: title,
            score: numericPercentage
          })
        }
      });
  
      examData.skillometerScore = Math.round((examData.totalAchievedScore / examData.maxScore) * 100)
      console.log(examData)
      return examData;
    }
  
    // Pairs a score with a random string from the range the score falls into
    function assignText(type, score, strings) {
      // retrieval failed, bail out
      if (null == strings) {
        console.log("no strings are present");
        return "";
      }
  
      // Section 1
      if (type == "summaryHeader") {
        let options = strings.summary.filter(option => option.maxScore >= score && option.minScore <= score);
        return options[0].headings[(Math.floor(options[0].headings.length * Math.random()))];
      }
  
      // Section 2
      if (type == "summaryMessage") {
        let options = strings.summary.filter(option => option.maxScore >= score && option.minScore <= score);
        return options[0].captions[(Math.floor(options[0].captions.length * Math.random()))];
      }
  
      // Sections 3 & 4
      else {
        let options = strings.activities.filter(option => option.maxScore >= score && option.minScore <= score);
        return options[0].messages[(Math.floor(options[0].messages.length * Math.random()))];
      }
    }
  
    // Generates the html to replace the standard report
    function generateReport(examData, strings) {
  
      // Header
      const summaryHeader = assignText("summaryHeader", examData.skillometerScore, strings);
      const summaryMessage = assignText("summaryMessage", examData.skillometerScore, strings);
      let activities = examData.activities
  
      // Activities
      activities.forEach(activity => {
        activity.feedback = assignText("message", activity.score, strings);
      })
  
      let content = `<div id="report-container">
        <div id="report-body">
          <div id="print-container">
            <a id="print-icon" onclick="print();">Print</a>
          </div>
          <div class="report-section">
            <h1 id="report-header">${summaryHeader}</h1>
          </div>
          <div class="report-section">
            <h2 id="report-summary" style="color: ${examData.summaryColor}">${summaryMessage}</h2>
            <div id="report-skillometer">
              <input type="text" value="${examData.skillometerScore}" class="dial">
            </div>`;
  
      /* End report heading - optionally show lab details*/
      content += `</div>`;
  
      /* Only create excelled if there are applicable activities */
      if (activities.some(activity => activity.score == 100)) {
        content += `<div class="report-section excelled"><h2 class="report-section-title">Areas where you excelled</h2><ul class="activities">`
  
        examData.activities.forEach(activity => {
          if (activity.score == 100) {
            content += `<li>
                <span class="report-activity-title">` + activity.title + `</span><br>
                <span class="report-activity-feedback">` + activity.feedback + `</span>
              </li> `;
          }
        })
  
        content += `</ul>
          </div>`
      }
  
      /* Only open growth if there are applicable activities */
      if (activities.some(activity => activity.score < 100)) {
        content += `<div class="report-section growth"><h2 class="report-section-title">Areas where you have room to grow</h2><ul class="activities">`;
  
        activities.forEach(activity => {
          if (activity.score < 100) {
  
            // Partially correct
            if (activity.score > 0) {
              content += `<li class="partial">`
            }
            else {
              content += `<li class="none">`
            }
  
            content +=
              `<span class="report-activity-title">` + activity.title + `</span><br>
                <span class="report-activity-feedback">` + activity.feedback + `</span>
              </li> `;
          }
        })
  
        content += `</ul>
          </div>`
      }
  
      content += `<div class="report-section assessments">`;
  
      // Pre and Post assessments will not display if their values cannot be retrieved
      if (null != examData.assessments.preScore || null != examData.assessments.postScore) {
        content += `<h2 class="report-section-title">Assessments</h2>`
      }
  
      if (null != examData.assessments.preScore) {
        content += `<div class="report-assessment"><span>Pre-Assessment: <b>${examData.assessments.preScore}</b></span></div>`;
      }
  
      if (null !== examData.assessments.postScore) {
        content += `<div class="report-assessment"><span>Post-Assessment: <b>${examData.assessments.postScore}</b></span></div>`;
      }
  
      /* End report body - optionally show lab details*/
      content += "</div></div>";
  
      let key = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1)
      content += `<a href="https://labondemand.com/Evaluation/Submit/${key}" id="evaluation"><button type="button" class="primary">Challenge Labs Feedback &gt;</button></a></div>`;
  
      return content;
    }
  
    function getColor() {
      if (document.querySelector('link[href^="/Css/Dark.css"]') != null) {
        document.querySelector('h2#report-summary').classList.add('dark');
      }
    }
  
  } else {
    // Hint Toggle
  
    // Starting state
    if ($('select[data-name="ShowHints"]').val() == 'Yes') {
      $('input.checkMode').attr('checked', true);
    }
    else {
      $('input.checkMode').removeAttr('checked');
    }
    
    $('select[data-name="ShowHints"]').trigger("change");
  
    $('body').off().on('click', 'input.checkMode', function () {
      // Is checkbox checked?
      if ($(this).is(':checked')) {
        //add extra option
        $('select[data-name="ShowHints"] option[value="Yes"]').prop('selected', true)
        $('input.checkMode').prop("checked", true);
        $('select[data-name="ShowHints"]').trigger("change");
      } else {
        //remove extra option
        $('select[data-name="ShowHints"] option[value="No"]').prop('selected', true)
        $('input.checkMode').prop("checked", false);
        $('select[data-name="ShowHints"]').trigger("change");
      }
    });
  
    $("#next").on('click', function(){
      if ( $("#page1").hasClass("selected") ){
        if ($('select[data-name="ShowHints"]').val() == 'Yes') {
          $('input.checkMode').attr('checked', true);
          $('select[data-name="ShowHints"]').trigger("change");
        }
      }
    });
  }