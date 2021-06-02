// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var CommandLogInjector = {
    injectRunCount: 0,

    init: function() {
        window.setInterval(this.fetchLogs, getConfig('command-log-reload-period'));
    },

    fetchLogs: function() {
        loadDynamicConfig(dyn_dir + '/command-log.json', CommandLogInjector.injectLogs);
    },

    injectLogs: function(items) {
        CommandLogInjector.injectRunCount += 1;
        if (CommandLogInjector.injectRunCount <= 3) {
            items.forEach(function (item, index) {
                var uuid = sanitize_string(item, 'uuid');
                CommandProcessor.markOld(uuid);
            });
        } else {
            items.forEach(function (item, index) {
                CommandProcessor.process(item);
            });
        }
    },
};

