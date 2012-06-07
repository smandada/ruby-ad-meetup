Ext.Loader.setConfig({enabled:true});

var RT = { // Define a namespace for random extra things
}

Ext.application({
  name: 'RT',

  launch: function() {

    var myStore = Ext.create('Ext.data.Store', {
      storeId: 'node_store',
      fields: [{name: 'name', type: 'string'}, {name: 'value', type: 'float', persist: false}],
      proxy: {
        type: 'ajax',
        url: '/data/maingrid.json',
        reader: Ext.create('Ext.data.reader.Json',{
          type: 'json',
          root: 'the_data'
        })
      },
      listeners: {
        load: function() {
          var me = this
          if (this.socket) {
            this.emitTrack()
          } else {
            this.socket = io.connect('/',{
              'force new connection': true
            });
            this.socket.on('connect',function() {
              me.emitTrack()
            });
            this.socket.on('error',function(e) {
              me.onError(e)
            });

            // Handle the stats callback
            this.socket.on('rtstats',function(data) {
              data.success ? me.onStats(data) : me.onError(data);
              me.fireEvent('loaded',me);
            });
          }
        }
      },
      emitTrack: function() {
        this.socket.emit('track',{})
      },
      onStats: function(data) {
        var me = this
        data.dat.forEach(function(d){
          me.each(function(rec){
            if (rec.get('name') == d.name) {
              rec.set('value',d.value)
            }
          })
        })
      },
      onError: function(e) {
        console.log('error:')
        console.log(e)
      },
      autoLoad: true
    })

    RT.grid = Ext.create('Ext.grid.Panel',{
      title: 'Data Grid',
      store: myStore,
      columns: [
        {text: 'Name', dataIndex: 'name', width: 150},
        {text: 'Value', dataIndex: 'value', xtype: 'numbercolumn', format: '0.00', width: 90, align: 'right'}
      ],
      root: 'the_data'
    })

    Ext.create('Ext.container.Viewport', {
      layout: 'fit',
      items: [ RT.grid ]
    });

    console.log('launched application')

  }
});
