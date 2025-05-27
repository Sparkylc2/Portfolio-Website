import { create, all } from 'mathjs'
const math = create(all, { matrix: 'Array' })   


export function linspace (a, b, n) {
  if (n < 2) return [a]
  const step = (b - a) / (n - 1)
  return Array.from({ length: n }, (_, i) => a + i * step)
}

export function meshgrid (xArr, yArr) {
  const X = yArr.map(() => xArr.slice())             
  const Y = yArr.map(y => Array(xArr.length).fill(y))
  return [X, Y]
}

export function isInsidePolygon ([x, z], vertices) {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], zi = vertices[i][1]
    const xj = vertices[j][0], zj = vertices[j][1]
    const intersect =
      ((zi > z) !== (zj > z)) &&
      (x < (xj - xi) * (z - zi) / (zj - zi + 1e-20) + xi)
    if (intersect) inside = !inside
  }
  return inside
}


export function panelGen (nacaCode = '2412', n = 100, aoaDeg = 0) {
  if (!/^\d{4}$/.test(nacaCode) || n <= 0) {
    throw new Error('naca_code must be four digits and n > 0')
  }


  const m = parseInt(nacaCode[0], 10) * 1e-2
  const p = parseInt(nacaCode[1], 10) * 1e-1
  const t = parseInt(nacaCode.slice(2), 10) * 1e-2


  const xCoord = Array.from({ length: n + 1 },
    (_, i) => 1 - 0.5 * (1 - Math.cos(2 * Math.PI * i / n)))


  const yCamber = new Array(n + 1).fill(0)
  const dyc_dx  = new Array(n + 1).fill(0)

  xCoord.forEach((x, idx) => {
    if (x < p) {
      yCamber[idx] = (m / (p ** 2)) * (2 * p * x - x ** 2)
      dyc_dx[idx]  = (2 * m / (p ** 2)) * (p - x)
    } else {
      yCamber[idx] = (m / ((1 - p) ** 2)) * (1 - 2 * p + 2 * p * x - x ** 2)
      dyc_dx[idx]  = (2 * m / ((1 - p) ** 2)) * (p - x)
    }
  })


  const yThickness = xCoord.map(x =>
    5 * t * (0.2969 * Math.sqrt(x) - 0.1260 * x
           - 0.3516 * x ** 2   + 0.2843 * x ** 3
           - 0.1015 * x ** 4))


  const theta = dyc_dx.map(dy => Math.atan(dy))
  const xArr = new Array(n + 1)
  const zArr = new Array(n + 1)


  const leIdx = xCoord.indexOf(Math.min(...xCoord))   

  for (let i = 0; i <= leIdx; i++) {                  
    xArr[i] = xCoord[i] + yThickness[i] * Math.sin(theta[i])
    zArr[i] = yCamber[i] - yThickness[i] * Math.cos(theta[i])
  }
  for (let i = leIdx; i <= n; i++) {                  
    xArr[i] = xCoord[i] - yThickness[i] * Math.sin(theta[i])
    zArr[i] = yCamber[i] + yThickness[i] * Math.cos(theta[i])
  }


  xArr[0] = xArr[n] = 0.5 * (xArr[0] + xArr[n])
  zArr[0] = zArr[n] = 0.5 * (zArr[0] + zArr[n])


  const aoa = aoaDeg * Math.PI / 180
  const wakeVec = math.complex({ r: 1, phi: -aoa })   
  xArr.push(xArr[n] + wakeVec.re)
  zArr.push(zArr[n] + wakeVec.im)

  return { x: xArr, z: zArr }
}


export function cdoublet (p, p1, p2) {
  const alfa = Math.atan2(p2[1] - p1[1], p2[0] - p1[0])
  const cosA = Math.cos(alfa)
  const sinA = Math.sin(alfa)


  const d1 =  (p[0] - p1[0]) *  cosA + (p[1] - p1[1]) * sinA   
  const d2 =  (p[0] - p2[0]) *  cosA + (p[1] - p2[1]) * sinA   
  const dz = -(p[0] - p1[0]) *  sinA + (p[1] - p1[1]) * cosA   

  let u1, v1
  if (Math.abs(dz) < 1e-6) {
    u1 = 0
    v1 = (d1 / (d1 ** 2) - d2 / (d2 ** 2)) / (2 * Math.PI)
  } else {
    const inv1 = 1 / (d1 ** 2 + dz ** 2)
    const inv2 = 1 / (d2 ** 2 + dz ** 2)
    u1 = -dz  * (inv1 - inv2) / (2 * Math.PI)
    v1 =  d1  * inv1          / (2 * Math.PI)
        - d2  * inv2          / (2 * Math.PI)
  }


  const u =  u1 *  cosA - v1 * sinA
  const v =  u1 *  sinA + v1 * cosA
  return [u, v]
}


export function solveSystem (panelCoord, Ufs, aoaDeg) {
  const aoa = aoaDeg * Math.PI / 180
  const N = panelCoord.length - 2

  const dx = Array.from({ length: N }, (_, i) => panelCoord[i + 1][0] - panelCoord[i][0])
  const dz = Array.from({ length: N }, (_, i) => panelCoord[i + 1][1] - panelCoord[i][1])
  const beta = dx.map((dxi, i) => Math.atan2(dz[i], dxi))

  const cosB = beta.map(Math.cos)
  const sinB = beta.map(Math.sin)

  const mid = Array.from({ length: N }, (_, i) => [
    panelCoord[i][0] + 0.5 * dx[i],
    panelCoord[i][1] + 0.5 * dz[i]
  ])

  const A = math.zeros(N + 1, N + 1)
  const B = math.zeros(N + 1)


  A[N][0]   =  1
  A[N][N-1] = -1
  A[N][N]   =  1   
  for (let i = 0; i < N; i++) {
    B[i] = -Ufs * Math.sin(aoa - beta[i])
    for (let j = 0; j <= N; j++) {
      const [u, v] = cdoublet(mid[i], panelCoord[j], panelCoord[j + 1])
      A[i][j] = v * cosB[i] - u * sinB[i]    
    }
  }

  const mu = math.squeeze(math.lusolve(A, B)) 
  return mu
}


export function velocityField (X, Z, mu, panelCoord, Ufs, aoaDeg) {
  const aoa = aoaDeg * Math.PI / 180
  const N = panelCoord.length - 2
  const cosA = Math.cos(aoa)
  const sinA = Math.sin(aoa)

  const rows = Z.length
  const cols = X[0].length
  const u = Array.from({ length: rows }, () => Array(cols).fill(NaN))
  const v = Array.from({ length: rows }, () => Array(cols).fill(NaN))

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const xp = X[r][c]
      const zp = Z[r][c]
      if (isInsidePolygon([xp, zp], panelCoord.slice(0, N))) continue 

      let uTot = Ufs * cosA
      let vTot = Ufs * sinA

      for (let k = 0; k <= N; k++) {
        const [ui, vi] = cdoublet([xp, zp], panelCoord[k], panelCoord[k + 1])
        uTot += mu[k] * ui
        vTot += mu[k] * vi
      }
      u[r][c] = uTot
      v[r][c] = vTot
    }
  }
  return { u, v }
}

export function liftCoefficient (mu, Ufs) {
  return -2 * mu[mu.length - 1] / Ufs
}
