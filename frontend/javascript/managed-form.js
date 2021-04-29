class ManagedForm {
    constructor(id) {
      this.form = document.createElement('form');
      this.form.id = id;
    }

    addControl(caption, control) {
        var label = document.createElement('label');
        label.for = control.id;
        label.textContent = localize(caption);

        this.form.appendChild(label);
        this.form.appendChild(control);
    }

    getElement() {
        return this.form;
    }
}
