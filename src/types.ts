export interface StaticModel {
  name: string;
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array;
  texture: HTMLCanvasElement;
}

export interface RenderableModel {
  staticModel: StaticModel;
  location: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
}

export interface Camera {
  location: Float32Array;
  direction: Float32Array;
  fov: number;
  aspectRatio: number;
  up: Float32Array;
}
