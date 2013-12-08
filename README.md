Minigrid Jquery plugin
===================
Minigrid is a super lighteweight jQuery plugin. It doesn't provide very pretty layout but gets straight to the point with powerful data manipulation. 

Using the Plugin
----------------
Include Jquery and Minigrid. Bootstrap is optional

   <script src="http://code.jquery.com/jquery-1.9.1.js"></script>
   <script src="src/miniGrid.js" type="text/javascript"></script>	
   <link rel="stylesheet" type="text/css" href="src/miniGrid.css" />
   <link rel="stylesheet" type="text/css" href="http://getbootstrap.com/2.3.2/assets/css/bootstrap.css" />    
    

API
----------------
Bindable events
onCellSelect
ondblClickRow
onOutsideClick
onEdit
onModeChange
onDoneEdit
updateWarningAndErrorCount

Public API
setGridParam
reloadData
getSelRow
getSelArray
setSelection
selectEditText
setHeight
editCell
addNewRow
removeRow
updateRow
showFilter
resetFilter
printInternalData