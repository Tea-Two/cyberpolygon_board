import "./main";
import "bootstrap/js/dist/tab";
import { ezQuery, ezAlert } from "../ezq";
import { htmlEntities } from "../utils";
require('dayjs/locale/ru')
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import $ from "jquery";
import CTFd from "../CTFd";
import config from "../config";
import hljs from "highlight.js";

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault("Europe/Moscow")

dayjs.extend(relativeTime);
dayjs.locale('ru')

const api_func = {
  teams: x => CTFd.api.get_team_solves({ teamId: x }),
  users: x => CTFd.api.get_user_solves({ userId: x })
};

CTFd._internal.challenge = {};
let challenges = [];
let solves = [];

const loadChal = id => {
  const chal = $.grep(challenges, chal => chal.id == id)[0];

  if (chal.type === "hidden") {
    ezAlert({
      title: "Задание скрыто!",
      body: "Вы еще не разблокировали эту задачу!",
      button: "Понятно!"
    });
    return;
  }

  displayChal(chal);
};

const loadChalByName = name => {
  let idx = name.lastIndexOf("-");
  let pieces = [name.slice(0, idx), name.slice(idx + 1)];
  let id = pieces[1];

  const chal = $.grep(challenges, chal => chal.id == id)[0];
  displayChal(chal);
};

const displayChal = chal => {
  return Promise.all([
    CTFd.api.get_challenge({ challengeId: chal.id }),
    $.getScript(config.urlRoot + chal.script),
    $.get(config.urlRoot + chal.template)
  ]).then(responses => {
    const challenge = CTFd._internal.challenge;

    $("#challenge-window").empty();

    // Inject challenge data into the plugin
    challenge.data = responses[0].data;

    // Call preRender function in plugin
    challenge.preRender();

    // Build HTML from the Jinja response in API
    $("#challenge-window").append(responses[0].data.view);

    $("#challenge-window #challenge-input").addClass(
      "form-control user-input-f");
    $("#challenge-window #challenge-submit").addClass(
      "btn button-f float-right w-100 p-0"
    );

    let modal = $("#challenge-window").find(".modal-dialog");
    if (
      window.init.theme_settings &&
      window.init.theme_settings.challenge_window_size
    ) {
      switch (window.init.theme_settings.challenge_window_size) {
        case "sm":
          modal.addClass("modal-sm");
          break;
        case "lg":
          modal.addClass("modal-lg");
          break;
        case "xl":
          modal.addClass("modal-xl");
          break;
        default:
          break;
      }
    }

    $(".challenge-solves").click(function(_event) {
      getSolves($("#challenge-id").val());
    });
    $(".nav-tabs a").click(function(event) {
      event.preventDefault();
      $(this).tab("show");
    });

    // Handle modal toggling
    $("#challenge-window").on("hide.bs.modal", function(_event) {
      $("#challenge-input").removeClass("wrong");
      $("#challenge-input").removeClass("correct");
      $("#incorrect-key").slideUp();
      $("#correct-key").slideUp();
      $("#already-solved").slideUp();
      $("#too-fast").slideUp();
    });

    $(".load-hint").on("click", function(_event) {
      loadHint($(this).data("hint-id"));
    });

    $("#challenge-submit").click(function(event) {
      event.preventDefault();
      $("#challenge-submit").addClass("disabled-button");
      $("#challenge-submit").prop("disabled", true);
      CTFd._internal.challenge
        .submit()
        .then(renderSubmissionResponse)
        .then(loadChals)
        .then(markSolves);
    });

    $("#challenge-input").keyup(event => {
      if (event.keyCode == 13) {
        $("#challenge-submit").click();
      }
    });

    challenge.postRender();

    $("#challenge-window")
      .find("pre code")
      .each(function(_idx) {
        hljs.highlightBlock(this);
      });

    window.location.replace(
      window.location.href.split("#")[0] + `#${chal.name}-${chal.id}`
    );
    $("#challenge-window").modal();
  });
};

