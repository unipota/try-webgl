import minMatrix from './minMatrix'
import mainFrag from './shader/main.frag'
import mainVert from './shader/main.vert'

type TODO = any

class renderObject {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram
  m: TODO
  mMatrix: TODO
  vMatrix: TODO
  pMatrix: TODO
  vpMatrix: TODO
  mvpMatrix: TODO
  uniLocation: Array<WebGLUniformLocation>
  invMatrix: TODO
  lightDirection: Float32List
  frameCount: number = 0
  index: Array<number>

  constructor() {
    this.canvas = createCanvas()
    this.gl = createGL(this.canvas)

    //カリングと深度テストの無効化
    this.gl.enable(this.gl.CULL_FACE)
    this.gl.enable(this.gl.DEPTH_TEST)
    this.gl.depthFunc(this.gl.LEQUAL)
    this.clearGLContext()
    this.program = createProgram(this.gl, mainFrag, mainVert)

    const attLocation = new Array()
    attLocation[0] = this.gl.getAttribLocation(this.program, 'position')
    attLocation[1] = this.gl.getAttribLocation(this.program, 'normal')
    attLocation[2] = this.gl.getAttribLocation(this.program, 'color')

    const attStride = []
    attStride[0] = 3 //データ要素数
    attStride[1] = 3
    attStride[2] = 4

    // const vertex_position = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, -1.0, 0.0] //頂点データ
    // const vertex_color = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    const torus_model = torus(32, 32, 1.0, 2.0)
    const vertex_position = torus_model[0]
    const vertex_normal = torus_model[1]
    const vertex_color = torus_model[2]
    this.index = torus_model[3]
    const position_vbo = createVBO(this.gl, vertex_position)
    const normal_vbo = createIBO(this.gl, vertex_normal)
    const color_vbo = createVBO(this.gl, vertex_color)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_vbo)
    this.gl.enableVertexAttribArray(attLocation[0])
    this.gl.vertexAttribPointer(attLocation[0], attStride[0], this.gl.FLOAT, false, 0, 0)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normal_vbo)
    this.gl.enableVertexAttribArray(attLocation[1])
    this.gl.vertexAttribPointer(attLocation[1], attStride[1], this.gl.FLOAT, false, 0, 0)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_vbo)
    this.gl.enableVertexAttribArray(attLocation[2])
    this.gl.vertexAttribPointer(attLocation[2], attStride[2], this.gl.FLOAT, false, 0, 0)

    // const index = [0, 1, 2, 3, 2, 1]
    const ibo = createIBO(this.gl, this.index)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo)

    this.m = new minMatrix()
    this.mMatrix = this.m.identity(this.m.create())
    this.vMatrix = this.m.identity(this.m.create())
    this.pMatrix = this.m.identity(this.m.create())
    this.vpMatrix = this.m.identity(this.m.create())
    this.mvpMatrix = this.m.identity(this.m.create())
    this.invMatrix = this.m.identity(this.m.create())

    this.uniLocation = new Array()
    this.uniLocation[0] = this.gl.getUniformLocation(this.program, 'mvpMatrix')
    this.uniLocation[1] = this.gl.getUniformLocation(this.program, 'invMatrix')
    this.uniLocation[2] = this.gl.getUniformLocation(this.program, 'lightDirection')

    this.m.lookAt([0.0, 0.0, 20.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], this.vMatrix) //ビュー座標変換行列
    this.m.perspective(45, this.canvas.width / this.canvas.height, 0.1, 100, this.pMatrix) //プロジェクション座標行列
    this.m.multiply(this.pMatrix, this.vMatrix, this.vpMatrix)

    this.lightDirection = [-0.5, 0.5, 0.5]
  }
  render = () => {
    this.gl.flush()
  }
  clearGLContext = () => {
    this.gl.clearColor(0, 0, 0, 1) // canvas初期化カラー
    this.gl.clearDepth(1.0) // canvas初期化深度
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT) //初期化
  }
  start = () => {
    this.mainLoop()
  }
  mainLoop = () => {
    this.frameCount++
    this.clearGLContext()

    let rad = ((this.frameCount % 360) * Math.PI) / 180

    this.m.identity(this.mMatrix)
    // this.m.translate(this.mMatrix, [0, 0.0, 0.0], this.mMatrix)
    this.m.rotate(this.mMatrix, rad, [0, 1, 1], this.mMatrix)
    this.m.multiply(this.vpMatrix, this.mMatrix, this.mvpMatrix) //座標変換行列の作成

    this.m.inverse(this.mMatrix, this.invMatrix)

    this.gl.uniformMatrix4fv(this.uniLocation[0], false, this.mvpMatrix) // uniformLocationへ座標変換行列登録
    this.gl.uniformMatrix4fv(this.uniLocation[1], false, this.invMatrix)
    this.gl.uniform3fv(this.uniLocation[2], this.lightDirection)

    // this.gl.drawArrays(this.gl.TRIANGLES, 0, 3) //モデル描画
    this.gl.drawElements(this.gl.TRIANGLES, this.index.length, this.gl.UNSIGNED_SHORT, 0)

    this.render()
    requestAnimationFrame(this.mainLoop)
  }
}

const createCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  document.body.appendChild(canvas)
  canvas.width = 500
  canvas.height = 500
  return canvas
}

const createGL = (canvas: HTMLCanvasElement): WebGLRenderingContext => {
  const gl = canvas.getContext('webgl')
  return gl
}

const createProgram = (gl: WebGLRenderingContext, frag: string, vert: string): WebGLProgram => {
  const program: WebGLProgram = gl.createProgram() //プログラムオブジェクト生成

  const fragShader: WebGLShader = gl.createShader(gl.FRAGMENT_SHADER) //シェーダー生成
  gl.shaderSource(fragShader, frag) //シェダーにソース割り当て
  gl.compileShader(fragShader) //シェーダーコンパイル
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragShader))
  }

  const vertShader: WebGLShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertShader, vert)
  gl.compileShader(vertShader)
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(vertShader))
  }

  gl.attachShader(program, fragShader) //シェーダー割り当て
  gl.attachShader(program, vertShader)
  gl.linkProgram(program) //シェーダーリンク

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.useProgram(program)
    return program
  } else {
    console.error(gl.getProgramInfoLog(program))
  }
}

const createVBO = (gl: WebGLRenderingContext, data: any) => {
  //頂点バッファ生成
  const vbo = gl.createBuffer() //バッファオブジェクト
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  return vbo
}

const createIBO = (gl: WebGLRenderingContext, data: any) => {
  // バッファオブジェクトの生成
  const ibo = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo) // バッファをバインドする
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW) // バッファにデータをセット
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null) // バッファのバインドを無効化
  return ibo
}

const torus = (row: number, column: number, irad: number, orad: number) => {
  const pos = new Array(),
    nor = new Array(),
    col = new Array(),
    idx = new Array()
  for (let i = 0; i <= row; i++) {
    const r = ((Math.PI * 2) / row) * i
    const rr = Math.cos(r)
    const ry = Math.sin(r)
    for (let ii = 0; ii <= column; ii++) {
      const tr = ((Math.PI * 2) / column) * ii
      const tx = (rr * irad + orad) * Math.cos(tr)
      const ty = ry * irad
      const tz = (rr * irad + orad) * Math.sin(tr)
      const rx = rr * Math.cos(tr)
      const rz = rr * Math.sin(tr)
      pos.push(tx, ty, tz)
      nor.push(rx, ry, rz)
      var tc = hsva((360 / column) * ii, 1, 1, 1)
      col.push(tc[0], tc[1], tc[2], tc[3])
    }
  }
  for (let i = 0; i < row; i++) {
    for (let ii = 0; ii < column; ii++) {
      let r = (column + 1) * i + ii
      idx.push(r, r + column + 1, r + 1)
      idx.push(r + column + 1, r + column + 2, r + 1)
    }
  }
  return [pos, nor, col, idx]
}

const hsva = (h: number, s: number, v: number, a: number) => {
  if (s > 1 || v > 1 || a > 1) {
    return
  }
  const th = h % 360
  const i = Math.floor(th / 60)
  const f = th / 60 - i
  const m = v * (1 - s)
  const n = v * (1 - s * f)
  const k = v * (1 - s * (1 - f))
  const color = new Array()
  if (!(s > 0) && !(s < 0)) {
    color.push(v, v, v, a)
  } else {
    const r = new Array(v, n, m, m, k, v)
    const g = new Array(k, v, v, n, m, m)
    const b = new Array(m, m, k, v, v, n)
    color.push(r[i], g[i], b[i], a)
  }
  return color
}

const ob = new renderObject()
document.addEventListener('DOMContentLoaded', ob.start)
