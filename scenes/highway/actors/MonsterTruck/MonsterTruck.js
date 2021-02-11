class MonsterTruck extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 500;
        const initialMaxSpeed = 900;
        const width = 600;
        const tires = [
          {x1: 1, x2: 168, y1: 101, y2: 267, w: 451, h: 268, clearance: 2},
          {x1: 283, x2: 450, y1: 101, y2: 267, w: 451, h: 268, clearance: 2},
        ];
        const angularShake = 0.2;
        const yShake = 3;
        super('MonsterTruck', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('MonsterTruck', MonsterTruck);
