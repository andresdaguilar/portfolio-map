"use client";

import { CameraRig } from "./CameraRig";
import { DevBridge } from "./DevBridge";
import { Interactions } from "./Interactions";
import { Player } from "./Player";
import { Building } from "./world/Building";
import { PALETTE } from "./fx/palette";
import { DEPTH, FOG_RANGE } from "./core/constants";
import { BUILDING } from "./world/zones/building";

/**
 * The lighting rig.
 *
 * Three lights, and that is the budget. A dim hemisphere so shadows are not
 * holes, a cold directional from behind to catch the edge of every silhouette,
 * and one warm practical standing in for a lamp. Inside's frames are mostly
 * darkness with a single thing lit; adding a fourth light is almost always the
 * wrong fix for "I cannot see it".
 */
export function Scene() {
  return (
    <>
      <fog attach="fog" args={[PALETTE.haze, FOG_RANGE.near, FOG_RANGE.far]} />
      <color attach="background" args={[PALETTE.haze]} />

      <hemisphereLight intensity={0.6} color={PALETTE.rim} groundColor={PALETTE.basement} />

      <directionalLight
        position={[14, 20, -16]}
        intensity={1.35}
        color={PALETTE.rim}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={32}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0006}
      />

      <pointLight
        position={[9, 6.5, 5]}
        intensity={120}
        distance={42}
        decay={2}
        color={PALETTE.accent}
      />

      {/* The haze wall. Far enough back that fog has eaten it entirely, so it
          renders as flat fog colour and every silhouette has something to read
          against. This plane is the light source of the composition. */}
      <mesh position={[0, 20, DEPTH.haze]}>
        <planeGeometry args={[400, 160]} />
        <meshBasicMaterial color={PALETTE.haze} fog={false} />
      </mesh>

      <Building />
      <Player colliders={BUILDING} />
      <CameraRig />
      <Interactions />
      <DevBridge colliders={BUILDING} />
    </>
  );
}
