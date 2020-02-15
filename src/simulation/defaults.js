
export class DefaultFeatureProfile {
    constructor(id, name, color, quantitative) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.paletteAmount = quantitative ? 0.5 : null;
    }
}

export class DefaultMarkerProfile extends DefaultFeatureProfile {
  constructor(id, name, color, quantitative) {
    super(id, name, color, quantitative);
    this.minimumIntensity = 0.01;
    this.fadeRate = 0.997;
  }
}


export class DefaultColonyProfile extends DefaultFeatureProfile {
    constructor(id, name, color, quantitative) {
        super(id, name, color, quantitative);
        this.maxAgents = 1000;
        this.meanStepsBetweenSpawns = 100;
        this.agentID = 'AG1';
    }
}

export class DefaultAgentProfile extends DefaultFeatureProfile {
    constructor(id, name, color, quantitative, cellSize) { 
        super(id, name, color, quantitative);
        this.vision = cellSize * 10;
        this.localBounds = null;
        this.radius = 6;
        this.speed = 3;
        this.agitated = 0.01;
        this.resourceCarryingCapacity = 0.02;
        this.forgetRate = 0.995;
        this.homeID = 'CO1';
        this.markerIDs = {
            home: 'MA1',
            resource: 'MA2',
        };
    }
}

export class DefaultFeatureProfiles {
    constructor() {
        this.resource = {food: new DefaultFeatureProfile('food', 'Food', [0, 255, 255], true)};
        this.barrier = {wall: new DefaultFeatureProfile('wall', 'Wall', [0, 0, 0], false)};
        this.agent = {};
        this.colony = {};
        this.marker = {};
    }
}