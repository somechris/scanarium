// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class CompactMpv extends Vehicle {
    constructor(x, y, flavor) {
        const initialMinSpeed = 400;
        const initialMaxSpeed = 750;
        const width = 650;
        const tires = [
          {x1: 127, x2: 263, y1: 271, y2: 407, w: 951, h: 408},
          {x1: 714, x2: 849, y1: 271, y2: 407, w: 951, h: 408},
        ];
        const undercarriage = [
          {points: [[77, 344], [879, 344], [879, 240], [77, 240]], w: 951, h: 408},
          ];
        const angularShake = 0.1;
        const yShake = 1.5;
        super(flavor, x, y, initialMinSpeed, initialMaxSpeed, width, tires, undercarriage, angularShake, yShake);
    }
}

ScActorManager.registerActor(CompactMpv);