function renderSubmissionResponse(response) {
  const result = response.data;

  const result_message = $("#result-message");
  const result_notification = $("#result-notification");
  const answer_input = $("#challenge-input");
  result_notification.removeClass();
  result_message.text(result.message);

  if (result.status === "authentication_required") {
    window.location =
      CTFd.config.urlRoot +
      "/login?next=" +
      CTFd.config.urlRoot +
      window.location.pathname +
      window.location.hash;
    return;
  } else if (result.status === "incorrect") {
    // Incorrect key
    result_notification.addClass(
      "alert alert-danger alert-dismissable text-center"
    );
    result_notification.slideDown();

    answer_input.removeClass("correct");
    answer_input.addClass("wrong");
    setTimeout(function() {
      answer_input.removeClass("wrong");
    }, 3000);
  } else if (result.status === "correct") {
    // Challenge Solved
    result_notification.addClass(
      "alert alert-success alert-dismissable text-center"
    );
    result_notification.slideDown();

    if (result.postdescription) {
      const descrBlock = $('.challenge-desc');
      descrBlock.append(
        '<hr style="background-color: #511592;">' +
        '<span class="challenge-desc text-white-f"><p>{0}</p></span>'.format(result.postdescription)
      );
    }

    if (
      $(".challenge-solves")
        .text()
        .trim()
    ) {
      // Only try to increment solves if the text isn't hidden
      $(".challenge-solves").text(
        "Решений " + (parseInt(
          $(".challenge-solves")
            .text()
            .split(" ")[1]
        ) + 1)
      );
    }

    answer_input.val("");
    answer_input.removeClass("wrong");
    answer_input.addClass("correct");
  } else if (result.status === "already_solved") {
    // Challenge already solved
    result_notification.addClass(
      "alert alert-info alert-dismissable text-center"
    );
    result_notification.slideDown();

    answer_input.addClass("correct");
  } else if (result.status === "paused") {
    // CTF is paused
    result_notification.addClass(
      "alert alert-warning alert-dismissable text-center"
    );
    result_notification.slideDown();
  } else if (result.status === "ratelimited") {
    // Keys per minute too high
    result_notification.addClass(
      "alert alert-warning alert-dismissable text-center"
    );
    result_notification.slideDown();

    answer_input.addClass("too-fast");
    setTimeout(function() {
      answer_input.removeClass("too-fast");
    }, 3000);
  }
  setTimeout(function() {
    $(".alert").slideUp();
    $("#challenge-submit").removeClass("disabled-button");
    $("#challenge-submit").prop("disabled", false);
  }, 3000);
}

function markSolves() {
  return api_func[CTFd.config.userMode]("me").then(function(response) {
    const solves = response.data;
    for (let i = solves.length - 1; i >= 0; i--) {
      const btn = $('button[value="' + solves[i].challenge_id + '"]');
      const div = $('.diag-' + solves[i].challenge_id);
      btn.addClass("solved-challenge");
      div.addClass("diag-open");
    }
  });
}

function loadUserSolves() {
  if (CTFd.user.id == 0) {
    return Promise.resolve();
  }

  return api_func[CTFd.config.userMode]("me").then(function(response) {
    const solves = response.data;

    for (let i = solves.length - 1; i >= 0; i--) {
      const chal_id = solves[i].challenge_id;
      solves.push(chal_id);
    }
  });
}

function getSolves(id) {
  return CTFd.api.get_challenge_solves({ challengeId: id }).then(response => {
    const data = response.data;
    $(".challenge-solves").text("Решений " + parseInt(data.length));
    const box = $("#challenge-solves-names");
    box.empty();
    for (let i = 0; i < data.length; i++) {
      const id = data[i].account_id;
      const name = data[i].name;
      const date = dayjs.tz(data[i].date).fromNow();
      const account_url = data[i].account_url;
      box.append(
        '<tr><td><a class="teamname-bold-f" href="{0}">{2}</td><td class="text-white-f">{3}</td></tr>'.format(
          account_url,
          id,
          htmlEntities(name),
          date
        )
      );
    }
  });
}

