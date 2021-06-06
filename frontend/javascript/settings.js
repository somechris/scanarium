// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var Settings = {
  element: null,

  toggle: function() {
      if (this.element == null) {
          this.show();
      } else {
          this.hide();
      }
  },

  show: function() {
    this.hide();

    if (!this.tabbedPage) {
      var pages = [
          new SettingsPageGeneral(),
          new SettingsPageAdministration(),
          new SettingsPageHelp(),
      ];

      var pagesWithContent = []
      pages.forEach(page => {
          if (page.content.children.length) {
              pagesWithContent.push(page);
          }
      });

      this.tabbedPage = new TabbedPage('settings', pagesWithContent);
      this.tabbedPage.getElement().style['font-size'] = SettingsButton.button.style['font-size'];

    }

    this.element = this.tabbedPage.getElement();

    document.body.appendChild(this.tabbedPage.getElement());
  },

  hide: function() {
    if (this.element != null) {
      this.element.remove();
      this.element = null;
    }
  },
};

var SettingsButton = {
  button: null,

  show: function() {
    this.hide();
    this.button = document.createElement('button');
    this.button.id = 'settings-button';
    this.button.className = 'big-button';
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
  uploadListeners: [],

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
                  UploadButton.addUpload();
                  var file = fileInput.files[i];
                  data = new FormData();
                  data.append('data', file);
                  MessageManager.addMessage(localize(
                      'Upload of \"{image_name}\" started',
                      {image_name: sanitize_string(file.name)}
                  ));
                  callCgi(UploadButton.cgi, data, function(is_ok) {
                      UploadButton.uploadListeners.forEach(callback => {
                          callback(file, is_ok);
                      });
                      UploadButton.removeUpload()
                  });
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
      button.className = 'big-button';
      button.textContent = localize('Upload image');
      var lastUploadButtonClick = 0;
      button.onclick = function(e) {
          const now = Date.now();
          if (now - lastUploadButtonClick > 400) {
              fileInput.click();
              e.handled_by_scanarium_settings = true;
          }
          lastUploadButtonClick = now;
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

  currentUploads: 0,
  addUpload: function() {
      UploadButton.currentUploads += 1;
  },
  removeUpload: function() {
      UploadButton.currentUploads -= 1;
  },
  _runOnceUploadsFinishedTry: function(action, reason, waitingEnd, notice, cleanup) {
      var uploads = UploadButton.currentUploads;
      var timeLeft = Math.max(waitingEnd - Date.now(), 0);
      var message = reason;
      var stillWaiting = true;
      if (uploads > 0) {
          message += localize(' But {uploads} upload' + (uploads == 1 ? ' is': 's are') + ' still in progress.', {
              uploads: uploads,
          });
          if (timeLeft > 0) {
              message += localize(' Waiting {secondsLeft} seconds before continuing anyways.', {
                  secondsLeft: Math.floor(timeLeft / 1000),
              });
          } else {
              message += localize(' Waiting period is over.');
              stillWaiting = false;
          }
      } else {
          message += localize(' All uploads done.');
          stillWaiting = false;
      }

      if (!stillWaiting) {
          message += localize(' Proceeding...');
      }

      notice.textContent = localize(message, {
          uploads: uploads,
          secondsLeft: Math.floor(timeLeft / 1000),
      });

      if (stillWaiting) {
          setTimeout(UploadButton._runOnceUploadsFinishedTry, 200, action, reason, waitingEnd, notice, cleanup);
      } else {
          action();
          if (cleanup) {
              notice.parentNode.removeChild(notice);
              notice = {};
          }
      }
  },
  runOnceUploadsFinished: function(action, reason, cleanup) {
      var uploads = UploadButton.currentUploads;
      var waitingEnd = Date.now();
      var notice = {};
      if (UploadButton.currentUploads > 0) {
          notice = document.createElement('div');
          notice.id = 'wait-notice';
          notice.className = 'window';
          notice.style['font-size'] = Math.ceil(16 * window.devicePixelRatio).toString() + 'px';
          notice.onclick = function(e) {
              e.stopPropagation();
              e.preventDefault();
          };
          notice.ontouchstart = notice.onclick;
          document.body.appendChild(notice);

          waitingEnd += 10000;
      }
      UploadButton._runOnceUploadsFinishedTry(action, reason ? reason : localize('A reload is necessary.'), waitingEnd, notice, cleanup);
  },

  registerUploadListener: function(callback) {
      this.uploadListeners.push(callback);
  }
};
