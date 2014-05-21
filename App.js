            Ext.define('CustomApp', {
                extend: 'Rally.app.App',
                componentCls: 'app',

                launch: function() {
				
					console.log("Our first App");
										
					var store = Ext.create('Rally.data.wsapi.Store', {
						model: 'User Story',
						autoLoad: true,
						fetch: ['FormattedID', 'Name', 'ScheduleState', 'c_KanbanStateCE', 'Project', 'Feature', 'Release'],
						filters: [
							{
							property: 'Project.Name',
							operator: '=',
							value: 'CE Kanban'
							}/*,
							{
							property: 'Release.Name',
							operator: '=',
							value: '14Q2'
							}*/
						],
						listeners: {
							load: function(myStore, myData, success) {
								console.log("Got Data!", success);	
								
								console.log("MY Store", myStore);
								
								console.log("My Data", myData);
								
								this._loadInitiativeStore(myStore, myData);

							},
							scope: this
						}
					});					
				},
				
				_loadInitiativeStore: function(storyStore, storyData) {
					var featidfilters = Ext.create('Rally.data.wsapi.Filter', { property: 'FormattedID', operator: '=', value: '0'});
					Ext.Array.each(storyData, function(story) {
                        //Perform custom actions with the data here
                        //Calculations, etc.
						feature = story.get('Feature');
						if (feature) {
							featidfilters = featidfilters.or(Ext.create('Rally.data.wsapi.Filter', { property: 'FormattedID', operator: '=', value: feature.FormattedID}));						
						}
                    });
					
					var featureStore = Ext.create('Rally.data.wsapi.Store', {
                        model: 'PortfolioItem/Feature',
                        autoLoad: true,
						filters: featidfilters,
                        listeners: {
                            load: function(featureStore, featureData, success) {
								this._onDataLoaded(storyStore, storyData, featureStore, featureData);
							}, 
                            scope: this
                        }
                    });
				},

				/*_loadGrid: function(myStore, fieldConfig)	 {
					var myGrid = Ext.create('Rally.ui.grid.Grid', {
						store: myStore,
						columnCfgs: [
							'FormattedID',fieldConfig.dataIndex, 'Feature', 'Project', 'Release', 'Name'
						]
					});
					
					console.log('my grid', myGrid);	
					this.add(myGrid);
				},	*/
				
				_onDataLoaded: function(storyStore, storyData, featureStore, featureData) {
                    var records = [];
					var kanbanToScrum = [];
					kanbanToScrum.None = 'Needs Definition';
					kanbanToScrum['Defined'] = 'Defined';
					kanbanToScrum['Analysis/Design'] = 'In-Progress';
					kanbanToScrum['Design verified'] =  'In-Progress';
					kanbanToScrum['Coding'] =  'In-Progress';
					kanbanToScrum['Done'] =  'Completed';
					kanbanToScrum['Accepted'] =  'Accepted';
					
					console.log(kanbanToScrum);
                    Ext.Array.each(storyData, function(record) {
                        //Perform custom actions with the data here
                        //Calculations, etc.
						var initiativeName = "";
						var featureName = "";
						console.log(record);
						feature = record.get('Feature');
						if (feature) {
							featureId = record.get('Feature').FormattedID;
							featureName = feature.Name;
							feature = featureStore.query('FormattedID', featureId);
							
							if (feature.get(0) && feature.get(0).data.Parent) {
								initiativeName = feature.get(0).data.Parent.Name;
							}
						}
						
						if (record.get('c_KanbanStateCE')) {
							newSchedState = kanbanToScrum[record.get('c_KanbanStateCE')];
							if (newSchedState != record.get('ScheduleState')) {
								record.beginEdit();
								record.set('ScheduleState', newSchedState);	
								record.set('Notes', newSchedState);	

								record.endEdit();
								//record.commit();
								record.save({
									callback: function(records,operation,success) {
										console.log("Records: ", records);
										console.log("Operation: ", operation);
										console.log("Success: ", success);
									}
								});
								console.log('Story: ', record.get('Name'), ' State:', record.get('c_KanbanStateCE'),  ' : ', newSchedState, record.get('ScheduleState'));
							}
						}				
                        records.push({
							FormattedID: record.get('FormattedID'),
                            ScheduleState: record.get('ScheduleState'),
							c_KanbanStateCE: record.get('c_KanbanStateCE'),
                            Name: record.get('Name'),
							Feature: featureName,
							Initiative: initiativeName,
                            Tasks: record.get('Tasks').length,
                            Defects: record.get('Defects').length,
							Notes: record.get('Notes')
                        });
                    });
					
					storyStore.sync({
						success: function(batch, options) {
							console.log("Success!");
						},
						failure: function(batch, options) {
							console.log("Success!");
						}
					});
					/*Rally.data.BulkRecordUpdater.updateRecords( {
						records: updateStateStories,
						propertiesToUpdate: {
							Notes: kanbanToScrum[
						},
						success: function(readOnlyRecords) {
							console.log("Could Not Update: ", readOnlyRecords);
						}
						scope: this
					});*/
						
						
						
                    this.add({
                        xtype: 'rallygrid',
                        store: Ext.create('Rally.data.custom.Store', {
                            data: records,
							pageSize: storyData.length
                        }),
                        columnCfgs: [
							{
								text: 'FormattedID', dataIndex: 'FormattedID'
							},
                            {
                                text: 'Name', dataIndex: 'Name', flex: 1
                            },
							{
								text: 'Feature', dataIndex: 'Feature'
							},
							{
								text: 'Initiative', dataIndex: 'Initiative'
							},
							{
								text: 'KanbanState', dataIndex: 'c_KanbanStateCE'
							},
                            {
                                text: 'Schedule State', dataIndex: 'ScheduleState'
                            },
                            {
                                text: 'Tasks', dataIndex: 'Tasks'
                            },
                            {
                                text: 'Defects', dataIndex: 'Defects'
                            },
							{
								text: 'Notes', dataIndex: 'Notes'
							}
                        ]
                    });
				
			
				}
			});