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
      <color attach="background" args={["#a8c4d4"]} />
      <fog attach="fog" args={["#a8c4d4", 110, 210]} />

      <hemisphereLight intensity={1.1} color="#cfe2ef" groundColor="#6f7f5e" />
      <directionalLight
        position={[40, 52, 24]}
        intensity={2.2}
        color="#ffe9c9"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={200}
        shadow-bias={-0.0004}
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
