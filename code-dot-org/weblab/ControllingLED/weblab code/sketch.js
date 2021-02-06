var portName = 'COM3';
let serial;

function setup() {
  serial = new p5.SerialPort();
  serial.open(portName);
  led_on = createButton("LED ON");
  led_off = createButton("LED OFF");
  led_on.mousePressed(turnon);
  led_off.mousePressed(turnoff);
}

function draw() {
  background(250);
}

function turnon(){
  serial.write("1")
}
function turnoff(){
  serial.write("2")
}
