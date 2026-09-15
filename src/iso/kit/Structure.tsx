"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
import { BOOKS } from "@/content";
import { makeTextTexture } from "@/game/world/kit/textTexture";
import { ISO_CAMERA } from "../core/constants";
import { walker } from "../player/walker";
import { C, type Building } from "../world/map";
import { Block } from "./Block";
import { Model } from "./Model";

/**
 * Everything that stands on the islands, built from primitives.
 *
 * Nothing is enclosed. A walled building in a fixed isometric view hides its
 * own contents and becomes a box you walk around, so a workplace is a desk on
 * a step, a studio is a table and a microphone, a library is shelving you can
 * see the spines of from across the water.
 */

/**
 * How close the walker must be for a place to name itself.
 *
 * Tied to the spacing of the things being named: the terrace landings sit 7
 * apart, so anything much beyond that has three signs shouting at once and the
 * map turns back into a labelled diagram.
 */
const LABEL_RANGE = 4.2;

/** Text on a surface, squared up to the camera, which never rotates. */
function Printed({
  text,
  width,
  color = "#1b222b",
}: {
  text: string;
  width: number;
  color?: string;
}) {
  const { texture, aspect } = useMemo(
    () => makeTextTexture(text, { color, font: "600 56px ui-sans-serif, system-ui, sans-serif" }),
    [text, color],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh>
      <planeGeometry args={[width, width / aspect]} />
      <meshBasicMaterial map={texture} transparent side={DoubleSide} />
    </mesh>
  );
}

/**
 * A sign shown only when the walker is near.
 *
 * With every sign lit at once the map reads as a labelled diagram rather than
 * a place, and the boards collide. Visibility is toggled on the object rather
 * than through React, so it costs nothing per frame.
 */
