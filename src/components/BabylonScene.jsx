import React, { useRef, useEffect } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  FreeCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  GlowLayer,
  MeshBuilder,
  Texture,
  StandardMaterial,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

const CAMERA_POS = new Vector3(-59.21, -2, -45.87);
const CAMERA_TARGET = new Vector3(-47.7, -9.1, -76.6);
const CAMERA_FOV = 0.9;

export default function BabylonScene({ onReady }) {
  const canvasRef = useRef(null);
  const calledReady = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { antialias: true });

    let debugMode = false;

    const createScene = async () => {
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0.08, 0.06, 0.12, 1);

      // Camera
      const camera = new ArcRotateCamera(
        "camera",
        0,
        Math.PI / 2,
        0.01,
        CAMERA_POS.clone(),
        scene,
      );
      camera.fov = CAMERA_FOV;

      const dir = CAMERA_TARGET.subtract(CAMERA_POS);
      camera.alpha = -Math.atan2(dir.z, dir.x) + Math.PI / 2;
      camera.beta = Math.acos(dir.y / dir.length());
      const baseAlpha = camera.alpha;
      const baseBeta = camera.beta;

      camera.lowerAlphaLimit = baseAlpha - Math.PI / 2;
      camera.upperAlphaLimit = baseAlpha + Math.PI / 2;
      camera.lowerBetaLimit = baseBeta - Math.PI / 4;
      camera.upperBetaLimit = baseBeta + Math.PI / 4;

      camera.lowerRadiusLimit = 0.01;
      camera.upperRadiusLimit = 0.01;
      camera.panningSensibility = 0;
      camera.pinchDeltaPercentage = 0;
      camera.wheelPrecision = 999999;
      camera.attachControl(canvas, true);

      // Load restaurant
      const { ImportMeshAsync } = await import("@babylonjs/core");
      const restaurantResult = await ImportMeshAsync(
        "/assets/restaurant_in_the_evening.glb",
        scene,
      );
      const restaurantRoot = restaurantResult.meshes[0];
      restaurantRoot.scaling = restaurantRoot.scaling.multiplyByFloats(
        10,
        10,
        10,
      );

      // Log restaurant bounds
      restaurantRoot.computeWorldMatrix(true);
      const restBounds = restaurantRoot.getHierarchyBoundingVectors(true);
      console.log(
        "Restaurant bounds min:",
        restBounds.min.toString(),
        "max:",
        restBounds.max.toString(),
      );
      console.log(
        "Restaurant size:",
        restBounds.max.subtract(restBounds.min).toString(),
      );

      // Skybox
      const skybox = MeshBuilder.CreateSphere("skybox", { diameter: 1000, sideOrientation: 1 }, scene);
      const skyMat = new StandardMaterial("skyMat", scene);
      skyMat.backFaceCulling = false;
      skyMat.disableLighting = true;
      const skyTex = new Texture("/assets/SKY.png", scene);
      skyTex.coordinatesMode = Texture.SPHERICAL_MODE;
      skyMat.diffuseTexture = skyTex;
      skyMat.emissiveTexture = skyTex;
      skybox.material = skyMat;
      skybox.infiniteDistance = true;

      // Ambient light
      const ambient = new HemisphericLight(
        "ambient",
        new Vector3(0, 1, 0),
        scene,
      );
      ambient.intensity = 0.8;
      ambient.diffuse = new Color3(0.95, 0.9, 0.85);
      ambient.groundColor = new Color3(0.3, 0.25, 0.2);

      // Load robot model
      const robotResult = await ImportMeshAsync("/assets/robot.glb", scene);
      const robotRoot = robotResult.meshes[0];
      robotRoot.position = new Vector3(-51.1, -17.5, -67.38);
      robotRoot.scaling.setAll(0.07);
      const dx = CAMERA_POS.x - robotRoot.position.x;
      const dz = CAMERA_POS.z - robotRoot.position.z;
      robotRoot.rotation.y = Math.atan2(dx, dz) + Math.PI;

      // Log robot info for debugging
      console.log(
        "Robot meshes:",
        robotResult.meshes.map((m) => m.name),
      );
      robotRoot.computeWorldMatrix(true);
      const bounds = robotRoot.getHierarchyBoundingVectors(true);
      console.log(
        "Robot bounds min:",
        bounds.min.toString(),
        "max:",
        bounds.max.toString(),
      );

      // Glow
      const gl = new GlowLayer("glow", scene);
      gl.intensity = 0.6;

      // Debug mode (F2)
      let debugCamera = null;
      const keysDown = new Set();
      const MOVE_SPEED = 5;
      const ROBOT_MOVE_STEP = 0.1;
      const ROBOT_SCALE_STEP = 0.1;
      let editingRobot = false;

      const debugDiv = document.createElement("div");
      debugDiv.id = "camera-debug";
      debugDiv.style.cssText =
        "display:none;position:absolute;top:10px;left:10px;color:#0ff;font-family:'Courier New',monospace;font-size:12px;background:#000a;padding:10px;border:1px solid #0ff3;border-radius:4px;z-index:999;pointer-events:none;white-space:pre;";
      document.body.appendChild(debugDiv);

      const onKey = (e) => {
        if (e.key === "F2") {
          debugMode = !debugMode;
          debugDiv.style.display = debugMode ? "block" : "none";
          if (debugMode) {
            // Switch to FreeCamera for ZQSD movement
            camera.detachControl();
            const pos = camera.target.clone();
            debugCamera = new FreeCamera("debugCam", pos, scene);
            debugCamera.fov = camera.fov;
            debugCamera.rotation.y = camera.alpha - Math.PI / 2;
            debugCamera.rotation.x = camera.beta - Math.PI / 2;
            debugCamera.minZ = 0.01;
            debugCamera.speed = MOVE_SPEED;
            // ZQSD keys (AZERTY)
            debugCamera.keysUp = [90]; // Z
            debugCamera.keysDown = [83]; // S
            debugCamera.keysLeft = [81]; // Q
            debugCamera.keysRight = [68]; // D
            // Also support WASD
            debugCamera.keysUp.push(87); // W
            debugCamera.keysDown.push(83); // S (already there)
            debugCamera.keysLeft.push(65); // A
            debugCamera.keysRight.push(68); // D (already there)
            debugCamera.attachControl(canvas, true);
            scene.activeCamera = debugCamera;
          } else {
            // Restore ArcRotateCamera
            if (debugCamera) {
              debugCamera.detachControl();
              debugCamera.dispose();
              debugCamera = null;
            }
            editingRobot = false;
            camera.alpha = baseAlpha;
            camera.beta = baseBeta;
            camera.radius = 0.01;
            camera.target = CAMERA_POS.clone();
            camera.lowerAlphaLimit = baseAlpha - Math.PI / 2;
            camera.upperAlphaLimit = baseAlpha + Math.PI / 2;
            camera.lowerBetaLimit = baseBeta - Math.PI / 4;
            camera.upperBetaLimit = baseBeta + Math.PI / 4;
            camera.lowerRadiusLimit = 0.01;
            camera.upperRadiusLimit = 0.01;
            camera.attachControl(canvas, true);
            scene.activeCamera = camera;
          }
          return;
        }

        if (!debugMode) return;

        // Tab toggles robot editing mode
        if (e.key === "Tab") {
          e.preventDefault();
          editingRobot = !editingRobot;
          // Detach/reattach camera so movement keys don't conflict
          if (editingRobot && debugCamera) {
            debugCamera.detachControl();
          } else if (!editingRobot && debugCamera) {
            debugCamera.attachControl(canvas, true);
          }
          return;
        }

        if (editingRobot) {
          e.preventDefault();
          const p = robotRoot.position;
          const s = robotRoot.scaling;
          switch (e.code) {
            case "ArrowUp":
              p.z -= ROBOT_MOVE_STEP;
              break;
            case "ArrowDown":
              p.z += ROBOT_MOVE_STEP;
              break;
            case "ArrowLeft":
              p.x -= ROBOT_MOVE_STEP;
              break;
            case "ArrowRight":
              p.x += ROBOT_MOVE_STEP;
              break;
            case "PageUp":
              p.y += ROBOT_MOVE_STEP;
              break;
            case "PageDown":
              p.y -= ROBOT_MOVE_STEP;
              break;
            case "Equal":
              s.setAll(s.x + ROBOT_SCALE_STEP);
              break;
            case "Minus":
            case "NumpadSubtract":
              s.setAll(Math.max(0.01, s.x - ROBOT_SCALE_STEP));
              break;
            case "NumpadAdd":
              s.setAll(s.x + ROBOT_SCALE_STEP);
              break;
            case "KeyR":
              robotRoot.rotation.y += 0.1;
              break;
          }
        }
      };
      window.addEventListener("keydown", onKey);

      scene.onBeforeRenderObservable.add(() => {
        if (debugMode) {
          const cam = debugCamera || camera;
          const camPos = cam.position;
          const rp = robotRoot.position;
          const rs = robotRoot.scaling.x;
          const ry = robotRoot.rotation.y;
          debugDiv.textContent =
            `DEBUG MODE (F2 to exit)\n` +
            `ZQSD/WASD to move, mouse to look\n` +
            `Tab to toggle robot edit mode\n\n` +
            `Camera pos: (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)})\n` +
            `Camera FOV: ${cam.fov.toFixed(2)}\n\n` +
            `--- Robot ${editingRobot ? "[EDITING]" : "(Tab to edit)"} ---\n` +
            `Position: (${rp.x.toFixed(2)}, ${rp.y.toFixed(2)}, ${rp.z.toFixed(2)})\n` +
            `Scale:    ${rs.toFixed(2)}\n` +
            `Rot Y:    ${ry.toFixed(2)}\n` +
            (editingRobot ? `Arrows=XZ  PgUp/PgDn=Y  +/-=Scale  R=Rotate` : ``);
        }
      });

      // Store cleanup ref
      scene._cleanupExtras = () => {
        window.removeEventListener("keydown", onKey);
        if (debugCamera) {
          debugCamera.detachControl();
          debugCamera.dispose();
        }
        debugDiv.remove();
      };

      return scene;
    };

    let scene;
    createScene().then((s) => {
      scene = s;
      engine.runRenderLoop(() => scene.render());
      if (!calledReady.current) {
        calledReady.current = true;
        onReady?.();
      }
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (scene) {
        scene._cleanupExtras?.();
        scene.dispose();
      }
      engine.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        touchAction: "none",
        display: "block",
      }}
    />
  );
}
