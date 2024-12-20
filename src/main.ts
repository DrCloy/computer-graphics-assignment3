import './style.css';
import { main } from './app';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1 id="header">Project #3: Tank</h1>
    <canvas id="canvas"></canvas>
    <div id="message">Message Area</div>
  </div>
`;

main();