function ProximityLabel({
  title,
  sub,
  y,
  color,
  worldX,
  worldZ,
}: {
  title: string;
  sub?: string;
  y: number;
  color: string;
  worldX: number;
  worldZ: number;
}) {
  const group = useRef<Group>(null);

  useFrame(() => {
    if (!group.current) return;
    group.current.visible =
      Math.hypot(worldX - walker.x, worldZ - walker.z) < LABEL_RANGE;
  });

  const top = useMemo(
    () => makeTextTexture(title, { color: "#1b222b", font: "600 56px ui-sans-serif, system-ui, sans-serif" }),
    [title],
  );
  const bottom = useMemo(
    () =>
      sub
        ? makeTextTexture(sub, { color: "#3c4652", font: "500 48px ui-sans-serif, system-ui, sans-serif" })
        : null,
    [sub],
  );

  useEffect(() => {
    return () => {
      top.texture.dispose();
      bottom?.texture.dispose();
    };
  }, [top, bottom]);

  // Two lines rather than one. A company, a role and a span of years on a
  // single strip makes a board wider than the building it names.
  const titleHeight = 0.5;
  const subHeight = 0.36;
  const titleWidth = titleHeight * top.aspect;
  const subWidth = bottom ? subHeight * bottom.aspect : 0;
  const width = Math.max(titleWidth, subWidth) + 0.3;
  const height = titleHeight + (bottom ? subHeight + 0.08 : 0) + 0.2;

  return (
    <group ref={group} position={[0, y, 0]} rotation={[0, ISO_CAMERA.azimuth, 0]}>
      <group rotation={[-Math.PI / 7, 0, 0]}>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color={color} side={DoubleSide} />
        </mesh>
        <mesh position={[0, bottom ? height / 2 - titleHeight / 2 - 0.1 : 0, 0.01]}>
          <planeGeometry args={[titleWidth, titleHeight]} />
          <meshBasicMaterial map={top.texture} transparent side={DoubleSide} />
        </mesh>
        {bottom && (
          <mesh position={[0, -height / 2 + subHeight / 2 + 0.1, 0.01]}>
            <planeGeometry args={[subWidth, subHeight]} />
            <meshBasicMaterial map={bottom.texture} transparent side={DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function Screen({ w, h, color }: { w: number; h: number; color: string }) {
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} />
    </mesh>
  );
}

export function Structure({ building }: { building: Building }) {
  const { kind, x, y, z, w, d, h, color, accent, label, sub, rotation = 0 } = building;
  const warm = accent ?? C.accent;
  // Most pieces square up to the camera, which never turns; a few are also
  // rotated to follow the leg of the terrace they stand on.
  const faceCamera: [number, number, number] = [0, ISO_CAMERA.azimuth + rotation, 0];

  const body = (() => {
    switch (kind) {
      /** A workplace: desk, monitor, chair. One per step of the career. */
      /**
       * A workplace: desk, chair, monitor, keyboard. One per step of the
       * career. Modelled pieces rather than assembled boxes — this is the
       * prop the visitor gets closest to, and it repeats eight times.
       */
      case "desk": {
        const long = rotation === 0 ? w : d;
        return (
          <group rotation={faceCamera}>
            <Model name="desk" fit={{ width: long }} />
            <Model
              name="computerScreen"
              fit={{ height: h * 0.55 }}
              position={[0, h * 0.62, -0.18]}
            />
            <Model
              name="computerKeyboard"
              fit={{ width: long * 0.34 }}
              position={[0, h * 0.62, 0.22]}
            />
            <Model
              name="chairDesk"
              fit={{ height: h * 0.8 }}
              position={[0, 0, long * 0.62]}
              rotation={[0, Math.PI, 0]}
            />
            {/* The room's colour, thrown by the screen. */}
            <pointLight
              color={warm}
              intensity={2.4}
              distance={3.4}
              decay={2}
              position={[0, h * 0.75, 0.1]}
            />
          </group>
        );
      }

      /** The company's name, cut into the step. */
      case "plaque": {
        const pw = rotation === 0 ? w : d;
        const pd = rotation === 0 ? d : w;
        return (
          <group rotation={faceCamera}>
            <Block args={[pw, h, pd]} position={[0, h * 0.5, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            <group position={[0, h * 0.62, pd / 2 + 0.01]} rotation={[-Math.PI / 12, 0, 0]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[pw * 0.88, h * 0.5]} />
                <meshStandardMaterial color={warm} roughness={0.9} />
              </mesh>
              <group position={[0, 0, 0.01]}>
                <Printed text={label ?? ""} width={pw * 0.76} />
              </group>
            </group>
          </group>
        );
      }

      /** A colonnade under a dome, with the degree across the front. */
      case "university":
        return (
          <group>
            <Block args={[w + 3, 0.5, d + 3]} radius={0.16} position={[0, 0.25, 0]} receiveShadow castShadow>
              <meshStandardMaterial color={C.stone} roughness={1} />
            </Block>
            <Block
              args={[w * 0.8, h * 0.7, d * 0.8]}
              radius={0.18}
              position={[0, h * 0.42, -d * 0.15]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            {/* Columns across the front. */}
            {Array.from({ length: 7 }, (_, i) => (
              <mesh
                key={i}
                position={[-w / 2 + 1.2 + i * ((w - 2.4) / 6), h * 0.38, d / 2 - 0.4]}
                castShadow
              >
                <cylinderGeometry args={[0.32, 0.36, h * 0.72, 10]} />
                <meshStandardMaterial color={C.marble} roughness={1} />
              </mesh>
            ))}
            {/* Pediment carrying the degree. */}
            <Block args={[w, h * 0.22, 1.4]} radius={0.08} position={[0, h * 0.82, d / 2 - 0.4]} castShadow>
              <meshStandardMaterial color={C.marble} roughness={1} />
            </Block>
            <group position={[0, h * 0.82, d / 2 + 0.32]}>
              <Printed text={label ?? ""} width={w * 0.82} />
            </group>
            {/* Dome. */}
            <mesh position={[0, h * 0.95, -d * 0.15]} castShadow>
              <cylinderGeometry args={[w * 0.18, w * 0.2, h * 0.18, 16]} />
              <meshStandardMaterial color={C.marble} roughness={1} />
            </mesh>
            <mesh position={[0, h * 1.04, -d * 0.15]} castShadow>
              <sphereGeometry args={[w * 0.18, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={C.slate} roughness={0.8} flatShading />
            </mesh>
          </group>
        );

      case "fountain":
        return (
          <group>
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[w / 2, w / 2 + 0.2, 0.6, 24]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[w / 2 - 0.3, 24]} />
              <meshStandardMaterial color={warm} roughness={0.2} metalness={0.2} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.26, 1, 10]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, 1.7, 0]} castShadow>
              <sphereGeometry args={[0.45, 16, 12]} />
              <meshStandardMaterial color={warm} roughness={0.25} metalness={0.2} />
            </mesh>
          </group>
        );

      /** A round table with microphones: the studio, with no walls. */
      case "roundtable":
        return (
          <group>
            <mesh position={[0, h, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[w / 2, w / 2, 0.14, 28]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.5, h, 12]} />
              <meshStandardMaterial color={C.timberDark} roughness={1} />
            </mesh>
            {[0, 1, 2, 3].map((i) => {
              const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
              const mx = Math.sin(angle) * (w / 2 - 0.7);
              const mz = Math.cos(angle) * (w / 2 - 0.7);
              return (
                <group key={i}>
                  {/* Microphone on a short boom. */}
                  <mesh position={[mx, h + 0.35, mz]} castShadow>
                    <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
                    <meshStandardMaterial color={C.ink} roughness={0.6} metalness={0.3} />
                  </mesh>
                  <mesh position={[mx, h + 0.75, mz]} castShadow>
                    <capsuleGeometry args={[0.11, 0.18, 4, 10]} />
                    <meshStandardMaterial color={accent ?? C.ink} roughness={0.5} />
                  </mesh>
                  {/* Chair. */}
                  <group position={[Math.sin(angle) * (w / 2 + 1), 0, Math.cos(angle) * (w / 2 + 1)]}>
                    <mesh position={[0, 0.5, 0]} castShadow>
                      <boxGeometry args={[0.8, 0.12, 0.8]} />
                      <meshStandardMaterial color={C.ink} roughness={1} />
                    </mesh>
                    <mesh position={[0, 0.3, 0]} castShadow>
                      <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
                      <meshStandardMaterial color={C.slate} roughness={0.7} />
                    </mesh>
                  </group>
                </group>
              );
            })}
          </group>
        );

      /** Acoustic panelling and the on-air lamp. The studio's back wall. */
      case "acoustic":
        return (
          <group rotation={faceCamera}>
            <Block args={[w, h, d]} radius={0.1} position={[0, h / 2, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            {Array.from({ length: 14 }, (_, i) => (
              <mesh
                key={i}
                position={[-w / 2 + 0.7 + i * ((w - 1.4) / 13), h * 0.55, d / 2 + 0.06]}
                castShadow
              >
                <boxGeometry args={[0.55, h * 0.72, 0.12]} />
                <meshStandardMaterial
                  color={i % 2 ? C.timber : C.timberDark}
                  roughness={1}
                />
              </mesh>
            ))}
            <group position={[0, h * 1.05, d / 2 + 0.1]}>
              <mesh>
                <planeGeometry args={[3.2, 0.9]} />
                <meshStandardMaterial color="#c0392b" emissive="#c0392b" emissiveIntensity={0.8} />
              </mesh>
              <group position={[0, 0, 0.02]}>
                <Printed text="ON AIR" width={2.4} color="#ffffff" />
              </group>
            </group>
            <pointLight color="#e06a55" intensity={20} distance={16} decay={2} position={[0, h, 2]} />
          </group>
        );

      /** The mixing desk. */
      case "console":
        return (
          <group rotation={faceCamera}>
            <mesh position={[0, h * 0.4, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h * 0.8, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <mesh position={[0, h * 0.84, 0]} rotation={[-Math.PI / 7, 0, 0]} castShadow>
              <boxGeometry args={[w * 0.95, 0.1, d * 0.9]} />
              <meshStandardMaterial color={C.ink} roughness={0.8} />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh
                key={i}
                position={[-w / 2 + 0.4 + i * ((w - 0.8) / 7), h * 0.92, 0]}
                rotation={[-Math.PI / 7, 0, 0]}
              >
                <boxGeometry args={[0.1, 0.05, 0.4]} />
                <meshStandardMaterial color={warm} emissive={warm} emissiveIntensity={0.6} />
              </mesh>
            ))}
          </group>
        );

      /** One show: a coloured marker readable from across the water. */
      case "totem":
        return (
          <group rotation={faceCamera}>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[w + 0.4, 0.2, d + 0.4]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            <Block args={[w, h, d]} position={[0, h / 2, 0]} castShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            <mesh position={[0, h * 0.68, d / 2 + 0.01]}>
              <planeGeometry args={[w * 0.82, h * 0.5]} />
              <meshStandardMaterial color={warm} emissive={warm} emissiveIntensity={0.5} />
            </mesh>
          </group>
        );

      /** Open shelving, spines out. */
      case "bookcase":
        return (
          <group rotation={faceCamera}>
            <Block args={[w, h, 0.2]} position={[0, h / 2, -d / 2]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            {[0.5, 1.4, 2.3, 3.2].map((shelfY) => (
              <group key={shelfY}>
                <mesh position={[0, shelfY, 0]} castShadow>
                  <boxGeometry args={[w, 0.1, d]} />
                  <meshStandardMaterial color={color} roughness={1} />
                </mesh>
                {Array.from({ length: 14 }, (_, i) => {
                  const tone = ["#a8503f", "#4f6f84", "#7e8a52", "#8b6a45", "#6a5472", "#a67c3f"][
                    (i * 3 + Math.round(shelfY * 10)) % 6
                  ];
                  const bookHeight = 0.5 + ((i * 7) % 4) * 0.06;
                  return (
                    <mesh
                      key={i}
                      position={[
                        -w / 2 + 0.3 + i * ((w - 0.6) / 13),
                        shelfY + 0.05 + bookHeight / 2,
                        0,
                      ]}
                      castShadow
                    >
                      <boxGeometry args={[0.18, bookHeight, d * 0.75]} />
                      <meshStandardMaterial color={tone} roughness={1} />
                    </mesh>
                  );
                })}
              </group>
            ))}
          </group>
        );

      /** The written work, face out, on a display table. */
      case "book-display":
        return (
          <group rotation={faceCamera}>
            <Block args={[w, 0.14, d]} position={[0, h * 0.85, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            {[-w / 2 + 0.3, w / 2 - 0.3].map((lx) => (
              <mesh key={lx} position={[lx, h * 0.42, 0]} castShadow>
                <boxGeometry args={[0.16, h * 0.85, d * 0.8]} />
                <meshStandardMaterial color={C.timberDark} roughness={1} />
              </mesh>
            ))}
            {BOOKS.map((book, i) => (
              <group
                key={book.id}
                position={[-w / 2 + 1 + i * ((w - 2) / (BOOKS.length - 1)), h * 1.28, 0]}
                rotation={[-0.16, 0, 0]}
              >
                <mesh castShadow>
                  <boxGeometry args={[1.1, 1.5, 0.12]} />
                  <meshStandardMaterial color={book.color} roughness={0.85} />
                </mesh>
                <mesh position={[0, 0, 0.07]}>
                  <planeGeometry args={[0.92, 1.3]} />
                  <meshStandardMaterial color="#ffffff" transparent opacity={0.14} />
                </mesh>
              </group>
            ))}
          </group>
        );

      case "armchair":
        return (
          <group rotation={faceCamera}>
            <Block args={[w, 0.45, d]} radius={0.1} position={[0, 0.45, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            <Block args={[w, 1.1, 0.35]} radius={0.1} position={[0, 0.95, -d / 2 + 0.2]} castShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            {[-w / 2 + 0.18, w / 2 - 0.18].map((lx) => (
              <mesh key={lx} position={[lx, 0.8, 0]} castShadow>
                <boxGeometry args={[0.32, 0.5, d * 0.9]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            ))}
          </group>
        );

      /** A project, as a lit board you can read from the bridge. */
      case "billboard":
        return (
          <group rotation={faceCamera}>
            {[-w / 2 + 0.3, w / 2 - 0.3].map((lx) => (
              <mesh key={lx} position={[lx, h * 0.3, 0]} castShadow>
                <boxGeometry args={[0.16, h * 0.6, 0.16]} />
                <meshStandardMaterial color={C.slate} roughness={0.9} />
              </mesh>
            ))}
            <Block args={[w, h * 0.56, d]} radius={0.07} position={[0, h * 0.72, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            <group position={[0, h * 0.78, d / 2 + 0.02]}>
              <Screen w={w * 0.82} h={h * 0.3} color={warm} />
            </group>
            <group position={[0, h * 0.54, d / 2 + 0.02]}>
              <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[w * 0.86, 0.5]} />
                <meshStandardMaterial color={C.marble} roughness={1} />
              </mesh>
              <group position={[0, 0, 0.01]}>
                <Printed text={label ?? ""} width={w * 0.76} />
              </group>
            </group>
          </group>
        );

      case "surfboard":
        return (
          <group rotation={[0, ISO_CAMERA.azimuth, 0.22]}>
            <mesh position={[0, h / 2, 0]} castShadow>
              <capsuleGeometry args={[0.42, h - 0.84, 6, 14]} />
              <meshStandardMaterial color={color} roughness={0.55} />
            </mesh>
            <mesh position={[0, h / 2, 0.06]} scale={[1, 1, 0.2]}>
              <capsuleGeometry args={[0.13, h - 1.1, 4, 10]} />
              <meshStandardMaterial color={warm} roughness={0.5} />
            </mesh>
          </group>
        );

      case "weights":
        return (
          <group rotation={faceCamera}>
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.24, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {[0.55, 1.1].map((shelfY) => (
              <group key={shelfY}>
                <mesh position={[0, shelfY, 0]} castShadow>
                  <boxGeometry args={[w, 0.12, d * 0.8]} />
                  <meshStandardMaterial color={color} roughness={1} />
                </mesh>
                {[-0.7, 0, 0.7].map((dx) => (
                  <group key={dx} position={[dx, shelfY + 0.28, 0]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
                      <meshStandardMaterial color={C.slate} metalness={0.4} roughness={0.5} />
                    </mesh>
                    {[-0.24, 0.24].map((side) => (
                      <mesh key={side} position={[0, 0, side]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.22, 0.22, 0.12, 14]} />
                        <meshStandardMaterial color={C.ink} roughness={0.9} />
                      </mesh>
                    ))}
                  </group>
                ))}
              </group>
            ))}
          </group>
        );

      case "bench":
        return (
          <group rotation={faceCamera}>
            <Block args={[w, 0.2, d]} radius={0.05} position={[0, h, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={1} />
            </Block>
            {[-w / 2 + 0.2, w / 2 - 0.2].map((lx) => (
              <mesh key={lx} position={[lx, h / 2, 0]} castShadow>
                <boxGeometry args={[0.14, h, 0.14]} />
                <meshStandardMaterial color={C.slate} roughness={0.8} />
              </mesh>
            ))}
          </group>
        );

      case "piano":
        return (
          <group rotation={faceCamera}>
            <Block args={[w, 0.3, d]} radius={0.06} position={[0, h * 0.75, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={color} roughness={0.5} />
            </Block>
            {/* Keys. */}
            <mesh position={[0, h * 0.92, d / 2 - 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w * 0.92, 0.45]} />
              <meshStandardMaterial color={warm} roughness={0.7} />
            </mesh>
            {Array.from({ length: 13 }, (_, i) => (
              <mesh
                key={i}
                position={[-w * 0.44 + i * ((w * 0.88) / 12), h * 0.94, d / 2 - 0.22]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.07, 0.26]} />
                <meshBasicMaterial color={color} />
              </mesh>
            ))}
            {[-w / 2 + 0.2, w / 2 - 0.2].map((lx) => (
              <mesh key={lx} position={[lx, h * 0.37, 0]} castShadow>
                <boxGeometry args={[0.14, h * 0.75, 0.14]} />
                <meshStandardMaterial color={color} roughness={0.6} />
              </mesh>
            ))}
            {/* Stool. */}
            <group position={[0, 0, d / 2 + 0.9]}>
              <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1, 0.14, 0.6]} />
                <meshStandardMaterial color={C.timberDark} roughness={1} />
              </mesh>
            </group>
          </group>
        );

      case "rackets":
        return (
          <group rotation={faceCamera}>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.2, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
            {[-0.35, 0.35].map((dx, i) => (
              <group key={dx} position={[dx, h * 0.6, 0]} rotation={[0, 0, i ? 0.22 : -0.22]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.05, 0.05, h * 0.5, 6]} />
                  <meshStandardMaterial color={C.ink} roughness={0.9} />
                </mesh>
                <mesh position={[0, h * 0.42, 0]} castShadow>
                  <torusGeometry args={[0.3, 0.05, 8, 18]} />
                  <meshStandardMaterial color={C.ink} roughness={0.9} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.32, d / 2 + 0.2]} castShadow>
              <sphereGeometry args={[0.18, 12, 10]} />
              <meshStandardMaterial color={warm} roughness={0.95} />
            </mesh>
          </group>
        );

      case "mat":
      default:
        return (
          <group rotation={faceCamera}>
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.1, d]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
          </group>
        );
    }
  })();

  // Plaques carry their name in the world, so nothing floats over them.
  const showSign = kind !== "plaque" && Boolean(label);
  const signY = h + Math.max(1.1, h * 0.35);

  return (
    <group position={[x, y, z]}>
      {body}
      {showSign && (
        <ProximityLabel
          title={label!}
          sub={sub}
          y={signY}
          color={warm}
          worldX={x}
          worldZ={z}
        />
      )}
    </group>
  );
}
