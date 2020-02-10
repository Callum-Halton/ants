import Agent from './agent.js';
import { Point } from './utils.js';

export default class Colony {
  constructor(terrain, profile, loc) {
    this._terrain = terrain;
    this._loc = new Point(loc.x, loc.y);
    this._profile = profile;
    this._agentsSpawned = 0;
    this._stepsUntilSpawn = 1;
  }

  spawnAgents() {
    this._stepsUntilSpawn -= 1;
    if (this._agentsSpawned < this._profile.maxAgents && this._stepsUntilSpawn <= 0) {
      console.log(this._agentsSpawned < this._profile.maxAgents, this._stepsUntilSpawn <= 0);
      console.log(this._terrain);
      this._terrain.addFeatureObject('agent', this._profile.agentID, this._loc);
      this._stepsUntilSpawn = Math.floor(
        Math.random() * this._profile.meanStepsBetweenSpawns * 2);
    }
  }

  draw(ctx, agentsFrozen) {
    if (!agentsFrozen) {
      this.spawnAgents();
    }
  }
}
