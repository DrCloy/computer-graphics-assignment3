import { RenderableModel, Camera } from './types';
import { vec3, mat4 } from 'wgpu-matrix';

export class Renderer {
  private camera: Camera;
  private device?: GPUDevice;
  private canvas?: HTMLCanvasElement;
  private context?: GPUCanvasContext;
  private pipeline?: GPURenderPipeline;
  private depthTexture?: GPUTexture;

  private readonly models: RenderableModel[] = [];
  private uniformBuffers: GPUBuffer[] = [];
  private uniformBindGroups: GPUBindGroup[] = [];
  private positionBuffers: GPUBuffer[] = [];
  private normalBuffers: GPUBuffer[] = [];

  public constructor() {
    this.camera = {
      location: new Float32Array([0, 0, 1]),
      direction: new Float32Array([0, 0, 0]),
      fov: Math.PI / 3,
      aspectRatio: 1,
    };
  }

  private async handleResize() {
    if (!this.canvas) return;

    const canvas = this.canvas;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio * 0.7;

    this.camera.aspectRatio = width / height;

    if (this.device) {
      this.depthTexture = this.device.createTexture({
        size: [canvas.width, canvas.height, 1],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
  }

  public async initialize() {
    // Initialize WebGPU device
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) throw new Error('WebGPU not supported');
    this.device = device;

    // Initialize canvas
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;
    const preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    this.canvas = canvas;
    this.context = canvas.getContext('webgpu')!;
    this.context.configure({
      device,
      format: preferredFormat,
    });

    // Add resize event listener
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();

    const depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height, 1],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.depthTexture = depthTexture;

    // Initialize shader module
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

    // Initialize render pipeline
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
            format: preferredFormat,
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
    this.pipeline = pipeline;
  }

  public addModel(model: RenderableModel) {
    if (!this.device) throw new Error('Device not initialized');
    if (!this.pipeline) throw new Error('Pipeline not initialized');

    this.models.push(model);

    // Add uniform buffer
    const uniformBuffer = this.device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformBuffers.push(uniformBuffer);

    // Add uniform bind group
    const uniformBindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
      ],
    });
    this.uniformBindGroups.push(uniformBindGroup);

    // Add position buffer
    const positionBuffer = this.device.createBuffer({
      size: model.staticModel.position.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(positionBuffer, 0, model.staticModel.position);
    this.positionBuffers.push(positionBuffer);

    // Add normal buffer
    const normalBuffer = this.device.createBuffer({
      size: model.staticModel.normal.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(normalBuffer, 0, model.staticModel.normal);
    this.normalBuffers.push(normalBuffer);
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
  }

  public render() {
    if (!this.device) throw new Error('Device not initialized');
    if (!this.pipeline) throw new Error('Pipeline not initialized');
    if (!this.depthTexture) throw new Error('Depth texture not initialized');

    const { device } = this;

    const commandEncoder = device.createCommandEncoder({
      label: 'Render Encoder',
    });

    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context!.getCurrentTexture().createView(),
          loadOp: 'clear',
          clearValue: [0.3, 0.3, 0.3, 1],
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0,
      },
    });

    passEncoder.setPipeline(this.pipeline);

    const projection = mat4.create();
    mat4.perspective(this.camera.fov, this.camera.aspectRatio, 0.1, 100, projection);

    const cameraLocation = vec3.fromValues(this.camera.location[0], this.camera.location[1], this.camera.location[2]);
    const cameraDirection = vec3.fromValues(
      this.camera.direction[0],
      this.camera.direction[1],
      this.camera.direction[2]
    );
    const view = mat4.create();
    mat4.lookAt(cameraLocation, cameraDirection, vec3.fromValues(0, 1, 0), view);

    const vpMatrix = mat4.create();
    mat4.multiply(projection, view, vpMatrix);

    this.models.forEach((model, i) => {
      const modelMatrix = mat4.create();
      mat4.identity(modelMatrix);
      mat4.translate(modelMatrix, model.location, modelMatrix);
      mat4.rotateX(modelMatrix, model.rotation[0], modelMatrix);
      mat4.rotateY(modelMatrix, model.rotation[1], modelMatrix);
      mat4.rotateZ(modelMatrix, model.rotation[2], modelMatrix);
      mat4.scale(modelMatrix, model.scale, modelMatrix);

      const mvpMatrix = mat4.create();
      mat4.multiply(vpMatrix, modelMatrix, mvpMatrix);

      const uniformBuffer = this.uniformBuffers[i];
      const uniformBindGroup = this.uniformBindGroups[i];
      const positionBuffer = this.positionBuffers[i];
      const normalBuffer = this.normalBuffers[i];

      device.queue.writeBuffer(uniformBuffer, 0, mvpMatrix as Float32Array);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.setVertexBuffer(0, positionBuffer);
      passEncoder.setVertexBuffer(1, normalBuffer);
      passEncoder.draw(model.staticModel.position.length / 3);
    });

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
  }
}
