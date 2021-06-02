// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class Tractor extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 150;
        const initialMaxSpeed = 350;
        const width = 550;
        const tires = [
          {x1: 0, x2: 79, y1: 157, y2: 232, w: 301, h: 233},
          {x1: 164, x2: 300, y1: 99, y2: 232, w: 301, h: 233},
        ];
        const undercarriage = [
          {points: [[22, 154], [22, 183], [266, 183], [256, 93], [200, 82], [138, 128]], w: 300, h: 235},
          ];
        const angularShake = 0.2;
        const yShake = 1.5;
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(Tractor);
