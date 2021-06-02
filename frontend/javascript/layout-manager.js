// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var LayoutManager = {
  layouters: [],
  width: 0,
  height: 0,

  onResize: function() {
    LayoutManager.width = window.innerWidth;
    LayoutManager.height = window.innerHeight;
    LayoutManager.layout();
  },

  register: function(layouter) {
    this.layouters.push(layouter);
    layouter(this.width, this.height);
  },

  layout: function() {
    var width = this.width;
    var height = this.height;
    this.layouters.forEach(function (layouter, index) {
      layouter(width, height);
    });
  },
}
LayoutManager.onResize();

