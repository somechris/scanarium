// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class HeartBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 53, y: 49, r: 45},
                {x: 160, y: 47, r: 45},
                {x: 102, y: 136, r: 30},
            ],
            width: 210,
            height: 213,
        };
        super(flavor, 160, x, y, spec);
    }
}

ScActorManager.registerActor(HeartBalloon);
