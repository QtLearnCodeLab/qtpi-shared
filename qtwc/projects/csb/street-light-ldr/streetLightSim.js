var createScene = function () {
  var scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    (3 * Math.PI) / 2,
    Math.PI / 2.2,
    50,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    "hemi",
    new BABYLON.Vector3(0, 50, 0)
  );
  light.intensity = 0.5;

  //add a spotlight and later after a mesh lamp post and a bulb have been created
  //then will make the post a parent to the bulb and
  //the bulb to the parent
  const lampLight = new BABYLON.SpotLight(
    "lampLight",
    BABYLON.Vector3.Zero(),
    new BABYLON.Vector3(0, -1, 0),
    Math.PI,
    1,
    scene
  );
  // lampLight.diffuse = BABYLON.Color3.Yellow();

  //shape to extrude
  const lampShape = [];
  for (let i = 0; i < 20; i++) {
    lampShape.push(
      new BABYLON.Vector3(
        Math.cos((i * Math.PI) / 10),
        Math.sin((i * Math.PI) / 10),
        0
      )
    );
  }
  lampShape.push(lampShape[0]); //close shape

  //extrusion path
  const lampPath = [];
  lampPath.push(new BABYLON.Vector3(0, 0, 0));
  lampPath.push(new BABYLON.Vector3(0, 10, 0));
  for (let i = 0; i < 20; i++) {
    lampPath.push(
      new BABYLON.Vector3(
        1 + Math.cos(Math.PI - (i * Math.PI) / 40),
        10 + Math.sin(Math.PI - (i * Math.PI) / 40),
        0
      )
    );
  }
  lampPath.push(new BABYLON.Vector3(3, 11, 0));

  const yellowMat = new BABYLON.StandardMaterial("yellowMat");
  yellowMat.emissiveColor = BABYLON.Color3.Yellow();

  const blackMat = new BABYLON.StandardMaterial("blackMat");
  blackMat.emissiveColor = BABYLON.Color3.Black();

  //extrude lamp
  const lamp = BABYLON.MeshBuilder.ExtrudeShape("lamp", {
    cap: BABYLON.Mesh.CAP_END,
    shape: lampShape,
    path: lampPath,
    scale: 0.5
  });

  //add bulb
  const bulb = BABYLON.MeshBuilder.CreateSphere("bulb", {
    diameterX: 1.5,
    diameterZ: 0.8
  });

  // bulb.material = yellowMat;
  bulb.parent = lamp;
  bulb.position.x = 2;
  bulb.position.y = 10.5;

  var lamp_state = 0;
  function switch1(data) {
    if (data) {
      lampLight.diffuse = BABYLON.Color3.Yellow();
      bulb.material = yellowMat;
    } else {
      lampLight.diffuse = BABYLON.Color3.Gray();
      bulb.material = blackMat;
    }
  }

  //control from keyboard - Press Spacebar to control!!!
  scene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        if (lamp_state === 0 && kbInfo.event.key === " ") {
          //give yellow colour to lamp
          lampLight.diffuse = BABYLON.Color3.Yellow();
          bulb.material = yellowMat;
          lamp_state = 1;
        } else if (lamp_state === 1 && kbInfo.event.key === " ") {
          //give white colour to lamp
          lampLight.diffuse = BABYLON.Color3.Gray();
          bulb.material = blackMat;
          lamp_state = 0;
        }
        break;
      default:
    }
  });

  lampLight.parent = bulb;

  const ground = BABYLON.MeshBuilder.CreateGround("ground", {
    width: 50,
    height: 50
  });
  var abc = { switch1: switch1 };
  scene = Object.assign(scene, abc);
  return scene;
};

const canvas = document.getElementById("renderCanvas"); // Get the canvas element
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
const scene = createScene(); //Call the createScene function
// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
  scene.render();
});
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});
var switch1 = scene.switch1;
export { switch1 };
