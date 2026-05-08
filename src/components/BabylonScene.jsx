import React, { useRef, useEffect } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  FreeCamera,
  Vector3,
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
  SpotLight,
  PointLight,
  ShadowGenerator,
  MeshBuilder,
  Texture,
  StandardMaterial,
  GlowLayer,
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

      // Debug: log material types to understand why spotlights don't work
      restaurantResult.meshes.forEach((m) => {
        if (m.material) {
          const mat = m.material;
          console.log(
            `[MAT] ${m.name} → type: ${mat.getClassName()}, unlit: ${mat.unlit}, albedo: ${mat.albedoColor}, emissive: ${mat.emissiveColor}, emissiveTex: ${!!mat.emissiveTexture}, albedoTex: ${!!mat.albedoTexture}`,
          );
        }
      });

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
      const skybox = MeshBuilder.CreateSphere(
        "skybox",
        { diameter: 1000, sideOrientation: 1 },
        scene,
      );
      const skyMat = new StandardMaterial("skyMat", scene);
      skyMat.backFaceCulling = false;
      skyMat.disableLighting = true;
      const skyTex = new Texture("/assets/SKY.png", scene);
      skyTex.coordinatesMode = Texture.SPHERICAL_MODE;
      skyMat.diffuseTexture = skyTex;
      skyMat.emissiveTexture = skyTex;
      skybox.material = skyMat;
      skybox.infiniteDistance = true;

      // Soft ambient light — lets the restaurant PBR textures show their baked look
      const ambient = new HemisphericLight(
        "ambient",
        new Vector3(0, 1, 0),
        scene,
      );
      ambient.intensity = 0.4;
      ambient.diffuse = new Color3(0.95, 0.9, 0.85);
      ambient.groundColor = new Color3(0.3, 0.25, 0.2);

      // Table lights — PointLights above tables
      const tableLightDefs = [
        [-52.97, 20.02, -58.85],
        [-16.19, 20.57, -85.25],
        [-14.91, 17.04, -53.87],
        [-21.27, 22.06, -134.22],
        [-23.2, 16.35, -164.83],
        [-62.89, 21.39, -143.17],
        [-64.01, 16.78, -201.57],
        [-52.86, 22.83, -273.31],
        [-20.37, 18.12, -198.38],
        [-88.83, 24.6, -128.77],
      ];
      // Glow layer for volumetric light dispersion
      const glow = new GlowLayer("glow", scene, {
        mainTextureFixedSize: 256,
        blurKernelSize: 16,
      });
      glow.intensity = 0.3;

      tableLightDefs.forEach((pos, i) => {
        const coneHeight = 30;
        const coneRadius = 15;

        // Outer soft cone — large glow halo
        const outerCone = MeshBuilder.CreateCylinder(
          `tableConeOuter_${i}`,
          {
            diameterTop: 0,
            diameterBottom: coneRadius * 2.5,
            height: coneHeight,
            tessellation: 32,
          },
          scene,
        );
        const outerMat = new StandardMaterial(`tableConeOuterMat_${i}`, scene);
        outerMat.emissiveColor = new Color3(1, 0.8, 0.3);
        outerMat.diffuseColor = new Color3(0, 0, 0);
        outerMat.alpha = 0.04;
        outerMat.backFaceCulling = false;
        outerMat.disableLighting = true;
        outerCone.material = outerMat;
        outerCone.position = new Vector3(
          pos[0],
          pos[1] - coneHeight / 2,
          pos[2],
        );
        glow.addIncludedOnlyMesh(outerCone);

        // Inner bright cone — core beam
        const innerCone = MeshBuilder.CreateCylinder(
          `tableConeInner_${i}`,
          {
            diameterTop: 0,
            diameterBottom: coneRadius * 1.2,
            height: coneHeight,
            tessellation: 32,
          },
          scene,
        );
        const innerMat = new StandardMaterial(`tableConeInnerMat_${i}`, scene);
        innerMat.emissiveColor = new Color3(1, 0.9, 0.5);
        innerMat.diffuseColor = new Color3(0, 0, 0);
        innerMat.alpha = 0.08;
        innerMat.backFaceCulling = false;
        innerMat.disableLighting = true;
        innerCone.material = innerMat;
        innerCone.position = new Vector3(
          pos[0],
          pos[1] - coneHeight / 2,
          pos[2],
        );
        glow.addIncludedOnlyMesh(innerCone);

        // SpotLight pointing downward for actual light dispersion
        const spot = new SpotLight(
          `tableSpot_${i}`,
          new Vector3(pos[0], pos[1], pos[2]),
          new Vector3(0, -1, 0),
          Math.PI / 3,
          1.5,
          scene,
        );
        spot.diffuse = new Color3(1, 0.85, 0.4);
        spot.intensity = 6;
        spot.range = 60;
      });

      // Directional sunlight from new position toward the scene
      const sunPos = new Vector3(332.19, 157.44, -265.07);
      const sunDir = CAMERA_POS.subtract(sunPos).normalize();
      const sunLight = new DirectionalLight("sunLight", sunDir, scene);
      sunLight.position = sunPos;
      sunLight.intensity = 1.5;
      sunLight.diffuse = new Color3(1.0, 0.95, 0.85);

      // Shadow generator — robot casts shadows onto restaurant
      const shadowGen = new ShadowGenerator(2048, sunLight);
      shadowGen.useBlurExponentialShadowMap = true;
      shadowGen.blurKernel = 32;

      // Restaurant receives shadows + make materials respond to lights
      restaurantResult.meshes.forEach((m) => {
        m.receiveShadows = true;
        if (m.material) {
          m.material.maxSimultaneousLights = 16;
          // glTF models often use unlit materials (baked lighting) — enable lighting
          if (m.material.unlit !== undefined) {
            m.material.unlit = false;
          }
        }
      });

      // Load robot model
      const robotResult = await ImportMeshAsync("/assets/robot.glb", scene);
      const robotRoot = robotResult.meshes[0];

      // Stop all animations first, then play sit-talking
      scene.animationGroups.forEach((ag) => ag.stop());

      robotRoot.position = new Vector3(-51.1, -17.5, -67.38);
      robotRoot.scaling.setAll(0.07);
      robotRoot.rotationQuaternion = null;
      const dx = CAMERA_POS.x - robotRoot.position.x;
      const dz = CAMERA_POS.z - robotRoot.position.z;
      robotRoot.rotation.y =
        Math.atan2(dx, dz) + Math.PI + (210 * Math.PI) / 180;

      // Play sit-talking animation (loop), then re-enforce root transform
      const sitAnim = scene.animationGroups.find(
        (ag) => ag.name === "sit-talking",
      );
      if (sitAnim) {
        sitAnim.start(true);
        // Prevent animation from overriding root node transform
        sitAnim.targetedAnimations.forEach((ta) => {
          if (ta.target === robotRoot) {
            sitAnim.removeTargetedAnimation(ta.animation);
          }
        });
      }

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

      // Robot casts shadows
      robotResult.meshes.forEach((m) => {
        if (m.getTotalVertices() > 0) {
          shadowGen.addShadowCaster(m);
        }
      });

      // Debug mode (F2)
      let debugCamera = null;
      const keysDown = new Set();
      const MOVE_SPEED = 5;
      const ROBOT_MOVE_STEP = 0.1;
      const ROBOT_SCALE_STEP = 0.1;
      let editingRobot = false;
      const coneLights = []; // { light, cone } pairs
      let selectedCone = -1; // index of currently selected cone light
      const CONE_ANGLE_STEP = 0.05;
      const CONE_INTENSITY_STEP = 0.5;
      const CONE_EXPONENT_STEP = 0.5;
      const CONE_RANGE_STEP = 5;
      const CONE_MOVE_STEP = 0.5;

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

        // Cone light controls (only in debug mode, not in robot edit mode)
        if (!editingRobot) {
          // L = place new cone light at camera position, pointing down
          if (e.code === "KeyL") {
            const cam = debugCamera || camera;
            const pos = cam.position.clone();
            const idx = coneLights.length;
            const light = new SpotLight(
              `coneLight_${idx}`,
              pos,
              new Vector3(0, -1, 0), // pointing down
              Math.PI / 4, // angle (45°)
              2, // exponent (falloff)
              scene,
            );
            light.intensity = 5;
            light.diffuse = new Color3(1, 0.95, 0.85); // warm white
            light.range = 50;

            // Visual cone helper mesh
            const cone = MeshBuilder.CreateCylinder(
              `coneHelper_${idx}`,
              {
                diameterTop: 0,
                diameterBottom: 2 * Math.tan(light.angle) * 5,
                height: 5,
                tessellation: 16,
              },
              scene,
            );
            const coneMat = new StandardMaterial(`coneMat_${idx}`, scene);
            coneMat.emissiveColor = new Color3(1, 0.9, 0.3);
            coneMat.alpha = 0.15;
            coneMat.wireframe = true;
            coneMat.disableLighting = true;
            cone.material = coneMat;
            cone.position = pos.clone();
            cone.position.y -= 2.5; // offset so top is at light position

            coneLights.push({ light, cone });
            selectedCone = idx;
            return;
          }

          // N/P = cycle through cone lights (Next/Previous)
          if (e.code === "KeyN" && coneLights.length > 0) {
            selectedCone = (selectedCone + 1) % coneLights.length;
            return;
          }
          if (e.code === "KeyP" && coneLights.length > 0) {
            selectedCone =
              (selectedCone - 1 + coneLights.length) % coneLights.length;
            return;
          }

          // Delete selected cone light with X
          if (e.code === "KeyX" && selectedCone >= 0 && coneLights.length > 0) {
            const removed = coneLights.splice(selectedCone, 1)[0];
            removed.light.dispose();
            removed.cone.dispose();
            selectedCone =
              coneLights.length > 0
                ? Math.min(selectedCone, coneLights.length - 1)
                : -1;
            return;
          }

          // Adjust selected cone light
          if (selectedCone >= 0 && selectedCone < coneLights.length) {
            const cl = coneLights[selectedCone];
            const updateHelper = () => {
              cl.cone.dispose();
              const newCone = MeshBuilder.CreateCylinder(
                cl.cone.name,
                {
                  diameterTop: 0,
                  diameterBottom: 2 * Math.tan(cl.light.angle) * 5,
                  height: 5,
                  tessellation: 16,
                },
                scene,
              );
              newCone.material =
                cl.cone.material ||
                (() => {
                  const m = new StandardMaterial("cm", scene);
                  m.emissiveColor = new Color3(1, 0.9, 0.3);
                  m.alpha = 0.15;
                  m.wireframe = true;
                  m.disableLighting = true;
                  return m;
                })();
              newCone.position = cl.light.position.clone();
              newCone.position.y -= 2.5;
              cl.cone = newCone;
            };

            switch (e.code) {
              // Move light with numpad or IJKL-area keys
              case "ArrowUp":
                e.preventDefault();
                cl.light.position.z -= CONE_MOVE_STEP;
                cl.cone.position.z -= CONE_MOVE_STEP;
                break;
              case "ArrowDown":
                e.preventDefault();
                cl.light.position.z += CONE_MOVE_STEP;
                cl.cone.position.z += CONE_MOVE_STEP;
                break;
              case "ArrowLeft":
                e.preventDefault();
                cl.light.position.x -= CONE_MOVE_STEP;
                cl.cone.position.x -= CONE_MOVE_STEP;
                break;
              case "ArrowRight":
                e.preventDefault();
                cl.light.position.x += CONE_MOVE_STEP;
                cl.cone.position.x += CONE_MOVE_STEP;
                break;
              case "PageUp":
                e.preventDefault();
                cl.light.position.y += CONE_MOVE_STEP;
                cl.cone.position.y += CONE_MOVE_STEP;
                break;
              case "PageDown":
                e.preventDefault();
                cl.light.position.y -= CONE_MOVE_STEP;
                cl.cone.position.y -= CONE_MOVE_STEP;
                break;
              // Angle: [ / ]
              case "BracketLeft":
                cl.light.angle = Math.max(
                  0.1,
                  cl.light.angle - CONE_ANGLE_STEP,
                );
                updateHelper();
                break;
              case "BracketRight":
                cl.light.angle = Math.min(
                  Math.PI / 2,
                  cl.light.angle + CONE_ANGLE_STEP,
                );
                updateHelper();
                break;
              // Intensity: - / +  (with shift held)
              case "Comma":
                cl.light.intensity = Math.max(
                  0,
                  cl.light.intensity - CONE_INTENSITY_STEP,
                );
                break;
              case "Period":
                cl.light.intensity += CONE_INTENSITY_STEP;
                break;
              // Exponent (falloff): ; / '
              case "Semicolon":
                cl.light.exponent = Math.max(
                  0,
                  cl.light.exponent - CONE_EXPONENT_STEP,
                );
                break;
              case "Quote":
                cl.light.exponent += CONE_EXPONENT_STEP;
                break;
              // Range: , / . (with shift → < / >)
              case "Minus":
                e.preventDefault();
                cl.light.range = Math.max(1, cl.light.range - CONE_RANGE_STEP);
                break;
              case "Equal":
                e.preventDefault();
                cl.light.range += CONE_RANGE_STEP;
                break;
            }
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
          let coneInfo = `\n--- Cone Lights (${coneLights.length}) ---\n`;
          if (coneLights.length === 0) {
            coneInfo += `L = place cone light at camera pos\n`;
          } else {
            coneInfo += `L=Add  N/P=Cycle  X=Delete\n`;
            coneInfo += `Arrows=MoveXZ  PgUp/Dn=MoveY\n`;
            coneInfo += `[/]=Angle  ,/.=Intensity  ;/'=Exponent  -/+=Range\n\n`;
            coneLights.forEach((cl, i) => {
              const lp = cl.light.position;
              const sel = i === selectedCone ? " ◄" : "";
              coneInfo += `[${i}]${sel} pos:(${lp.x.toFixed(2)}, ${lp.y.toFixed(2)}, ${lp.z.toFixed(2)})\n`;
              coneInfo += `    angle:${cl.light.angle.toFixed(2)} int:${cl.light.intensity.toFixed(1)} exp:${cl.light.exponent.toFixed(1)} range:${cl.light.range.toFixed(0)}\n`;
            });
          }

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
            (editingRobot
              ? `Arrows=XZ  PgUp/PgDn=Y  +/-=Scale  R=Rotate`
              : ``) +
            coneInfo;
        }
      });

      // Store cleanup ref
      scene._cleanupExtras = () => {
        window.removeEventListener("keydown", onKey);
        if (debugCamera) {
          debugCamera.detachControl();
          debugCamera.dispose();
        }
        coneLights.forEach(({ light, cone }) => {
          light.dispose();
          cone.dispose();
        });
        coneLights.length = 0;
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
