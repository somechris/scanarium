class Truck extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 400;
        const initialMaxSpeed = 750;
        const width = 1000;
        const tires = [
          {x1: 42, x2: 94, y1: 183, y2: 235, w: 470, h: 236, clearance: 2},
          {x1: 290, x2: 342, y1: 183, y2: 235, w: 470, h: 236, clearance: 2},
          {x1: 357, x2: 409, y1: 183, y2: 235, w: 470, h: 236, clearance: 2},
        ];
        const angularShake = 0.2;
        const yShake = 1.5;
        super('Truck', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('Truck', Truck);
