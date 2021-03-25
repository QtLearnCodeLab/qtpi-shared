import { Game } from "./src/js/main.js";

let game = new Game(".renderCanvas");
console.log("fight is ", game.fight);

function gotData(data) {
  game.fight(data === 1);
}

window["gotData"] = gotData;
