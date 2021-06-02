// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var FullscreenManager = {
    enterFullscreen: function() {
        var target = document.body.parentNode;
        if (target.requestFullscreen) {
            target.requestFullscreen();
        } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
        } else if (target.msRequestFullscreen) {
            target.msRequestFullscreen();
        } else if (target.mozRequestFullscreen) {
            target.mozRequestFullscreen();
        }
    },

    exitFullscreen: function() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozExitFullscreen) {
            document.mozExitFullscreen();
        }
    },

    isFullscreen: function() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.mozFullscreenElement;
    },

    toggle: function() {
        if (FullscreenManager.isFullscreen()) {
            FullscreenManager.exitFullscreen();
        } else {
            FullscreenManager.enterFullscreen();
        }
    }
};

