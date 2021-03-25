import { shoot } from "./dartSim.js";

function gotData(data) {
  console.log("data: ", data);
  shoot(data === 1);
}
window["gotData"] = gotData;
