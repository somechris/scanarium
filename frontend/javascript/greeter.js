// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var Greeter = {
    urlParameter: 'greeted',

    init: function() {
        if (!getUrlParameterBoolean(this.urlParameter, false)) {
            MessageManager.addMessage(localize('Welcome to Scanarium!'), 'smile', false);
            if (getUrlParameterBoolean('advertiseScreenTap', true)) {
                MessageManager.addMessage(localize('Tap/Click on the middle of the screen to see controls for settings and uploads'), 'none');
            }
            setUrlParameterBoolean(this.urlParameter, true);
        }
    },
};
