import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';

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

  const name = obj.name;
  const position = (obj.geometry as THREE.BufferGeometry).attributes.position.array;
  const normal = (obj.geometry as THREE.BufferGeometry).attributes.normal.array;
  const uv = (obj.geometry as THREE.BufferGeometry).attributes.uv.array;
  // Get texture from URL if it exists, otherwise use a blank canvas
  const texture = texture_url
    ? new THREE.TextureLoader().load(texture_url)
    : new THREE.CanvasTexture(document.createElement('canvas'));

  return {
    name,
    position: new Float32Array(position),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
    texture: texture.image as HTMLCanvasElement,
  };
}

export async function load_gltf(url: string): Promise<StaticModel[]> {
  const loader = new GLTFLoader();
  const root: GLTF = await new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
  if (!root) {
    throw new Error('Failed to load GLTF');
  }

  const gltf = root.scene as THREE.Group;

  const meshes = [] as THREE.Mesh[];
  gltf.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      meshes.push(child);
    }
  });

  console.log(meshes);

  return meshes.map((mesh) => {
    const name = mesh.name;
    const position = (mesh.geometry as THREE.BufferGeometry).attributes.position.array;
    const normal = (mesh.geometry as THREE.BufferGeometry).attributes.normal.array;
    const uv = (mesh.geometry as THREE.BufferGeometry).attributes.uv.array;
    const texture = (mesh.material as THREE.MeshStandardMaterial).map?.image as HTMLCanvasElement;
    const index = (mesh.geometry as THREE.BufferGeometry).index?.array;

    const indexedPosition = [] as number[];
    const indexedNormal = [] as number[];
    const indexedUV = [] as number[];

    if (index) {
      for (let i = 0; i < index.length; i++) {
        indexedPosition.push(position[index[i] * 3], position[index[i] * 3 + 1], position[index[i] * 3 + 2]);
        indexedNormal.push(normal[index[i] * 3], normal[index[i] * 3 + 1], normal[index[i] * 3 + 2]);
        indexedUV.push(uv[index[i] * 2], uv[index[i] * 2 + 1]);
      }
    } else {
      indexedPosition.push(...position);
      indexedNormal.push(...normal);
      indexedUV.push(...uv);
    }

    return {
      name,
      position: new Float32Array(indexedPosition),
      normal: new Float32Array(indexedNormal),
      uv: new Float32Array(indexedUV),
      texture,
    };
  });
}
