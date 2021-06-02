// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class Parrot extends Bird {
    constructor(x, y, flavor) {
        const body = {
            wing: {
                shape: [
                    [100, 300],
                    [206, 502],
                    [548, 502],
                    [580, 480],
                    [580, 0],
                    [100, 0],
                ],
                durations: {
                    glide: 300,
                    glideToUp: 50,
                    upToDown: 300,
                    downToGlide: 200,
                    downToUp: 100,
                },
                flapY: 502,
                flapAcceleration: [250, 600],
                scales: {
                    up: 1.6,
                    glide: -0.1,
                    down: -1.6,
                },
            },
            center: [190, 584],
            beak: [
                [50, 750],
                [200, 750],
            ],
            rotationFactor: 0.3,
            width: 1000,
            height: 688,
        };
        super(flavor, 200, x, y, body, 0.4, 1, 550);
    }
}

ScActorManager.registerActor(Parrot);
