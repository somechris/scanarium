class SportsCar extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 600;
        const initialMaxSpeed = 1300;
        const width = 650;
        const tires = [
          {x1: 82, x2: 150, y1: 66, y2: 133, w: 473, h: 134},
          {x1: 366, x2: 433, y1: 66, y2: 133, w: 473, h: 134},
        ];
        const angularShake = 0.05;
        const yShake = 0.5;
        super('SportsCar', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('SportsCar', SportsCar);
