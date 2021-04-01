class SportsCar extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 600;
        const initialMaxSpeed = 1300;
        const width = 650;
        const tires = [
          {x1: 82, x2: 150, y1: 66, y2: 133, w: 473, h: 134},
          {x1: 366, x2: 433, y1: 66, y2: 133, w: 473, h: 134},
        ];
        const undercarriage = [
          {points: [[70, 118], [420, 118], [447, 94], [429, 56], [115, 56], [70, 65]], w: 473, h: 134},
          ];
        const angularShake = 0.05;
        const yShake = 0.5;
        super('SportsCar', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(SportsCar);
