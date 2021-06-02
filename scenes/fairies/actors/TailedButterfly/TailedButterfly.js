// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class TailedButterfly extends Creature {
    constructor(x, y, flavor) {
        const minWidthRef = 210;
        const maxWidthRef = 330;
        const body = {
          points: [
            [101, 0],
            [159, 83],
            [159, 155],
            [174, 155],
            [174, 83],
            [234, 0],
            ],
          centerY: 79,
          width: 334,
          height: 225,
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

ScActorManager.registerActor(TailedButterfly);
