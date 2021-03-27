var Settings = {
  panel: null,

  toggle: function() {
      if (this.panel == null) {
          this.show();
      } else {
          this.hide();
      }
  },


  generateHeading: function(title, localization_parameters) {
      var heading = document.createElement('h2');
      heading.innerHTML = localize(title, localization_parameters);
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

  loadActorVariants: function() {
      if (actor_variants.length == 0) {
          loadJson(scene_dir + '/actor-variants.json', function(payload) {
              actor_variants = sanitize_dictionary(payload, undefined, true);
              Settings.loadedActorVariants();
          });
      } else {
          Settings.loadedActorVariants();
      }
  },

  get_localized_sorted_list_copy: function(list, parameter_name) {
      var scenes = list.slice();

      list.sort((a, b) => {
          a = localize_parameter(parameter_name, a);
          b = localize_parameter(parameter_name, b);
          if (a < b) {
              return -1;
          }
          if (a > b) {
              return 1;
          }
          return 0;
      });

      return list;
  },

  loadedScenesConfig: function() {
      var scenes = this.get_localized_sorted_list_copy(scenes_config, 'scene_name');
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

  loadedActorVariants: function() {
      this.pdfList.innerHTML = '';
      Object.keys(actor_variants).forEach(actor => actor_variants[actor].forEach(variant => {
          var variant_suffix = '';
          if (variant) {
              variant_suffix = '-variant-' + variant;
          }
          var pdfImage = document.createElement('img');
          pdfImage.src = 'scenes/' + scene + '/actors/' + actor + '/' + actor + variant_suffix + '-thumb.jpg';
          pdfImage.alt = localize_parameter('actor_name', actor);

          var pdfLink = document.createElement('a');
          pdfLink.href = 'scenes/' + scene + '/actors/' + actor + '/' + actor + variant_suffix + '.pdf';
          pdfLink.appendChild(pdfImage);

          this.pdfList.appendChild(pdfLink);
      }));
      console.log(actor_variants);
  },

  generateScenesSections: function() {
      var heading = this.generateHeading('Switch scene');
      var sceneList = document.createElement('p');
      sceneList.id = 'section-scene-switcher';
      sceneList.innerHTML = localize('Loading scene data ...');

      this.sceneList = sceneList;
      return [heading, sceneList];
  },

  generatePdfSections: function() {
      var heading = this.generateHeading('Actor PDFs for scene {scene_name}', {scene_name: scene});
      var pdfList = document.createElement('p');
      pdfList.id = 'pdf-list';
      pdfList.innerHTML = localize('Loading actor data ...');

      this.pdfList = pdfList;
      return [heading, pdfList];
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
    this.panel.style['font-size'] = SettingsButton.button.style['font-size'];

    var sections = [];
    Array.prototype.push.apply(sections, this.generateScenesSections());
    Array.prototype.push.apply(sections, this.generatePdfSections());

    this.loadScenesConfig();
    this.loadActorVariants();
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
    this.button.id = 'settings-button';
    this.button.innerHTML = localize('Settings');
    this.button.onclick = function(e) {
        Settings.toggle();
        e.stopPropagation();
        e.preventDefault();
    };
    this.button.ontouchstart = this.button.onclick;
    this.button.style["font-size"] = Math.ceil(16 * window.devicePixelRatio).toString() + 'px';
    document.body.appendChild(this.button);
  },

  hide: function() {
    if (this.button != null) {
      this.button.remove();
      this.button = null;
    }
  },

  getWidth: function() {
    return (this.button != null) ? this.button.offsetWidth : 0;
  },

  setWidth: function(width) {
    if (this.button != null) {
            this.button.style.width = width;
    }
  },
};

var UploadButton = {
  container: null,
  form: null,

  show: function() {
      this.hide();

      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'file-upload-data';
      fileInput.accept = 'image/*';

      fileInput.onchange = function(e) {
          if (fileInput.files.length > 0) {
              var i;
              for (i = 0; i < fileInput.files.length; i++) {
                  var file = fileInput.files[i];
                  data = new FormData();
                  data.append('data', file);
                  MessageManager.addMessage(localize(
                      'Upload of \"{image_name}\" started',
                      {image_name: sanitize_string(file.name)}
                  ));
                  callCgi('scan-data', data);
              }
          } else {
              MessageManager.addMessage(localize('No image selected. Upload aborted.'), 'failed');
          }
          e.stopPropagation();
          e.preventDefault();
          PauseManager.resume();
      };

      var button = document.createElement('button');
      button.id = 'file-upload-button';
      button.textContent = localize('Upload image');
      button.onclick = function(e) {
          fileInput.click();
          e.handled_by_scanarium_settings = true;
      }
      button.ontouchstart = button.onclick;
      button.style["font-size"] = Math.ceil(16 * window.devicePixelRatio).toString() + 'px';

      this.container = document.createElement('div');
      this.container.id = 'file-upload-button-container';
      this.container.appendChild(button);
      document.body.appendChild(this.container);

      if (SettingsButton.getWidth() > scanariumConfig.width / 5) {
          // small layout:
          this.container.className =  'file-upload-button-container-right';
          console.log(button.offsetWidth);
          console.log(SettingsButton.getWidth());
          maxWidth = Math.max(button.offsetWidth, SettingsButton.getWidth()).toString() + 'px';
          button.style.width = maxWidth;
          SettingsButton.setWidth(maxWidth);
      } else {
          this.container.className =  'file-upload-button-container-top-center';
      }

  },

  hide: function() {
    if (this.container != null) {
      this.container.remove();
      this.container = null;
    }
  },
};
