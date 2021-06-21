// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var CommandLogInjector = {
    reloadsNeededBeforeProcessingFull: 3,
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
        if (CommandLogInjector.reloadsNeededBeforeProcessingFull > 0) {
            // We're still in the boot-up phase and need to decide which
            // messages to skip, which to replay, and which tno inject normally
            const showAfterUuid = CommandLogInjector.showAfterUuid;
            const processAfterUuid = CommandLogInjector.processAfterUuid || CommandLogInjector.showAfterUuid;
            var searchingShowAfterUuid = true;
            var searchingProcessAfterUuid = true;
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
                            items.forEach((innerItem, innerIndex) => {
                                if (innerIndex <= index) {
                                    CommandProcessor.process(innerItem, true);
                                }
                            });
                            searchingShowAfterUuid = false;
                        }
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
            if (searchingShowAfterUuid && searchingProcessAfterUuid) {
                CommandLogInjector.reloadsNeededBeforeProcessingFull -= 1;
            } else {
                // Found at least some uuid, so we can process fully from
                // now on.
                CommandLogInjector.reloadsNeededBeforeProcessingFull = 0;
            }
        } else {
            items.forEach(function (item, index) {
                CommandProcessor.process(item);
            });
        }
    },
};

