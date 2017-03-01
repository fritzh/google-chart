(() => {

/**
 * Supported control type short hand values.
 * @enum {string}
 */
const ControlTypes = {
  'range': 'NumberRangeFilter',
};

const loader = new GoogleChartLoader(['controls']);

Polymer({
  is: 'google-chart-control',
  properties: {
    /**
     * The type of control we should draw.
     * This can be a string in the `ControlTypes` object or any string corresponding to
     * a valid control name.
     * @type {string}
     * @attribute type
     */
    type: {
      type: String,
      value: 'range',
    },
    /**
     * The options of the specific control.
     * @type {!Object}
     * @attribute options
     */
    options: {
      type: Object,
      value: () => ({}),
    },
    /**
     * The state of the specific control.
     * @type {Object|undefined}
     * @attribute state
     */
    state: {
      type: Object,
    },
    /**
     * The label of the column in the data to control.
     * Either `label` or `index` should be set, not both.
     * @type {string}
     * @attribute label
     */
    label: {
      type: String,
      value: null,
    },
    /**
     * The index of the column in the data to control.
     * Either `label` or `index` should be set, not both.
     * @type {number}
     * @attribute index
     */
    index: {
      type: Number,
      value: -1,
    },
    /**
     * Specifies the group for the chart in a Dashboard.
     * @type {string}
     * @attribute group
     */
    group: {
      type: String,
    },
    /**
     * Internal promise for creating a `ChartWrapper`.
     * Should not be used externally.
     * @type {!Promise<!google.visualization.ChartWrapper>}
     * @attribute wrapper
     */
    wrapper: {
      type: String,
      readOnly: true,
      computed: '_computeWrapper(type)',
    },
  },
  observers: [
    '_computeOptions(wrapper, options.*, index, label)',
    '_computeState(wrapper, state.*)',
  ],
  /**
   * Update the state when it changes.
   * @param {!Promise<!google.visualization.ChartWrapper} wrapper
   * @param {{base:!Object}}} stateSplice
   */
  _computeState(wrapper, stateSplice) {
    wrapper.then(w => {
      w.setState(stateSplice.base);
      w.draw();
    });
  },
  /**
   * Update the options with the index and label properties.
   * Only one of index or label should be set.
   * @param {!Promise<!google.visualization.ChartWrapper} wrapper
   * @param {{base:!Object}}} optionsSplice
   * @param {number} index the column index to control
   * @param {string} label the column label to control
   */
  _computeOptions(wrapper, optionsSplice, index, label) {
    if (this._noReact) {
      return;
    }
    const options = optionsSplice.base;
    this._noReact = true;  // Ignore splice changes here.
    options.filterColumnLabel = label || undefined;
    options.filterColumnIndex = index >= 0 ? index : undefined;
    this._noReact = false;
    wrapper.then(w => {
      w.setOptions(options);
      w.draw();
    });
  },
  /**
   * Creates a `ControlWrapper` for the specified `type`.
   * @param {string} type the type of the `Control`
   * @return {!Promise<!google.visualization.ControlWrapper>}
   */
  _computeWrapper(type) {
    return loader.visualization.then(v => {
      const wrapper = new v.ControlWrapper({
        'controlType': ControlTypes[this.type] || this.type,
        'container': this.$.control,
      });
      v.events.addOneTimeListener(wrapper, 'ready', () => {
        loader.moveStyles(this);
      });
      return wrapper;
    });
  },
});

})();
