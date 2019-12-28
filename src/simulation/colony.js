import Agent from './agent.js';
import { colorString } from './utils.js';

export default class Colony {
  constructor(terrain, spec) {
    // Don't copy and keep a referenc to spec because spec might change later.
    this.terrain = terrain;
    this.loc = spec.loc;
    this.id = spec.id;
    this.color = spec.color;
    this.agentColor = spec.agentColor;
    this.agentColorRender = colorString(this.agentColor);
    this.agentVision = spec.agentVision;
    this.agentAgitated = spec.agentAgitated;
    this.agentRadius = 6;
    this.agentSpeed = 3;
    this.maxAgents = spec.maxAgents;
    this.agentsSpawned = 0;
    this.meanStepsBetweenSpawns = spec.meanStepsBetweenSpawns;
    this.framesUntilSpawn = 1;
    this.agents = [];
    this.terrain.changeFeature(this.loc, "home", 1);
  }

  spawnAgents() {
    this.framesUntilSpawn -= 1;
    if (this.agentsSpawned < this.maxAgents && this.framesUntilSpawn <= 0) {
      this.agents.push(new Agent(this.terrain, this));
      this.framesUntilSpawn = Math.floor(
        Math.random() * this.meanStepsBetweenSpawns * 2);
    }
  }

  update() {
    this.spawnAgents();
  }

  draw(ctx, agentsFrozen) {
    if (!agentsFrozen) {
      this.update();
    }
    for (let agent of this.agents) {
      agent.draw(ctx, agentsFrozen);
    }
  }
}
