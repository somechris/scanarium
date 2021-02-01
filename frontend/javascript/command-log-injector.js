var CommandLogInjector = {
    injectRunCount: 0,

    init: function() {
        window.setInterval(this.fetchLogs, commandReloadPeriod);
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

