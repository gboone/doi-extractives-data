---
# Jekyll frontmatter
---
(function(exports) {

  /**
   * This object encapsulates all of the logic of a specific data type such as
   * revenue, production, exports or jobs (GDP). The constructor takes an
   * object that describes the type's behavior, including:
   *
   * `.geo`: the geographic hierarchies available in this data type
   * `.data`: an array of data URL specs that are used to determine which URL
   * to load for a given set of parameters.
   *
   * @param Object spec
   */
  var DataType = function(spec) {
    this.spec = spec || {};
  };

  DataType.prototype = {

    /**
     * Determine the "data spec" for a given set of parameters. This iterates
     * over the spec object's `data` array _in reverse order_ and returns the
     * first entry for which {@link matchesParams} returns `true`.
     *
     * @param Object params
     * @return {Object|null} the relevant data spec object with at least a
     *  `url` property
     */
    getDataSpec: function(params) {
      if (!Array.isArray(this.spec.data)) {
        throw new Error('missing "data" spec property');
      }

      var data = this.spec.data;
      for (var i = data.length - 1; i >= 0; i--) {
        var spec = data[i];
        if (this.matchesParams(spec, params)) {
          return spec;
        } else {
          // console.warn('does not match:', spec, params);
        }
      }
      return null;
    },

    /**
     * Get the data URL for a given set of parameters. This first finds the
     * relevant spec using {@link getDataSpec}, then returns its `url` if one
     * is found.
     *
     * @param Object params
     * @return {String|null}
     */
    getDataURL: function(params) {
      var spec = this.getDataSpec(params);
      return spec
        ? this.expand(spec.url, params)
        : null;
    },

    /**
     * Determine whether a given set of parameters matches a known "spec". If
     * the `spec` is an Object, the following must be true for every
     * key/property:
     *
     * - the value is `true`, or
     * - the same key of `params` must be equal (`==`)
     *
     * @example
     * var type = new DataType({});
     * var params = {foo: 1};
     * assert.equal(true, type.matchesParams({foo: 1}, foo));
     * assert.equal(true, type.matchesParams({foo: true}, foo));
     * assert.equal(false, type.matchesParams({bar: 1}, foo));
     * assert.equal(true, type.matchesParams(true, foo));
     * assert.equal(false, type.matchesParams(false, foo));
     *
     * @param {*} spec
     * @param {Object} params
     * @return Boolean
     */
    matchesParams: function(spec, params) {
      if (!spec || typeof spec === 'boolean') {
        return !!spec;
      }
      var needs = spec.params;
      return !needs || Object.keys(needs).every(function(key) {
        return (needs[key] === true)
          ? (key in params)
          : (params[key] == needs[key]);
      });
    },

    /**
     * Expands a Backbone-style URL template with placeholders in the regex
     * form /:(\w+)/.
     *
     * @param String template
     * @param Object params
     * @return String
     */
    expand: function(urlTemplate, params) {
      return urlTemplate.replace(/:(\w+)/g, function(_, key) {
        return params[key];
      });
    },

  };

  /**
   * @class ResourceRouter
   *
   * @example
   * var router = new ResourceRouter();
   * Backbone.history.start();
   */
  var ResourceRouter = Backbone.Router.extend({
    routes: {
      // #oilgas
      ':resource':                                          'resource',
      // #coal/revenue
      ':resource/:datatype':                                'resource',
      // #minerals/exports/US
      ':resource/:datatype/:regiontype':                    'resource',
      // #coal/exports/onshore/CA
      // #coal/exports/offshore/GOA
      ':resource/:datatype/:regiontype/:region':            'resource',
      // #coal/exports/onshore/CA/Inyo
      ':resource/:datatype/:regiontype/:region/:subregion': 'resource',
    },

    dataTypes: {
      {% for datatype in site.data.datatypes %}
      '{{ datatype[0] }}': new DataType(({{ datatype[1]|jsonify }})),
      {% endfor %}
    },

    /**
     * The class constructor.
     *
     * @param Object options
     */
    initialize: function(options) {
      this.options = options = _.defaultsDeep(options || {}, {
        dataPath: '/data',
        root: '#resources',
        map: '#region-map',
        inputs: {
          resource:       '#resource-selector',
          datatype:       '#datatype-selector',
          region:         '#region-selector',
          subregion:      '#subregion-selector',
          year:           '#year-slider',
        },
        outputs: {
          year:           '#output-year',
          text:           '#output-text',
          numericalTotal: '#output-numerical-total'
        }
      });

      var root = this.root = document.querySelector(options.root);
      if (!this.root) throw new Error('no such root element: "' + this.options.root + '"');

      this.resourceSelector = root.querySelector(options.inputs.resource);
      this.resourceSelector.addEventListener('change', this.onResourceChange.bind(this));

      this.regionSelector = root.querySelector(options.inputs.region);
      this.regionSelector.addEventListener('change', this.onRegionChange.bind(this));

      this.dataTypeSelector = root.querySelector(options.inputs.datatype);
      this.dataTypeSelector.addEventListener('change', this.onDataTypeChange.bind(this));

      this.subregionSelector = root.querySelector(options.inputs.subregion);
      this.subregionSelector.addEventListener('change', this.onSubregionChange.bind(this));

      this.yearSlider = root.querySelector(options.inputs.year);
      this.yearSlider.addEventListener('change', this.onYearChange.bind(this));

      this.map = root.querySelector(options.map);

      this.displayYear = this.root.querySelector(options.outputs.year);

      this.displayText = this.root.querySelector(options.outputs.text);

      this.displayNumericalTotalEl = this.root.querySelector(options.outputs.numericalTotal);

      this.params = {};
    },

    /**
     * Navigate to a new URL by setting one or more new
     * parameters. This will trigger a call to navigate() with a
     * new URL.
     *
     * @param Object params
     * @return void
     */
    navigateToParameters: function(params) {
      params = _.extend({}, this.params, params);
      var path = [
        params.resource,
        params.datatype,
        params.regiontype,
      ];
      if (params.region) {
        path.push(params.region);
        if (params.subregion) {
          path.push(encodeURIComponent(params.subregion));
        }
      }
      var url = path.join('/');
      if (params.year) {
        url += '?year=' + params.year;
      }
      this.navigate(url, {trigger: true});
    },

    /**
     * This is the main route handler. It does a couple of things:
     *
     * 1. If it finds an "=" in the last parameter, it treats it
     *    like a query string.
     * 1. It constructs a hash of named parameters from the
     *    positional args and saves this in `this.params` for
     *    later reference.
     * 1. It calls `this.update()` to update the state of its
     *    various selector inputs.
     *
     * @return void
     */
    resource: function(resource, datatype, regiontype, region, subregion) {
      var last = arguments[arguments.length - 1];
      var query;
      if (last && last.match(/=/)) {
        query = this.parseQueryString(last);
        arguments[arguments.length - 1] = null;
      }

      var params = {
        resource: resource || 'all',
        datatype: datatype || 'revenue',
        regiontype: regiontype || 'US',
        region: region,
        subregion: subregion,
        year: this.yearSlider.value
      };

      if (query) {
        params = _.extend(params, query);
      }

      this.diff = diffObject(this.params, params);
      this.params = params;

      console.log('resource():', params);
      this.update(params);
    },

    /**
     * This is the main state update function. It sets the _updating flag to
     * `true` so that we don't end up in an infinite loop of elements changing
     * and triggering their own change handlers.
     *
     * @param Object params
     * @return void
     */
    update: function(params) {
      this._updating = true;
      this.updateSelectors(params);

      if (params.year) {
        this.yearSlider.value = +params.year;
      }

      this.loadData(params);
      this._updating = false;
    },

    /**
     * Update the map.
     * @param Object params
     */
    updateMap: function(data, params) {
      var map = this.map;

      var featureId = null;
      switch (params.regiontype) {
        case 'onshore':
        case 'offshore':
          // FIXME: zoom to subregion?
          // note: for counties this should be the FIPS, *not* the name
          featureId = params.region;
          break;
      }

      var type = this.dataTypes[params.datatype];
      this.updateMapLayers(map, type, params);

      var spec = type.getDataSpec(params);

      var groupKey = spec.geo || 'Region';
      var sumKey = spec.value;

      if (!groupKey || !sumKey) {
        return console.error('no group/sum key for params:', [groupKey, sumKey], params);
      }

      // ensure that groupKey is an array
      if (!Array.isArray(groupKey)) {
        groupKey = [groupKey];
      }

      var nest = d3.nest();
      groupKey.forEach(function(key) {
        if (key.charAt(0) === '+') {
          key = key.substr(1);
          nest.key(function(d) { return +d[key]; });
        } else {
          nest.key(eiti.data.getter(key));
        }
      });

      nest.rollup(function(d) {
        return d3.sum(d, eiti.data.getter(sumKey));
      });

      var nested = nest.map(data);
      console.log('nested data:', nested);

      var domain = d3.extent(d3.values(nested));
      // ensure that the domain min is <= 0
      if (domain[0] > 0) domain[0] = 0;
      var scale = d3.scale.linear()
        .domain(domain)
        .range(['#ddd', '#000'])
        .nice()
        .clamp(true);

      onMapLoaded(map, function() {
        d3.select(map)
          .selectAll('path.feature')
          .style('fill', function(d) {
            if (d.id in nested) {
              return scale(nested[d.id]);
            }
            // console.warn('no data for', d.id);
            return null;
          });

        // console.log('zooming to:', featureId);
        map.zoomTo(featureId);
      });
    },

    /**
     * Update the individual layers of the given <eiti-map> instance with the
     * geo information from the provided data type and parameters.
     *
     * @param EITIMap map
     * @param DataType type
     * @param Object params
     * @return Boolean true if changed, false otherwise
     */
    updateMapLayers: function(map, type, params) {
      var geo = type.spec.geo || {};

      var changed = false;

      // iterate over each layer
      var layers = d3.select(map)
        .selectAll('g[data-url]')
        .each(function() {
          var geoType = this.getAttribute('data-object') || this.getAttribute('data-layer-type');

          // determine if this layer is visible in the current dataType
          var visible = geo[geoType]
            ? type.matchesParams(geo[geoType], params)
            : false;

          // XXX <eiti-map> skips layers with data-load="false"
          var attrs = {
            'data-load': String(visible),
          };

          // if the layer has a filter template, interpolate the current set
          // of parameters into it and use that as the data-filter attribute,
          // which <eiti-map> will use to filter the visible geometries
          if (this.hasAttribute('data-filter-template')) {
            var template = this.getAttribute('data-filter-template');
            attrs['data-filter'] = template.replace(/{(\w+)}/g, function(_, key) {
              return params[key];
            });
          }

          // iterate over the attributes and set the changed flag to true if
          // any differ from the current attributes
          for (var attr in attrs) {
            var value = this.getAttribute(attr);
            if (value !== attrs[attr]) {
              changed = true;
              this.setAttribute(attr, attrs[attr]);
            }
          }
        });

      // only reload the map if geo data has changed
      if (changed) {
        map.load();
      }

      return changed;
    },

    /**
    * Load data given a set of parameters
    * @param Object params
    * @return void
    */
    loadData: function(params) {
      var url = this.getDataURL(params);

      var that = this;
      this.loadDataRequest = d3.tsv(url, function(error, data) {
        that.loadDataRequest = null;

        if (error) {
          console.error('unable to load data from', url);
          data = [];
        }

        // console.warn('loadData() loaded data:', data);
        that.updateData(data, params);
      });
     },

    /**
     * Get the URL of the relevant data file for a given set of parameters.
     * @param Object params
     * @return String the data URL
     */
    getDataURL: function(params) {
      var type = this.dataTypes[params.datatype];
      if (!type) {
        throw new Error('unrecognized data type: "' + params.datatype + '"');
      }
      return type.getDataURL(params);
    },

    /**
    * This filters data (onshore and offshore) when parameters change, triggers
    * this.updateOutputs, which updates elements with relevant/current data.
    *
    * @param Array data
    * @param Object params
    * @return
    */
    updateData: function(data, params) {
      // XXX: this shouldn't be necessary
      params = params || this.params;

      var where = {};
      if (params.resource && params.resource !== 'all') {
        where.Resource = params.resource;
      }
      if (params.year) {
        where.Year = String(params.year);
      }

      if (params.regiontype === 'onshore') {
        if (params.subregion) {
          where.County = params.subregion;
        }
      } else if (params.regiontype === 'offshore') {
        where.Area = params.subregion;
      }

      var filtered = _.filter(data, where);
      console.warn('behold, your data: ', where, filtered);
      this.updateMap(filtered, params);
      this.updateOutputs(filtered, params);
    },

    /**
     * Update the various selectors based on a hash of named
     * parameters.
     *
     * @param Object params
     * @return void
     */
    updateSelectors: function(params) {
      this.updateResourceSelector(params);
      this.updateRegionSelector(params);
      this.updateDataTypeSelector(params);
    },

    /**
     * Update the resource selector.
     */
    updateResourceSelector: function(params) {
      this.resourceSelector.value = params.resource;
    },

    /**
     * Update the region selector.
     * @param Object params
     * @return void
     */
    updateRegionSelector: function(params) {
      var region = params.region
        ? [params.regiontype, params.region].join('/')
        : params.regiontype;
      console.log('selected region:', region);
      this.regionSelector.value = region;

      // cancel the outbound subregion request
      if (this.subregionRequest) {
        this.subregionRequest.abort();
      }

      // hide the selector by default
      var selector = d3.select(this.subregionSelector)
        .style('display', 'none');

      var options = selector.selectAll('option.subregion');

      // request new subregions if there's a "region" param
      if (params.region) {

          // show the selector
          selector.style('display', null);

        var type = this.dataTypes[params.datatype];
        var spec = type.getDataSpec(params);
        if (spec && spec.subregions) {
          var subregionURL = type.expand(spec.subregions, params);

          console.log('loading subregions:', subregionURL);

          var that = this;
          return this.subregionRequest = eiti.load(subregionURL, function(error, subregions) {
            that.subregionRequest = null;

            if (error) {
              console.error('unable to load subregions from', subregionURL);
              subregions = [];
            } else {
              // console.warn('loaded subregions:', subregions);
              subregions.sort(function(a, b) {
                return d3.ascending(a.name, b.name);
              });
            }

            options = options.data(subregions);
            options.exit().remove();
            options.enter().append('option')
              .attr('class', 'subregion');
            options.text(function(d) {
              return d.name;
            });

            selector
              .property('selectedIndex', 0)
              .property('value', params.subregion);
          });
        } else {
          console.warn('not loading subregions for', params);
        }

      } else {
        // TODO: hide the selector
      }

      options.remove();
    },

    /**
     * Update the data type selector.
     * @param Object params
     * @return void
     */
    updateDataTypeSelector: function(params) {
      this.dataTypeSelector.value = params.datatype;
    },

    /**
     * This is the "change" event handler for the resource
     * selector. It calls `this.navigateToParameters()` and sets
     * the "resource" parameter based on the value of the
     * selector.
     *
     * @param Event e
     * @return void
     */
    onResourceChange: function(e) {
      if (this._updating) return;
      this.navigateToParameters({
        resource: this.resourceSelector.value
      });
    },

    /**
     * This is the "change" event handler for the region selector.
     * It calls `this.navigateToParameters()` and sets the
     * "regiontype" and "subregion" parameters based on the value
     * of the selector.
     *
     * @param Event e
     * @return void
     */
    onRegionChange: function(e) {
      if (this._updating) return;
      var value = this.regionSelector.value;
      var parts = value.split('/');
      var params = {
        regiontype: parts[0],
        region: parts[1],
        subregion: null
      };
      this.navigateToParameters(params);
    },

    /**
     * This is the "change" event handler for the subregion
     * (county or offshore area) selector. It calls
     * `this.navigateToParameters()` and sets the "subregion"
     * parameter based on the value of the selector.
     *
     * @param Event e
     * @return void
     */
    onSubregionChange: function(e) {
      this.navigateToParameters({
        subregion: this.subregionSelector.value
      });
    },

    /**
     * This is the "change" event handler for the data type
     * selector. It calls `this.navigateToParameters()` and sets
     * the "datatype" parameter based on the input value.
     * @param Event e
     * @return void
     */
    onDataTypeChange: function(e) {
      if (this._updating) return;
      this.navigateToParameters({
        datatype: this.dataTypeSelector.value
      });
    },

    /**
     * This is the "change" event handler for the year slider.
     * @param Event e
     * @return void
     */
    onYearChange: function(e) {
      if (this._updating) return;
      this.navigateToParameters({
        year: this.yearSlider.value
      });
    },

    /**
     * This is a minimal query string parameter parser.
     *
     * @param String str
     * @return Object
     */
    parseQueryString: function(str) {
      // strip the leading "?"
      if (str.charAt(0) === '?') {
        str = str.substr(1);
      }
      return str.split('&').reduce(function(query, part) {
        var bits = part.split('=');
        var key = bits[0];
        var value = bits.length > 1
          ? decodeURIComponent(bits[1])
          : true;
        query[bits[0]] = value;
        return query;
      }, {});
    },

    /**
     * This updates the total (in dollars) associated with data filters
     * change.
     *
     * @param Object params
     * @return void
     */
    displayNumericalTotal: function(data, params) {
      var sumKey;
      if (params) {
        switch (params.datatype) {
          case 'revenue':
            sumKey = 'Revenue';
            break;
          case 'exports':
            sumKey = 'Value';
            break;

          default:
            console.warn('unable to sum:', params.datatype);
            return false;
        }
      }

      var sum = ~~d3.sum(data, eiti.data.getter(sumKey));
      var format = d3.format('$,');
      d3.select(this.displayNumericalTotalEl)
        .text(format(sum));
    },

    /**
     * This displays the data filter parameters
     * change.
     *
     * @param Object params
     * @return void
     */
    displayFilterParameters: function(data, params) {
      params = params || this.params;
      var resource = getSelectedLabel(this.resourceSelector);
      // placeholder logic while there are only two options
      var dataType = params.datatype;
      var regionName = getSelectedLabel(this.regionSelector);
      var region = params.subregion
        ? params.subregion + ', ' + regionName
        : regionName;
      var year = this.displayYear.textContent = params.year;

      // format the text to be displayed
      var displayText = resource + ' ' + dataType + ' in ' + region + ' in ' + year;
      this.displayText.textContent = displayText;
    },

    /**
     * This triggers functions that display the data filter parameters
     * and display the total $$ associated with those filters
     *
     * @param Object params
     * @return void
     */
    updateOutputs: function(data, params) {
      this.displayFilterParameters(data, params);
      this.displayNumericalTotal(data, params);
    }

  });


  // kick off the router
  var router = new ResourceRouter();
  Backbone.history.start();

  if (!location.hash) {
    router.navigateToParameters({
      resource: 'all',
      datatype: 'revenue',
      regiontype: 'US'
    });
  }

  exports.router = router;

  function onMapLoaded(map, callback) {
    if (map.loaded) {
      return callback(map);
    } else {
      var onload;
      map.addEventListener('load', onload = function(e) {
        map.removeEventListener('load', onload);
        callback(map);
      });
    }
  }

  function getSelectedLabel(select) {
    var index = select.selectedIndex;
    var option = select.options[index];
    return option.label;
  }

  function diffObject(a, b) {
    var diff = {};
    var key;
    for (key in a) {
      if (b[key] != a[key]) diff[key] = true;
    }
    for (key in b) {
      if (!diff[key] && b[key] != a[key]) diff[key] = true;
    }
    return diff;
  }

})(this);
