(function() {

  // config ///////////////////////////

  // shows some feedback from qbox-adapter
  Ember.ENV.DEBUG = true;

  var config = window.qbox_table_config;

  // make sure config object exists
  if(!config) {
    console.error('qbox_table_config object not found. qbox-table-config.js must be loaded before qbox-table.js. See qbox docs for more information.');
    return;
  }

  // a little feedback
  console.debug(
    Handlebars.compile(
      "qbox_table_config object found. Index name is '{{index_name}}'. Type name is '{{type_name}}'.")
    ({
      index_name : config.index_name, 
      type_name : config.type_name
    })
  );

  //////////////////////////////////////////////////////


  // template integration ///////////////////////////

  Ember.TEMPLATES['application'] = Ember.Handlebars.compile(config.app_template);

  Ember.TEMPLATES['documents'] = Ember.Handlebars.compile(config.table_template);

  

  //////////////////////////////////////////////////////


  // app definition ///////////////////////////

  App = Ember.Application.create({
    // // create ember app in the right element
     rootElement: '#ember_app_container'
    //LOG_TRANSITIONS: true
  });

  //////////////////////////////////////////////////////

    // application ///////////////////////////

  App.ApplicationRoute = Em.Route.extend({
    renderTemplate: function(controller, model) {
      this.render();
      // return this.render('nav/nav', {
      //   into: 'application',
      //   outlet: 'nav'
      // });
    }
  });

  App.ApplicationView = Ember.View.extend({
    endpoint: config.endpoint,
    index_name: config.index_name,
    type_name: config.type_name
  });

  App.ApplicationController = Ember.Controller.extend({
    q : "",

    docListAll : function(){
      if (Ember.ENV.DEBUG) console.debug("docListAll");
      delete App.SearchParams.query;
      this.set('q', '');
      App.DocumentsControllerInstance.set('currentPage', 1);
    },

    search : function(){
      var term = this.get('q');
      if(!term) return this.docListAll();
      if (Ember.ENV.DEBUG) console.debug("search, q: '" + term + "'");
      App.SearchParams.query = { query_string: { query: term } };
      App.DocumentsControllerInstance.set('currentPage', 1);
    }
  });

  App.SearchParams = {
    from: 0,
    size: 20
  };

  App.ResultParams = {
    totalHitCount: 0
  };

  /////////////////////////////////

  // adapter ///////////////////////////

  // QBOX Adapter
  App.Adapter = DS.QBOXAdapter.create({
    url: [config.endpoint, config.index_name, config.type_name].join('/'),
    setTotalHitCount: function(totalHitCount) {
      //if (Ember.ENV.DEBUG) console.debug('App.Adapter.setTotalHitCount: ', totalHitCount);
      App.ResultParams.totalHitCount = totalHitCount;
      if(App.DocumentsControllerInstance)
        App.DocumentsControllerInstance.set('totalHitCount', App.ResultParams.totalHitCount);
      else if (Ember.ENV.DEBUG) console.debug('App.Adapter; App.DocumentsControllerInstance not set');
    }
  });

  //////////////////////////////////////////////////////

  // model ///////////////////////////

  // use Ember Data
  App.Store = DS.Store.extend({
    revision: 12,
    adapter: 'App.Adapter'
  });

  App.Document = DS.Model.extend(config.model_base);

  //App.Document.reopenClass(config.model_extended);

  App.Document.reopenClass({
    url: config.type_name
  });

  //////////////////////////////////////////////////////



  ////////////////////////////

  // Map out the route
  App.Router.map(function(match){
    this.route('documents', { path: "/" });
  });

  // Declare the route
  App.DocumentsRoute = Ember.Route.extend({
    setupController: function(controller, model) {
      controller.set('documents.data', App.Document.find(App.SearchParams));
    }
  });

  App.DocumentsControllerInstance = null;

  // Declare the controller and instantiate the pageable ArrayController with customizations
  App.DocumentsController = Ember.Controller.extend({
    documents: Ember.ArrayController.createWithMixins(VG.Mixins.Pageable, {

      init: function(){
        App.DocumentsControllerInstance = this;
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
        //if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.content data: ', this.get('data'));
        return this.data;
      }.property('currentPage', 'data'),

      totalPages: function () {
        var pages = Math.ceil(this.get('totalHitCount') / this.get('perPage'));
        if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.totalPages: ', pages);
        return pages;
      }.property('totalHitCount', 'perPage'),

      currentPage: function(key, value) {
        // getter
        if (arguments.length === 1) {
          var page = Math.floor(App.SearchParams.from / this.get('perPage')) + 1;
          //if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.currentPage: ', page);
          return page;

        // setter
        } else {
          if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.currentPage; set to: ', value);
          var newFrom = (value - 1) * this.get('perPage');
          if(newFrom != App.ResultParams.from){
            App.SearchParams.from = newFrom;
            this.set('data', App.Document.find(App.SearchParams));
          } 
          return value;
        }
      }.property(),

      sortByProperty: function (property, direction) {

        if (Ember.ENV.DEBUG) console.debug('App.DocumentsController.sortByProperty: ', property, direction);

        if (direction === undefined) {
          App.SearchParams.sort = {};
          if (this.get('sortBy') === property && this.get('sortDirection') === 'ascending') {
            direction = 'descending';
            App.SearchParams.sort[property + ".sortable"] = "desc";
          }
          else {
            direction = 'ascending';
            App.SearchParams.sort[property + ".sortable"] = "asc";
          }
        }

        this.set('sortBy', property);

        this.set('sortDirection', direction);

        this.set('currentPage', 1);
      }

    })
  });


  // Declare the pagination view and set the number of pages to show to 15
  App.PaginationView = VG.Views.Pagination.extend({
    numberOfPages: 10
  });

  App.TableHeaderView = VG.Views.TableHeader.extend({
    template: Ember.Handlebars.compile('{{#if view.isCurrent}}<i {{bindAttr class="view.isAscending:icon-chevron-up view.isDescending:icon-chevron-down"}}></i>{{/if}}{{view.text}}')
  });

  // utility ///////////////////////////

  // this allows passing attributes through to the input element
  App.TextField = Ember.TextField.extend({
      attributeBindings: ['name']
  });

  //////////////////////////////////////////////////////





}).call(this);