function createButton(chalinfo) {
  const chalid = chalinfo.name.replace(/ /g, "-").hashCode();
  const chalwrap = $(
    "<div id='{0}' class='col-md-4 d-inline-block'></div>".format(chalid)
  );
  let chalbutton;

  if (solves.indexOf(chalinfo.id) == -1) {
    chalbutton = $(
      "<button class='btn challenge-btn-f w-100 text-truncate pt-3 pb-3 mb-2 {0} px-0' value='{1}'></button>".format(
        chalinfo.type === "hidden" ? "inactive" : "",
        chalinfo.id
      )
    );
  } else {
    chalbutton = $(
      "<button class='btn btn-dark challenge-button solved-challenge w-100 text-truncate pt-3 pb-3 mb-2 px-0' value='{0}'><i class='fas fa-check corner-button-check'></i></button>".format(
        chalinfo.id
      )
    );
  }

  const chalheader = $("<p>{0}</p>".format(chalinfo.name));
  const chalscore = $("<span>{0}</span>".format(chalinfo.value));
  for (let j = 0; j < chalinfo.tags.length; j++) {
    const tag = "tag-" + chalinfo.tags[j].value.replace(/ /g, "-");
    chalwrap.addClass(tag);
  }

  chalbutton.append(chalheader);
  chalbutton.append(chalscore);
  chalwrap.append(chalbutton);
  return chalwrap;
}

