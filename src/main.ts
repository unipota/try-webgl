import minMatrix from './minMatrix'
import mainFrag from './shader/main.frag'
import mainVert from './shader/main.vert'

const Init = (_: any) => {
    const canvas: HTMLCanvasElement = createCanvas()
    const gl: WebGLRenderingContext = createGL(canvas)

    gl.clearColor(0, 0, 0, 1) // canvas初期化カラー
    gl.clearDepth(1.0) // canvas初期化深度
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT) //初期化

    const program: WebGLProgram = createProgram(gl, mainFrag, mainVert)

    const attLocation = []
    attLocation[0] = gl.getAttribLocation(program, 'position')
    attLocation[1] = gl.getAttribLocation(program, 'color')
    const attStride = []
    attStride[0] = 3 //データ要素数
    attStride[1] = 4
    const vertex_position = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0] //頂点データ
    const vertex_color = [
        1.0,
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        0.0,
        1.0,
        0.0,
        0.0,
        1.0,
        1.0,
    ]
    const position_vbo = createVBO(gl, vertex_position)
    const color_vbo = createVBO(gl, vertex_color)

    gl.bindBuffer(gl.ARRAY_BUFFER, position_vbo)
    gl.enableVertexAttribArray(attLocation[0])
    gl.vertexAttribPointer(attLocation[0], attStride[0], gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, color_vbo)
    gl.enableVertexAttribArray(attLocation[1])
    gl.vertexAttribPointer(attLocation[1], attStride[1], gl.FLOAT, false, 0, 0)

    const m = new minMatrix()
    let mMatrix = m.identity(m.create())
    let vMatrix = m.identity(m.create())
    let pMatrix = m.identity(m.create())
    let mvpMatrix = m.identity(m.create())
    m.lookAt([0, 1, 3], [0, 0, 0], [0, 1, 0], vMatrix) //ビュー座標変換行列
    m.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix) //プロジェクション座標行列
    m.multiply(pMatrix, vMatrix, mvpMatrix)
    m.multiply(mvpMatrix, mMatrix, mvpMatrix) //座標変換行列の作成

    const uniLocation = gl.getUniformLocation(program, 'mvpMatrix')
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix) // uniformLocationへ座標変換行列登録
    gl.drawArrays(gl.TRIANGLES, 0, 3) //モデル描画
    gl.flush() //描画
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

const createProgram = (
    gl: WebGLRenderingContext,
    frag: string,
    vert: string
): WebGLProgram => {
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

document.addEventListener('DOMContentLoaded', Init)
