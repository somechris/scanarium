class PoliceCar extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 400;
        const initialMaxSpeed = 750;
        const width = 650;
        const tires = [
          {x1: 134, x2: 275, y1: 330, y2: 472, w: 1000, h: 473},
          {x1: 751, x2: 892, y1: 330, y2: 472, w: 1000, h: 473},
        ];
        const undercarriage = [
          {points: [[100, 405], [920, 405], [920, 302], [110, 302]], w: 1000, h: 473},
          ];
        const angularShake = 0.1;
        const yShake = 1.5;
        const decal = {x1: 311, y1: 239, x2: 805, y2: 318, w: 1000, h: 473};
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake, decal);
    }
}
ScActorManager.registerActor(PoliceCar);
