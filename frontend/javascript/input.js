var eventMap = {
  ' ': 'toggle-pause',
  '?': 'toggle-help',
  'f': 'toggle-fullscreen',
  'p': 'toggle-pause',
  'n': 'cgi:reset-dynamic-content',
  'i': 'cgi:show-source',
  's': 'cgi:scan',
  'r': 'cgi:reindex',
  'm': 'add-actor-random',
  'c': 'toggle-frame-counter',
  'h': 'toggle-help',
  'd': 'toggle-developer-information',
  'pointer': 'toggle-pause',
};

var commands = {
    'add-actor-random': {
        description: 'Add another random actor',
        implementation: ScActorManager.addActorRandom,
    },
    'cgi:scan': {
        description: 'Scan image',
        implementation: () => callCgi('scan'),
    },
    'cgi:show-source': {
        description: 'Show camera source image',
        implementation: () => callCgi('show-source'),
    },
    'cgi:reset-dynamic-content': {
        description: 'Delete all your scanned actors',
        implementation: () => callCgi('reset-dynamic-content'),
    },
    'cgi:reindex': {
        description: 'Reindex actors',
        implementation: () => callCgi('reindex'),
    },
    'toggle-fullscreen': {
        description: 'Enter/leave fullscreen mode',
        implementation: FullscreenManager.toggle,
    },
    'toggle-developer-information': {
        description: 'Show/hide developer information',
        implementation: DeveloperInformation.toggleVisibility,
    },
    'toggle-frame-counter': {
        description: 'Show/hide frame counter',
        implementation: FrameCounter.toggleVisibility,
    },
    'toggle-help': {
        description: 'Show/hide this help page',
        implementation: HelpPage.toggleVisibility,
    },
    'toggle-pause': {
        description: 'Pause/Resume',
        implementation: PauseManager.toggle,
    },
};

var run_frontend_command = function(command) {
    if (command in commands) {
        commands[command]['implementation']();
    } else {
        const msg = localize('Unknown frontend command "{command}"', {command: command});
        MessageManager.addMessage(msg, 'failed');
    }
}

var run_event_command = function(event) {
    if (event in eventMap) {
        run_frontend_command(eventMap[event]);
    }
}

document.addEventListener("keypress", function(e) {
    run_event_command(e.key);
}, false);


function root_pointer_event(event) {
  if (!event.handled_by_scanarium_settings) {
    run_event_command('pointer');
  }
}

document.addEventListener("click", root_pointer_event);
document.addEventListener("touchstart", root_pointer_event);


function isCommandForbidden(command) {
    const key = command + '.allow';
    return (key in global_config && !global_config[key]);
}

function pruneForbiddenCommandsFromEventMap() {
    Object.keys(eventMap).forEach(event => {
        const command = eventMap[event];
        if (isCommandForbidden(command)) {
            delete eventMap[event];
        }
    });
}
