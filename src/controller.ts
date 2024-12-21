import { Renderer } from './renderer';
import { RenderableModel, StaticModel } from './types';

export class Controller {
  private renderer: Renderer;
  private shellModel: StaticModel;
  private tankBodyModel: RenderableModel;
  private tankBarrelModel: RenderableModel;
  private tankTurretModel: RenderableModel;
  private shellRenderableModels: RenderableModel[] = [];
  private shellRenderedTime: number[] = [];

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

  private calculateBarrelLocation() {
    const radius = 0.25;

    this.tankBarrelModel.location[0] =
      this.tankBodyModel.location[0] -
      radius * (Math.cos(this.tankBodyModel.rotation[1]) - Math.cos(this.tankBarrelModel.rotation[1]));
    this.tankBarrelModel.location[2] =
      this.tankBodyModel.location[2] -
      radius * (Math.sin(this.tankBarrelModel.rotation[1]) - Math.sin(this.tankBodyModel.rotation[1]));

    this.tankTurretModel.location[0] =
      this.tankBodyModel.location[0] -
      radius * (Math.cos(this.tankBodyModel.rotation[1]) - Math.cos(this.tankTurretModel.rotation[1]));
    this.tankTurretModel.location[2] =
      this.tankBodyModel.location[2] -
      radius * (Math.sin(this.tankTurretModel.rotation[1]) - Math.sin(this.tankBodyModel.rotation[1]));
  }

  private handlePressUp() {
    const angle = this.tankBodyModel.rotation[1];
    this.tankBodyModel.location[0] += 0.1 * Math.cos(angle);
    this.tankBodyModel.location[2] -= 0.1 * Math.sin(angle);

    this.calculateBarrelLocation();

    this.updateMessage('ArrowUp');
  }

  private handlePressDown() {
    const angle = this.tankBodyModel.rotation[1];
    this.tankBodyModel.location[0] -= 0.1 * Math.cos(angle);
    this.tankBodyModel.location[2] += 0.1 * Math.sin(angle);

    this.calculateBarrelLocation();

    this.updateMessage('ArrowDown');
  }

  private handlePressLeft() {
    const prevBarrelRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];

    this.tankBodyModel.rotation[1] += 0.1;

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;

    this.calculateBarrelLocation();

    this.updateMessage('ArrowLeft');
  }

  private handlePressRight() {
    const prevBarrelRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];

    this.tankBodyModel.rotation[1] -= 0.1;

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + prevBarrelRotation;

    this.calculateBarrelLocation();

    this.updateMessage('ArrowRight');
  }

  private handlePressA() {
    const prevRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];
    const nextRotation = prevRotation + 0.05;

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + nextRotation;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + nextRotation;

    this.calculateBarrelLocation();

    this.updateMessage('A');
  }

  private handlePressD() {
    const prevRotation = this.tankBarrelModel.rotation[1] - this.tankBodyModel.rotation[1];
    const nextRotation = prevRotation - 0.05;

    this.tankBarrelModel.rotation[1] = this.tankBodyModel.rotation[1] + nextRotation;
    this.tankTurretModel.rotation[1] = this.tankBodyModel.rotation[1] + nextRotation;

    this.calculateBarrelLocation();

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
    const newShellRenderableModel: RenderableModel = {
      staticModel: this.shellModel,
      location: new Float32Array([
        this.tankBarrelModel.location[0] + 0.25 * Math.cos(this.tankBarrelModel.rotation[1]),
        0.15 + Math.sin(0.05 + this.tankTurretModel.rotation[2] * 0.3),
        this.tankBarrelModel.location[2] - 0.25 * Math.sin(this.tankBarrelModel.rotation[1]),
      ]),
      rotation: new Float32Array([0, this.tankBarrelModel.rotation[1], 0.15 + this.tankTurretModel.rotation[2]]),
      scale: new Float32Array([0.8, 0.8, 0.8]),
    };

    this.renderer.addModel(newShellRenderableModel);
    this.shellRenderableModels.push(newShellRenderableModel);
    this.shellRenderedTime.push(Date.now());

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
}
