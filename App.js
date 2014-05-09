            Ext.define('CustomApp', {
                extend: 'Rally.app.App',
                componentCls: 'app',

                launch: function() {
					console.log("Our first App");
					var myFilters = [Ext.create('Rally.data.QueryFilter', {
						property: 'Project',
						operator: '=',
						value: 'CareEngine'
						})];
					
					var store = Ext.create('Rally.data.wsapi.Store', {
						model: 'User Story',
						autoLoad: true,
						listeners: {
							load: function(myStore, myData, success) {
								console.log("Got Data!", success);	
								
								console.log("MY Store", myStore);
								
								console.log("My Data", myData);

								var myGrid = Ext.create('Rally.ui.grid.Grid', {
									store: myStore,
									columnCfgs: [
										'FormattedID', 'c_KanbanStatus', 'c_KanbanStateCE', 'c_KanbanStateCEL2', 'Name'
									]
								});
								
								console.log('my grid', myGrid);	
								this.add(myGrid);
							},
							scope: this
						},
						fetch: ['FormattedID', 'Name', 'ScheduleState', 'c_KanbanStateCE', 'c_KanbanStateCEL2', 'c_KanbanStatus'],
						//filters: myFilters
					});
				}
            });	