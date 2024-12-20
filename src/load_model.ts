import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface CustomModel {
  position: Float32Array;
  normal: Float32Array;
  uv: Float32Array;
}

export async function load_obj(url: string): Promise<CustomModel> {
  const loader = new OBJLoader();
  const root: THREE.Group = await new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
  if (!root) {
    throw new Error('Failed to load OBJ');
  }

  const obj = root.children[0] as THREE.Mesh;

  const position = (obj.geometry as THREE.BufferGeometry).attributes.position.array;
  const normal = (obj.geometry as THREE.BufferGeometry).attributes.normal.array;
  const uv = (obj.geometry as THREE.BufferGeometry).attributes.uv.array;

  return {
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
  };
}

export async function load_gltf(url: string): Promise<CustomModel> {
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

  return {
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
  };
}
