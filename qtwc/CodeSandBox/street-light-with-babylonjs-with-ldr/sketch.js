import { switch1 } from "./streetLightSim.js";

function gotData(data) {
  console.log("data: ", data);
  if (data < 300) {
    switch1(true);
  } else {
    switch1(false);
  }
}
window["gotData"] = gotData;
