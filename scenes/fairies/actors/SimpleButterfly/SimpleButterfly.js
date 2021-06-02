// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class SimpleButterfly extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 125;
        const maxWidthRef = 200;
        const body = {
          points: [
            [50, 19],
            [105, 113],
            [105, 178],
            [119, 178],
            [119, 113],
            [172, 19],
            ],
          centerY: 106,
          width: 223,
          height: 238,
        };
        const wiggleX = 4;
        const wiggleY = 4;
        const wiggleAngle = 10;
        const minFlapCycleLength = 180;
        const maxFlapCycleLength = 220;
        super(flavor, x, y, minWidthRef, maxWidthRef, body,
              wiggleX, wiggleY, wiggleAngle,
              minFlapCycleLength, maxFlapCycleLength);
    }
}

ScActorManager.registerActor(SimpleButterfly);
