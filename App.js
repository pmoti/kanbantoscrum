            Ext.define('CustomApp', {
                extend: 'Rally.app.App',
                componentCls: 'app',

                launch: function() {
				
					console.log("Our first App");
					var updateSchedulState = false; 
					var recordsToUpdate;
					
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
				
				_onDataLoaded: function(storyStore, storyData, featureStore, featureData) {
                    var records = [];
					var recordMap = {};
					
                    Ext.Array.each(storyData, function(record) {
                        //Perform custom actions with the data here
                        //Calculations, etc.
						var initiativeName = "";
						console.log(record);
						var feature = record.get('Feature');
						if (feature) {
							feature = featureStore.findRecord('FormattedID', feature.FormattedID);
							if (feature) {
								if (feature.data.Parent) {
									initiativeName = feature.data.Parent.Name;
								}
								var id = feature.data.FormattedID;
								var name = feature.data.Name;
								var project = (feature.data.Project)?feature.data.Project.Name:"";
								var state = (feature.data.State)?feature.data.State.Name:"";
								
								console.log("Feature ", feature);
								if (recordMap.hasOwnProperty(id)) {
									val = recordMap[id];
									val.StoryCount++;
									val.CompletedStories += (kanbanState=="Accepted")?1:0;
									
									val.PctDoneStoryCount = (val.CompletedStories/val.StoryCount * 100).toFixed(0);
									
								} else {
									kanbanState = record.get('c_KanbanStateCE');
									
									var completedStories = (kanbanState=="Accepted")?1:0;
									var pctComplete = completedStories * 100;
									var customrec = {
										FeatureId: id,
										Name: name,
										PctDoneStoryCount: pctComplete,
										InitiativeName: initiativeName,
										Project: project,
										State: state,
										StoryCount: 1,
										CompletedStories: completedStories
									};
									recordMap[id] = customrec;
									records.push(customrec);
								}
							}
							
							
						}
						
						
						if (this.updateScheduleState) {
							this._updateScheduleState(record);
							storyStore.sync({
								success: function(batch, options) {
									console.log("Success!");
								},
								failure: function(batch, options) {
									console.log("Success!");
								}
							});				
						}
						
						/*customrec = {
							FormattedID: record.get('FormattedID'),
                            ScheduleState: record.get('ScheduleState'),
							c_KanbanStateCE: record.get('c_KanbanStateCE'),
                            Name: record.get('Name'),
							Feature: featureName,
							Initiative: initiativeName,
                            Tasks: record.get('Tasks').length,
                            Defects: record.get('Defects').length,
							Notes: record.get('Notes')
                        }*/
						
                        /*records.push({
							FormattedID: record.get('FormattedID'),
                            ScheduleState: record.get('ScheduleState'),
							c_KanbanStateCE: record.get('c_KanbanStateCE'),
                            Name: record.get('Name'),
							Feature: featureName,
							Initiative: initiativeName,
                            Tasks: record.get('Tasks').length,
                            Defects: record.get('Defects').length,
							Notes: record.get('Notes')
                        });*/
						
						
                    });
					
					this._loadGrid(records,storyData.length);
					
				},
				
				_updateScheduleState: function(record) {
					var kanbanToScrum = [];
					kanbanToScrum.None = 'Needs Definition';
					kanbanToScrum.Defined = 'Defined';
					kanbanToScrum['Analysis/Design'] = 'In-Progress';
					kanbanToScrum['Design verified'] =  'In-Progress';
					kanbanToScrum.Coding =  'In-Progress';
					kanbanToScrum.Done =  'Completed';
					kanbanToScrum.Accepted =  'Accepted';
					
					console.log(kanbanToScrum);
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
				},
			
				_loadGrid: function(records, length) {
						console.log("Records: ", records);
				        this.add({
                        xtype: 'rallygrid',
                        store: Ext.create('Rally.data.custom.Store', {
                            data: records,
							pageSize: length
                        }),
						columnCfgs: [
							{
								text: 'ID', dataIndex: 'FeatureId'
							},
							{
								text: 'Name', dataIndex: 'Name'
							},
							{
								text: '% Done by Story Count', dataIndex: 'PctDoneStoryCount'
							},
							{
								text: '% Done by Plan Estimate', dataIndex: 'PctDoneStoryCount'
							},
							{
								text: 'Parent', dataIndex: 'InitiativeName'
							},
							{
								text: 'Project', dataIndex: 'Project'
							},
							{
								text: 'State', dataIndex: 'State'
							},
							{
								text: 'Stories', dataIndex: 'StoryCount'
							}
                        /*columnCfgs: [
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
							}*/
                        ]
                    });

				}
			
			});