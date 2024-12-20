import { vec2, vec3, vec4, mat4 } from 'wgpu-matrix';
import { load_gltf, load_obj } from './load_model';
import { RenderableModel } from './types';
import { Renderer } from './renderer';

async function main() {
  const renderer = new Renderer();
  await renderer.initialize();

  const shell = await load_obj('project/shell.obj');
  const shellRenderableModel: RenderableModel = {
    staticModel: shell,
    location: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    scale: vec3.create(1, 1, 1),
  };

  const shellRenderModel2: RenderableModel = {
    staticModel: shell,
    location: vec3.create(0.5, 0, 0),
    rotation: vec3.create(0, Math.PI, 0),
    scale: vec3.create(1, 2, 1),
  };

  renderer.addModel(shellRenderableModel);
  renderer.addModel(shellRenderModel2);

  const render = (time: number) => {
    const x = Math.sin(time / 1000) * 0.1;
    const y = Math.cos(time / 1000) * 0.1;

    shellRenderableModel.location = vec3.create(x, y, 0);

    renderer.render();
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}

export { main };
