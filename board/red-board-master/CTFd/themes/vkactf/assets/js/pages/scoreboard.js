import "./main";
import $ from "jquery";
import CTFd from "../CTFd";
import echarts from "echarts/dist/echarts-en.common";
import dayjs from "dayjs";
import { htmlEntities, cumulativeSum, colorHash } from "../utils";

const graph = $("#score-graph");
const table = $("#scoreboard tbody");

const updateScoreboard = (filter) => {
  if (!getCookie(filter) || getCookie(filter) !== filter) {
    setCookie(filter, filter);
    $("." + filter).addClass('active');
  } else {
    deleteCookie(filter);
    $("." + filter).removeClass('active');
  }
  fetch("/api/v1/clearcache")
    .then(response => {
      update();
    });
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

$(".millitary").click(function(event) {
  event.preventDefault();
  updateScoreboard("millitary");
});
$(".official").click(function(event) {
  event.preventDefault();
  updateScoreboard("official");
});

const updateScores = () => {
  CTFd.api.get_scoreboard_list().then(response => {
    const teams = response.data;
    table.empty();

    for (let i = 0; i < 3; i++) {
      let cadets = ""
      if (teams[i].millitary)
        cadets = '<span class="box-green-f badge ml-2 p-1">Курсанты</span>'
      let cls = ""
      if (i === 0)
        cls = "first-place-teamname"
      else if (i === 1)
        cls = "second-place-teamname"
      else if (i === 2)
        cls = "third-place-teamname"
      const row = [
        '<tr align="center">',
        '<th class="text-white-f" style="padding: 5px;"><span class="icon-f icon-cup{0}-f"></span></th>'.format(i+1),
        '<td align="center"><a class="teamname-bold-f {0}" href="{1}/teams/{2}">'.format(
          cls,
          CTFd.config.urlRoot,
          teams[i].account_id
        ),
        htmlEntities(teams[i].name),
        "</a>",
        cadets,
        "</td>",
        '<td align="center" class="d-none d-sm-block"><span>',
        teams[i].affiliation,
        "</span></td>",
        '<td align="center"><span class="text-white-f">',
        teams[i].score,
        '</span></td></tr>'
      ].join("");
      table.append(row);
    }

    for (let i = 3; i < teams.length; i++) {
      let cadets = ""
      if (teams[i].millitary)
        cadets = '<span class="box-green-f badge ml-2 p-1">Курсанты</span>'
      const row = [
        '<tr align="center">',
        '<th class="text-white-f">',
        i + 1,
        '</th>',
        '<td align="center"><a class="teamname-bold-f" href="{0}/teams/{1}">'.format(
          CTFd.config.urlRoot,
          teams[i].account_id
        ),
        htmlEntities(teams[i].name),
        '</a>',
        cadets,
        "</td>",
        '<td align="center" class="d-none d-sm-block"><span>',
        teams[i].affiliation,
        "</span></td>",
        '<td align="center"><span class="text-white-f">',
        teams[i].score,
        '</span></td></tr>'
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
        text: "Топ 10 " + (CTFd.config.userMode === "teams" ? "Команд" : "Пользователей"),
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
        '<h3 class="text-white-f opacity-50 text-center w-100 justify-content-center align-self-center">Ещё нет решений</h3>'
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

// npx webpack --config webpack.config.js