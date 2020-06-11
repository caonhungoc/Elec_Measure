const socket = io("http://localhost:3000");

var month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var line_chart;
var chart_config;

var ssr_pin_value = 0;
var valve_pin_value = 0;
var power_threshold = 0;
var water_threshold = 0;

$(document).on("scroll load", () => {
  $(this).scrollTop();
});

$(document).ready(() => {
  chartjs();
  create_button_callbacks();
  create_socket_callbacks();
  socket.emit("get_pin_state");
  socket.emit("get_threshold");
})

function chartjs() {
  chart_config = {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: "Điện năng tiêu thụ",
        data: [0],
        backgroundColor: ['rgba(221, 199, 167, .4)'],
        borderColor: ['rgba(221, 199, 167, 0.9)'],
        yAxisID: 'y-axis-1',
      }, {
        label: "Lưu lượng nước",
        data: [0],
        backgroundColor: ['rgba(154, 196, 159, .8)'],
        borderColor: ['rgba(154, 196, 159, .9)'],
        yAxisID: 'y-axis-2',
      }]
    },
    options: {
      responsive: true,
      legend: {
        display: false
      },
      tooltips: {
        mode: 'index',
        intersect: false,
      },
      hover: {
        mode: 'nearest',
        intersect: true
      },
      scales: {
        yAxes: [{
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-1',
        }, {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-2',

          gridLines: {
            drawOnChartArea: false,
          },
        }],
      }
    }
  }
  var context = document.getElementById("chart_canvas").getContext("2d");
  line_chart = new Chart(context, chart_config);
}

function create_button_callbacks() {
  $("#btn-electronic-dev").click(() => {
    socket.emit("toggle_ssr", {"ssr_pin_value": ssr_pin_value^1});
  });

  $("#btn-water-valve").click(() => {
    socket.emit("toggle_valve", {"valve_pin_value": valve_pin_value^1});
  });

  $("#btn-set-threshold").click(() => {
    var power_thres = parseFloat($('#txt-set-power').val());
    var water_thres = parseFloat($('#txt-set-water').val());
    if (!isNaN(power_thres) && !isNaN(water_thres)) {
      socket.emit("set_threshold", {
        "power_threshold": power_thres,
        "water_threshold": water_thres
      });
    } else {
      $('#txt-set-power').val(power_threshold);
      $('#txt-set-water').val(water_threshold);
      alert("Not a number");
    }
  });
}

function create_socket_callbacks() {
  socket.on('data-available', (data) => {
    chart_config.data.labels = data.timestamp;
    chart_config.data.datasets[0].data = data.power;
    chart_config.data.datasets[1].data = data.water_flow;
    line_chart.update();
    var newestPowerRecord = data.power[data.power.length - 1];
    var newestWaterRecord = data.water_flow[data.water_flow.length - 1];
    $('#txt-power').html((Math.round(newestPowerRecord * 100) / 100).toFixed(2));
    $('#txt-waterflow').html((Math.round(newestWaterRecord * 100) / 100).toFixed(2));
  });

  socket.on("ssr_pin_state_change", (data) => {
    $("#btn-electronic-dev").html(`${data.ssr_pin_value == 1 ? "TẮT" : "BẬT"}`);
    ssr_pin_value = data.ssr_pin_value;
  });

  socket.on("valve_pin_state_change", (data) => {
    $("#btn-water-valve").html(`${data.valve_pin_value == 1 ? "TẮT" : "BẬT"}`);
    valve_pin_value = data.valve_pin_value;
  });

  socket.on("respond_pin_state", (data) => {
    $("#btn-electronic-dev").html(`${data.ssr_pin_value == 1 ? "TẮT" : "BẬT"}`);
    $("#btn-water-valve").html(`${data.valve_pin_value == 1 ? "TẮT" : "BẬT"}`);
    ssr_pin_value = data.ssr_pin_value;
    valve_pin_value = data.valve_pin_value;
  })

  socket.on("respond_threshold", (data) => {
    $("#txt-set-power").val(data.power_threshold);
    $("#txt-set-water").val(data.water_threshold);
    power_threshold = data.power_threshold;
    water_threshold = data.water_threshold;
  });
}