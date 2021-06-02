// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class DragonBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 90, y: 59, r: 25},
                {x: 135, y: 168, r: 25},
                {x: 50, y: 151, r: 25},
                {x: 87, y: 126, r: 30},
            ],
            width: 206,
            height: 226,
        };
        super(flavor, 220, x, y, spec);
    }
}

ScActorManager.registerActor(DragonBalloon);
