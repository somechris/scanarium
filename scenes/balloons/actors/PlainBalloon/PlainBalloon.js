// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class PlainBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 72, y: 41, r: 30},
                {x: 52, y: 122, r: 20},
                {x: 20, y: 40, r: 10},
            ],
            width: 108,
            height: 165,
        };
        super(flavor, 90, x, y, spec);
    }
}

ScActorManager.registerActor(PlainBalloon);
