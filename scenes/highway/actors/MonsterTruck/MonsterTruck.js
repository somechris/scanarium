// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class MonsterTruck extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 500;
        const initialMaxSpeed = 900;
        const width = 600;
        const tires = [
          {x1: 1, x2: 168, y1: 101, y2: 267, w: 451, h: 268},
          {x1: 283, x2: 450, y1: 101, y2: 267, w: 451, h: 268},
        ];
        const undercarriage = [
          {points: [[61, 87], [61, 116], [371, 116], [371, 87]], w: 450, h: 268},
          ];
        const angularShake = 0.2;
        const yShake = 3;
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(MonsterTruck);
