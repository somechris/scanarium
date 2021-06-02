// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class PlanetWithRing extends PlanetBase {
    constructor(x, y, flavor) {
        var lengthMin = 107;
        var lengthMax = 320;

        super(flavor, x, y, lengthMin, lengthMax);

        // Resetting angular velocity, as it looks off, if the planet has a
        // ring.
        this.mainSprite.body.setAngularVelocity(0);
    }
}

ScActorManager.registerActor(PlanetWithRing);
