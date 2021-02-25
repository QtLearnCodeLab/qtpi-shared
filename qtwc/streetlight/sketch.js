/* eslint-disable no-undef, no-unused-vars */
var ldr;

function setup() {
  ldr = document.getElementById("ldr1");
  ldr.setAttribute("onData", "gotData");
  ldr.setAttribute("state", "on");
  console.log("setup");
}

function gotData(data) {
  console.log("data: ", data);
  if (data < 300) {
    myled.led("on");
  } else {
    myled.led("off");
  }
}
