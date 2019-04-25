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
  uniLocation: TODO
  frameCount: number = 0

  constructor() {
    this.canvas = createCanvas()
    this.gl = createGL(this.canvas)
    clearGLContext(this.gl)
    this.program = createProgram(this.gl, mainFrag, mainVert)

    const attLocation = []
    attLocation[0] = this.gl.getAttribLocation(this.program, 'position')
    attLocation[1] = this.gl.getAttribLocation(this.program, 'color')
    const attStride = []
    attStride[0] = 3 //データ要素数
    attStride[1] = 4
    const vertex_position = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0] //頂点データ
    const vertex_color = [1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0]
    const position_vbo = createVBO(this.gl, vertex_position)
    const color_vbo = createVBO(this.gl, vertex_color)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_vbo)
    this.gl.enableVertexAttribArray(attLocation[0])
    this.gl.vertexAttribPointer(attLocation[0], attStride[0], this.gl.FLOAT, false, 0, 0)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, color_vbo)
    this.gl.enableVertexAttribArray(attLocation[1])
    this.gl.vertexAttribPointer(attLocation[1], attStride[1], this.gl.FLOAT, false, 0, 0)

    this.m = new minMatrix()
    this.mMatrix = this.m.identity(this.m.create())
    this.vMatrix = this.m.identity(this.m.create())
    this.pMatrix = this.m.identity(this.m.create())
    this.vpMatrix = this.m.identity(this.m.create())
    this.mvpMatrix = this.m.identity(this.m.create())
    this.uniLocation = this.gl.getUniformLocation(this.program, 'mvpMatrix')

    this.m.lookAt([0, 0, 3], [0, 0, 0], [0, 1, 0], this.vMatrix) //ビュー座標変換行列
    this.m.perspective(90, this.canvas.width / this.canvas.height, 0.1, 100, this.pMatrix) //プロジェクション座標行列
    this.m.multiply(this.pMatrix, this.vMatrix, this.vpMatrix)
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
    this.m.translate(this.mMatrix, [1.5, 0.0, 0.0], this.mMatrix)
    this.m.multiply(this.vpMatrix, this.mMatrix, this.mvpMatrix) //座標変換行列の作成
    this.gl.uniformMatrix4fv(this.uniLocation, false, this.mvpMatrix) // uniformLocationへ座標変換行列登録
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3) //モデル描画

    this.m.identity(this.mMatrix) //初期化
    this.m.translate(this.mMatrix, [-1.5, 0.0, 0.0], this.mMatrix)
    this.m.rotate(this.mMatrix, rad, [0, 1, 0], this.mMatrix)
    this.m.multiply(this.vpMatrix, this.mMatrix, this.mvpMatrix) //座標変換行列の作成
    this.gl.uniformMatrix4fv(this.uniLocation, false, this.mvpMatrix) // uniformLocationへ座標変換行列登録
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3) //モデル描画

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

const clearGLContext = (gl: WebGLRenderingContext): void => {
  gl.clearColor(0, 0, 0, 1) // canvas初期化カラー
  gl.clearDepth(1.0) // canvas初期化深度
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) //初期化
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

const ob = new renderObject()
document.addEventListener('DOMContentLoaded', ob.start)
