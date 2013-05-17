
$(function() {

  // shows some feedback from qbox-adapter (set to false to reduce console clutter)
  Ember.ENV.DEBUG = true;

  var config = window.qbox_table_config;

  // config ///////////////////////////

  if(!config) {
    console.error('qbox_table_config object not found. qbox-table-config.js must be loaded before qbox-table.js. See https://github.com/StackSearchInc/ember-pageable-elasticsearch for more information.');
    return;
  }

  // a little feedback
  console.debug(
    Handlebars.compile("qbox_table_config object found. Index name is '{{index_name}}'. Type name is '{{type_name}}'.")
      ({
        index_name : config.index_name, 
        type_name : config.type_name
      })
  );


  // template integration ///////////////////////////

  Ember.TEMPLATES['application'] = Ember.Handlebars.compile(config.app_template);

  Ember.TEMPLATES['documents'] = Ember.Handlebars.compile(config.table_template);

  Ember.TEMPLATES['document'] = Ember.Handlebars.compile(config.details_template);


  // app definition and params ///////////////////////////

  App = Ember.Application.create({
    // create ember app in the right element
     rootElement: '#ember_app_container'
    //LOG_TRANSITIONS: true
  });

  App.DefaultResultSize = 20;

  App.SearchParams = {
    from: 0,
    size: App.DefaultResultSize
  };

  App.ResultParams = {
    totalHitCount: 0
  };


  // qbox Adapter ///////////////////////////

  App.Adapter = DS.qboxAdapter.create({
    url: config.strict_endpoint || [config.endpoint, config.index_name, config.type_name].join('/'),
    setTotalHitCount: function(totalHitCount) {
      //if (Ember.ENV.DEBUG) console.debug('App.Adapter.setTotalHitCount: ', totalHitCount);
      App.ResultParams.totalHitCount = totalHitCount;
      if(App.DocumentsControllerInstance)
        App.DocumentsControllerInstance.set('totalHitCount', App.ResultParams.totalHitCount);
      else if (Ember.ENV.DEBUG) console.debug('App.Adapter; App.DocumentsControllerInstance not set');
    }
  });


  // model ///////////////////////////

  App.Store = DS.Store.extend({
    revision: 12,
    adapter: 'App.Adapter'
  });

  App.Document = DS.Model.extend(config.model_base);

  App.Document.reopenClass({
    url: config.type_name
  });


  // routes ///////////////////////////

  App.Router.map(function(match){
    this.resource('documents', { path: "/" }, function() {
      this.resource('document', { path: ':document_id' });
    });
  });

  
  // application ///////////////////////////

  App.ApplicationRoute = Em.Route.extend({
    renderTemplate: function(controller, model) {
      this.render();
    }
  });

  App.ApplicationView = Ember.View.extend({
    endpoint: config.endpoint,
    index_name: config.index_name,
    type_name: config.type_name,

    keyUp : function(e){
      // search on input enter
      if(e.which == 13){
        this.get("controller").send("search");
      }
    }
  });

  App.ApplicationController = Ember.Controller.extend({
    q : "",

    reset : function(){
      if (Ember.ENV.DEBUG) console.debug("App.ApplicationController.reset");
      this.set('q', '');
      App.SearchParams = {
        from: 0,
        size: App.DefaultResultSize
      };
      App.DocumentsControllerInstance.set('sortBy', null);
      App.DocumentsControllerInstance.set('perPage', App.DefaultResultSize);
      App.DocumentsControllerInstance.set('currentPage', 1);
      this.transitionToRoute('documents');
    },

    search : function(){
      var term = this.get('q');
      if(!term) return this.docListAll();
      if (Ember.ENV.DEBUG) console.debug("App.ApplicationController.search, q: '" + term + "'");
      App.SearchParams.query = { query_string: { query: term } };
      App.DocumentsControllerInstance.set('currentPage', 1);
    },

    
  });


  //// document ////////////////////////

  App.DocumentController = Ember.ObjectController.extend({
    close: function(){
      this.transitionToRoute('documents');
    }
  });
  

  // documents ///////////////////////////

  App.DocumentsRoute = Ember.Route.extend({
    setupController: function(controller, model) {
      if(config.default_sort_property != undefined && config.default_sort_property){
        App.DocumentsControllerInstance.sortByProperty(config.default_sort_property, config.default_sort_direction);
      }
      else App.DocumentsControllerInstance.getData();
    }
  });

  App.DocumentsControllerInstance = null;

  // Declare the controller and instantiate the pageable ArrayController, 
  //  with customizations for server-side processing
  App.DocumentsController = Ember.Controller.extend({
    documents: Ember.ArrayController.createWithMixins(VG.Mixins.Pageable, {

      init: function(){
        if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.init');
        App.DocumentsControllerInstance = this;
      },

      getData: function(){
        this.set('data', App.Document.find(App.SearchParams));
      },

      perPage: function(key, value) {
        // getter
        if (arguments.length === 1) {
          return App.SearchParams.size;

        // setter
        } else {
          if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.perPage; set to: ', value);
          if(value && value != App.SearchParams.size && value <= 500){
            App.SearchParams.size = value;
            // setting currentPage will trigger a request; no need to update data directly
            this.set('currentPage', 1);
          } 
          return value;
        }
      }.property(),

      totalHitCount: function(key, value) {
        // getter
        if (arguments.length === 1) {
          return App.ResultParams.totalHitCount;

        // setter
        } else {
          if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.totalHitCount; set to: ', value);
          App.ResultParams.totalHitCount = value;
          return value;
        }
      }.property(),

      formatted_totalHitCount: function() {
        return this.get('totalHitCount').toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }.property('totalHitCount'),

      content: function () {
        return this.data;
      }.property('data'),

      totalPages: function () {
        var pages = Math.ceil(this.get('totalHitCount') / this.get('perPage'));
        if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.totalPages: ', pages);
        return pages;
      }.property('totalHitCount', 'perPage'),

      currentPage: function(key, value) {
        // getter
        if (arguments.length === 1) {
          return Math.floor(App.SearchParams.from / this.get('perPage')) + 1;

        // setter
        } else {
          if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.currentPage; set to: ', value);
          App.SearchParams.from = (value - 1) * this.get('perPage');
          this.getData();
          return value;
        }
      }.property(),

      sortByProperty: function (property, direction) {

        if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.sortByProperty: ', property, direction);

        if (direction === undefined || !direction) {
          if (this.get('sortBy') === property && this.get('sortDirection') === 'ascending') {
            direction = 'descending';
          }
          else {
            direction = 'ascending';
          }
        }

        App.SearchParams.sort = {};
        App.SearchParams.sort[property + ".sortable"] = (direction == 'descending') ? "desc" : "asc";

        this.set('sortBy', property);
        this.set('sortDirection', direction);
        this.set('currentPage', 1);
      },

      details: function(doc) {
        if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.details: ', doc);
      }

    })
  });


  // Declare the pagination view and set the number of pages to show to 10
  App.PaginationView = VG.Views.Pagination.extend({
    numberOfPages: 10
  });

  App.TableHeaderView = VG.Views.TableHeader.extend({
    template: Ember.Handlebars.compile('{{#if view.isCurrent}}<i {{bindAttr class="view.isAscending:icon-chevron-up view.isDescending:icon-chevron-down"}}></i>{{/if}}{{view.text}}')
  });

  // this allows passing attributes through to the input element
  App.TextField = Ember.TextField.extend({
      attributeBindings: ['name']
  });

});
//}).call(this);

