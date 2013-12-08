//miniGrid
//http://jsfiddle.net/zS7Ny/
;(function ( $, window, document, undefined ) {

  	// Set the default options 
	var pluginName = "miniGrid",
		defaults = {
			width	: '500px',
	        height 	: '700px',
	        gridName: 'miniGrid',
	        data    : {},
		};
	var modes = {"UNIVERSAL": 0, "ROW": 1 , "EDIT": 2};
	var RENDER_ALL_COL = "all";
	var currentMode;
	var editable_cols;
	var hidden_cols;
   var checkbox_col = 1;
	
	var keyCodes = {"0":"48","1":"49","2":"50","3":"51","4":"52","5":"53","6":"54","7":"55","8":"56","9":"57","\\":"220","backspace":"8","tab":"9","num":"63289","enter":"13","shift":"16","ctrl":"57392","alt":"18","pause":"19","caps":"20","escape":"27","space":"32","pageup":"33","pagedown":"34","end":"35","home":"36","left":"37","up":"38","right":"39","down":"40","print":"124","insert":"45","delete":"46","a":"65","b":"66","c":"67","d":"68","e":"69","f":"70","g":"71","h":"72","i":"73","j":"74","k":"75","l":"76","m":"77","n":"78",
	"o":"79","p":"80","q":"81","r":"82","s":"83","t":"84","u":"85","v":"86","w":"87","x":"88","y":"89","z":"90","cmd":"224","num_0":"96","num_1":"97","num_2":"98","num_3":"99","num_4":"100","num_5":"101","num_6":"102","num_7":"103","num_8":"104","num_9":"105","num_multiply":"106","num_add":"107","num_enter":"108","num_subtract":"109","num_decimal":"110","num_divide":"111","scroll":"145",";":"186","=":"187",",":"188","-":"189",".":"190","/":"191","`":"223","[":"219","]":"221","'":"222"} ;
	

	//accept data in json format
	var internal_data,
		data,
		tstate = {
			focus_row	: null,	 	//row currently focussed 
			sel_rows	: [], 		//rows selected
			edit_row	: null,
			edit_col 	: null
		},
		table,
		table_plugin,
		col_to_id_table;

	//functions that could be binded externally
	var binded_events = {
		onCellSelect: function(rowid, iCol){},
	    ondblClickRow: function(rowid,iCol) {},
	 	onOutsideClick: function(){},
	 	onEdit: function(){},
	 	onModeChange: function(mode){},
	 	onDoneEdit: function(){},
	}

	//priate methods
	var methods = {
		//bind row events such as mouseover row or click on row. Handles logic for selecting/deselecting checkboxes
		bindRowEvent: function(rowid){

			var row_selector = 'tr';
			if(rowid){
				row_selector+= "#"+rowid;
			}

			$(table).find(row_selector).on('click', function(e){
            if(this.id == 'theader'){
               methods['changeMode'](modes.ROW);
               return;
            }
				var rowid = parseInt(this.id),
					 colid = $(e.target).closest('td').index(),
                target_role = e.target.getAttribute('role');

				//if clicking on the input cell itself
				if(target_role == 'edit_data'){
					return false;
				}

				//if click on the cell that is editable
				if(target_role == 'gridcell' && $.inArray(colid-1, editable_cols)!=-1){
					//if we came from another edit, save the other one
					if(currentMode == modes.EDIT){
						methods['editCell'](tstate.edit_row, tstate.edit_col, false);
					}
					//open the new edit box
					methods['editCell'](rowid,colid, true);
				}else{
            //if click on a cell that is not editable

               //if click on the checkbox cell but not the checkbox itself, trigger checkbox
               if(target_role == 'gridcell' && colid == checkbox_col){
                  $(this).find('.cbox').click();
               }
					if(currentMode == modes.EDIT){
						methods['editCell'](tstate.edit_row, tstate.edit_col, false);
					}
					methods['changeMode'](modes.ROW);

				}

				//if click directly on the checkbox
				if(target_role == 'checkbox'){
					if(!$(this).find('.cbox').is(':checked')){
						//if already checked, uncheck
						$(this).removeClass('ui-state-highlight').find(".cbox").prop('checked', false);
						//remove it from array
						tstate.sel_rows.splice($.inArray(rowid, tstate.sel_rows), 1);
					}else{
						//if not checked, check the box
						tstate.sel_rows.push(rowid);
						$(this).addClass('ui-state-highlight').find(".cbox").prop('checked', true);
						tstate.focus_row 	= rowid;
					}
				}else if(colid != checkbox_col){
               methods['selectRow'](rowid, this);
            }

				//select the clicked row
				binded_events['onCellSelect'](rowid, colid+1);
            //remove checkall
            $("#checkbox_all").prop('checked', false);

			}).on('dblclick', function(e){
            if(this.id == 'theader'){
               return;
            }
				var rowid = this.id,
					 colid = $(e.target).closest('td').index();

				binded_events['ondblClickRow'](rowid, colid+1);
			});

         //bind checkbox to select all visible rows (check if hasClass hide_row)
         $("#checkbox_all").change(function(){

            if($(this).is(':checked')){
               //remove previously selected rows
               for(var i=0, l = tstate.sel_rows.length; i<l; i++ ){
                  $(table).find("tr#"+tstate.sel_rows[i]).removeClass('ui-state-highlight')
                     .find(".cbox").prop('checked', false);
               }
               tstate.sel_rows = [];

               //select all visible rows
               $("#"+table.id +" tr[role='row']:not(.hide_row)").each(function(key,r){
                  tstate.sel_rows.push(r.id);
                  $(r).addClass('ui-state-highlight').find(".cbox").prop('checked', true);
               });
            }else{
               $("#"+table.id +" tr[role='row']").slice(0, data.length).each(function(key,r){
                  $(r).removeClass('ui-state-highlight').find(".cbox").prop('checked', false);
               });
               tstate.sel_rows = [];
            }
         });
		},
		editCell: function(rowid, colid, editState){
	
			var cell = $(table).find('#'+rowid + " td:nth-child("+(colid+1)+")");	

			//var cell = $(table).find('#'+rowid + " td")[colid];	

			if(editState){
				binded_events['onEdit'](rowid,colid);	
				//open the edit cell
				methods['changeMode'](modes.EDIT);	
				tstate.edit_row = rowid;
				tstate.edit_col = colid;

            var v = cell[0].textContent;

				cell.addClass('editCell').html("<input role='edit_data' type='text' width='98%' value='' />").attr("tabindex", "0");
            cell.find('input').val(v);

				//overwrite keybinding in input box

				cell.find('input').on('keydown', function(e){
					var key = e.charCode || e.keyCode;
					
				    if(key == keyCodes['escape']){
						methods['editCell'](tstate.edit_row, tstate.edit_col, false);
						e.preventDefault();	
					}else if(key == keyCodes['enter']){

						methods['editCell'](tstate.edit_row, tstate.edit_col, false);	
						e.preventDefault();
					}else if(key == keyCodes['tab']){

                   var edit_col = tstate.edit_col,
                       edit_row = tstate.edit_row;

                   methods['editCell'](tstate.edit_row, tstate.edit_col, false);
                   var k = editable_cols.indexOf(edit_col-1); //k should never be -1..
                   if(k == -1){
                      console.log('Something is wrong here..');
                   }
                   if(editable_cols[k+1]){
                      //if there's more input box, go to it
                      methods['editCell'](edit_row, editable_cols[k+1]+1, true);
                   }else{
                      //if not, go to next row
                      if(edit_row < data.length-1){
                         methods['editCell'](edit_row+1, editable_cols[0]+1, true);
                      }
                   }
                   e.preventDefault();
                }
				});

				window.setTimeout(function () {
                    cell.find('input').focus();
                }, 0);
                
			}else{
				//close the edit cell
				var newContent = cell.find("input[role='edit_data']").val();
                cell.text(newContent).removeClass('editCell');
                var col_name = table_plugin.settings.colModel[colid-1].name;
   				//save the changes
   				data[rowid][col_name] 		   = newContent;
   				internal_data[rowid][col_name] = newContent;
   				tstate.edit_row			  = null;
   				tstate.edit_col 		  = null;

   				//trigger done edit method
   				binded_events['onDoneEdit']();
   				methods['changeMode'](modes.ROW);	

			}

		},

		selectRow: function(rowid, rowObj){
			// if multiple rows were selected, remove all of them
			if(tstate.sel_rows.length >0){
				for(var i=0, l = tstate.sel_rows.length; i<l; i++ ){
					$(table).find("tr#"+tstate.sel_rows[i]).removeClass('ui-state-highlight')
						.find(".cbox").prop('checked', false);
				}
			}
			tstate.sel_rows 	= [rowid];
			tstate.focus_row 	= rowid;

			$(table).find('#'+rowid).addClass('ui-state-highlight').find(".cbox").prop('checked', true);

			//assuming if rowObj is not passed, the function is called externally (clicked). So scroll to focus
			if(!rowObj){
				var row = $(table).find("#"+rowid);
				$(table).parent().scrollTop(row[0].offsetTop - ($(table).parent().height()/2) );
			}
		},
		
		//bind event for clicking outside the table
		bindClickOutsideEvent: function(){
			$('body').on('click', function(e) {
			    if($(e.target).closest('#'+table.id).length == 0) {
			    	//close the previous open editcell
			    	methods['exitFromAllMode']();
			    	binded_events['onOutsideClick']();
			    }
			});
		},
		changeMode: function(mode){
			if(currentMode != mode){
				currentMode = mode;
				for(var v in modes){
					if(modes[v] == currentMode){
						binded_events['onModeChange'](v);
						//console.log(v);
						return;
					}
				}
			}
		},
		exitFromAllMode: function(){
			if(currentMode == modes.EDIT){
	    		methods['editCell'](tstate.edit_row, tstate.edit_col, false);
	    	}
			methods['changeMode'](modes.UNIVERSAL);
		},
		dataFormatter: function(col_name, data_row, formatter, table_row){

			if(formatter){
				return formatter(data_row[col_name], data_row, col_name, table_row);
			}
			if(!data_row[col_name]){
				return "";
			}

			return data_row[col_name];
		},
		init_var: function(data_src){
			internal_data = [];
			editable_cols = [];
			hidden_cols   = [];
			tstate.focus_row = null;
			tstate.sel_rows  = [];
			tstate.edit_col  = null;
			tstate.edit_row	 = null;
			data = data_src;
		},
		init_table: function(){
			//find number of actual displaying columns
			var col_setting = table_plugin.settings.colModel;
			var table_header = "";
			col_to_id_table = {};
			table_header += "<td role=columnheader></td>";
			table_header += "<td role='columnheader' style='text-align:center' class='ui-state-default ui-th-column ui-th-ltr'><input id='checkbox_all' role='checkbox' class='cbox' type='checkbox'></td>";
			for(var i=0, col_length = col_setting.length; i<col_length; i++){
				if(!col_setting[i].hidden){
					
					table_header += "<td role='columnheader' style='text-align:center' class='ui-state-default ui-th-column ui-th-ltr'>" 
									+ table_plugin.settings.colNames[i] +"</td>";
		
				}else{
					hidden_cols.push(table_plugin.settings.colNames[i].toLowerCase());
				}
				if(col_setting[i].editable){
					editable_cols.push(i);
				}
				col_to_id_table[table_plugin.settings.colModel[i].name] = i;
			}
			//push the header first
			$(table).find('tbody').append("<tr id='theader'>"+table_header+"</tr>");

         //render row (without cell content)
			for(var i=0, data_length = data.length; i<data_length; i++){
				
				var internal_data_row = {};
				var row = $("<tr role='row' id='"+i+"' class='ui-widget-content ui-row-ltr'>"+
							"<td role='gridcell' class='ui-state-default' style='text-align:center;width:20px;'>"+(i+1)+"</td>"+
						    "<td role='gridcell' style='text-align:center;width:10px; '><input role='checkbox' type='checkbox' class='cbox'></td></tr>");  
				
				//create an empty row first
				for(var j=0, col_length = col_setting.length; j<col_length; j++){
					var col_name = col_setting[j].name;
					internal_data_row[col_name] = "";
					//if not hidden append it to DOM
					if(!col_setting[j].hidden){
						row.append("<td role='gridcell' width='50px' class='"+ table_plugin.settings.gridName +"_"+col_name +"''>");
					}

				}

				//then put in the value, the reason we do this is to render html tags as regular text
				$(table).find('tbody').append(row);
				internal_data.push(internal_data_row);


			}
         //Render Row Data
         var col_names = [];
         for(var c in col_to_id_table) col_names.push(c);
         methods['renderRowData'](0,data.length, RENDER_ALL_COL);

		},
      //render
      renderRowData: function(start_row, end_row, col_names){
         var rowid = start_row;
         if(col_names == RENDER_ALL_COL){
            col_names = [];
            for(key in col_to_id_table){
               col_names.push(key);
            }
         }
         $("#"+table.id +" tr[role='row']").slice(start_row, end_row).each(function(key,r){
            

            for(var i=0, l=col_names.length; i<l; i++){
               var col_name = col_names[i], id = col_to_id_table[col_name];
               var new_value = methods['dataFormatter'](col_names[i], data[rowid], table_plugin.settings.colModel[id].formatter, r);
               internal_data[rowid][col_name] = new_value;
               //update the value to row if the column is not hidden
               if(hidden_cols.indexOf(col_name) ==-1){
                  r.cells[id+1].textContent = internal_data[rowid][col_name] ;
               }
            }
            rowid++;
         });


      },
      countFilter: function(col_name, value){
         var count = 0;
         $("#"+table.id +" tr[role='row']").each(function(rowid,r){
            if(col_name != "all" && internal_data[rowid][col_name] == value){
               count++;
            }
         });

         return count;
      },
	}

	// The actual plugin constructor
	function Plugin ( element, options ) {
			this.element 	= element;
			this.settings 	= $.extend( {}, defaults, options );
			this._defaults 	= defaults;
			this._name		= pluginName;
			table 			= this.element;
			table_plugin	= this;
			this.init();
	}


	Plugin.prototype = {
			init: function () {
				methods['changeMode'](modes.UNIVERSAL);
				methods['init_var'](this.settings.data);
            $(table).addClass('minigrid')
                    .wrap("<div id='minigrid_wrap'></div>")
                    .append("<tbody></tbody>")
                    .find('tbody').css({width: this.settings.width, height: this.settings.height});
            $("#minigrid_wrap").css({width: this.settings.width, height: this.settings.height});
				methods['init_table']();	
				methods['bindRowEvent']();
				methods['bindClickOutsideEvent']();	

			},
			setGridParam : function(param){
				binded_events = $.extend( binded_events, param );
			},

			//reload/update grid data
			reloadData : function(data_src) {
				//reload data on the grid...should be similar to init
				methods['changeMode'](modes.UNIVERSAL);
				methods['init_var'](data_src);
				$(table).html("");
				methods['init_table']();	
				methods['bindRowEvent']();
				methods['bindClickOutsideEvent']();	
			},	
			getSelRow: function(){
				return tstate.focus_row;
			},
			getSelArray: function(){
				return tstate.sel_rows;
			},
			setSelection : function( rowid) {
				
				methods['selectRow'](rowid);
			},
         selectEditText: function(){
            $(table).find(".editCell input").select();
         },
         setHeight: function(height){
            $('#minigrid_wrap').height(height);
         },
			editCell: function(rowid, colid){

				if(currentMode == modes.EDIT){
					methods['editCell'](tstate.edit_row, tstate.edit_col, false);
				}
				//open the new edit box
				methods['editCell'](rowid,colid, true);
			},
			addNewRow: function(rowid, newRowData){
				//change the source data array
				data.splice(rowid,0,newRowData);
				for(var i=data.length-1 ;i>rowid;--i){
		  			++data[i]['rowid'];
		  			++data[i]['id'];
		  		}

		  		var internal_data_row = {};
		  		var row = $("<tr role='row' id='"+rowid+"' class='ui-widget-content ui-row-ltr'>"+
								"<td role='gridcell' class='ui-state-default' style='text-align:center;'>"+(rowid+1)+"</td>"+
							    "<td role='gridcell' style='text-align:center'><input role='checkbox' type='checkbox' class='cbox'></td></tr>");

				//create an empty row first
				for(var j=0, col_length = this.settings.colModel.length; j<col_length; j++){
					var col_name = this.settings.colModel[j].name;
					internal_data_row[col_name] = "";
					//if not hidden append it to DOM
					if(!this.settings.colModel[j].hidden){
						row.append("<td role='gridcell' class='"+ this.settings.gridName +"_"+col_name +"''></td>");

					}
				}

				//then put in the value, the reason we do this is to render html tags as regular text

				//add new row to table body
				$("#"+this.element.id +" tr[role='row']").slice(rowid, data.length-1).each(function(key,r){
					++r.id;
					r.cells[0].textContent = parseInt(r.cells[0].textContent)+1 ;
				})
				$("#"+this.element.id +" tr#"+(rowid-1)).last().after(row);

				//change the internal data array
				internal_data.splice(rowid,0,internal_data_row);
				for(var i=internal_data.length-1 ;i>=rowid;--i){
		  			++internal_data[i]['rowid'];
		  			++internal_data[i]['id'];
		  		}

            //update row data
            var col_names = [];
            for(var c in col_to_id_table) col_names.push(c);
            methods['renderRowData'](rowid,rowid+1, RENDER_ALL_COL);

		  		//pushed the select array
		  		if(tstate.edit_row >= rowid){
		  			++tstate.edit_row;
		  		}
		  		if(tstate.focus_row >= rowid){
		  			++tstate.focus_row;
		  		}
		  		for(var i=tstate.sel_rows.length; i>=0; --i){
		  			if(tstate.sel_rows[i] >= rowid){
		  				++tstate.sel_rows[i];
		  			}
		  		}
		  	
		  		//bind event on this row...
		  		methods['bindRowEvent'](rowid);	
			},
			removeRow: function(rowid){
				//change the source data array
				for(var i=data.length-1 ;i>rowid;--i){
		  			--data[i]['rowid'];
		  			--data[i]['id'];
		  		}
		        data.splice(rowid,1);

		      //remove row from tbody
		      var toBeRemoved = $("#"+this.element.id +" tr#"+rowid);
		      $("#"+this.element.id +" tr[role='row']").slice(rowid+1, data.length+1).each(function(key,r){
               --r.id;
               r.cells[0].textContent = parseInt(r.cells[0].textContent)-1 ;
				});
		      toBeRemoved.remove();

		        //pushed the select array
		  		if(tstate.edit_row > rowid){
		  			--tstate.edit_row;
		  		}else if(tstate.edit_row == rowid){
		  			tstate.edit_row = null;
		  		}
		  		if(tstate.focus_row > rowid){
		  			--tstate.focus_row ;
		  		}else if(tstate.focus_row == rowid){
		  			tstate.focus_row = null;
		  		}
		  		for(var i=tstate.sel_rows.length; i>=0; --i){
		  			if(tstate.sel_rows[i] > rowid){
		  				--tstate.sel_rows[i];
		  			}else if(tstate.sel_rows[i] == rowid){
		  				tstate.sel_rows.splice(i, 1);
		  			}
		  		}

		      //change the internal data aray
            for(var i=internal_data.length-1 ;i>rowid;--i){
		  			--internal_data[i]['rowid'];
		  			--internal_data[i]['id'];
		  		}
		      internal_data.splice(rowid,1);
			},

         //change the data of an entire row
			setData: function(rowid, newData){
				for(var key in newData){
					data[rowid][key] = newData[key];
				}
			},
			

			//SO MUCH FASTER THAN JQGRID!!!
         //update row values and apply dataformatter
			updateRow: function(start_row, end_row, col_names){
            methods['renderRowData'](start_row, end_row, col_names);
			},
			showFilter: function(col_name, value){
				$("#"+this.element.id +" tr[role='row']").each(function(rowid,r){
					if(internal_data[rowid][col_name].indexOf(value) >=0){
                  $(r).removeClass("hide_row");

					}else{
                  $(r).addClass("hide_row");
               }

				})
			},
         resetFilter: function(){
            $("#"+this.element.id +" tr[role='row']").each(function(rowid,r){
               $(r).removeClass("hide_row");
            })
         },


         printInternalData: function(){
				console.log(data);
				console.log(internal_data);
				console.log(tstate);
			}
	};

	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options ) {
			return this.each(function() {
					if ( !$.data( this,  pluginName ) ) {
							$.data( this, pluginName, new Plugin( this, options ) );
					}
			});
	};
})( jQuery, window, document );

