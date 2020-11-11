var portName = 'COM3';
let serial;
var ldr_value = 0;

function setup() {
  createCanvas(400, 400);
  serial = new p5.SerialPort();
  serial.open(portName);
  serial.on('data', gotData);
  textSize(32);
}

function gotData() {
  let currentString = serial.readLine();
  trim(currentString);
  if (!currentString) return;
  //console.log(currentString);
  ldr_value = currentString;
  //latestData = currentString;
  
}

function draw() {
  background(200);
  text(("ldr value = "+ldr_value), 100, 200)
}
