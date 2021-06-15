// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var CommandLogInjector = {
    injectRunCount: 0,
    showAfterUuid: getUrlParameter('lastFullyShownUuid'),
    searchingShowAfterUuid: true,

    init: function() {
        window.setInterval(this.fetchLogs, getConfig('command-log-reload-period'));
    },

    fetchLogs: function() {
        loadDynamicConfig(dyn_dir + '/command-log.json', CommandLogInjector.injectLogs);
    },

    injectLogs: function(items) {
        CommandLogInjector.injectRunCount += 1;
        if (CommandLogInjector.injectRunCount <= 3 && CommandLogInjector.searchingShowAfterUuid) {
            items.forEach(function (item, index) {
                var uuid = sanitize_string(item, 'uuid');
                if (CommandLogInjector.searchingShowAfterUuid) {
                    CommandProcessor.markOld(uuid);
                    if (CommandLogInjector.showAfterUuid && uuid == CommandLogInjector.showAfterUuid) {
                        CommandLogInjector.searchingShowAfterUuid = false;
                    }
                } else {
                    CommandProcessor.process(item, undefined, true);
                }
            });
        } else {
            items.forEach(function (item, index) {
                CommandProcessor.process(item);
            });
        }
    },
};

