import { Renderer } from './renderer';
import { RenderableModel, StaticModel } from './types';
import { mat4, vec3 } from 'wgpu-matrix';

export class Controller {
  private renderer: Renderer;
  private shellModel: StaticModel;
  private tankBodyModel: RenderableModel;
  private tankBarrelModel: RenderableModel;
  private tankTurretModel: RenderableModel;
  private shellRenderableModels: RenderableModel[] = [];
  private shellVelocityVectors: Float32Array[] = [];

  public isPaused = false;

  public constructor(
    renderer: Renderer,
    shellModel: StaticModel,
    tankBodyModel: RenderableModel,
    tankBarrelModel: RenderableModel,
    tankTurretModel: RenderableModel
  ) {
    this.renderer = renderer;
    this.shellModel = shellModel;
    this.tankBodyModel = tankBodyModel;
    this.tankBarrelModel = tankBarrelModel;
    this.tankTurretModel = tankTurretModel;
  }

  private updateMessage(message: string) {
    const messageElem = document.querySelector<HTMLDivElement>('#message')!;
    messageElem.innerText = `The Key "${message}" is down.`;
  }

  private calculateDirectionVector(roll: number, pitch: number, yaw: number): Float32Array {
    const directionVector = vec3.fromValues(1, 0, 0);

    const rotationMatrix = mat4.create();
    mat4.identity(rotationMatrix);
    mat4.rotateX(rotationMatrix, roll, rotationMatrix);
    mat4.rotateY(rotationMatrix, pitch, rotationMatrix);
    mat4.rotateZ(rotationMatrix, yaw, rotationMatrix);

    vec3.transformMat4(directionVector, rotationMatrix, directionVector);

    return directionVector;
  }

  private adjustBarrelLocation(tankBodyDirectionVector: Float32Array) {
    const tankBarrelDirectionVector = this.calculateDirectionVector(
      this.tankBarrelModel.rotation[0],
      this.tankBarrelModel.rotation[1],
      this.tankBarrelModel.rotation[2]
    );

    const tankBarrelCenterDirectionVector = vec3.subtract(tankBarrelDirectionVector, tankBodyDirectionVector);

    const radius = 0.25;

    vec3.add(
      this.tankBodyModel.location,
      vec3.scale(tankBarrelCenterDirectionVector, radius),
      this.tankBarrelModel.location
    );
    vec3.add(
      this.tankBodyModel.location,
      vec3.scale(tankBarrelCenterDirectionVector, radius),
      this.tankTurretModel.location
    );
  }

  private handlePressUp() {
    const tankBodyDirectionVector = this.calculateDirectionVector(
      this.tankBodyModel.rotation[0],
      this.tankBodyModel.rotation[1],
      this.tankBodyModel.rotation[2]
    );
    vec3.normalize(tankBodyDirectionVector, tankBodyDirectionVector);

    vec3.add(this.tankBodyModel.location, vec3.scale(tankBodyDirectionVector, 0.1), this.tankBodyModel.location);

    this.adjustBarrelLocation(tankBodyDirectionVector);

    this.updateMessage('ArrowUp');
  }

  private handlePressDown() {
    const tankDirectionVector = this.calculateDirectionVector(
      this.tankBodyModel.rotation[0],
      this.tankBodyModel.rotation[1],
      this.tankBodyModel.rotation[2]
    );
    vec3.normalize(tankDirectionVector, tankDirectionVector);

    vec3.subtract(this.tankBodyModel.location, vec3.scale(tankDirectionVector, 0.1), this.tankBodyModel.location);

    this.adjustBarrelLocation(tankDirectionVector);

    this.updateMessage('ArrowDown');
  }

  private handlePressLeft() {
    const prevBarrelRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];

    this.tankBodyModel.rotation[1] += 0.1;

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;

    const tankBodyDirectionVector = this.calculateDirectionVector(
      this.tankBodyModel.rotation[0],
      this.tankBodyModel.rotation[1],
      this.tankBodyModel.rotation[2]
    );
    vec3.normalize(tankBodyDirectionVector, tankBodyDirectionVector);

    this.adjustBarrelLocation(tankBodyDirectionVector);

