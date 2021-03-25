export class Game {
  constructor(canvasSelector = "canvas") {
    this._canvas = document.querySelector(canvasSelector);
    this._engine = new BABYLON.Engine(this._canvas);

    // Scene
    this._scene = new BABYLON.Scene(this._engine);

    // Camera
    this._camera = new BABYLON.ArcRotateCamera(
      "Main Camera",
      Math.PI / 8,
      1.3,
      25,
      BABYLON.Vector3.Zero(),
      this._scene
    );

    this._camera.attachControl(this._canvas);

    // Light
    const light = new BABYLON.HemisphericLight(
      "mainLight",
      new BABYLON.Vector3(0, -6, 0),
      this._scene
    );

    light.intensity = 0.7;
    this._scene.clearColor = new BABYLON.Color3(1, 1, 1);
    var gotResult;

    this.fight = function (data) {
      console.log("RECIEVED", gotResult, gotResult.animationGroups[0]);

      if (data) {
        gotResult.animationGroups[0].start(true);
      } else {
        gotResult.animationGroups[0].stop();
      }
    };

    BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "src/assets/",
      "fight2.glb",
      this._scene,
      (fightMesh) => {
        fightMesh.position = new BABYLON.Vector3(0, 0, 0);
      }
    ).then((result) => {
      gotResult = result;
      this.fight(false);
      console.log(
        "animation:",
        result.animationGroups.length,
        result.animationGroups[0]
      );
    });

    // Render Loop
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });
  }
}
