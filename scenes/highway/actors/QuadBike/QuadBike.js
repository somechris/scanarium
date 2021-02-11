class QuadBike extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 500;
        const initialMaxSpeed = 900;
        const width = 350;
        const tires = [
          {x1: 2, x2: 62, y1: 129, y2: 189, w: 232, h: 190, clearance: 2},
          {x1: 171, x2: 231, y1: 129, y2: 189, w: 232, h: 190, clearance: 2},
        ];
        const angularShake = 1;
        const yShake = 1;
        super('QuadBike', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('QuadBike', QuadBike);
