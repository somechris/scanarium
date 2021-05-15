class Ambulance extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 400;
        const initialMaxSpeed = 750;
        const width = 750;
        const tires = [
          {x1: 94, x2: 224, y1: 407, y2: 537, w: 927, h: 539},
          {x1: 716, x2: 846, y1: 407, y2: 537, w: 927, h: 539},
        ];
        const undercarriage = [
          {points: [[50, 480], [890, 480], [890, 380], [50, 380]], w: 927, h: 539},
          ];
        const angularShake = 0.1;
        const yShake = 1.5;
        const decal = undefined;
        const beacon = {x1: 340, y1: 38, x2: 365, y2: 39, w: 927, h: 539, chance: 0.25, speedFactor: 2.5, phaseLength: 400, phaseSlotLength: 100, litSlots: [0, 2], scale: 2};
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake, decal, beacon);
    }
}

ScActorManager.registerActor(Ambulance);
