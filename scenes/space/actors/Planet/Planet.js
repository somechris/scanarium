// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class Planet extends PlanetBase {
    constructor(x, y, flavor) {
        var lengthMin = 50;
        var lengthMax = 150;

        super(flavor, x, y, lengthMin, lengthMax);
    }
}

ScActorManager.registerActor(Planet);
