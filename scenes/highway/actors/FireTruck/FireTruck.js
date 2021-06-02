// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class FireTruck extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 500;
        const initialMaxSpeed = 850;
        const width = 1000;
        const tires = [
          {x1: 131, x2: 261, y1: 344, y2: 474, w: 942, h: 474},
          {x1: 608, x2: 738, y1: 344, y2: 474, w: 942, h: 474},
        ];
        const undercarriage = [
          {points: [[106, 395], [172, 422], [790, 422], [790, 300], [106, 300]], w: 942, h: 474},
          ];
        const angularShake = 0.1;
        const yShake = 0.5;
        const decal = undefined;
        const beacon = {x1: 86, y1: 17, x2: 126, y2: 35, w: 942, h: 474, chance: 0.2, speedFactor: 2.5, phaseLength: 500, phaseSlotLength: 100, litSlots: [0, 2]};
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake, decal, beacon);
    }
}

ScActorManager.registerActor(FireTruck);
