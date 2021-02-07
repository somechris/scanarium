class SportsCar extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 600;
        const initialMaxSpeed = 1300;
        const width = 650;
        const tires = [
          {x1: 170, x2: 318, y1: 137, y2: 285, w: 1000, h: 286, clearance: 1},
          {x1: 767, x2: 915, y1: 137, y2: 285, w: 1000, h: 286, clearance: 1},
        ];
        const angularShake = 0.05;
        const yShake = 0.5;
        super('SportsCar', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('SportsCar', SportsCar);
