var createScene = function () {
  var scene = new BABYLON.Scene(engine);
  scene.enablePhysics(
    new BABYLON.Vector3(0, -9.8, 0),
    new BABYLON.AmmoJSPlugin()
  );

  // This creates and positions a free camera (non-mesh)
  var camera = new BABYLON.FreeCamera(
    "camera1",
    new BABYLON.Vector3(0, 0, -50),
    scene
  );
  //var camera = new BABYLON.ArcRotateCamera("Camera", BABYLON.Tools.ToRadians(-120), BABYLON.Tools.ToRadians(80), 65, new BABYLON.Vector3(0, -15, 0), scene);    camera.attachControl(canvas, false);

  // This targets the camera to scene origin
  camera.setTarget(BABYLON.Vector3.Zero());

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  var light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  // Default intensity is 1. Let's dim the light a small amount
  light.intensity = 0.7;

  // Environment
  var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
    "https://playground.babylonjs.com/textures/environment.dds",
    scene
  );
  hdrTexture.name = "envTex";
  hdrTexture.gammaSpace = false;
  scene.environmentTexture = hdrTexture;

  var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
    "https://playground.babylonjs.com/textures/skybox",
    scene
  );
  skyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;

  var marbleMaterialArray = [];

  BABYLON.SceneLoader.ImportMesh(
    "",
    "https://models.babylonjs.com/Marble/marble/",
    "marble.gltf",
    scene,
    function (newMeshes) {
      var marble = scene.getMeshByName("marble");
      marble.setParent(null);
      marble.visibility = 0;

      marbleMaterialArray.push(
        scene.getMaterialByName("blueMat"),
        scene.getMaterialByName("greenMat"),
        scene.getMaterialByName("redMat"),
        scene.getMaterialByName("purpleMat"),
        scene.getMaterialByName("yellowMat")
      );
    }
  );

  BABYLON.SceneLoader.ImportMesh(
    "",
    "https://models.babylonjs.com/",
    "target.glb",
    scene
  );

  var bullsEye = BABYLON.MeshBuilder.CreateCylinder(
    "bullsEye",
    { tessellation: 15 },
    scene
  );
  bullsEye.rotation.x -= BABYLON.Tools.ToRadians(90);
  bullsEye.scaling = new BABYLON.Vector3(4.25, 0.2, 4.25);
  bullsEye.visibility = 0;

  var killBox = BABYLON.MeshBuilder.CreateBox(
    "killBox",
    { width: 1000, depth: 1000, height: 0.5 },
    scene
  );
  killBox.position = new BABYLON.Vector3(0, -50, 0);
  killBox.visibility = 0;
  var goal = 0;
  var recentlyFired = 0;
  function shoot(data) {
    if (data) {
      if (recentlyFired === 0) {
        recentlyFired = 1;
        var marble = scene.getMeshByName("marble").clone("marbleClone");
        marble.position = camera.position;
        marble.visibility = 1;
        marble.physicsImpostor = new BABYLON.PhysicsImpostor(
          marble,
          BABYLON.PhysicsImpostor.SphereImpostor,
          { mass: 2, friction: 0.5, restitution: 0 },
          scene
        );
        marble.material = marbleMaterialArray[Math.floor(Math.random() * 5)];
        marble.physicsImpostor.applyForce(
          camera.getForwardRay().direction.scale(5000),
          marble.getAbsolutePosition()
        );

        marble.actionManager = new BABYLON.ActionManager(scene);
        marble.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            {
              trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
              parameter: bullsEye
            },
            function () {
              var audio = new Audio(
                "https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3"
              );

              audio.play();
              goal++;
              document.getElementById("goals").innerText = goal;
              console.log("Goal!", goal);
            }
          )
        );

        marble.actionManager.registerAction(
          new BABYLON.ExecuteCodeAction(
            {
              trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
              parameter: killBox
            },
            function () {
              marble.dispose();
            }
          )
        );
      } else {
        recentlyFired = 0;
      }
    }
  }

  scene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.type) {
      case BABYLON.KeyboardEventTypes.KEYDOWN:
        if (recentlyFired === 0 && kbInfo.event.key === " ") {
          recentlyFired = 1;
          var marble = scene.getMeshByName("marble").clone("marbleClone");
          marble.position = camera.position;
          marble.visibility = 1;
          marble.physicsImpostor = new BABYLON.PhysicsImpostor(
            marble,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 2, friction: 0.5, restitution: 0 },
            scene
          );
          marble.material = marbleMaterialArray[Math.floor(Math.random() * 5)];
          marble.physicsImpostor.applyForce(
            camera.getForwardRay().direction.scale(5000),
            marble.getAbsolutePosition()
          );

          marble.actionManager = new BABYLON.ActionManager(scene);
          marble.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
              {
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: bullsEye
              },
              function () {
                var audio = new Audio(
                  "https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3"
                );

                audio.play();
                goal++;

                document.getElementById("goals").innerText = goal;
                console.log("Goal!", goal);
              }
            )
          );

          marble.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
              {
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: killBox
              },
              function () {
                marble.dispose();
              }
            )
          );
        }
        break;
      case BABYLON.KeyboardEventTypes.KEYUP:
        if (kbInfo.event.key == " ") {
          recentlyFired = 0;
        }
        break;
      default:
    }
  });
  var abc = { shoot: shoot };
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
var shoot = scene.shoot;

export { shoot };
