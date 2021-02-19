class OldFamilyCar extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 300;
        const initialMaxSpeed = 600;
        const width = 500;
        const tires = [
          {x1: 46, x2: 104, y1: 92, y2: 150, w: 398, h: 151},
          {x1: 285, x2: 343, y1: 92, y2: 150, w: 398, h: 151},
        ];
        const angularShake = 0.2;
        const yShake = 1.5;
        super('OldFamilyCar', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, angularShake, yShake);
    }
}

ScActorManager.registerActor('OldFamilyCar', OldFamilyCar);
