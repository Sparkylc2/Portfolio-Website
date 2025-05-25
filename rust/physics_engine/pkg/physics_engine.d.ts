/* tslint:disable */
/* eslint-disable */
export class ConstraintPhysicsEngine {
  free(): void;
  constructor();
  add_body(x: number, y: number, half_width: number, half_height: number, mass: number): number;
  add_distance_constraint(body_a: number, body_b: number, rest_length: number, stiffness: number): void;
  add_fixed_distance_constraint(fixed_x: number, fixed_y: number, body: number, rest_length: number, stiffness: number): void;
  start_mouse_drag(world_x: number, world_y: number): number;
  update_mouse_position(world_x: number, world_y: number): void;
  end_mouse_drag(): void;
  add_damping(): void;
  update(dt: number): void;
  body_position(index: number): Array<any>;
  body_angle(index: number): number;
  body_velocity(index: number): Array<any>;
  body_angular_velocity(index: number): number;
  set_gravity(x: number, y: number): void;
  set_iterations(iterations: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_constraintphysicsengine_free: (a: number, b: number) => void;
  readonly constraintphysicsengine_new: () => number;
  readonly constraintphysicsengine_add_body: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly constraintphysicsengine_add_distance_constraint: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly constraintphysicsengine_add_fixed_distance_constraint: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly constraintphysicsengine_start_mouse_drag: (a: number, b: number, c: number) => number;
  readonly constraintphysicsengine_update_mouse_position: (a: number, b: number, c: number) => void;
  readonly constraintphysicsengine_end_mouse_drag: (a: number) => void;
  readonly constraintphysicsengine_add_damping: (a: number) => void;
  readonly constraintphysicsengine_update: (a: number, b: number) => void;
  readonly constraintphysicsengine_body_position: (a: number, b: number) => any;
  readonly constraintphysicsengine_body_angle: (a: number, b: number) => number;
  readonly constraintphysicsengine_body_velocity: (a: number, b: number) => any;
  readonly constraintphysicsengine_body_angular_velocity: (a: number, b: number) => number;
  readonly constraintphysicsengine_set_gravity: (a: number, b: number, c: number) => void;
  readonly constraintphysicsengine_set_iterations: (a: number, b: number) => void;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
