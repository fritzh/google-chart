Polymer({
  is: 'google-chart-dashboard',
  properties: {
    /**
     * The data we should draw.
     * This can be a `DataTable`, `DataView`, or a 2D Array.
     * @type {!DataTable|!Array<!Array>|undefined}
     * @attribute data
     */
    data: {
      type: Object,
      notify: true,
    },
    /**
     * The current selection in the dashboard.
     * @type {!Array<{col:number,row:number}>}
     * @attribute selection
     */
    selection: {
      type: Array,
      notify: true,
      readOnly: true,
      value: () => [],
    },
    /**
     * Indicates if the dashboard has finished drawing.
     * @type {boolean}
     * @attribute drawn
     */
    drawn: {
      type: Boolean,
      notify: true,
      readOnly: true,
      value: false,
    },
    /**
     * Internal promise for the `Dashboard` creation.
     * @type {!Promise<!google.visualization.Dashboard>}
     * @attribute dashboard
     */
    dashboard: {
      type: Object,
      readOnly: true,
    },
    /**
     * Internal promise for the charts and controls binding in the dashboard.
     * @type {!Promise}
     * @attribute bound
     */
    bound: {
      type: Object,
      readOnly: true,
      computed: '_computeBound(dashboard, groups)',
    },
    /**
     * Internal object tracking the chart and control groups.
     * @type {!Object<string, {
     *     controls: !Array<!Element>,
     *     charts: !Array<!Element>}>}
     * @attribute groups
     */
    groups: {
      type: Object,
      readOnly: true,
    },
  },
  listeners: {
    'google-chart-data-change': '_onDataChanged',
    'google-chart-select': '_onSelectChanged',
  },
  observers: [
    '_drawDashboard(dashboard, bound, data)',
  ],
  _uncontrolledCharts: [],
  _v: new GoogleChartLoader(['controls']).visualization,
  /**
   * Let's iterate through all the charts and controls, building their bind groups.
   * Those without a specified group are put into a default group.
   * @return {!Object<string, {
   *     controls: !Array<!Element>,
   *     charts: !Array<!Element>}>}
   */
  _createGroups() {
    const $ = q => Polymer.dom(this).querySelectorAll(q);
    const groups = {};
    const getGroup = id => {
      id = id || '__DEFAULT';
      if (!groups[id]) {
        groups[id] = {controls:[], charts:[]};
      }
      return groups[id];
    };
    $('google-chart-control').forEach(
        control => getGroup(control.group).controls.push(control));
    $('google-chart').forEach(
        chart => getGroup(chart.group).charts.push(chart));
    return groups;
  },
  /**
   * After the dashboard is attached, we can start looking for charts and controls.
   * We'll go ahead and create the Dashboard, too.
   */
  attached() {
    this._setGroups(this._createGroups());
    this._setDashboard(this._v.then(v => new v.Dashboard(this.$.dashboard)));
  },
  /**
   * Once we have a dashboard and the groups, let's bind them together.
   * For each group, if we have at least one chart and control, bind them.
   * If there are no controls in a group, add the chart to the uncontrolled list.
   * If there are no charts in a group, set the `unconnected` class on the control.
   * @param {!Promise<!google.visualization.Dashboard>} dashboard
   * @param {!Object<string, {
   *    controls: !Array<!Element>,
   *    charts: !Array<!Element>}>} groups the binding groups for controls and charts
   * @return {!Promise} a promise for the completed binding phase
   */
  _computeBound(dashboard, groups) {
    const bindPromises = [];
    for (const id in groups) {
      const group = groups[id];
      // Bind controls charts if the are specified
      if (group.controls.length && group.charts.length) {
        // We need to resolve the dashboard and all the wrappers before binding.
        bindPromises.push(Promise.all([
          dashboard,
          Promise.all(group.controls.map(c => c.wrapper)),
          Promise.all(group.charts.map(c => c.wrapper)),
        ]).then(dcc => dcc[0].bind(dcc[1], dcc[2])));
      } else if (group.charts.length) {
        this._uncontrolledCharts.push(...group.charts);
      } else if (group.controls.length) {
        // Add the class `unconnected` to unconnected controls.
        // `google-chart-control` should hide itself when this class is added.
        group.controls.forEach(c => {
          Polymer.dom(c).classList.add('unconnected');
        });
      }
    }
    return Promise.all(bindPromises);
  },
  /**
   * Bindings are configured, now we need to draw data changes.
   * For all the uncontrolled charts, just set the data on them.
   * @param {!Promise<!google.visualization.Dashboard>} dashboard
   * @param {!Promise} a promise for the completed binding phase
   */
  _drawDashboard(dashboard, bound, data) {
    this._setDrawn(false);
    Promise.all([dashboard, bound]).then(db => {
      db[0].draw(data)
      this._setDrawn(true);
    });
    this._uncontrolledCharts.forEach(c => {
      c.data = data;
    });
  },
  /**
   * Handle data updates fired from within the dashboard.
   * We'll stop it because no other element should be interested.
   * @param {!Event} evt the `google-chart-data-change` event
   */
  _onDataChanged(evt) {
    evt.stopPropagation();
    this.data = evt.detail;
  },
  /**
   * Stop and re-fire the select event in the context of the dashboard.
   * Chart select events are different from a dashboard.
   * (they are based on the chart's data slice, not the full dataset)
   * If someone is listening for a select on the Dashboard, they should get
   * a reference to the Dashboard's dataset.
   * If the select event comes from an uncontrolled chart,
   * the selection value will remain unchanged.
   * @param {!Event} evt the `google-chart-select` event
   */
  _onSelectChanged(evt) {
    evt.stopPropagation();
    this.dashboard.then(d => {
      this._setSelection(d.getSelection());
      this.fire('google-chart-select', this.selection, {node: this.parentNode});
    });
  },
});
