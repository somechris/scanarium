// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class QuadBike extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 500;
        const initialMaxSpeed = 900;
        const width = 350;
        const tires = [
          {x1: 2, x2: 62, y1: 129, y2: 189, w: 232, h: 190},
          {x1: 171, x2: 231, y1: 129, y2: 189, w: 232, h: 190},
        ];
        const undercarriage = [
          {points: [[26, 115], [26, 167], [203, 167], [215, 157], [200, 110], [177, 115]], w: 232, h: 192},
          ];
        const angularShake = 1;
        const yShake = 1;
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(QuadBike);
