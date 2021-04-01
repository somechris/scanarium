class Bus extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 400;
        const initialMaxSpeed = 750;
        const width = 1000;
        const tires = [
          {x1: 73, x2: 116, y1: 116, y2: 159, w: 460, h: 160},
          {x1: 347, x2: 390, y1: 116, y2: 159, w: 460, h: 160},
        ];
        const undercarriage = [
          {points: [[60, 144], [410, 144], [410, 100], [60, 100]], w: 460, h: 160},
          ];
        const angularShake = 0.1;
        const yShake = 1.5;
        super('Bus', flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(Bus);
