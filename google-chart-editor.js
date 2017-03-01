(() => {

const loader = new GoogleChartLoader(['charteditor']);

Polymer({
  is: 'google-chart-editor',
  properties: {
    editor: {
      type: Object,
      value: function() {
        return loader.visualization.then(v => {
          const editor = new v.ChartEditor();
          v.events.addListener(editor, 'ok', () => {
            const wrapper = editor.getChartWrapper();
            this.chart.type = this.type = wrapper.getChartType();
            this.chart.options = this.options = wrapper.getOptions();
            this.chart.src = this.src = wrapper.getDataSourceUrl();
            this.open = false;
            this.fire('google-chart-ok');
          });
          v.events.addListener(editor, 'cancel', () => {
            this.open = false;
            this.fire('google-chart-cancel');
          });
          return editor;
        });
      },
    },
    open: {
      type: Boolean,
      notify: true,
      observer: '_observeOpen',
    },
    type: {
      type: String,
      notify: true,
    },
    options: {
      type: Object,
      notify: true,
    },
    src: {
      type: String,
      notify: true,
    },
  },
  listeners: {
    'google-chart-ready': '_onChartReady',
  },
  attached() {
    const $ = q => Polymer.dom(this).querySelector(q);
    this.chart = $('google-chart');
    this.dataSourceInput = $('.data-source-input') || 'urlbox';
  },
  openDialog() {
    this.open = true;
  },
  closeDialog() {
    this.open = false;
  },
  _observeOpen(toOpen) {
    if (toOpen) {
      Promise.all([this.editor, this.chart.wrapper]).then(ew => {
        const [editor, wrapper] = ew;
        editor.openDialog(wrapper, {'dataSourceInput': this.dataSourceInput});
      });
    } else {
      this.editor.then(e => e.closeDialog());
    }
  },
  /**
   * Updates the chart in the open dialog.
   * If we make changes to the chart outside of the editor, we should update
   * the chart inside the editor, as well.
   * We only update the chart if it's the one used for the editor.
   * @param {!Event} evt
   */
  _onChartReady(evt) {
    if (!this.open || this.chart != evt.target) {
      return;
    }
    Promise.all([this.editor, this.chart.wrapper]).then(ew => {
      const [editor, wrapper] = ew;
      editor.setChartWrapper(wrapper);
    });
  },
});

})();
