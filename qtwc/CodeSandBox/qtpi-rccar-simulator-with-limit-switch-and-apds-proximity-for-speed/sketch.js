import { keymap, booster } from "./RCcarSim.js";

// 0 0 - stop
//1 0 - left
//0 1 - right
// 1 1 - drive
//if both keys pressed then move forward
var leftKeyPressed = 0;
var rightKeyPressed = 0;
function ControlCar() {
  keymap["a"] = leftKeyPressed;
  keymap["d"] = rightKeyPressed;
  if (leftKeyPressed && rightKeyPressed) {
    //move forward
    keymap["w"] = leftKeyPressed && rightKeyPressed;
  }
  if (!leftKeyPressed && !rightKeyPressed) {
    //move forward
    keymap["w"] = false;
  }
}

function gotDataLeft(data) {
  console.log("leftKeyPressed:::", data);
  leftKeyPressed = data === 1;
  ControlCar();
}
function gotDataRight(data) {
  console.log("rightKeyPressed:::", data);
  rightKeyPressed = data === 1;
  ControlCar();
}
// let sketch = function (p) {
//   p.setup = function () {};
// };
// var p = new p5(sketch, "container");
function mapRange(value, a, b, c, d) {
  // first map value from (a..b) to (0..1)
  value = (value - a) / (b - a);
  // then map it from (0..1) to (c..d) and return it
  return c + value * (d - c);
}

function gotDataSpeed(data) {
  var d = JSON.parse(data).proximity;
  console.log("VALUE ", d);
  d = Math.trunc(mapRange(d, 0, 255, 0, 25));
  console.log("VALUE ", d);
  document.getElementById("mySpeed").value = d;
  booster(d);
}
window["gotDataLeft"] = gotDataLeft;
window["gotDataRight"] = gotDataRight;
window["gotDataSpeed"] = gotDataSpeed;
