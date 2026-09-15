"use client";

import { IsoCamera } from "./IsoCamera";
import { IsoInteractions } from "./IsoInteractions";
import { IsoWalker } from "./IsoWalker";
import { Structure } from "./kit/Structure";
import { Terrain } from "./kit/Terrain";
import { BUILDINGS } from "./world/map";

/**
 * Daylight, which is the whole point of the difference from the side-scroller.
 *
 * One strong sun low enough to throw long shadows across the ground — in a
 * top-down view the shadows are what give the buildings height — plus a sky
 * fill so the shaded faces stay readable rather than going black.
 */
export function IsoScene() {
  return (
    <>
      <color attach="background" args={["#9dbccf"]} />
      <fog attach="fog" args={["#9dbccf", 150, 290]} />

      {/*
        * Fill, kept low on purpose.
        *
        * At 1.15 the sky light was flooding every shadow back to nearly full
        * brightness: the shadow maps were rendering correctly the whole time
        * and simply could not be seen, which left every pale object looking
        * like it was floating above the grass rather than sitting on it.
        */}
      <hemisphereLight intensity={0.5} color="#d6e8f2" groundColor="#6a7a55" />
      {/*
        * Key light, deliberately opposite the camera on X.
        *
        * It used to sit at +X +Z — the same side the camera looks from — so
        * every shadow fell away from the viewer and tucked itself behind the
        * object casting it. The shadow maps were correct the whole time and
        * simply invisible. From -X the shadows fall across the ground to the
        * right, while the +Z component keeps the faces turned towards the
        * camera lit rather than silhouetted.
        */}
      <directionalLight
        position={[-32, 54, 22]}
        intensity={2.9}
        color="#ffe9c9"
        castShadow
        /*
         * Shadow softness, the hard way.
         *
         * drei's SoftShadows patches a three.js shader chunk this version has
         * changed and the whole fragment shader stops compiling; variance
         * shadow maps produce no shadow at all here and leave white bleed on
         * the grass. So: plain PCF, but with the shadow camera pulled in tight
         * around the archipelago, which buys back most of the quality by
         * spending far more texels per unit of ground.
         */
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={190}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />

      <Terrain />

      {BUILDINGS.map((building) => (
        <Structure key={building.id} building={building} />
      ))}

      <IsoWalker />
      <IsoCamera />
      <IsoInteractions />
    </>
  );
}
