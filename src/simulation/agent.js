import { MyMath, Point } from './utils.js';

export default class Agent {
  constructor(terrain, colony) {
    // The agent can interact with the terrain via the following object
    // reference.
    this._terrain = terrain;
    this._colony = colony;
    this._loc = new Point(this._colony.loc.x, this._colony.loc.y);
    this._direction = Math.random() * 360;
    this._resourceWallet = {
                            food: 0,
                            buildingMaterial: 0,
                           };
    this._carriedResource = 0;
    this._selected = false;
    this._memories = {
      resource: 0,
      home    : 0.2,
    };
  }

  _angleTo(target) {
    /*
    Remember that the x-axis increases left-to-right, but the y-axis
    increases top-to-bottom. So angle increases clockwise.
    */

    let dx = target.x - this._loc.x; // x-component of vector pointing at target
    let dy = target.y - this._loc.y; // y-component of vector pointing at target
    let angle = MyMath.atan(dy/dx);

    if (dx === 0) {
      // Handle case where dy/dx is undefined.
      if (dy > 0) {
        // Target is below
        return 90;
      } else {
        // Target is above
        return 270;
      }
    } else if (dy > 0) {
      if (dx > 0) {
        // Bottom-right quadrant
        // angle = angle;
      } else {
        // Bottom-left quadrant
        angle = 180 + angle;
      }
    } else {
      if (dx > 0) {
        // Top-right quadrant
        angle = 360 + angle;
      } else {
        // top-left quadrant
        angle = 180 + angle;
      }
    }
    return angle;
  }

  _move() {
    this._loc.x += this._colony.agent.speed * MyMath.cos(this._direction);
    this._loc.y += this._colony.agent.speed * MyMath.sin(this._direction);
    // Callum, I added the following checks because sometimes the agents were
    // going off the edge of the canvas, leading to indexing out of bounds
    // in the cell array in terrain.
    if (this._loc.x < 0) { this._loc.x = 0; }
    if (this._loc.y < 0) { this._loc.y = 0; }
    if (this._loc.x >= this._terrain.width) { this._loc.x = this._terrain.height-1; }
    if (this._loc.y >= this._terrain.height) { this._loc.y = this._terrain.width-1; }
  }

  /*
  _reached(target) {
    let threshold = this._colony.agent.speed / 2;
    if (Math.hypot(this._loc.x - target.loc.x, this._loc.y - target.loc.y) <=
        threshold) {
      return true;
    } else {
      return false;
    }
  }
  */

  _upGradientDirection(centerOfGravity) {
    const threshold = this._terrain._cellSize; // hack for now
    if (Math.hypot(this._loc.x - centerOfGravity.x,
                   this._loc.y - centerOfGravity.y) > threshold) {
      let direction = this._angleTo(centerOfGravity);
      return direction;
    } else {
      return null;
    }
  }

  _wanderAimlessly() {
    if (Math.random() < this._colony.agent.agitated) {
      this._direction = Math.random() * 360;
    } // else just keep on truckin' in the same direction
  }

