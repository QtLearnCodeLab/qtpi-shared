import "./styles.css";

var alexaled1 = document.getElementById("alexaled1");
var led1 = document.getElementById("led1");

alexaled1.onData = function onData(ev) {
  var data1 = JSON.parse(ev).last_value;
  console.log("DATA=>", data1);
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

alexaled1.listen();
