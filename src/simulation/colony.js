import Agent from './agent.js';
import { colorString } from './utils.js';

class MarkerProfile {
  constructor(color, minimumIntensity, fadeRate) {
    this.color = color;
    this.minimumIntensity = minimumIntensity;
    this.fadeRate = fadeRate;
  }
}

export default class Colony {
  constructor(terrain, spec) {
    // Don't copy and keep a reference to spec because spec might change later.
    this.terrain = terrain;
    this.loc = spec.loc;
    this.baseID = spec.baseID;
    this.id = 'C' + this.baseID;
    this.color = spec.color;
    this.maxAgents = spec.maxAgents;
    this.agentsSpawned = 0;
    this.meanStepsBetweenSpawns = spec.meanStepsBetweenSpawns;
    this.stepsUntilSpawn = 1;
    this.agents = [];
    this.terrain.addFeature(this.loc, "colony", this.id, 1);

    this.agent = {
      markerIDs                : {
                                  resource : 'R' + this.baseID,
                                  home     : 'H' + this.baseID,
                                 },
      colorRender              : colorString(spec.agent.color),
      vision                   : spec.agent.vision,
      localBounds              : this.terrain.preCalcLocalBounds(spec.agent.vision),
      agitated                 : spec.agent.agitated,
      resourceCarryingCapacity : spec.agent.resourceCarryingCapacity,
      radius                   : spec.agent.radius,
      speed                    : spec.agent.speed,
    };

    for (let markerType in this.agent.markerIDs) {
      this.terrain.addFeatureProfile(
        this.agent.markerIDs[markerType], 
        new MarkerProfile(spec.agent.markerColors[markerType], 0.01, 0.997)
      );
    }
    this.terrain.addFeatureProfile(this.id, { cRender : colorString(this.color) });
  }

  agentsCount() {
    return this.agents.length;
  }

  spawnAgents() {
    this.stepsUntilSpawn -= 1;
    if (this.agentsSpawned < this.maxAgents && this.stepsUntilSpawn <= 0) {
      this.agents.push(new Agent(this.terrain, this));
      this.stepsUntilSpawn = Math.floor(
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
    return this.agents.length;
  }
}
