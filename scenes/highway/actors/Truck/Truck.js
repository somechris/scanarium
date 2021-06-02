// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class Truck extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 400;
        const initialMaxSpeed = 750;
        const width = 1000;
        const tires = [
          {x1: 42, x2: 94, y1: 182, y2: 233, w: 474, h: 234},
          {x1: 291, x2: 343, y1: 182, y2: 233, w: 474, h: 234},
          {x1: 358, x2: 410, y1: 182, y2: 233, w: 474, h: 234},
        ];
        const undercarriage = [
          {points: [[24, 206], [420, 206], [420, 164], [24, 164]], w: 474, h: 234},
          ];
        const angularShake = 0.2;
        const yShake = 1.5;
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(Truck);
