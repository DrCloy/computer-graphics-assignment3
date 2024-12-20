import { vec2, vec3, vec4, mat4 } from 'wgpu-matrix';
import { load_obj } from './load_model';

async function main() {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) throw new Error('WebGPU not supported');

  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

  // Dynamically set the canvas size to match the window size
  let canvasWidth = canvas.clientWidth;
  let canvasHeight = canvas.clientHeight;

  const resize = () => {
    canvasWidth = canvas.width = canvas.clientWidth;
    canvasHeight = canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', () => {
    resize();
  });
  resize();

  const context = canvas.getContext('webgpu')!;
  const prefferedFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: prefferedFormat,
  });

  const shell = await load_obj('project/shell.obj');

  const uniformBuffer = device.createBuffer({
    size: 64, // 4x4 matrix
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const mvpMatrix = mat4.create();

  const updateMvpMatrix = (t: number) => {
    const projection = mat4.create();
    mat4.perspective(Math.PI / 4, canvasWidth / canvasHeight, 0.1, 100, projection);

    const eye = vec3.fromValues(Math.sin(t / 1000) * 0.25, 0.25, Math.cos(t / 1000) * 0.25);
    const center = vec3.fromValues(0, 0, 0);
    const up = vec3.fromValues(0, 1, 0);
    const view = mat4.create();
    mat4.lookAt(eye, center, up, view);

    const model = mat4.create();
    mat4.identity(model);

    mat4.multiply(projection, view, mvpMatrix);
    mat4.multiply(mvpMatrix, model, mvpMatrix);

    device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);

    requestAnimationFrame(updateMvpMatrix);
  };
  updateMvpMatrix(0);

  const positionBuffer = device.createBuffer({
    size: shell.position.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(positionBuffer, 0, shell.position);

  const normalBuffer = device.createBuffer({
    size: shell.normal.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(normalBuffer, 0, shell.normal);

  const shaderModule = device.createShaderModule({
    code: /* wgsl */ `
            struct VertexInput {
                @location(3) position: vec3f,
                @location(2) normal: vec3f
            }

            struct VertexOutput {
                @builtin(position) position: vec4f,
                @location(1) normal: vec3f
            };

            struct Uniforms {
              mvpMatrix: mat4x4f,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;

            @vertex
            fn vertex_main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                output.position = uniforms.mvpMatrix * vec4f(input.position, 1.0);
                output.normal = (uniforms.mvpMatrix * vec4f(input.normal, 0.0)).xyz;
                return output;
            }

            @fragment
            fn fragment_main(input: VertexOutput) -> @location(0) vec4f {
                return vec4f(input.normal, 1.0);
            }
        `,
  });

  const pipeline = device.createRenderPipeline({
    label: 'Render Pipeline',
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: [
        {
          arrayStride: 3 * 4,
          attributes: [
            {
              shaderLocation: 3,
              offset: 0,
              format: 'float32x3',
            },
          ],
        },
        {
          arrayStride: 3 * 4,
          attributes: [
            {
              shaderLocation: 2,
              offset: 0,
              format: 'float32x3',
            },
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [
        {
          format: prefferedFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    },
  });

  const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const render = () => {
    const encoder = device.createCommandEncoder({
      label: 'Render Encoder',
    });
    const canvasTexture = context.getCurrentTexture();

    const depthTexture = device.createTexture({
      size: [canvas.width, canvas.height, 1],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const depthTextureView = depthTexture.createView();

    const passEncoder = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: canvasTexture.createView(),
          loadOp: 'clear',
          clearValue: [0.3, 0.3, 0.3, 1],
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTextureView,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    });
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.setVertexBuffer(1, normalBuffer);
    passEncoder.draw(shell.position.length / 3);
    passEncoder.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

export { main };
