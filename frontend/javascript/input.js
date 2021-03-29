var keymap = {
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
};

document.addEventListener("keypress", function(e) {
    if (e.key in keymap) {
        var command = keymap[e.key];
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
}, false);


function pause_manager_toggle(event) {
  if (!event.handled_by_scanarium_settings) {
    PauseManager.toggle();
  }
}

document.addEventListener("click", pause_manager_toggle);
document.addEventListener("touchstart", pause_manager_toggle);