    this.updateMessage('ArrowLeft');
  }

  private handlePressRight() {
    const prevBarrelRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];

    this.tankBodyModel.rotation[1] -= 0.1;

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;

    const tankBodyDirectionVector = this.calculateDirectionVector(
      this.tankBodyModel.rotation[0],
      this.tankBodyModel.rotation[1],
      this.tankBodyModel.rotation[2]
    );
    vec3.normalize(tankBodyDirectionVector, tankBodyDirectionVector);

    this.adjustBarrelLocation(tankBodyDirectionVector);

    this.updateMessage('ArrowRight');
  }

  private handlePressA() {
    const prevBarrelRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation + 0.05;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation + 0.05;

    const tankBodyDirectionVector = this.calculateDirectionVector(
      this.tankBodyModel.rotation[0],
      this.tankBodyModel.rotation[1],
      this.tankBodyModel.rotation[2]
    );
    vec3.normalize(tankBodyDirectionVector, tankBodyDirectionVector);

    this.adjustBarrelLocation(tankBodyDirectionVector);

    this.updateMessage('A');
  }

  private handlePressD() {
    const prevBarrelRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation - 0.05;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation - 0.05;

    const tankBodyDirectionVector = this.calculateDirectionVector(
      this.tankBodyModel.rotation[0],
      this.tankBodyModel.rotation[1],
      this.tankBodyModel.rotation[2]
    );
    vec3.normalize(tankBodyDirectionVector, tankBodyDirectionVector);

    this.adjustBarrelLocation(tankBodyDirectionVector);

    this.updateMessage('D');
  }

  private handlePressW() {
    this.tankTurretModel.rotation[2] += 0.05;
    if (this.tankTurretModel.rotation[2] > 0.25) {
      this.tankTurretModel.rotation[2] = 0.25;
    }

    this.updateMessage('W');
  }

  private handlePressS() {
    this.tankTurretModel.rotation[2] -= 0.05;
    if (this.tankTurretModel.rotation[2] < -0.25) {
      this.tankTurretModel.rotation[2] = -0.25;
    }

    this.updateMessage('S');
  }

  private handlePressSpace() {
    const newShellLocation = vec3.clone(this.tankBarrelModel.location);
    const tankBarrelDirectionVector = this.calculateDirectionVector(
      this.tankBarrelModel.rotation[0],
      this.tankBarrelModel.rotation[1],
      this.tankTurretModel.rotation[2]
    );
    vec3.scale(tankBarrelDirectionVector, 0.25, tankBarrelDirectionVector);
    vec3.add(newShellLocation, tankBarrelDirectionVector, newShellLocation);
    newShellLocation[1] += 0.2;

    const newShellDirectionVector = vec3.clone(tankBarrelDirectionVector);

    const newShellVelocityVector = vec3.scale(newShellDirectionVector, 0.15);

    const newShellRenderableModel: RenderableModel = {
      staticModel: this.shellModel,
      location: newShellLocation,
      rotation: vec3.create(0, this.tankBarrelModel.rotation[1], this.tankTurretModel.rotation[2]),
      scale: vec3.create(0.8, 0.8, 0.8),
    };

    this.shellRenderableModels.push(newShellRenderableModel);
    this.shellVelocityVectors.push(newShellVelocityVector);

    this.renderer.addModel(newShellRenderableModel);

    this.updateMessage(' ');
  }

  private handlePressP() {
    this.isPaused = !this.isPaused;

    this.updateMessage('P');
  }

  public async initialize() {
    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowUp':
          this.handlePressUp();
          break;
        case 'ArrowDown':
          this.handlePressDown();
          break;
        case 'ArrowLeft':
          this.handlePressLeft();
          break;
        case 'ArrowRight':
          this.handlePressRight();
          break;
        case 'w':
          this.handlePressW();
          break;
        case 'ㅈ':
          this.handlePressW();
          break;
        case 's':
          this.handlePressS();
          break;
        case 'ㄴ':
          this.handlePressS();
          break;
        case 'a':
          this.handlePressA();
          break;
        case 'ㅁ':
          this.handlePressA();
          break;
        case 'd':
          this.handlePressD();
          break;
        case 'ㅇ':
          this.handlePressD();
          break;
        case ' ':
          this.handlePressSpace();
          break;
        case 'p':
          this.handlePressP();
          break;
        case 'ㅔ':
          this.handlePressP();
          break;
        default:
          break;
      }
    });
  }

  public update() {
    for (let i = 0; i < this.shellRenderableModels.length; ++i) {
      const shellRenderableModel = this.shellRenderableModels[i];
      const shellVelocityVector = this.shellVelocityVectors[i];

      if (shellRenderableModel.location[1] < -0.5) {
        this.renderer.removeModel(shellRenderableModel);
        this.shellRenderableModels.splice(i, 1);
        this.shellVelocityVectors.splice(i, 1);
        --i;
        continue;
      } else {
        const elapsedTime = 1;
        const prevLocation = vec3.clone(shellRenderableModel.location);

        vec3.add(
          shellRenderableModel.location,
          vec3.scale(shellVelocityVector, elapsedTime),
          shellRenderableModel.location
        );

        vec3.add(shellVelocityVector, vec3.fromValues(0, -0.00098, 0), shellVelocityVector);
      }
    }
  }
}
