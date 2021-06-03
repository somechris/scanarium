// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class ManagedForm {
    constructor(id, submit_action, submit_button_caption) {
        var self = this;
        var form = document.createElement('form');
        var button;
        var font_size = Math.ceil(16 * window.devicePixelRatio).toString() + 'px';

        form.id = id;
        form.novalidate = true; // lowercase V according to MDN
        form.noValidate = true; // uppercase V is used in Firefox
        form.onsubmit = function(event) {
            self._onsubmit(event);
        }
        if (submit_button_caption) {
            button = document.createElement('button');
            button.id = form.id + '-submit-button';
            button.textContent = submit_button_caption;
            button.style['font-size'] = font_size;

            form.appendChild(button);
        }
        this.form = form;
        this.submit_action = submit_action;
        this.submit_button = button;
        this.font_size = font_size;
        this.validate();
    }

    addControl(caption, control, validation) {
        var self = this;

        var label = document.createElement('label');
        label.for = control.id;
        label.textContent = caption;

        if (validation) {
            control.scValidation = validation;
            control.oninput = function() {
                self.validate();
            }
        }

        var validationContainer = document.createElement('div');
        validationContainer.id = control.id + '-validation-message';
        validationContainer.className = 'validation-message';

        var row = document.createElement('div');
        row.className = 'form-row';

        row.appendChild(label);
        row.appendChild(control);
        row.appendChild(validationContainer);
        if (this.submit_button) {
            this.form.insertBefore(row, this.submit_button);
        } else {
            this.form.appendChild(row);
        }
        control.rowElement = row;
    }

    addPassword(caption, id, validation) {
        var input = document.createElement('input');
        input.type = 'password';
        input.id = id;
        input.name = id;
        input.placeholder = caption;
        input.required = true;
        input.style['font-size'] = this.font_size;
        this.addControl(caption, input, validation);

        return input;
    }

    addTextArea(caption, id, validation) {
        var textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.name = id;
        textarea.placeholder = caption;
        textarea.required = true;
        textarea.cols = 30;
        textarea.rows = 8;
        textarea.style['font-size'] = this.font_size;
        this.addControl(caption, textarea, validation);

        return textarea;
    }

    addCheckbox(caption, id, validation, text) {
        var span = document.createElement('span');
        span.className = 'form-element';

        var input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.name = id;
        span.appendChild(input);

        if (text) {
            var label = document.createElement('label');
            label.for = id;
            label.textContent = text;
            label.onclick = function(e) {
                input.checked = !input.checked;
            }
            span.appendChild(label);
        }

        this.addControl(caption, span, validation);

        input.rowElement = span.rowElement;

        return input;
    }

    _validateNode(node) {
        var result = true;

        if (node.scValidation) {
            result = node.scValidation(node);

            var validationContainer = document.getElementById(node.id + '-validation-message');
            if (validationContainer) {
                validationContainer.textContent = '';
            }

            if (result === true) {
                node.setCustomValidity('');
            } else {
                var message = localize('Invalid value');
                if (result !== false && result !== '' && result !== null) {
                    message = result;
                }
                node.setCustomValidity(message);

                if (validationContainer) {
                    validationContainer.textContent = message;
                }

                result = false;
            }
        }

        node.childNodes.forEach(child => {
            const child_result = this._validateNode(child);
            result &= child_result;
        });

        return result;
    }

    validate() {
        var result = this._validateNode(this.getElement());
        if (this.submit_button) {
            this.submit_button.disabled = !result;
        }
        return result;
    }

    _onsubmit(event) {
        if (this.validate()) {
            if (this.submit_action) {
                this.submit_action(event);
            }
        } else {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    getElement() {
        return this.form;
    }
}
