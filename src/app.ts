import { vec2, vec3, vec4, mat4 } from 'wgpu-matrix';
import { load_gltf, load_obj } from './load_model';
import { RenderableModel } from './types';
import { Renderer } from './renderer';
import { Controller } from './controller';

async function main() {
  const renderer = new Renderer();
  await renderer.initialize();

  const shell = await load_obj('project/shell.obj');

  const tank = await load_gltf('project/tank.glb');

  const body = tank[0];
  const turret = tank[1];
  const barrel = tank[2];

  const bodyRenderableModel: RenderableModel = {
    staticModel: body,
    location: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    scale: vec3.create(0.5, 0.5, 0.5),
  };

  const turretRenderableModel: RenderableModel = {
    staticModel: turret,
    location: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    scale: vec3.create(0.5, 0.5, 0.5),
  };

  const barrelRenderableModel: RenderableModel = {
    staticModel: barrel,
    location: vec3.create(0, 0, 0),
    rotation: vec3.create(0, 0, 0),
    scale: vec3.create(0.5, 0.5, 0.5),
  };

  renderer.addModel(bodyRenderableModel);
  renderer.addModel(turretRenderableModel);
  renderer.addModel(barrelRenderableModel);

  const controller = new Controller(renderer, shell, bodyRenderableModel, barrelRenderableModel, turretRenderableModel);
  controller.initialize();

  const camera = {
    location: new Float32Array([0, 0, 2]),
    direction: new Float32Array([0, 0, 0]),
    fov: Math.PI / 3,
    aspectRatio: 1,
    up: new Float32Array([0, 1, 0]),
  };
  renderer.setCamera(camera);

  if (controller.isPaused) {
    const render = () => {
      renderer.render();
    };
    render();
  } else {
    const render = (time: number) => {
      renderer.render();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }
}

export { main };
