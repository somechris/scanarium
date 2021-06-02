// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class Astronaut extends SpaceshipBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 200;

        super(flavor, x, y, 90, lengthMin, lengthMax);

        var thrustScale = scaleBetween(0.10, 0.30, this.base_scale);

        this.addThruster(-0.4, -0.1, -80, thrustScale, 0.3, 0.9); // Left
        this.addThruster(0.4, -0.1, -100, thrustScale, -0.3, 0.9); // Right
    }
}

ScActorManager.registerActor(Astronaut);
