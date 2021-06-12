// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var degToRadian = 2 * Math.PI / 360;

// Reference is 1920x1080 monitor
var refWidth = 1920;
var refHeight = 1080;
var refToScreen = 1;
var screenToRef = 1;
LayoutManager.register(function(width, height) {
  refToScreen = Math.max(width, height) / refWidth;
  screenToRef = 1 / refToScreen;
});

function scaleBetween(min, max, scale) {
    return (max - min) * scale + min;
}

function randomBetween(min, max) {
    return scaleBetween(min, max, Math.random());
}

function randomPlusMinus(max) {
    return scaleBetween(-max, max, Math.random());
}

function randomAround(base, maxDeviation) {
    return scaleBetween(base - maxDeviation, base + maxDeviation, Math.random());
}

function randomDeviationFactor(maxDeviation) {
    return scaleBetween(1 - maxDeviation, 1 + maxDeviation, Math.random());
}

function tunnel(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

function chooseInt(min, max) {
    return tunnel(Math.floor(randomBetween(min, max+1)), min, max);
}

function bringToFront(sprite) {
  sprite.setDepth(999999);
}

function sendToBack(sprite) {
  sprite.setDepth(-999999);
}

function isPhaserGameObject(obj) {
  return (obj instanceof Phaser.GameObjects.GameObject);
}

function computedPxLength(element, property) {
  const lengthStr = window.getComputedStyle(element)[property];
  return parseFloat(lengthStr.substring(0, lengthStr.length - 2));
}
