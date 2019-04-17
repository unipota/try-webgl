import mainFrag from './shader/main.frag'
import mainVert from './shader/main.vert'
import minMatrix from './minMatrix'

const Init = (_: any) => {
    const canvas: HTMLCanvasElement = createCanvas()
    const gl: WebGLRenderingContext = createGL(canvas)

    gl.clearColor(0, 0, 0, 1)
    gl.clearDepth(1.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const program: WebGLProgram = createProgram(gl, mainFrag, mainVert)

    const attLocation = gl.getAttribLocation(program, 'position')
    const attStride = 3 //データ要素数
    const vertex_position = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0]
    const vbo = createVBO(gl, vertex_position)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.enableVertexAttribArray(attLocation)
    gl.vertexAttribPointer(attLocation, attStride, gl.FLOAT, false, 0, 0)

    const m = new minMatrix()
    let mMatrix = m.identity(m.create())
    let vMatrix = m.identity(m.create())
    let pMatrix = m.identity(m.create())
    let mvpMatrix = m.identity(m.create())
    m.lookAt([0, 1, 3], [0, 0, 0], [0, 1, 0], vMatrix)
    m.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix)
    m.multiply(pMatrix, vMatrix, mvpMatrix)
    m.multiply(mvpMatrix, mMatrix, mvpMatrix)

    const uniLocation = gl.getUniformLocation(program, 'mvpMatrix')
    gl.uniformMatrix4fv(uniLocation, false, mvpMatrix)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.flush()
}

function createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    canvas.width = 500
    canvas.height = 500
    return canvas
}

function createGL(canvas: HTMLCanvasElement): WebGLRenderingContext {
    const gl = canvas.getContext('webgl')
    return gl
}

function createProgram(
    gl: WebGLRenderingContext,
    frag: string,
    vert: string
): WebGLProgram {
    const program: WebGLProgram = gl.createProgram()

    const fragShader: WebGLShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragShader, frag)
    gl.compileShader(fragShader)
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fragShader))
    }

    const vertShader: WebGLShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertShader, vert)
    gl.compileShader(vertShader)
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vertShader))
    }

    gl.attachShader(program, fragShader)
    gl.attachShader(program, vertShader)
    gl.linkProgram(program)

    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program)
        return program
    } else {
        console.error(gl.getProgramInfoLog(program))
    }
}

function createVBO(gl: WebGLRenderingContext, data: any) {
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return vbo
}

document.addEventListener('DOMContentLoaded', Init)
