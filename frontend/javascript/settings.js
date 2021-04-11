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
      heading.textContent = localize(title, localization_parameters);
      return heading;
  },

  switchScene: function(scene) {
      setUrlParameter('scene', scene, true);
  },

  loadScenesConfig: function() {
      if (scenes_config.length == 0) {
          loadDynamicConfig(scenes_dir + '/scenes.json', function(payload) {
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
      this.sceneList.textContent = '';
      scenes.forEach(scene => {
          const localized_scene_name = localize_parameter('scene_name', scene);
          var sceneImage = document.createElement('img');
          sceneImage.src = 'scenes/' + scene + '/scene-bait-thumb.jpg';
          sceneImage.alt = localized_scene_name;

          var sceneLabel = document.createElement('div');
          sceneLabel.className = 'card-label';
          sceneLabel.textContent = localized_scene_name;

          var sceneLink = document.createElement('a');
          sceneLink.href = '';
          sceneLink.onclick = function(e) {
              Settings.switchScene(scene);
              e.stopPropagation();
              e.preventDefault();
          };
          sceneLink.className = 'card';
          sceneLink.appendChild(sceneImage);
          sceneLink.appendChild(sceneLabel);

          this.sceneList.appendChild(sceneLink);
      });
  },

  loadedActorVariants: function() {
      this.actorList.textContent = '';
      var langDir = Object.keys(localization).length ? language : 'fallback';
      var actors = {}
      var offerPdfs = getConfig('offer-pdf-downloads');
      Object.keys(actor_variants).forEach(actor => actor_variants[actor].forEach(variant => {
          const localized_actor = localize_parameter('actor_name', actor);
          var name = localized_actor;
          if (variant) {
              const localized_variant = localize_parameter('parameter_variant_name', variant);
              name = localize('{parameter_name} ({parameter_variant_name})', {
                  parameter_name: localized_actor,
                  parameter_variant_name: localized_variant,
              });
          }
          var basename = name.replace(/[^a-zA-Z]+/g, '-');
          basename = basename.replace(/^-/g, '');
          basename = basename.replace(/-$/g, '');

          actors[basename] = {
              name: name,
              base_path: 'scenes/' + scene + '/actors/' + actor + '/pdfs/' + langDir + '/' + basename,
          };
      }));
      Object.keys(actors).sort().forEach(key => {
          const item = actors[key];
          const base_path = item['base_path'];
          const name = item['name'];

          var actorImage = document.createElement('img');
          actorImage.src = base_path + '-thumb.jpg';
          actorImage.alt = name;

          var actorLabel = document.createElement('div');
          actorLabel.className = 'card-label';
          actorLabel.textContent = name;

          var actorCard = document.createElement(offerPdfs ? 'a' : 'span');
          if (offerPdfs) {
              actorCard.href = base_path + '.pdf';
          }
          actorCard.className = 'card';
          actorCard.appendChild(actorImage);
          actorCard.appendChild(actorLabel);

          this.actorList.appendChild(actorCard);
      });
  },

  generateScenesSections: function() {
      var heading = this.generateHeading('Switch scene');
      var sceneList = document.createElement('p');
      sceneList.id = 'section-scene-switcher';
      sceneList.className = 'card-container';
      sceneList.textContent = localize('Loading scene data ...');

      this.sceneList = sceneList;
      return [heading, sceneList];
  },

  generateActorSections: function() {
      var heading = this.generateHeading('Coloring pages for scene {scene_name}', {scene_name: scene});
      var actorList = document.createElement('div');
      actorList.id = 'actor-list';
      actorList.className = 'card-container';
      actorList.textContent = localize('Loading actor data ...');

      this.actorList = actorList;
      return [heading, actorList];
  },

  generateActorsSections: function() {
      var sections = [];
      const cgi = 'reset-dynamic-content';
      if (!isCgiForbidden(cgi)) {
          var heading = this.generateHeading('Delete actors');
          sections.push(heading)

          var resetSceneButton = document.createElement('button');
          resetSceneButton.id = 'reset-scene-button';
          resetSceneButton.textContent = localize('Reset scene "{scene_name}"', {'scene_name': scene});
          resetSceneButton.style['font-size'] = SettingsButton.button.style['font-size'];
          resetSceneButton.onclick = function(e) {
              if (confirm(localize('Really reset the scene "{scene_name}", delete this scenes\' scanned actors, and start afresh? (This cannot be undone)', {'scene_name': scene}))) {
                  data = new FormData();
                  data.append('scene', scene);
                  callCgi(cgi, data);
              }
              e.stopPropagation();
              e.preventDefault();
          };
          sections.push(resetSceneButton);
      }
      return sections;
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
    Array.prototype.push.apply(sections, this.generateActorSections());
    Array.prototype.push.apply(sections, this.generateActorsSections());

    this.loadScenesConfig();
    this.loadActorVariants();
    sections.forEach(section => this.panel.appendChild(section));

    var bottomSpacer = document.createElement('div');
    bottomSpacer.style.padding = '1em';
    this.panel.appendChild(bottomSpacer);

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
    this.button.textContent = localize('Settings');
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
  cgi: 'scan-data',

  show: function() {
      this.hide();
      if (!isCgiForbidden(this.cgi)) {
          this._showForce();
      }
  },

  _showForce: function() {
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
                  callCgi(this.cgi, data);
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
