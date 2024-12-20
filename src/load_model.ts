import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { StaticModel } from './types';

export async function load_obj(model_url: string, texture_url?: string): Promise<StaticModel> {
  const loader = new OBJLoader();
  const root: THREE.Group = await new Promise((resolve, reject) => {
    loader.load(model_url, resolve, undefined, reject);
  });
  if (!root) {
    throw new Error('Failed to load OBJ');
  }

  const obj = root.children[0] as THREE.Mesh;

  const position = (obj.geometry as THREE.BufferGeometry).attributes.position.array;
  const normal = (obj.geometry as THREE.BufferGeometry).attributes.normal.array;
  const uv = (obj.geometry as THREE.BufferGeometry).attributes.uv.array;
  // Get texture from URL if it exists, otherwise use a blank canvas
  const texture = texture_url
    ? new THREE.TextureLoader().load(texture_url)
    : new THREE.CanvasTexture(new HTMLCanvasElement());

  return {
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
    texture: texture.image as HTMLCanvasElement,
  };
}

export async function load_gltf(url: string): Promise<StaticModel> {
  const loader = new GLTFLoader();
  const root: THREE.Group = await new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        resolve(gltf.scene);
      },
      undefined,
      reject
    );
  });
  if (!root) {
    throw new Error('Failed to load GLTF');
  }

  const obj = root.children[0] as THREE.Mesh;

  const position = (obj.geometry as THREE.BufferGeometry).attributes.position.array;
  const normal = (obj.geometry as THREE.BufferGeometry).attributes.normal.array;
  const uv = (obj.geometry as THREE.BufferGeometry).attributes.uv.array;
  // Get texture from material if it exists, otherwise use a blank canvas
  const texture = (obj.material as THREE.MeshBasicMaterial).map || new THREE.CanvasTexture(new HTMLCanvasElement());

  return {
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
    texture: texture.image as HTMLCanvasElement,
  };
}
