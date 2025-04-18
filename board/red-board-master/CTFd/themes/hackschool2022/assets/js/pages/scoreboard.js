import "./main";
import $ from "jquery";
import CTFd from "../CTFd";
import echarts from "echarts/dist/echarts-en.common";
import dayjs from "dayjs";
import { htmlEntities, cumulativeSum, colorHash } from "../utils";

const graph = $("#score-graph");
const table = $("#scoreboard tbody");

const updateScoreboard = (filter) => {
  if (!getCookie(filter) || getCookie(filter) !== "disabled") {
    setCookie(filter, "disabled");
    $("." + filter).removeClass('active');
    $("." + filter).text('Все участники')
  } else {
    deleteCookie(filter);
    $("." + filter).addClass('active');
    $("." + filter).text('Tоп 50')
  };
};

const getCookie = (name) => {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
};

const setCookie = (name, value, options = {}) => {

  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}

const deleteCookie = (name) => {
  setCookie(name, "", {
    'max-age': -1
  })
}

$(".top50").on("click", function(event) {
  event.preventDefault();
  updateScoreboard("top50");
  fetch("/api/v1/clearcache")
    .then(response => {
      updateScores();
    });
});

const updateScores = () => {
  const userId = parseInt($("#user_id")[0].textContent);
  var top50 = false;

  CTFd.api.get_scoreboard_list().then(response => {
    var teams = response.data;
    table.empty();

    var team;

    for (let i = 0; i < teams.length; i++) {
      if (teams[i].account_id === userId) {
        team = teams[i];
      }
    }

    if (!getCookie('top50') || getCookie('top50') !== "disabled") {
      top50 = true;
      teams = teams.slice(0, 50);
      console.log(teams);
    }

    for (let i = 0; i < 3; i++) {
      let user_place = "";
      if (userId === teams[i].account_id){
        user_place = "user-place";
      }
      const row = [
        '<tr class="bordered {0}">'.format(user_place),
        '<th class="text-white-f" style="padding: 5px;"><span class="icon-f icon-cup{0}-f"></span></th>'.format(i+1),
        '<td class="text-left"><a class="user-text-f" href="{0}/users/{1}">'.format(
          CTFd.config.urlRoot,
          teams[i].account_id
        ),
        htmlEntities(teams[i].name),
        "</a></td>",
        '<td class="d-none d-md-block d-lg-block">',
        teams[i].affiliation,
        "</td>",
        '<td>',
        teams[i].score,
        '</td></tr>',
        "<tr>",
        '<th class="p-0"></th>',
        '<td class="p-0"></td>',
        '<td class="p-0"></td>',
        '<td class="p-1"></td>',
        '</tr>'
      ].join("");
      table.append(row);
    }

    for (let i = 3; i < teams.length; i++) {
      let user_place = "";
      if (userId === teams[i].account_id){
        user_place = "user-place";
      }
      const row = [
        '<tr class="bordered {0}">'.format(user_place),
        '<th scope="row">',
        i + 1,
        "</th>",
        '<td class="text-left"><a class="user-text-f" href="{0}/users/{1}">'.format(
          CTFd.config.urlRoot,
          teams[i].account_id
        ),
        htmlEntities(teams[i].name),
        "</a></td>",
        '<td class="d-none d-md-block d-lg-block">',
        teams[i].affiliation,
        "</td>",
        "<td>",
        teams[i].score,
        "</td>",
        "</tr>",
        "<tr>",
        '<th class="p-0"></th>',
        '<td class="p-0"></td>',
        '<td class="p-0"></td>',
        '<td class="p-1"></td>',
        '</tr>'
      ].join("");
      table.append(row);
    }

    if ( team.pos > 51 && top50) {
      const row = [
        '<tr class="non-bordered">',
				'<th scope="row"> . . . </th>',
				'<td class="text-left">',
				'. . .',
				'</td>',
				'<td class="d-none d-md-block d-lg-block">',
        '. . .',
        '</td>',
        '<td>',
        '. . .',
        '</td>',
        '</tr>',
        '<tr class="non-bordered">',
        '<th class="p-0"></th>',
        '<td class="p-0"></td>',
        '<td class="p-0"></td>',
        '<td class="p-1"></td>',
        '</tr>'
      ].join("");
      table.append(row);
    }

    if ( team.pos > 50 && top50) {
      const row = [
        '<tr class="bordered user-place">',
        '<th scope="row">',
          team.pos,
        "</th>",
        '<td class="text-left"><a class="user-text-f" href="{0}/users/{1}">'.format(
          CTFd.config.urlRoot,
          team.account_id
        ),
        htmlEntities(team.name),
        "</a></td>",
        '<td class="d-none d-md-block d-lg-block">',
        team.affiliation,
        "</td>",
        "<td>",
        team.score,
        "</td>",
        "</tr>",
      ].join("");
      table.append(row);
    }
  });
};

