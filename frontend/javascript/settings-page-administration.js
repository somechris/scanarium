// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class SettingsPageAdministration extends NamedPage {
    constructor() {
        const name = localize_parameter('page_title', 'Administration');
        super('administration', name);
    }

    initContent() {
        this.initContentUi();
        this.initContentActorReset();
        this.initContentPasswortSwitch();
    }

    initContentUi() {
        var that = this;
        this.appendSectionHeader('User interface');

        const uiFollowScannedActorSceneParameter = 'followScannedActorScene';
        var uiFollowScannedActorScene;

        var form = new ManagedForm('ui-settings', false);
        this.uiForm = form;

        uiFollowScannedActorScene = form.addCheckbox(localize('Switch scene'), 'scanning-actor-switches-scene', undefined, localize('when an actor of a different scene got scanned'));
        uiFollowScannedActorScene.setChecked(getUrlParameterBoolean(uiFollowScannedActorSceneParameter ,true));
        uiFollowScannedActorScene.onChangedAndValid = function(event) {
            setUrlParameter(uiFollowScannedActorSceneParameter, uiFollowScannedActorScene.checked);

            event.stopPropagation();
            event.preventDefault();
        };

        form.addFixedTextField(localize('Language'), 'ui-setting-language', localize('Loading localization data ...'));

        this.loadLocalizationsConfig();

        this.appendElement(form.getElement());
    }

    initContentActorReset() {
        const cgi = 'reset-dynamic-content';
        if (!isCgiForbidden(cgi)) {
            this.appendSectionHeader('Delete actors');

            var controls = document.createElement('p');

            var resetSceneButton = document.createElement('button');
            resetSceneButton.id = 'reset-scene-button';
            resetSceneButton.textContent = localize('Reset scene "{scene_name}"', {'scene_name': scene});
            resetSceneButton.style['font-size'] = SettingsButton.button.style['font-size'];
            resetSceneButton.onclick = function(e) {
                if (confirm(localize('Really reset the scene "{scene_name}", delete this scenes\' scanned actors, and start afresh? (This cannot be undone)', {'scene_name': scene}))) {
                    var data = new FormData();
                    data.append('scene', scene);
                    callCgi(cgi, data);
                }
                e.stopPropagation();
                e.preventDefault();
            };
            controls.appendChild(resetSceneButton);

            this.appendElement(controls);
        }
    }

    initContentPasswortSwitch() {
        const cgi = 'update-password';
        if (!isCgiForbidden(cgi)) {
            this.appendSectionHeader('Change password');

            var oldPasswordInput;
            var newPasswordInput;
            var confirmPasswordInput;
            var form;
            var submit = function(event) {
                var data = new FormData();
                data.append('old-password', oldPasswordInput.value);
                data.append('new-password', newPasswordInput.value);
                callCgi(cgi, data, (is_ok) => {
                    if (is_ok) {
                        oldPasswordInput.value = '';
                        newPasswordInput.value = '';
                        confirmPasswordInput.value = '';
                        form.validate();
                    }
                });

                event.stopPropagation();
                event.preventDefault();
                PauseManager.resume();
            }
            form = new ManagedForm('update-password-form', submit, localize('Change password'));

            var old_password_validator = function(node) {
                const password = node.value;

                if (password.length == '') {
                    return localize('This field may not be empty');
                }

                return true;
            }

            var new_password_validator = function(node) {
                const password = node.value;

                if (password.length < minimum_password_length) {
                    return localize('Password is too short (minimum: {count} characters)', {count: minimum_password_length});
                }

                if (document.getElementById('new-password').value != document.getElementById('confirm-password').value) {
                    return localize('New password and its confirmation do not match');
                }
                return true;
            }

            oldPasswordInput = form.addPassword(localize('Current password'), 'current-password', old_password_validator);
            newPasswordInput = form.addPassword(localize('New password'), 'new-password', new_password_validator);
            confirmPasswordInput = form.addPassword(localize('Confirm new password'), 'confirm-password', new_password_validator);

            this.appendElement(form.getElement());
        }
    }

    loadLocalizationsConfig() {
        var self = this;
        if (Object.keys(localizations_config).length == 0) {
            loadDynamicConfig('localization/localizations.json', function(payload) {
                localizations_config = sanitize_dictionary(payload, undefined, true);
                self.loadedLocalizationsConfig();
            });
        } else {
            self.loadedLocalizationsConfig();
        }
    }

    loadedLocalizationsConfig() {
        var languageDropDown = this.uiForm.addDropDown(undefined, 'ui-setting-language', undefined, 'bari');

        localizations_config['localizations'].sort().forEach(key => {
            const selected = (key == language);
            var l10n_in_same_l10n = localizations_config[key + '-' + key] || key;
            var l10n_localized = localize_parameter('language', key);
            var text = key;
            if (l10n_in_same_l10n != key) {
                text += ' - ' + l10n_in_same_l10n;
                if (l10n_localized != key && l10n_localized != l10n_in_same_l10n) {
                    text += ' (' + l10n_localized + ')';
                }
            }

            languageDropDown.addOption(text, key, selected);
        });
        languageDropDown.onChangedAndValid = function(event) {
            if (languageDropDown.selectedOptions.length > 0) {
                const selected = languageDropDown.selectedOptions[0].value;
                setUrlParameter('language', selected, selected != language);
            }

            event.stopPropagation();
            event.preventDefault();
        };
    }
}
