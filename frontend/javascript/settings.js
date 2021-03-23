var Settings = {
  panel: null,

  toggle: function() {
      if (this.panel == null) {
          this.show();
      } else {
          this.hide();
      }
  },


  generateHeading: function(title) {
      var heading = document.createElement('h2');
      heading.innerHTML = localize(title);
      return heading;
  },

  switchScene: function(scene) {
      setUrlParameter('scene', scene, true);
  },

  loadScenesConfig: function() {
      if (scenes_config.length == 0) {
          loadDynamicConfig(dyn_dir + '/scenes.json', function(payload) {
              scenes_config = sanitize_list(payload);
              Settings.loadedScenesConfig();
          });
      } else {
          Settings.loadedScenesConfig();
      }
  },

  loadedScenesConfig: function() {
      var scenes = scenes_config.slice();

      scenes.sort((a, b) => {
          a = localize_parameter('scene_name', a);
          b = localize_parameter('scene_name', b);
          if (a < b) {
              return -1;
          }
          if (a > b) {
              return 1;
          }
          return 0;
      });

      this.sceneList.innerHTML = '';
      scenes.forEach(scene => {
          var sceneImage = document.createElement('img');
          sceneImage.src = 'scenes/' + scene + '/scene-bait-thumb.jpg';
          sceneImage.alt = localize_parameter('scene_name', scene);

          var sceneLink = document.createElement('a');
          sceneLink.href = '';
          sceneLink.onclick = function(e) {
              Settings.switchScene(scene);
              e.stopPropagation();
              e.preventDefault();
          };
          sceneLink.appendChild(sceneImage);

          this.sceneList.appendChild(sceneLink);
      });
  },

  generateScenesSections: function() {
      var heading = this.generateHeading('Switch scene');
      var sceneList = document.createElement('p');
      sceneList.id = 'section-scene-switcher';
      sceneList.innerHTML = localize('Loading scene data ...');

      this.sceneList = sceneList;
      return [heading, sceneList];
  },

  show: function() {
    this.hide();

    this.panel = document.createElement('div');
    this.panel.onclick = function(e) {
        // We need to propagate to enable scrolling. Yet we need to flag to the
        // document handler that the event is handled upstream. So we add a
        // custom property.
        e.handled_by_scanarium_settings = true;
    };
    this.panel.ontouchstart = this.panel.onclick;

    this.panel.id = 'settings';

    var sections = [];
    Array.prototype.push.apply(sections, this.generateScenesSections());

    this.loadScenesConfig();
    sections.forEach(section => this.panel.appendChild(section));
    document.body.appendChild(this.panel);
  },

  hide: function() {
    if (this.panel != null) {
      this.panel.remove();
      this.panel = null;
    }
  },
};

var SettingsButton = {
  button: null,

  show: function() {
    this.hide();
    this.button = document.createElement('button');
    this.button.innerHTML = localize('Settings');
    this.button.onclick = function(e) {
        Settings.toggle();
        e.stopPropagation();
        e.preventDefault();
    };
    this.button.ontouchstart = this.button.onclick;
    this.button.style.position = 'absolute';
    this.button.style.right = '0px';
    this.button.style.top = '0px';
    this.button.style["font-size"] = Math.ceil(16 * window.devicePixelRatio).toString() + 'px';
    this.button.style.padding = '1em 2em';
    document.body.appendChild(this.button);
  },

  hide: function() {
    if (this.button != null) {
      this.button.remove();
      this.button = null;
    }
  },
};
