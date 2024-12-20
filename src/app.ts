import { vec2, vec3, vec4, mat4 } from 'wgpu-matrix';
import { load_obj } from './load_model';

async function main() {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) throw new Error('WebGPU not supported');

  const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

  // Dynamically set the canvas size to match the window size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
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

  console.log(shell);

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

            @vertex
            fn vertex_main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                output.position = vec4f(input.position.xy*8, 0.01, 1.0);
                output.normal = input.normal;
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
  });

  const render = () => {
    const encoder = device.createCommandEncoder({
      label: 'Render Encoder',
    });
    const canvasTexture = context.getCurrentTexture();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: canvasTexture.createView(),
          loadOp: 'clear',
          clearValue: [0.3, 0.3, 0.3, 1],
          storeOp: 'store',
        },
      ],
    };

    const renderPass = encoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, positionBuffer);
    renderPass.setVertexBuffer(1, normalBuffer);
    renderPass.draw(shell.position.length / 3);

    renderPass.end();
    device.queue.submit([encoder.finish()]);

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

export { main };