function loadChals() {
  CTFd.api.confrontation().then(function(response) {
    $(".pg-bar-red-f").css("width", response.data.ussr + '%');
    $(".pg-bar-red-f").text(response.data.ussr + '%');

    $(".pg-bar-blue-f").css("width", response.data.spacex + '%');
    $(".pg-bar-blue-f").text(response.data.spacex + '%');
    $(".pg-bar-f").removeClass("d-none");
  });
  return CTFd.api.get_challenge_list().then(function(response) {
    var title = "";
    var l_theme = "";
    const $challenges_board = $("#challenges-board");
    challenges = response.data;
    themes = ["other", "spacex", "ussr"]
  
    $challenges_board.empty();
    for (let j = themes.length - 1; j >= 0; j--){
      categories = {"other": [], "spacex": [], "ussr": []};
      const theme = themes[j];
      const themeid = theme.replace(/ /g, "-").hashCode();
      const themerow = $(
        "" +
          '<div id="{0}-theme" class="notif-box">'.format(themeid) +
          '<div class="theme-header label-f col-md-12 my-5 text-center">' +
          "</div>" +
          "</div>"
      )
      for (let i = challenges.length - 1; i >= 0; i--) {
        if (challenges[i].topic != theme) {
          if ($.inArray(challenges[i].topic, Object.keys(categories)) != -1) {
            continue;
          }
          else if (theme !== "other") continue;
        }
        l_theme = theme
        challenges[i].solves = 0;
        if ($.inArray(challenges[i].category, categories[l_theme]) == -1 && challenges[i].topic != "quest") {
          const category = challenges[i].category;
          categories[l_theme].push(category);

          const categoryid = category.replace(/ /g, "-").hashCode();
          const categoryrow = $(
            "" +
              '<div id="{0}-row">'.format(categoryid) +
              '<h4 class="category-header label-f ml-5 mb-3">' + category + '</h4>' +
              '<div class="category-challenges col-md-12">' +
              '<div class="challenges-row col-md-12 mb-5"></div>' +
              "</div>" +
              "</div>"
          );

          themerow.append(categoryrow);
        }
      }
      if (l_theme === "ussr") {
        title = "CCCP 2.0"
      } else if (l_theme === "spacex") {
        title = "Космос Х"
      } else {
        title = "Другие"
      }
      themerow
        .find(".theme-header")
        .append($("<h3>" + title + "</h3>"));

      if (categories[l_theme].length != 0)
          $challenges_board.append(themerow);
    }

    $challenges_board.append($(
        "" +
          '<div class="notif-box">' +
            '<div class="theme-header label-f col-md-12 my-5 text-center">' +
              '<h3>Тайна девятой планеты</h3>' +
            "</div>" +
            '<div id="quest-challs" class="category-challenges col-md-12">' +
            "</div>" +
          "</div>"
    ));

    for (let i = 0; i <= challenges.length - 1; i++) {
      const chalinfo = challenges[i];
      const themeid = "";
      if ($.inArray(chalinfo.topic, Object.keys(categories)) != -1) {
        themeid = chalinfo.topic.replace(/ /g, "-").hashCode();
      } else themeid = "other".hashCode();
      const catid = chalinfo.category.replace(/ /g, "-").hashCode();
      const chalwrap = createButton(chalinfo);

      $("#" + themeid + "-theme > #" + catid + "-row")
        .find(".category-challenges > .challenges-row")
        .append(chalwrap);
    }

    // Квест
    for (let stage = 0; stage <= 5; stage++) {
      const stagerow = $(
        '<div class="challenges-row col-md-12 mb-medium-f d-sm-flex justify-content-sm-center">' +
        '</div>'
      )
      var counter = 0;
      var chalinfo1, chalinfo2, chalinfo3;
      var chalwrap1, chalwrap2, chalwrap3;
      for (let i = 0; i <= challenges.length - 1; i++) {
        if (challenges[i].topic == "quest") {
          if (stage == 0) {
              if (challenges[i].name == "Начало приключений") {
                chalinfo1 = challenges[i];
                chalwrap1 = createButton(chalinfo1);
              }
              stagerow.append(
                '<div class="diag diag-{0} diag-1-2 d-none d-sm-block"></div>'.format(chalinfo1.id)
              );
              stagerow.append(chalwrap1);
              stagerow.append(
                '<div class="diag diag-{0} diag-1-3 d-none d-sm-block"></div>'.format(chalinfo1.id)
              );
              break;
          }
          if (stage == 1) {
              if (challenges[i].name == "Судьбоносные записки") {
                counter += 1;
                chalinfo1 = challenges[i];
                chalwrap1 = createButton(chalinfo1);
              } else if (challenges[i].name == "Отцовская консоль") {
                counter += 1;
                chalinfo2 = challenges[i];
                chalwrap2 = createButton(chalinfo2);
              }
              if (counter == 2) {
                stagerow.append(
                  '<div class="diag diag-{0} diag-1-1 d-none d-sm-block"></div>'.format(chalinfo1.id) +
                  '<div class="diag diag-{0} diag-1-2 d-none d-sm-block"></div>'.format(chalinfo1.id)
                );
                stagerow.append(chalwrap1);
                stagerow.append(chalwrap2);
                stagerow.append(
                  '<div class="diag diag-{0} diag-1-3 d-none d-sm-block"></div>'.format(chalinfo2.id) +
                  '<div class="diag diag-{0} diag-1-4 d-none d-sm-block"></div>'.format(chalinfo2.id)
                );
                break;
              }
          } else if (stage == 2) {
              if (challenges[i].name == "Космический музей") {
                counter += 1;
                chalinfo1 = challenges[i];
                chalwrap1 = createButton(chalinfo1);
              } else if (challenges[i].name == "Пип-Бой") {
                counter += 1;
                chalinfo2 = challenges[i];
                chalwrap2 = createButton(chalinfo2);
              } else if (challenges[i].name == "Лотерея") {
                counter += 1;
                chalinfo3 = challenges[i];
                chalwrap3 = createButton(chalinfo3);
              }
              if (counter == 3) {
                stagerow.append(
                  '<div class="diag diag-{0} diag-2-1 d-none d-sm-block"></div>'.format(chalinfo1.id)
                );
                stagerow.append(chalwrap1);
                stagerow.append(
                  '<div class="diag diag-{0} diag-2-2 d-none d-sm-block"></div>'.format(chalinfo2.id)
                );
                stagerow.append(chalwrap2);
                stagerow.append(chalwrap3);
                stagerow.append(
                  '<div class="diag diag-{0} diag-2-3 d-none d-sm-block"></div>'.format(chalinfo3.id)
                );
                break;
              }
          } else if (stage == 3) {
              if (challenges[i].name == "Тайная передача") {
                counter += 1;
                chalinfo1 = challenges[i];
                chalwrap1 = createButton(chalinfo1);
              } else if (challenges[i].name == "Дино") {
                counter += 1;
                chalinfo2 = challenges[i];
                chalwrap2 = createButton(chalinfo2);
              }
              if (counter == 2) {
                stagerow.append(
                  '<div class="diag diag-{0} diag-3-1 d-none d-sm-block"></div>'.format(chalinfo1.id)
                );
                stagerow.append(chalwrap1);
                stagerow.append(chalwrap2);
                stagerow.append(
                  '<div class="diag diag-{0} diag-3-2 d-none d-sm-block"></div>'.format(chalinfo2.id)
                );
                break;
              }
          } else if (stage == 4) {
              if (challenges[i].name == "Терминальный доступ") {
                counter += 1;
                chalinfo1 = challenges[i];
                chalwrap1 = createButton(chalinfo1);
              } else if (challenges[i].name == "Управление полётами") {
                counter += 1;
                chalinfo2 = challenges[i];
                chalwrap2 = createButton(chalinfo2);
              }
              if (counter == 2) {
                stagerow.append(
                  '<div class="diag diag-{0} diag-4-1 d-none d-sm-block"></div>'.format(chalinfo1.id)
                );
                stagerow.append(chalwrap1);
                stagerow.append(chalwrap2);
                stagerow.append(
                  '<div class="diag diag-{0} diag-4-2 d-none d-sm-block"></div>'.format(chalinfo2.id)
                );
                break;
              }
          } else {
              if (challenges[i].name == "Старая база") {
                chalinfo = challenges[i];
                chalwrap = createButton(chalinfo);
                stagerow.append(chalwrap);
                break;
              }
          }
        }
      }
      $("#quest-challs").append(stagerow);
    }

    $(".challenge-btn-f").click(function(_event) {
      loadChal(this.value);
      getSolves(this.value);
    });
  });
}

