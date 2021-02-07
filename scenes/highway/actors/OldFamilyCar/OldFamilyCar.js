class OldFamilyCar extends Vehicle {
    constructor(x, y, flavor) {
        const tires = [
          {x1: 46, x2: 104, y1: 92, y2: 150, w: 398, h: 151, clearance: 1},
          {x1: 285, x2: 343, y1: 92, y2: 150, w: 398, h: 151, clearance: 1},
        ];
        const angularShake = 0.2;
        super('OldFamilyCar', flavor, x, y, 500, tires, angularShake);
    }
}

ScActorManager.registerActor('OldFamilyCar', OldFamilyCar);
