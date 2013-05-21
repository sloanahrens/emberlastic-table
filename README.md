### Qbox.io pageable table demo

- This demo uses a [Qbox.io](http://qbox.io) search index populated with a million records. [see it [live](http://qbox.io/demos/table)]
- Pagination, sorting and searching are all performed server-side by [Elasticsearch](http://www.elasticsearch.org).
- The UI is constructed with [Ember.js](http://emberjs.com) and [Bootstrap](http://twitter.github.io/bootstrap).
- Some of the code was adapted from this [project](https://github.com/VisualGuruz/emberjs-pageable).

### Dependencies (included)

- jQuery v1.9.1
- Bootstrap v2.3.1
- Handlebars v1.0.0-rc.3
- Ember v1.0.0-rc.3
- Ember Data Revision 12 (careful, [Ember Data](https://github.com/emberjs/data) is changing quickly so newer versions may or may not break this demo)
- Ember Pageable, from [VisualGuruz](https://github.com/VisualGuruz/emberjs-pageable)
- qbox-adapter.js - this makes Ember Data talk to Elasticsearch; it was modified from the Ember Data REST adapter
- qbox-table-config.js - this is where all the configuration data is stored; modify this to use your index data
- qbox-table.js - the core code that sets up the Ember application


### To use as-is
- Just clone this repository and open index.html. :)

### To use with your elasticsearch endpoint
Open qbox-table-config.js and look at the first few lines: 

```javascript
window.qbox_table_config = {
  // replace the next three lines with the information for your elasticsearch endpoint:
  endpoint: 'http://api.qbox.io/hnbiojicnyvmqlqf',
  index_name: 'people',
  type_name : 'person',
.
.
.
}
```
Replace these details with your endpoint, index name and type name to form the base search URL for your elasticsearch index.

The `representative_document` is there simply to show how the `model_base` object was constructed. 

```javascript
window.qbox_table_config = {
.
.
.
  // this object is only here as a reference, and was used to construct the model_base below
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
.
.
.
}
```

`representative_document` is not used in the code anywhere and can be safely discarded, or replaced with a representative document from your data for reference.

`model_base` is used by Ember to construct the model. 

```javascript
window.qbox_table_config = {
.
.
.
  // replace the properties of this object with the relevant details for your index
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
.
.
.
}
```
Modify this object to reflect the structure of the documents in your index (perhaps by using your own `representative_document`).

After you modify the index and `model_base` you will need to modify the templates to reflect your data structure. For example, in `table_template`, 

```javascript
{{view App.TableHeaderView text="First Name" propertyName="first_name" controllerBinding="documents"}}\
```

and

```javascript
<td>{{doc.first_name}}</td>\
```

will no longer be relevant if your data does not have a field called `first_name`, and so on.

All the magic happens in `qbox-table.js`. Next we'll dig into how it works. Stay tuned. :)

### Coming soon

- further documentation
- Faceting