var led1 = document.getElementById("led1");
var gv = document.getElementById("gvled1");

gv.onData = function onData(ev) {
  var data1 = JSON.parse(ev).last_value;
  data1 = data1.toLowerCase();
  console.log("DATA=>", data1);
  if (data1 === "on") {
    led1.setAttribute("state", "on");
  } else if (data1 === "off") {
    led1.setAttribute("state", "off");
  } else if (data1 === "blink") {
    led1.setAttribute("state", "blink");
  }
};

gv.listen();
