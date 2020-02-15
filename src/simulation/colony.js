import { Point } from './utils.js';

export default class Colony {
  constructor(terrain, profile, spawnContext) {
    this._terrain = terrain;
    this._profile = profile;
    let { x, y } = spawnContext.loc;
    this._loc = new Point(x, y);
    this._agentsSpawned = 0;
    this._stepsUntilSpawn = 1;
  }

  spawnAgents() {
    this._stepsUntilSpawn -= 1;
    if (this._agentsSpawned < this._profile.maxAgents && this._stepsUntilSpawn <= 0) {
      this._terrain.addFeatureObject(
        'agent', 
        this._profile.agentID, 
        {loc: this._loc, origin: 'home'}
      );
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
