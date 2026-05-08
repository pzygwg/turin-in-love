import React, { useRef, useEffect } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  MeshBuilder,
  Texture,
  StandardMaterial,
  GlowLayer,
  SpotLight,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import styles from "./MainMenu.module.css";

export default function MainMenu({ onPlay, onSucces }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true, { antialias: true });

    let disposed = false;

    const createScene = async () => {
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0.08, 0.06, 0.12, 1);

      // Rotating camera centered in the restaurant
      const camera = new ArcRotateCamera(
        "menuCam",
        0,
        Math.PI / 2.5,
        0.01,
        new Vector3(-40, 5, -120),
        scene,
      );
      camera.fov = 0.9;
      // No user control — auto-rotate only
      camera.inputs.clear();

      // Load restaurant
      const { ImportMeshAsync } = await import("@babylonjs/core");
      const restaurantResult = await ImportMeshAsync(
        "/assets/restaurant_in_the_evening.glb",
        scene,
      );
      const restaurantRoot = restaurantResult.meshes[0];
      restaurantRoot.scaling = restaurantRoot.scaling.multiplyByFloats(10, 10, 10);

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

      // Ambient light
      const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
      ambient.intensity = 0.4;
      ambient.diffuse = new Color3(0.95, 0.9, 0.85);
      ambient.groundColor = new Color3(0.3, 0.25, 0.2);

      // Table lights (same as game scene)
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

      const glow = new GlowLayer("glow", scene, {
        mainTextureFixedSize: 256,
        blurKernelSize: 16,
      });
      glow.intensity = 0.3;

      tableLightDefs.forEach((pos, i) => {
        const coneHeight = 30;
        const coneRadius = 15;

        const outerCone = MeshBuilder.CreateCylinder(`menuConeOuter_${i}`, {
          diameterTop: 0,
          diameterBottom: coneRadius * 2,
          height: coneHeight,
          tessellation: 32,
        }, scene);
        outerCone.position = new Vector3(pos[0], pos[1] - coneHeight / 2, pos[2]);
        const outerMat = new StandardMaterial(`menuConeOuterMat_${i}`, scene);
        outerMat.emissiveColor = new Color3(1, 0.85, 0.4);
        outerMat.alpha = 0.04;
        outerMat.disableLighting = true;
        outerCone.material = outerMat;

        const innerCone = MeshBuilder.CreateCylinder(`menuConeInner_${i}`, {
          diameterTop: 0,
          diameterBottom: coneRadius * 0.7,
          height: coneHeight * 0.8,
          tessellation: 32,
        }, scene);
        innerCone.position = new Vector3(pos[0], pos[1] - (coneHeight * 0.8) / 2, pos[2]);
        const innerMat = new StandardMaterial(`menuConeInnerMat_${i}`, scene);
        innerMat.emissiveColor = new Color3(1, 0.95, 0.7);
        innerMat.alpha = 0.08;
        innerMat.disableLighting = true;
        innerCone.material = innerMat;

        const spot = new SpotLight(
          `menuSpot_${i}`,
          new Vector3(pos[0], pos[1], pos[2]),
          new Vector3(0, -1, 0),
          Math.PI / 3,
          1.5,
          scene,
        );
        spot.diffuse = new Color3(1, 0.9, 0.6);
        spot.intensity = 6;
        spot.range = 60;
      });

      // Auto-rotate
      let alpha = 0;
      scene.registerBeforeRender(() => {
        alpha += 0.001;
        camera.alpha = alpha;
      });

      engine.runRenderLoop(() => {
        if (!disposed) scene.render();
      });
    };

    createScene();

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      engine.dispose();
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.overlay}>
        <div className={styles.content}>
          <img src="/assets/logo.png" alt="Turin' in Love" className={styles.logo} />
          <div className={styles.buttons}>
            <button className={styles.btnPlay} onClick={onPlay}>
              Jouer
            </button>
            <button className={styles.btnSucces} onClick={onSucces}>
              Succès
            </button>
          </div>
        </div>
        <button className={styles.btnSettings} aria-label="Settings">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