  _changeDirection() {
    /*
    Below is a pseudo-code plan for the method:

    if not full
      if can see resource then
        turn towards resource
      else if there is a resource marker gradient then
        turn up gradient
      else if headed toward a barrier then
        avoid barrier
      else
        change direction probabilistically based on time since last
        change plus other factors.
    if full
      if can see home then
        turn towards home
      else if there is a home marker gradient then
        turn up gradient
      else if headed toward a barrier then
        avoid barrier
      else
        change direction probabilistically based on time since last
        change plus other factors.

    * To make behavior more natural, it might make sense to change
    direction by no more than a fixed amount on each step.
    */

    let features = {destinations : {}, markers : {}};
    let remainingCapacity = this._colony.agent.resourceCarryingCapacity -
                            this._carriedResource;
    //console.log(remainingCapacity);
    if (remainingCapacity) { // head for resource
      // First, try to consume resource
      // TODO: limit rate that agents can remove resource
      let removedResource = this._terrain.takeFeature(this._loc, "food",
                                                         remainingCapacity);
      this._carriedResource += removedResource;
      this._resourceWallet.food += removedResource;
      if (this._carriedResource ===
          this._colony.agent.resourceCarryingCapacity) {
        // Just got full
        this._memories.resource = this._carriedResource;
      } else if (removedResource === 0) {
        // There ain't no resource here, so let's look for some ...
        let resourceMarkerID = this._colony.agent.markerIDs.resource;
        features.destinations.food = [];
        features.markers[resourceMarkerID] = null;
        this._terrain.getLocalFeatures(this._loc, features, this._colony.agent.localBounds);
        if (features.destinations.food.length > 0) {
          // Can see resource, so move towards it
          let closestResource = {
                  loc: null, dist: this._colony.agent.vision + 10};
          features.destinations.food.forEach(resourceLoc => {
            let distanceToResource = Math.hypot(resourceLoc.x - this._loc.x,
                                                resourceLoc.y - this._loc.y);
            if (distanceToResource < closestResource.dist) {
              closestResource = {loc: resourceLoc, dist: distanceToResource};
            }
          });
          if (closestResource.loc == null) {
            closestResource.loc = features.destinations.food[0];
          }
          this._direction = this._angleTo(closestResource.loc);
        } else {
          // Cannot see resource, so let's try smelling for some ...
          let directionUpResourceMarkerGradient =
              this._upGradientDirection(features.markers[resourceMarkerID]);
          if (directionUpResourceMarkerGradient) {
            this._direction = directionUpResourceMarkerGradient;
          } else {
            // Cannot smell resource, so let's just wander around aimlessly
            this._wanderAimlessly();
          }
        }
      }
    } else { // head for home
      let homeMarkerID = this._colony.agent.markerIDs.home;
      // Is this home? ...
      if (this._terrain.getFeature(this._loc, this._colony.id)) {
        this._carriedResource = 0;
        this._resourceWallet.food = 0;
        this._memories.home = 0.2;
      } else {
        //Let's look for home ...
        features.destinations[this._colony.id] = [];
        features.markers[homeMarkerID] = null;
        this._terrain.getLocalFeatures(this._loc, features, this._colony.agent.localBounds);
        if (features.destinations[this._colony.id].length > 0) {
          // Can see home, so move towards it
          this._direction = this._angleTo(features.destinations[this._colony.id][0]);
        } else {
          // Cannot see home, so let's try smelling for it ...
          let directionUpHomeMarkerGradient =
              this._upGradientDirection(features.markers[homeMarkerID]);
          if (directionUpHomeMarkerGradient) {
            this._direction = directionUpHomeMarkerGradient;
          } else {
            // Cannot smell home, so let's just wander around aimlessly
            this._wanderAimlessly();
          }
        }
      }
    }
    /*
    Note that the following bounce mechanism can get caught in a high
    frequency oscillation at the edges of the screen. This is because
    when the incident angle is very small, it's possible that changing
    direction does not move the agent, in one step, far enough from the
    wall such that it's outside of the bounce region. So then it bounces
    back at the wall again. If we intended to keep using this bounce
    mechanism, which I believe we don't, then we could add some temporal
    hysteresis to cause the bounce check to be suppressed for a given
    number of cycles after a bounce occurs.

    The following mod operation is not absolutely necessary, if
    negative angles are allowed, but it we decide that angles are
    to always be in the range [0..360), then the mod is necessary.
    */
    if (this._loc.x > (this._terrain.width - this._colony.agent.radius) ||
        this._loc.x < this._colony.agent.radius) {
      this._direction = (180 - this._direction) % 360;
    }
    if (this._loc.y > (this._terrain.height - this._colony.agent.radius) ||
        this._loc.y < this._colony.agent.radius) {
      this._direction = -this._direction % 360;
    }
  }

  _dropMarkers() {
    for (let thing in this._memories) {
      let markerID = this._colony.agent.markerIDs[thing];
      if (this._memories[thing]) {
        this._terrain.addFeature(this._loc, "marker", markerID, this._memories[thing]);
        this._memories[thing] *= 0.995;
        if (this._memories[thing] < this._terrain.markerProfiles[markerID].minimumIntensity) {
          this._memories[thing] = 0;
        }
      }
    }
    /*
    Periodically drop some marker at the current location based on
    the size of the resource seen and how long ago it was seen
    (resourceMemory). So when a resource is located, the agent's
    resourceMemory jumps up to reflect the resource size, and then that
    memory decays over time. The agent drops a marker with an intensity
    proportional to its current resourceMemory.

    Also drop home_marker in a similar way.
    */
  }

  _update() {
    this._changeDirection();
    this._move();
    this._dropMarkers();
  }

  _drawAgentShape(ctx, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this._loc.x, this._loc.y, radius, 0,
            Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(this._loc.x, this._loc.y);
    ctx.rotate((this._direction - 45) * 2 * Math.PI / 360);
    ctx.fillRect(0, 0, radius, radius);
    ctx.restore();
  }

  draw(ctx, agentsFrozen) {
    if (!agentsFrozen) {
      this._update();
    }
    if (this._selected) {
      this._drawAgentShape(ctx, this._colony.agent.radius * 1.5, this._colony.agent.colorRender);
      this._drawAgentShape(ctx, this._colony.agent.radius * 1.25, '#ffffff');
    }

    this._drawAgentShape(ctx, this._colony.agent.radius, this._colony.agent.colorRender);

    if (this._carriedResource === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this._loc.x, this._loc.y, this._colony.agent.radius / 2, 0,
              Math.PI * 2);
      ctx.fill();
    }
    /* VISION CIRCLE
    ctx.strokeStyle = this._colony.agent.colorRender;
    ctx.beginPath();
    ctx.arc(this._loc.x, this._loc.y, this._colony.agent.vision, 0,
            Math.PI * 2);
    ctx.stroke();
    */
  }
}
