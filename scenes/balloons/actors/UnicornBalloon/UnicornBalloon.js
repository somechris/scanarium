// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class UnicornBalloon extends BaseBalloon {
    constructor(x, y, flavor) {
        var spec = {
            shreds : [
                {x: 116, y: 116, r: 45},
                {x: 215, y: 166, r: 45},
                {x: 29, y: 157, r: 25},
            ],
            width: 108,
            height: 165,
        };
        super(flavor, 220, x, y, spec);
    }
}

ScActorManager.registerActor(UnicornBalloon);
