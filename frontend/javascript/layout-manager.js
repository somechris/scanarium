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

