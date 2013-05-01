(function() {
/*global jQuery*/

var get = Ember.get, set = Ember.set, merge = Ember.merge;

/*
  Modified by qbox to work with the qbox elasticsearch api (http://qbox.io)
*/

/**
  The REST adapter allows your store to communicate with an HTTP server by
  transmitting JSON via XHR. Most Ember.js apps that consume a JSON API
  should use the REST adapter.

  This adapter is designed around the idea that the JSON exchanged with
  the server should be conventional.

  ## JSON Structure

  The REST adapter expects the JSON returned from your server to follow
  these conventions.

  ### Object Root

  The JSON payload should be an object that contains the record inside a
  root property. For example, in response to a `GET` request for
  `/posts/1`, the JSON should look like this:

  ```js
  {
    "post": {
      title: "I'm Running to Reform the W3C's Tag",
      author: "Yehuda Katz"
    }
  }
  ```

  ### Conventional Names

  Attribute names in your JSON payload should be the underscored versions of
  the attributes in your Ember.js models.

  For example, if you have a `Person` model:

  ```js
  App.Person = DS.Model.extend({
    firstName: DS.attr('string'),
    lastName: DS.attr('string'),
    occupation: DS.attr('string')
  });
  ```

  The JSON returned should look like this:

  ```js
  {
    "person": {
      "first_name": "Barack",
      "last_name": "Obama",
      "occupation": "President"
    }
  }
  ```
*/
DS.qboxAdapter = DS.Adapter.extend({
  bulkCommit: false,
  since: 'since',

  serializer: DS.RESTSerializer,

  init: function() {
    this._super.apply(this, arguments);
  },

  shouldSave: function(record) {
    var reference = get(record, '_reference');

    return !reference.parent;
  },

  dirtyRecordsForRecordChange: function(dirtySet, record) {
    this._dirtyTree(dirtySet, record);
  },

  dirtyRecordsForHasManyChange: function(dirtySet, record, relationship) {
    var embeddedType = get(this, 'serializer').embeddedType(record.constructor, relationship.secondRecordName);

    if (embeddedType === 'always') {
      relationship.childReference.parent = relationship.parentReference;
      this._dirtyTree(dirtySet, record);
    }
  },

  _dirtyTree: function(dirtySet, record) {
    dirtySet.add(record);

    get(this, 'serializer').eachEmbeddedRecord(record, function(embeddedRecord, embeddedType) {
      if (embeddedType !== 'always') { return; }
      if (dirtySet.has(embeddedRecord)) { return; }
      this._dirtyTree(dirtySet, embeddedRecord);
    }, this);

    var reference = record.get('_reference');

    if (reference.parent) {
      var store = get(record, 'store');
      var parent = store.recordForReference(reference.parent);
      this._dirtyTree(dirtySet, parent);
    }
  },

  createRecord: function(store, type, record) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.createRecord', store, type, record);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.createRecord');

    var root = this.rootForType(type);

    var data = this.serialize(record, { includeId: true });
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.createRecord data', data);

    this.ajax(this.buildURL(root), "POST", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          var result = this.processUpdateResult(root, json, data);
          this.didCreateRecord(store, type, record, result);
        });
      },
      error: function(xhr) {
        this.didError(store, type, record, xhr);
      }
    });
  },

  createRecords: function(store, type, records) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.createRecords', store, type, records);
    
    if (get(this, 'bulkCommit') === false) {
      if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.createRecords: returning');
      return this._super(store, type, records);
    }

    throw "DS.QBOXAdapter.createRecords not implemented!";

    // var root = this.rootForType(type),
    //     plural = this.pluralize(root);

    // var data = {};
    // data[plural] = [];
    // records.forEach(function(record) {
    //   data[plural].push(this.serialize(record, { includeId: true }));
    // }, this);

    // this.ajax(this.buildURL(root), "POST", {
    //   data: data,
    //   success: function(json) {
    //     Ember.run(this, function(){
    //       this.didCreateRecords(store, type, records, json);
    //     });
    //   }
    // });
  },

  updateRecord: function(store, type, record) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.updateRecord', store, type, record);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.updateRecord');
    
    var id = get(record, 'id');
    var root = this.rootForType(type);

    var data = this.serialize(record);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.updateRecord data', data);

    this.ajax(this.buildURL(root, id), "PUT", {
      data: data,
      success: function(json) {
        Ember.run(this, function(){
          var result = this.processUpdateResult(root, json);
          this.didUpdateRecord(store, type, record, result)
        });
      },
      error: function(xhr) {
        this.didError(store, type, record, xhr);
      }
    });
  },

  updateRecords: function(store, type, records) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.updateRecords', store, type, records);
    
    if (get(this, 'bulkCommit') === false) {
      if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.updateRecords: returning');
      return this._super(store, type, records);
    }

    throw "DS.QBOXAdapter.updateRecords not implemented!";

    // var root = this.rootForType(type),
    //     plural = this.pluralize(root);

    // var data = {};
    // data[plural] = [];
    // records.forEach(function(record) {
    //   data[plural].push(this.serialize(record, { includeId: true }));
    // }, this);

    // this.ajax(this.buildURL(root, "bulk"), "PUT", {
    //   data: data,
    //   success: function(json) {
    //     Ember.run(this, function(){
    //       this.didUpdateRecords(store, type, records, json);
    //     });
    //   }
    // });
  },

  deleteRecord: function(store, type, record) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.deleteRecord', store, type, record);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.deleteRecord');
    
    var id = get(record, 'id');
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, id), "DELETE", {
      success: function(json) {
        Ember.run(this, function(){
          var result = this.processUpdateResult(root, json);
          this.didDeleteRecord(store, type, record, result);
        });
      },
      error: function(xhr) {
        this.didError(store, type, record, xhr);
      }
    });
  },

  deleteRecords: function(store, type, records) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.deleteRecords', store, type, records);
    
    if (get(this, 'bulkCommit') === false) {
      if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.deleteRecords: returning');
      return this._super(store, type, records);
    }

    throw "DS.QBOXAdapter.deleteRecords not implemented!";

    // var root = this.rootForType(type),
    //     plural = this.pluralize(root),
    //     serializer = get(this, 'serializer');

    // var data = {};
    // data[plural] = [];
    // records.forEach(function(record) {
    //   data[plural].push(serializer.serializeId( get(record, 'id') ));
    // });

    // this.ajax(this.buildURL(root, 'bulk'), "DELETE", {
    //   data: data,
    //   success: function(json) {
    //     Ember.run(this, function(){
    //       this.didDeleteRecords(store, type, records, json);
    //     });
    //   }
    // });
  },

  find: function(store, type, id) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.find', store, type, id);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.find');
    
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, id), "GET", {
      success: function(json) {
        Ember.run(this, function(){
          var result = this.processFindResult(root, json);
          this.didFindRecord(store, type, result, id);
        });
      }
    });
  },

  findAll: function(store, type, since) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.findAll', store, type, since);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.findAll');
    
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, "_search"), "GET", {
      data: this.sinceQuery(since),
      success: function(json) {
        Ember.run(this, function(){
          var result = this.processSearchResult(this.pluralize(root), json);
          this.didFindAll(store, type, result);
        });
      }
    });
  },

  findQuery: function(store, type, query, recordArray) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.findQuery', store, type, query, recordArray);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.findQuery');
    
    var root = this.rootForType(type);

    this.ajax(this.buildURL(root, "_search"), "POST", {
      data: query,
      success: function(json) {
        Ember.run(this, function(){
          var result = this.processSearchResult(this.pluralize(root), json);
          this.didFindQuery(store, type, result, recordArray);
        });
      }
    });
  },

  findMany: function(store, type, ids, owner) {
    //if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.findMany', store, type, ids, owner);
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.findMany');

    throw "DS.QBOXAdapter.findMany not implemented!";
    
    // var root = this.rootForType(type);
    // ids = this.serializeIds(ids);

    // this.ajax(this.buildURL(root), "GET", {
    //   data: {ids: ids},
    //   success: function(json) {
    //     Ember.run(this, function(){
    //       this.didFindMany(store, type, json);
    //     });
    //   }
    // });
  },

  /**
    @private

    This method serializes a list of IDs using `serializeId`

    @returns {Array} an array of serialized IDs
  */

  processFindResult: function(rootKey, json){
    var result = {};
    result[rootKey] = Ember.Object.create(json['_source']).reopen({id: json._id, version: json._version});
    if (Ember.ENV.DEBUG) {
      console.debug('DS.QBOXAdapter.processFindResult: ', result);
      console.debug('------------------------------------------------------');
    }
    return result;
    //return {};
  },

  processUpdateResult: function(rootKey, json, data){
    var result = {};
    result[rootKey] = Ember.Object.create({ _id: json['_id'], _version: json['_version']});
    if(data) result[rootKey].reopen(data);
    if (Ember.ENV.DEBUG) {
      console.debug('DS.QBOXAdapter.processUpdateResult: ', result);
      console.debug('------------------------------------------------------');
    }
    return result;
    //return {};
  },

  processSearchResult: function(rootKey, json){
    var result = {};
    result[rootKey] = json['hits']['hits'].map( function(i) {
      return Ember.Object.create(i['_source']).reopen({id: i._id, version: i._version})
    } );
    this.setTotalHitCount(json['hits']['total']);
    if (Ember.ENV.DEBUG) {
      console.debug('DS.QBOXAdapter.processSearchResult: ', result);
      console.debug('------------------------------------------------------');
    }
    return result;
  },

  serializeIds: function(ids) {
    var serializer = get(this, 'serializer');

    return Ember.EnumerableUtils.map(ids, function(id) {
      return serializer.serializeId(id);
    });
  },

  didError: function(store, type, record, xhr) {
    if (xhr.status === 422) {
      var json = JSON.parse(xhr.responseText),
          serializer = get(this, 'serializer'),
          errors = serializer.extractValidationErrors(type, json);

      store.recordWasInvalid(record, errors);
    } else {
      this._super.apply(this, arguments);
    }
  },

  ajax: function(url, type, hash) {
    hash.url = url;
    hash.type = type;
    hash.dataType = 'json';
    //hash.contentType = 'application/json; charset=utf-8';
    hash.context = this;

    if (hash.data && type !== 'GET') {
      hash.data = JSON.stringify(hash.data);
      if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.ajax data:', hash.data);
    }

    jQuery.ajax(hash);
  },

  url: "",

  rootForType: function(type) {
    var serializer = get(this, 'serializer');
    return serializer.rootForType(type);
  },

  pluralize: function(string) {
    var serializer = get(this, 'serializer');
    return serializer.pluralize(string);
  },

  buildURL: function(record, suffix) {
    //if (Ember.ENV.DEBUG) console.debug('buildURL', record, suffix, this.url, this.namespace);

    var url = [this.url];

    Ember.assert("Namespace URL (" + this.namespace + ") must not start with slash", !this.namespace || this.namespace.toString().charAt(0) !== "/");
    Ember.assert("Record URL (" + record + ") must not start with slash", !record || record.toString().charAt(0) !== "/");
    Ember.assert("URL suffix (" + suffix + ") must not start with slash", !suffix || suffix.toString().charAt(0) !== "/");

    if (this.namespace !== undefined) {
      url.push(this.namespace);
    }

    //url.push(this.pluralize(record));

    if (suffix !== undefined) {
      url.push(suffix);
    }

    var result = url.join("/");
    if (Ember.ENV.DEBUG) console.debug('DS.QBOXAdapter.buildURL: ', result);
    return result;
  },

  sinceQuery: function(since) {
    var query = {};
    query[get(this, 'since')] = since;
    return since ? query : null;
  }
});


})();