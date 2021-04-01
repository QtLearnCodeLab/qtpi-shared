let proximity, color, ambience, gesture;

function gotData(data) {
  var d = JSON.parse(data);
  proximity = d.proximity;
  color = d.color;
  ambience = d.ambience;
  gesture = d.gesture;
  console.log(
    "COLOR:" +
      color +
      "  PROXIMITY:" +
      proximity +
      "   AMBIENCE:" +
      ambience +
      "  GESTURE:" +
      gesture
  );
}

window["gotData"] = gotData;