const buildGraphData = () => {
  return CTFd.api.get_scoreboard_detail({ count: 10 }).then(response => {
    const places = response.data;

    const teams = Object.keys(places);
    if (teams.length === 0) {
      return false;
    }

    const option = {
      title: {
        left: "center",
        text: "Топ 10 " + (CTFd.config.userMode === "teams" ? "Команд" : "Участников"),
        textStyle: {
          color: '#ffffff'
        }
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross"
        }
      },
      legend: {
        type: "scroll",
        orient: "horizontal",
        align: "left",
        bottom: 35,
        data: [],
        textStyle: {
          color: '#ffffff'
        },
        inactiveColor: '#e4002b'
      },
      toolbox: {
        show: false,
        feature: {
          dataZoom: {
            yAxisIndex: "none"
          },
          saveAsImage: {}
        }
      },
      grid: {
        containLabel: true
      },
      xAxis: [
        {
          type: "time",
          boundaryGap: false,
          data: []
        }
      ],
      yAxis: [
        {
          type: "value"
        }
      ],
      dataZoom: [
        {
          id: "dataZoomX",
          type: "slider",
          xAxisIndex: [0],
          filterMode: "filter",
          height: 20,
          top: 35,
          fillerColor: "rgba(233, 236, 241, 0.4)",
          textStyle: {
            color: '#ffffff'
          }
        }
      ],
      series: [],
      textStyle: {
        color: '#ffffff'
      }
    };

    for (let i = 0; i < teams.length; i++) {
      const team_score = [];
      const times = [];
      for (let j = 0; j < places[teams[i]]["solves"].length; j++) {
        team_score.push(places[teams[i]]["solves"][j].value);
        const date = dayjs(places[teams[i]]["solves"][j].date);
        times.push(date.toDate());
      }

      const total_scores = cumulativeSum(team_score);
      var scores = times.map(function(e, i) {
        return [e, total_scores[i]];
      });

      option.legend.data.push(places[teams[i]]["name"]);

      const data = {
        name: places[teams[i]]["name"],
        type: "line",
        label: {
          normal: {
            position: "top"
          }
        },
        itemStyle: {
          normal: {
            color: colorHash(places[teams[i]]["name"] + places[teams[i]]["id"])
          }
        },
        data: scores
      };
      option.series.push(data);
    }

    return option;
  });
};

const createGraph = () => {
  buildGraphData().then(option => {
    if (option === false) {
      // Replace spinner
      graph.html(
        '<h3 class="text-pixel-f opacity-50 text-center w-100 justify-content-center align-self-center">Ещё нет решений</h3>'
      );
      return;
    }

    graph.empty(); // Remove spinners
    let chart = echarts.init(document.querySelector("#score-graph"));
    chart.setOption(option);

    $(window).on("resize", function() {
      if (chart != null && chart != undefined) {
        chart.resize();
      }
    });
  });
};

const updateGraph = () => {
  buildGraphData().then(option => {
    let chart = echarts.init(document.querySelector("#score-graph"));
    chart.setOption(option);
  });
};

function update() {
  updateScores();
  updateGraph();
}

$(() => {
  setInterval(update, 300000); // Update scores every 5 minutes
  createGraph();
});

window.updateScoreboard = update;
