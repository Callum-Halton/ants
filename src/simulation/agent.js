import { MyMath, Point, colorString, DropContext } from './utils.js';

export default class Agent {
  constructor(terrain, profile, dropContext) {
    // The agent can interact with the terrain via the following object
    // reference.
    this._terrain = terrain;
    this._profile = profile;
    let { loc, origin } = dropContext;
    this._loc = new Point(loc.x, loc.y);
    this._direction = Math.random() * 360;
    this._resourceWallet = {
                            food: 0,
                            buildingMaterial: 0,
                           };
    this._carriedResource = 0;
    this._selected = false;
    this._memories = {
      resource : 0,
      home     : origin === 'home' ? 0.2 : 0,
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
    let { _terrain, _loc, _profile, _direction } = this;
    let { speed } = _profile;
    
    let startLoc = new Point(_loc.x, _loc.y);
    this._loc.x += speed * MyMath.cos(_direction);
    this._loc.y += speed * MyMath.sin(_direction);
    
    if (_loc.x < 0) { _loc.x = 0; }
    if (_loc.y < 0) { _loc.y = 0; }
    
    let { width, height } = _terrain;
    if (_loc.x >= width) { _loc.x = height-1; }
    if (_loc.y >= height) { _loc.y = width-1; }
    
    _terrain.moveAgent(this, _profile.id, startLoc, _loc);
  }

  /*
  _reached(target) {
    let threshold = this._profile.speed / 2;
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
    if (Math.random() < this._profile.agitated) {
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

    let remainingCapacity = this._profile.resourceCarryingCapacity -
                            this._carriedResource;
    if (remainingCapacity) { // head for resource
      // First, try to consume resource
      // TODO: limit rate that agents can remove resource
      let removedResource = this._terrain.takeFeature(this._loc, "resource", "food",
                                                         remainingCapacity, null);
      this._carriedResource += removedResource;
      this._resourceWallet.food += removedResource;
      if (this._carriedResource ===
          this._profile.resourceCarryingCapacity) {
        // Just got full
        this._memories.resource = this._carriedResource;
      } else if (removedResource === 0) {
        // There ain't no resource here, so let's look for some ...
        let resourceMarkerID = this._profile.markerIDs.resource;
        let features = { resource : { food : [] }, marker : {}, };
        features.marker[resourceMarkerID] = null;
        this._terrain.getLocalFeatures(this._loc, features, this._profile.localBounds);
        if (features.resource.food.length > 0) {
          // Can see resource, so move towards it
          let closestResource = {
                  loc: null, dist: this._profile.vision + 10};
          features.resource.food.forEach(resourceLoc => {
            let distanceToResource = Math.hypot(resourceLoc.x - this._loc.x,
                                                resourceLoc.y - this._loc.y);
            if (distanceToResource < closestResource.dist) {
              closestResource = {loc: resourceLoc, dist: distanceToResource};
            }
          });
          if (closestResource.loc == null) {
            closestResource.loc = features.resource.food[0];
          }
          this._direction = this._angleTo(closestResource.loc);
        } else {
          // Cannot see resource, so let's try smelling for some ...
          let directionUpResourceMarkerGradient =
              this._upGradientDirection(features.marker[resourceMarkerID]);
          if (directionUpResourceMarkerGradient) {
            this._direction = directionUpResourceMarkerGradient;
          } else {
            // Cannot smell resource, so let's just wander around aimlessly
            this._wanderAimlessly();
          }
        }
      }
    } else { // head for home
      let homeMarkerID = this._profile.markerIDs.home;
      // Is this home? ...
      if (this._terrain.getFeature(this._loc, "colony", this._profile.homeID)) {
        this._carriedResource = 0;
        this._resourceWallet.food = 0;
        this._memories.home = 0.2;
      } else {
        //Let's look for home ...
        let features = { colony : {}, marker : {}, };
        features.colony[this._profile.homeID] = [];
        features.marker[homeMarkerID] = null;
        this._terrain.getLocalFeatures(this._loc, features, this._profile.localBounds);
        if (features.colony[this._profile.homeID].length > 0) {
          // Can see home, so move towards it
          this._direction = this._angleTo(features.colony[this._profile.homeID][0]);
        } else {
          // Cannot see home, so let's try smelling for it ...
          let directionUpHomeMarkerGradient =
              this._upGradientDirection(features.marker[homeMarkerID]);
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
    if (this._loc.x > (this._terrain.width - this._profile.radius) ||
        this._loc.x < this._profile.radius) {
      this._direction = (180 - this._direction) % 360;
    }
    if (this._loc.y > (this._terrain.height - this._profile.radius) ||
        this._loc.y < this._profile.radius) {
      this._direction = -this._direction % 360;
    }
  }

  _dropMarkers() {
    let markerProfiles = this._terrain.featureProfiles.marker;
    for (let thing in this._memories) {
      let markerID = this._profile.markerIDs[thing];
      if (this._memories[thing]) {
        this._terrain.addFeature(new DropContext(this._loc, 'agent'), "marker", markerID, this._memories[thing]);
        this._memories[thing] *= this._profile.forgetRate;
        if (this._memories[thing] < markerProfiles[markerID].minimumIntensity) {
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
    
    let cRender = colorString(this._profile.color);
    if (this._selected) {
      this._drawAgentShape(ctx, this._profile.radius * 1.5, cRender);
      this._drawAgentShape(ctx, this._profile.radius * 1.25, '#ffffff');
    }

    this._drawAgentShape(ctx, this._profile.radius, cRender);

    if (this._carriedResource === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this._loc.x, this._loc.y, this._profile.radius / 2, 0,
              Math.PI * 2);
      ctx.fill();
    }
    /*
     //VISION CIRCLE
    ctx.strokeStyle = this._profile.colorRender;
    ctx.beginPath();
    ctx.arc(this._loc.x, this._loc.y, this._profile.vision, 0,
            Math.PI * 2);
    ctx.stroke();*/
    
    if (!agentsFrozen) {
      this._update();
    }
  }
}
