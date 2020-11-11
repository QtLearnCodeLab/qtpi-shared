var portName = 'COM3';
let serial;

function setup() {
  led_on = createButton("LED ON");
  led_off = createButton("LED OFF");
  led_on.mousePressed(turnon);
  led_off.mousePressed(turnoff);
  serial = new p5.SerialPort();
  serial.list();
  serial.open(portName);
  serial.on('list', gotList);
}

function gotList(thelist) {
  console.log("List of Serial Ports:");
  for (let i = 0; i < thelist.length; i++) {
    console.log(i + " " + thelist[i]);
  }
}

function draw() {
  background(220);
}

function turnon(){
  serial.write("1");
}
function turnoff(){
  serial.write("2");
}
