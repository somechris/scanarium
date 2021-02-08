var CommandProcessor = {
    recentUuids: [null, null, null, null, null],

    isNew: function(uuid) {
        return (uuid == null || uuid == '' || !(this.recentUuids.includes(uuid)));
    },

    markOld: function(uuid) {
        this.recentUuids.shift();
        this.recentUuids.push(uuid);
    },

    processCommandActor: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var command = sanitize_string(capsule, 'command');
        var parameters = sanitize_list(capsule, 'parameters');

        var template;
        if (is_ok) {
            template = 'Scanned new actor drawing for {actor_name}';
            if (command == scene) {
                var flavor = sanitize_string(capsule.payload, 'flavor')
                if (typeof ScActorManager !== 'undefined') {
                    ScActorManager.addActor(parameters[0], flavor);
                }
            }
            if (PageInsertionHint != null && (global_config['drop_page_insertion_hint_after_scan'] || true)) {
                PageInsertionHint.setInvisible();
            }
        } else {
            template = 'Failed to scan new actor drawing for {actor_name}';
        }
        if (command != scene) {
            template += ' for scene {scene_name}';
        }
        return localize(template, {
            'actor_name': parameters[0],
            'scene_name': command,
        });
    },

    processCommandDebug: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        var template = 'Unknown debug command received';
        if (parameters.length > 0) {
          if (['ok', 'fail'].includes(parameters[0])) {
            template = false;
          } else if (parameters[0] == 'toggleFps') {
            if (is_ok) {
              FrameCounter.toggleVisibility();
              template = 'Toggled frames-per-second counter';
            } else {
              template = 'Toggling frames-per-second counter failed';
            }
          }
        }
        return template ? localize(template) : false;
    },

    processCommandSwitchScene: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        if (is_ok) {
            template = 'Switching to scene {scene_name}';
            setUrlParameter('scene', parameters[0], true);
        } else {
            template = 'Cannot switch to scene {scene_name}';
        }
        return localize(template, {
            'scene_name': parameters[0],
        });
    },

    processCommandSystem: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        var template = 'Unknown system command received';
        if (parameters.length > 0) {
          if (parameters[0] == 'poweroff') {
            if (is_ok) {
              template = 'Shutdown initiated';
            } else {
              template = 'Shutdown initiation failed';
            }
          }
        }
        return localize(template);
    },

    processCommandReset: function(capsule) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var parameters = sanitize_list(capsule, 'parameters');
        if (is_ok) {
            template = 'Reset all dynamic content';
            document.location.reload();
        } else {
            template = 'Resetting all dynamic content failed';
        }
        return localize(template);
    },

    processNew: function(capsule, prefix) {
        var is_ok = sanitize_boolean(capsule, 'is_ok');
        var command = sanitize_string(capsule, 'command');
        var parameters = sanitize_list(capsule, 'parameters');
        var msg = '';
        if ('command' in capsule && capsule['command'] != null) {
            msg = localize('{command_name} command ' + (is_ok ? 'ok' : 'failed'),
                           {'command_name': command});

            if (command == 'debug') {
                msg = this.processCommandDebug(capsule) || msg;
            } else if (command == 'reset') {
                msg = this.processCommandReset(capsule) || msg;
            } else if (command == 'switchScene') {
                msg = this.processCommandSwitchScene(capsule) || msg;
            } else if (command == 'system') {
                msg = this.processCommandSystem(capsule) || msg;
            } else {
                msg = this.processCommandActor(capsule) || msg;
            }
        }

        var error_message = sanitize_string(capsule, 'error_message');
        var error_template = sanitize_string(capsule, 'error_template');
        var error_parameters = sanitize_dictionary(capsule, 'error_parameters');
        error_template = error_template || error_message;
        if (error_template) {
            if (msg) {
                msg += ': ';
            }
            msg += localize(error_template, error_parameters);
        }

        var uuid = sanitize_string(capsule, 'uuid');
        if (prefix) {
            msg = prefix + (msg ? (': ' + msg) : '');
        }
        MessageManager.addMessage(uuid, is_ok ? 'ok' : 'failed', msg);
    },

    process: function(capsule, prefix) {
        var uuid = sanitize_string(capsule, 'uuid');
        if (this.isNew(uuid)) {
            this.markOld(uuid);
            this.processNew(capsule, prefix);
        }
    }
};

