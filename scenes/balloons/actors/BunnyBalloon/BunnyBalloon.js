// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class BunnyBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 72, y: 212, r: 40},
                {x: 72, y: 127, r: 40},
                {x: 30, y: 44, r: 20},
                {x: 110, y: 61, r: 20},
            ],
            width: 143,
            height: 275,
        };
        super(flavor, 100, x, y, spec);
    }
}

ScActorManager.registerActor(BunnyBalloon);