function update() {
  return loadUserSolves() // Load the user's solved challenge ids
    .then(loadChals) //  Load the full list of challenges
    .then(markSolves);
}

$(() => {
  update().then(() => {
    if (window.location.hash.length > 0) {
      loadChalByName(decodeURIComponent(window.location.hash.substring(1)));
    }
  });

  $("#challenge-input").keyup(function(event) {
    if (event.keyCode == 13) {
      $("#challenge-submit").click();
    }
  });

  $(".nav-tabs a").click(function(event) {
    event.preventDefault();
    $(this).tab("show");
  });

  $("#challenge-window").on("hidden.bs.modal", function(_event) {
    $(".nav-tabs a:first").tab("show");
    history.replaceState("", window.document.title, window.location.pathname);
  });

  $(".challenge-solves").click(function(_event) {
    getSolves($("#challenge-id").val());
  });

  $("#challenge-window").on("hide.bs.modal", function(_event) {
    $("#challenge-input").removeClass("wrong");
    $("#challenge-input").removeClass("correct");
    $("#incorrect-key").slideUp();
    $("#correct-key").slideUp();
    $("#already-solved").slideUp();
    $("#too-fast").slideUp();
  });
});
setInterval(update, 300000); // Update every 5 minutes.

const displayHint = data => {
  ezAlert({
    title: "Подсказка",
    body: data.html,
    button: "Принял!"
  });
};

const displayUnlock = id => {
  ezQuery({
    title: "Разблокировать подсказку?",
    body: "Вы уверены, что хотите открыть эту подсказку?",
    success: () => {
      const params = {
        target: id,
        type: "hints"
      };
      CTFd.api.post_unlock_list({}, params).then(response => {
        if (response.success) {
          CTFd.api.get_hint({ hintId: id }).then(response => {
            displayHint(response.data);
          });

          return;
        }

        ezAlert({
          title: "Ошибка",
          body: response.errors.score,
          button: "Принял!"
        });
      });
    }
  });
};

const loadHint = id => {
  CTFd.api.get_hint({ hintId: id }).then(response => {
    if (response.data.content) {
      displayHint(response.data);
      return;
    }

    displayUnlock(id);
  });
};
