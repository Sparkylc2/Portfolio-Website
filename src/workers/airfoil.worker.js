import init from '../wasm/airfoil_simulator.js'

let wasm

self.onmessage = async (e) => {
  const { naca, uFs, aoaDeg, nPanels, nStreams } = e.data || {}
  try {
    if (!wasm) {
      wasm = await init()
    }

    const res = await wasm.analyze_airfoil(
      naca,
      uFs,
      aoaDeg,
      nPanels,
      nStreams
    )

    const cl = res.cl

    const foilMat = res.airfoil_coords
    const r = wasm.matrix_rows(foilMat)
    const c = wasm.matrix_cols(foilMat)
    const foil = new Float32Array(r * c)
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        foil[i * c + j] = wasm.matrix_coeff(foilMat, i, j)
      }
    }

    const nLines = res.streamlines.size()
    const streamBuffers = []
    for (let k = 0; k < nLines; k++) {
      const m = res.streamlines.get(k)
      const rr = wasm.matrix_rows(m)
      const cc = wasm.matrix_cols(m)
      const flat = new Float32Array(rr * cc)
      for (let i = 0; i < rr; i++) {
        for (let j = 0; j < cc; j++) {
          flat[i * cc + j] = wasm.matrix_coeff(m, i, j)
        }
      }
      streamBuffers.push(flat.buffer)
      m?.delete()
    }

    res.mu?.delete()
    res.stream_field?.u?.delete()
    res.stream_field?.v?.delete()
    res.stream_grid?.x?.delete()
    res.stream_grid?.z?.delete()
    res.streamlines?.delete?.()
    foilMat?.delete?.()
    res?.delete?.()

    self.postMessage(
      { cl, foil, nLines, streamBuffers },
      [foil.buffer, ...streamBuffers]
    )
  } catch (err) {
    self.postMessage({ error: String(err) })
  }
}
