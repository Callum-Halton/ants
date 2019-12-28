import Agent from './agent.js';
import { colorString } from './utils.js';

export default class Colony {
  constructor(terrain, spec) {
    // Don't copy and keep a reference to spec because spec might change later.
    this.terrain = terrain;
    this.loc = spec.loc;
    this.id = spec.id;
    this.color = spec.color;
    this.maxAgents = spec.maxAgents;
    this.agentsSpawned = 0;
    this.meanStepsBetweenSpawns = spec.meanStepsBetweenSpawns;
    this.framesUntilSpawn = 1;
    this.agents = [];
    this.terrain.changeFeature(this.loc, "home", 1);
    this.agent = {
      colorRender              : colorString(spec.agent.color),
      vision                   : spec.agent.vision,
      agitated                 : spec.agent.agitated,
      resourceCarryingCapacity : spec.agent.resourceCarryingCapacity,
      radius                   : spec.agent.radius,
      speed                    : spec.agent.speed,
    }
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
