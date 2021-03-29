var eventMap = {
  ' ': 'cgi:scan',
  '?': 'toggle-help',
  'f': 'fullscreen',
  'p': 'toggle-pause',
  'n': 'cgi:reset-dynamic-content',
  's': 'cgi:show-source',
  'r': 'cgi:reindex',
  'm': 'add-actor-random',
  'c': 'toggle-frame-counter',
  'h': 'toggle-help',
  'd': 'toggle-developer-information',
  'pointer': 'toggle-pause',
};

var run_frontend_command = function(command) {
    if (command.startsWith('cgi:')) {
        callCgi(command.substring(4));
    } else {
        switch (command) {
        case 'add-actor-random':
            ScActorManager.addActorRandom();
            break;
        case 'fullscreen':
            canvases = document.getElementsByTagName('canvas');
            if (canvases.length) {
                canvases[0].requestFullscreen();
            }
            break;
        case 'toggle-developer-information':
            DeveloperInformation.toggleVisibility();
            break;
        case 'toggle-frame-counter':
            FrameCounter.toggleVisibility();
            break;
        case 'toggle-help':
            // Phaser does not offer a keycode for question mark, so we trigger from
            // outside.
            HelpPage.toggleVisibility();
            break;
        case 'toggle-pause':
            // We (un)pause outside of the game itself, as a paused game did not handle
            // keydown events reliable and hence made it tricky to unpause.
            PauseManager.toggle();
            break;
        default:
            const msg = localize('Unknown frontend command "{command}"', {command: command});
            MessageManager.addMessage(msg, 'failed');
        }
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
