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

      var actors = this.get_localized_sorted_list_copy(Object.keys(ScActorManager.actors_config.actors), 'actor_name');
      actors.forEach(actor => {
          var pdfImage = document.createElement('img');
          pdfImage.src = 'scenes/' + scene + '/actors/' + actor + '/' + actor + '-thumb.jpg';
          pdfImage.alt = localize_parameter('actor_name', actor);

          var pdfLink = document.createElement('a');
          pdfLink.href = 'scenes/' + scene + '/actors/' + actor + '/' + actor + '.pdf';
          pdfLink.appendChild(pdfImage);

          pdfList.appendChild(pdfLink);
      });

      return [heading, pdfList];
  },

  generateUploadSections: function() {
      var heading = this.generateHeading('Upload image');

      var form = document.createElement('form');

      var fileInput = document.createElement('input');
      fileInput.id = 'file-upload-data';
      fileInput.type = 'file';
      fileInput.style['font-size'] = this.panel.style['font-size'];
      form.appendChild(fileInput);

      var submitButton = document.createElement('input');
      submitButton.type = 'submit';
      submitButton.id = 'file-upload-submit';
      submitButton.style['font-size'] = this.panel.style['font-size'];
      submitButton.onclick = function(e) {
          console.log(fileInput);
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
      form.appendChild(submitButton);


      return [heading, form];
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
    Array.prototype.push.apply(sections, this.generateUploadSections());
    Array.prototype.push.apply(sections, this.generateScenesSections());
    Array.prototype.push.apply(sections, this.generatePdfSections());

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
};
