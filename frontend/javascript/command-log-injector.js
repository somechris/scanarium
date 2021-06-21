// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var CommandLogInjector = {
    firstInjection: true,
    showAfterUuid: getUrlParameter('lastFullyShownUuid'),
    processAfterUuid: getUrlParameter('lastFullyProcessedUuid'),

    init: function() {
        window.setInterval(this.fetchLogs, getConfig('command-log-reload-period'));
    },

    fetchLogs: function() {
        // Logfile requests don't need to get queued up. So we only request them
        // if they won't be blocked. (If they are blocked, we'll catch up with
        // log items once the block is gone).
        if (!isLoadingBlocked()) {
            loadDynamicConfig(dyn_dir + '/command-log.json', CommandLogInjector.injectLogs);
        }
    },

    injectLogs: function(items) {
        if (CommandLogInjector.firstInjection) {
            // We're still in the boot-up phase and need to decide which
            // messages to skip, which to replay, and which tno inject normally
            const showAfterUuid = CommandLogInjector.showAfterUuid;
            const processAfterUuid = CommandLogInjector.processAfterUuid || CommandLogInjector.showAfterUuid;
            var searchingShowAfterUuid = true;
            var searchingProcessAfterUuid = true;
            var lastFullyShownUuid = null;
            items.forEach(function (item, index) {
                var uuid = sanitize_string(item, 'uuid');
                if (searchingShowAfterUuid) {
                    CommandProcessor.markOld(uuid);
                    if (showAfterUuid && uuid == showAfterUuid) {
                        searchingShowAfterUuid = false;
                    }
                    if (processAfterUuid && uuid == processAfterUuid) {
                        searchingProcessAfterUuid = false;
                        if (searchingShowAfterUuid) {
                            // We've found the processAfterUuid, but not yet the
                            // showAfterUuid. So the showAfterUuid is no longer
                            // present in the file and must be older. Henco, all
                            // entries up to the current in the log should have
                            // been replayed. So we process them accordingly.
                            lastFullyShownUuid = null;
                            items.forEach((innerItem, innerIndex) => {
                                if (innerIndex <= index) {
                                    CommandProcessor.process(innerItem, true);
                                }
                            });
                            searchingShowAfterUuid = false;
                        }
                    }
                    if (searchingShowAfterUuid && uuid) {
                        // As finding the `processAfterUuid` also sets
                        // `searchingShowAfterUuid` to `false`, we know that
                        // we've found neither the `showAfterUuid` nor the
                        // `processAfterUuid`.
                        // And we can hence mark the current uuid as ignorable.
                        lastFullyShownUuid = uuid;
                    }
                } else {
                    if (searchingProcessAfterUuid) {
                        CommandProcessor.process(item, true);
                        if (processAfterUuid && uuid == processAfterUuid) {
                            searchingProcessAfterUuid = false;
                        }
                    } else {
                        CommandProcessor.process(item);
                    }
                }
            });
            if (lastFullyShownUuid && searchingShowAfterUuid && getUrlParameter('lastFullyShownUuid') === showAfterUuid) {
                // No uuid was found, and `lastFullyShownUuid` parameter has not
                // been updated in the mean time, so we shim in a good initial
                // value.
                // This value helps to avoid re-playing the full command log, if
                // an image gets scanned, and the location gets updated before
                // the message has been fully shown.
                setUrlParameter('lastFullyShownUuid', lastFullyShownUuid);
            }
            CommandLogInjector.firstInjection = false;
        } else {
            items.forEach(function (item, index) {
                CommandProcessor.process(item);
            });
        }
    },
};

