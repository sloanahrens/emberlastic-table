
window.qbox_table_config = {
  endpoint: 'http://api.qbox.io/mqlewrfa',
  index_name: 'people',
  type_name : 'person',

  model_base: {
    first_name: DS.attr('string'),
    last_name: DS.attr('string'),
    email: DS.attr('string'),
    street_address: DS.attr('string'),
    city: DS.attr('string'),
    state: DS.attr('string'),
    zip: DS.attr('string'),
    phone: DS.attr('string'),
    job_title: DS.attr('string'),
    company: DS.attr('string'),
    company_motto: DS.attr('string'),
    formal_motto: function(){
      var motto = this.get('company_motto');
      return motto.charAt(0).toUpperCase() + motto.slice(1) + '.';
    }.property()
  },

  representative_document: {
    "username":"thalia.auer", 
    "first_name":"Thora", 
    "last_name":"Hills", 
    "email":"lolita@erdman.com", 
    "ip_address":"145.64.234.161", 
    "company":"Huels, Hudson and Senger", 
    "company_motto":"facilitate cutting-edge schemas", 
    "job_title":"Corporate Directives Engineer", 
    "company_domain":"fay.net", 
    "phone":"(534)099-2109 x64852", 
    "street_address":"980 Dare Junction", 
    "city":"Lake Mervinfort", 
    "state":"Arkansas", 
    "country":"Heard Island and McDonald Islands", 
    "zip":"41367-3442", 
    "latitude":"24.08135649253721", 
    "longitude":"-60.05041137975341"
  },

  app_template : '\
    <div class="row">\
      <div class="span12">\
        <h3>qbox.io pageable table demo</h3>\
        <div class=" hero-unit less-pad">\
          This demo uses a <a target="_blank" href="http://qbox.io">qbox.io</a> search index populated with a million records.<br>\
          Pagination, sorting and searching are all performed server-side by <a target="_blank" href="http://www.elasticsearch.org">Elasticsearch</a>.<br>\
          The UI is constructed with <a target="_blank" href="http://emberjs.com">Ember</a> \
          and <a target="_blank" href="http://twitter.github.io/bootstrap/">Bootstrap</a> \
          and is available on <a target="_blank" href="https://github.com/StackSearchInc/ember-pageable-elasticsearch">GitHub</a>.\
        </div>\
        <h4>Hosted Elasticsearch Endpoint: <span class="text-warning" id="endpoint">{{view.endpoint}}/{{view.index_name}}/{{view.type_name}}</span></h4>\
        <hr>\
      </div>\
    </div>\
    <div class="row">\
      <div class="span12 search-actions">\
        <div class="pull-left">\
          <button {{action "reset"}} class="btn">Reset</button>\
        </div>\
        <div class="pull-right">\
          {{view App.TextField valueBinding="q" placeholder="search for"}}\
          <button {{action "search"}} class="btn">Search</button>\
        </div>\
      </div>\
    </div>\
    {{outlet}}\
  ',

  table_template : '\
    <div class="row">\
      <div class="span12">\
        <hr>\
        {{outlet}}\
      </div>\
    </div>\
    <div class="row">\
      <div class="span3 results-count">\
        <h4> <span class="text-warning">{{documents.formatted_totalHitCount}} </span><strong>results</strong></h4>\
      </div>\
      <div class="span2 per-page-input">\
        {{view App.TextField valueBinding="documents.perPage" placeholder="per page"}}\ <strong>per page</strong>\
      </div>\
      {{view App.PaginationView controllerBinding="documents" classNames="span7"}}\
    </div>\
    <div class="row">\
      <div class="span12">\
        <table class="table table-striped table-bordered table-condensed">\
          <thead>\
            <tr>\
              {{view App.TableHeaderView text="First Name" propertyName="first_name" controllerBinding="documents"}}\
              {{view App.TableHeaderView text="Last Name" propertyName="last_name" controllerBinding="documents"}}\
              {{view App.TableHeaderView text="Email" propertyName="email" controllerBinding="documents"}}\
              {{view App.TableHeaderView text="State" propertyName="state" controllerBinding="documents"}}\
              {{view App.TableHeaderView text="Company" propertyName="company" controllerBinding="documents"}}\
              <th></th>\
            </tr>\
          </thead>\
          <tbody>\
            {{#each doc in documents}}\
              <tr>\
                <td>{{doc.first_name}}</td>\
                <td>{{doc.last_name}}</td>\
                <td>{{doc.email}}</td>\
                <td>{{doc.state}}</td>\
                <td>{{doc.company}}</td>\
                <td>{{#linkTo "document" doc}}more{{/linkTo}}</td>\
              </tr>\
            {{/each}}\
          </tbody>\
        </table>\
      </div>\
    </div>\
    <div class="row">\
      {{view App.PaginationView controllerBinding="documents" classNames="span12"}}\
    </div>\
  ',

  details_template: '\
    <div class=" hero-unit less-pad">\
      <div class="row">\
        <div class="pull-left">\
          <div class="span3">\
            <div><strong>{{first_name}} {{last_name}}</strong></div>\
            <div>{{street_address}}</div>\
            <div>{{city}}, {{state}}</div>\
            <div>{{zip}}</div>\
          </div>\
          <div class="span4">\
            <div><strong>{{job_title}}</strong></div>\
            <div><strong>Company: </strong>{{company}}</div>\
            <div><strong>Phone: </strong>{{phone}}</div>\
            <div><strong>Email: </strong>{{email}}</div>\
          </div>\
          <div class="span4">\
            <div><strong>Motto: </strong></div>\
            <h4>{{formal_motto}}</h4>\
          </div>\
        </div>\
        <div class="pull-right">\
          <button {{action "close"}} class="btn btn-small pull-right" title="Close">\
          <large>&times</large>\
          </button>\
        </div>\
      </div>\
    </div>\
  '

};