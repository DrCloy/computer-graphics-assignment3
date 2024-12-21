import { Renderer } from './renderer';
import { RenderableModel, StaticModel } from './types';

export class Controller {
  private renderer: Renderer;
  private shellModel: StaticModel;
  private tankBodyModel: RenderableModel;
  private tankTurretModel: RenderableModel;
  private tankBarrelModel: RenderableModel;
  private shellRenderableModels: RenderableModel[] = [];
  private shellRenderedTime: number[] = [];

  public isPaused = false;

  public constructor(
    renderer: Renderer,
    shellModel: StaticModel,
    tankBodyModel: RenderableModel,
    tankTurretModel: RenderableModel,
    tankBarrelModel: RenderableModel
  ) {
    this.renderer = renderer;
    this.shellModel = shellModel;
    this.tankBodyModel = tankBodyModel;
    this.tankTurretModel = tankTurretModel;
    this.tankBarrelModel = tankBarrelModel;
  }

  private updateMessage(message: string) {
    const messageElem = document.querySelector<HTMLDivElement>('#message')!;
    messageElem.innerText = `The Key "${message}" is down.`;
  }

  private handlePressUp() {
    const angle = this.tankBodyModel.rotation[1];
    this.tankBodyModel.location[0] += 0.1 * Math.cos(angle);
    this.tankBodyModel.location[2] -= 0.1 * Math.sin(angle);
    this.tankTurretModel.location[0] += 0.1 * Math.cos(angle);
    this.tankTurretModel.location[2] -= 0.1 * Math.sin(angle);
    this.tankBarrelModel.location[0] += 0.1 * Math.cos(angle);
    this.tankBarrelModel.location[2] -= 0.1 * Math.sin(angle);

    this.updateMessage('ArrowUp');
  }

  private handlePressDown() {
    const angle = this.tankBodyModel.rotation[1];
    this.tankBodyModel.location[0] -= 0.1 * Math.cos(angle);
    this.tankBodyModel.location[2] += 0.1 * Math.sin(angle);
    this.tankTurretModel.location[0] -= 0.1 * Math.cos(angle);
    this.tankTurretModel.location[2] += 0.1 * Math.sin(angle);
    this.tankBarrelModel.location[0] -= 0.1 * Math.cos(angle);
    this.tankBarrelModel.location[2] += 0.1 * Math.sin(angle);

    this.updateMessage('ArrowDown');
  }

  private handlePressLeft() {
    this.tankBodyModel.rotation[1] += 0.1;
    this.tankTurretModel.rotation[1] += 0.1;
    this.tankBarrelModel.rotation[1] += 0.1;

    this.updateMessage('ArrowLeft');
  }

  private handlePressRight() {
    this.tankBodyModel.rotation[1] -= 0.1;
    this.tankTurretModel.rotation[1] -= 0.1;
    this.tankBarrelModel.rotation[1] -= 0.1;

    this.updateMessage('ArrowRight');
  }

  private handlePressW() {
    this.tankBarrelModel.rotation[2] += 0.1;

    this.updateMessage('W');
  }

  private handlePressS() {
    this.tankBarrelModel.rotation[2] -= 0.1;

    this.updateMessage('S');
  }

  private handlePressA() {
    this.tankTurretModel.rotation[1] += 0.1;
    this.tankBarrelModel.rotation[1] += 0.1;

    this.updateMessage('A');
  }

  private handlePressD() {
    this.tankTurretModel.rotation[1] -= 0.1;
    this.tankBarrelModel.rotation[1] -= 0.1;

    this.updateMessage('D');
  }

  private handlePressSpace() {
    const newShellRenderableModel: RenderableModel = {
      staticModel: this.shellModel,
      location: new Float32Array([0, 0, 0]),
      rotation: new Float32Array([0, 0, 0]),
      scale: new Float32Array([1, 1, 1]),
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
        case 's':
          this.handlePressS();
          break;
        case 'a':
          this.handlePressA();
          break;
        case 'd':
          this.handlePressD();
          break;
        case ' ':
          this.handlePressSpace();
          break;
        case 'p':
          this.handlePressP();
          break;
      }
    });
  }
}
