let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const ConstraintPhysicsEngineFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_constraintphysicsengine_free(ptr >>> 0, 1));

export class ConstraintPhysicsEngine {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ConstraintPhysicsEngineFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_constraintphysicsengine_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.constraintphysicsengine_new();
        this.__wbg_ptr = ret >>> 0;
        ConstraintPhysicsEngineFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} width
     * @param {number} height
     */
    set_bounds(width, height) {
        wasm.constraintphysicsengine_set_bounds(this.__wbg_ptr, width, height);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} half_width
     * @param {number} half_height
     * @param {number} mass
     * @returns {number}
     */
    add_body(x, y, half_width, half_height, mass) {
        const ret = wasm.constraintphysicsengine_add_body(this.__wbg_ptr, x, y, half_width, half_height, mass);
        return ret >>> 0;
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} half_width
     * @param {number} half_height
     * @returns {number}
     */
    add_fixed_body(x, y, half_width, half_height) {
        const ret = wasm.constraintphysicsengine_add_fixed_body(this.__wbg_ptr, x, y, half_width, half_height);
        return ret >>> 0;
    }
    /**
     * @param {number} body_a
     * @param {number} body_b
     * @param {number} rest_length
     * @param {number} stiffness
     */
    add_distance_constraint(body_a, body_b, rest_length, stiffness) {
        wasm.constraintphysicsengine_add_distance_constraint(this.__wbg_ptr, body_a, body_b, rest_length, stiffness);
    }
    /**
     * @param {number} fixed_x
     * @param {number} fixed_y
     * @param {number} body
     * @param {number} rest_length
     * @param {number} stiffness
     */
    add_fixed_distance_constraint(fixed_x, fixed_y, body, rest_length, stiffness) {
        wasm.constraintphysicsengine_add_fixed_distance_constraint(this.__wbg_ptr, fixed_x, fixed_y, body, rest_length, stiffness);
    }
    /**
     * @param {number} world_x
     * @param {number} world_y
     * @returns {number}
     */
    start_mouse_drag(world_x, world_y) {
        const ret = wasm.constraintphysicsengine_start_mouse_drag(this.__wbg_ptr, world_x, world_y);
        return ret;
    }
    /**
     * @param {number} world_x
     * @param {number} world_y
     */
    update_mouse_position(world_x, world_y) {
        wasm.constraintphysicsengine_update_mouse_position(this.__wbg_ptr, world_x, world_y);
    }
    end_mouse_drag() {
        wasm.constraintphysicsengine_end_mouse_drag(this.__wbg_ptr);
    }
    add_damping() {
        wasm.constraintphysicsengine_add_damping(this.__wbg_ptr);
    }
    /**
     * @param {number} dt
     */
    update(dt) {
        wasm.constraintphysicsengine_update(this.__wbg_ptr, dt);
    }
    /**
     * @param {number} index
     * @returns {Array<any>}
     */
    body_position(index) {
        const ret = wasm.constraintphysicsengine_body_position(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {number}
     */
    body_mass(index) {
        const ret = wasm.constraintphysicsengine_body_mass(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {number}
     */
    body_angle(index) {
        const ret = wasm.constraintphysicsengine_body_angle(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {Array<any>}
     */
    body_velocity(index) {
        const ret = wasm.constraintphysicsengine_body_velocity(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {number}
     */
    body_angular_velocity(index) {
        const ret = wasm.constraintphysicsengine_body_angular_velocity(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    set_gravity(x, y) {
        wasm.constraintphysicsengine_set_gravity(this.__wbg_ptr, x, y);
    }
    /**
     * @param {number} iterations
     */
    set_iterations(iterations) {
        wasm.constraintphysicsengine_set_iterations(this.__wbg_ptr, iterations);
    }
    /**
     * @returns {number}
     */
    get_body_count() {
        const ret = wasm.constraintphysicsengine_get_body_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    destroy() {
        wasm.constraintphysicsengine_destroy(this.__wbg_ptr);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_new_78feb108b6472713 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('physics_engine_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
