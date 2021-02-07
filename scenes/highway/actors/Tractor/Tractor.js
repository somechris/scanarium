class Tractor extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 150;
        const initialMaxSpeed = 350;
        const width = 550;
        const tires = [
          {x1: 1, x2: 263, y1: 526, y2: 789, w: 1000, h: 791, clearance: 1},
          {x1: 541, x2: 998, y1: 332, y2: 789, w: 1000, h: 791, clearance: 1},
        ];
        const angularShake = 0.2;
        const yShake = 1.5;
        super('Tractor', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('Tractor', Tractor);
