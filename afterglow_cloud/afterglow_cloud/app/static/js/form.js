
afterglow.form = {

    /** Map with validators. Validators are functions that validate
        user input taking into account current state of the UI.
     */
    validators : {
        onRender : {
            /* Valited input source fieldset */
            inputSources : function(){
                var logType = $('input[name = "xLogType"]:checked').val();
                var isValid = true;
                            
                switch(logType){
                    case 'data':
                    case 'log':
                        isValid = afterglow.form
                            .validate('#id_dataFile') && isValid;

                        var regexType = $('input[name = "regExType"]:checked').val();
                        switch(regexType){
                            case '1':
                                isValid = afterglow.form
                                    .validate('#id_regEx') && isValid;

                                    if($('#id_saveRegEx').is(':checked')){
                                        isValid = afterglow.form.validate('#id_saveRegExName') && isValid;
                                        isValid = afterglow.form.validate('#id_saveRegExDescription') && isValid;
                                    }
                                break;
                            case '2':
                                isValid = afterglow.form
                                    .validate('#id_regExChoices', ['optionSelected'])  && isValid;
                                break;
                        }

                        return isValid;
                        break;
                    case 'loggly':
                        return afterglow.form
                            .validate('#id_logglySubdomain');
                        break;
                }

                return isValid;
            },

            /* Validates main settings fieldset */
            mainSettings : function(){
                afterglow.form.clearValidation("#mainSettings");
                var isValid = true;
                isValid = afterglow.form.validate('#id_overrideEdgeLength') && isValid;
                isValid = afterglow.form.validate('#id_textLabel', ['notEmpty', 'htmlColor']) && isValid;

                return isValid;
            },

            /* Validated advanced setttings fieldset */
            advancedSettings : function(){
                afterglow.form.clearValidation("#advancedSettings");
                var isValid = true;

                isValid = afterglow.form.validate('#id_skipLines', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_maxLines', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_omitThreshold', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_sourceFanOut', ['notEmpty', 'isInteger']) && isValid;
                isValid = afterglow.form.validate('#id_eventFanOut', ['notEmpty', 'isInteger']) && isValid;

                return isValid;
            },
        },

        /** Validators for configuration modal windows */
        nodeColour : function(){
                var isValid = true;
                isValid = afterglow.form.validate('#xColourType', ['optionSelected']) && isValid;
                isValid = afterglow.form.validate('#xColourHEX', ['notEmpty', 'htmlColor']) && isValid;

                var conditionType = $('input:radio[name=xColourRadio]:checked').val();

                switch(conditionType){
                    case 'none':
                        break;
                    case 'if':
                        isValid = afterglow.form.validate('#xColourIfCondition') && isValid;
                        break;
                    case 'custom':
                        isValid = afterglow.form.validate('#xColourCustomCondition') && isValid;
                        break;
                }

                return isValid;
        },

        nodeSize : function(){
            afterglow.form.clearValidation('#nodeSize');
            var isValid = true;
       
            if ( $("input[name='xSizeRadio']:checked").val() == "exp"){                    
                isValid = afterglow.form.validate('#xSizeCondition') && isValid;
            }

            isValid = afterglow.form.validate('#xThresholdType', ['optionSelected']) && isValid;

            return isValid;

        },

        nodeThreshold : function(){
            afterglow.form.clearValidation('#nodeThreshold');
            var isValid = true;

            isValid = afterglow.form.validate('#xThresholdType', ['optionSelected']) && isValid;
            isValid = afterglow.form.validate('#xThresholdSize', ['notEmpty', 'isInteger']) && isValid;

            return isValid;

        },

        nodeClustering : function(){
            var isValid = true;

            isValid =  afterglow.form.validate('#xClusteringType', ['optionSelected']) && isValid;

            var clusteringType = $("input[name='xClusteringRadio']:checked").val().toLowerCase();
          
            if(clusteringType == "exp"){
                isValid = afterglow.form.validate('#xClusteringCondition') && isValid;
            }else{
                isValid = afterglow.form.validate('#xClusteringPort', ['isInteger']) && isValid;
            }
            
            return isValid;
        },

        configGlobals : function(){

        },

        customLine : function(){
            return afterglow.form.validate('#xCustomCondition');
        }
    },

    /* Function to validate specified field with list of validate helpers */
    validate : function (field, conditions){

        if (conditions === undefined){
            conditions = ['notEmpty'];
        }

        var isValid = true;
        for(var i = 0; i < conditions.length; i++){
            isValid = isValid && afterglow.form.validateHelpers[conditions[i]](field);
            if (!isValid){
                break;
            }
        }

        if (!isValid){
            $('.validation-message[data-validation-for = "' + field  + '"]').show();
            console.log('Field "' + field + '" is NOT valid'); 
        } else {
            console.log('Field "' + field + '" is valid'); 
        }

        return isValid;
    },

    /* Functions that allow to validate field against some particular constraint */
    validateHelpers : {
        /* Returns true if field is not empty/blank */
        notEmpty : function(field){
            var value = $(field).val();
            return !(!value || /^\s*$/.test(value));
        },
        /* Returns true if there is an option selected in select input */
        optionSelected : function(field){
            return !!$(field).children('option:selected').length;
        },
        /* Returns true if field contains color in HTML format */
        htmlColor : function(field){
            var value = $(field).val();
            return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value);
        },
        /* Returns true if field contains positive integer number */
        isInteger : function(field){
            var value = $(field).val();
            return /^[0-9]+$/.test(value);
        }

    },

    /**
    *   Hides all validation messages in the specified form/fieldset
    */
    clearValidation : function (fieldset){
        $(fieldset).find(".validation-message").hide();
    },

    eventHandlers : {
        addNodeColourRule : function(){
            afterglow.form.clearValidation("#nodeColour");
            if (afterglow.form.validators.nodeColour()){
                
                var addColourWindow = $('#nodeColour');

                var rawRule = "";
                var rule = "Node Colour";
                var hasCondition = addColourWindow.find('input:radio[name=xColourRadio]:checked').val() != 'none';
                var condition = $("#xColourIfCondition").val();
                var value = addColourWindow.find('#xColourHEX').val();
                var target = addColourWindow.find('select#xColourType').val();

                if(hasCondition){
                    rawRule = rawRule + " if (" + condition + ")";
                }

                rawRule = rawRule + ' color';

                if (target != 'All'){
                    rawRule = rawRule + $("#xColourType").val().toLowerCase();
                }

                rawRule = rawRule + '="' + value + '"';

                afterglow.form.addRuleToConfig(rawRule);
                afterglow.form.addRuleToTable(rule + ' : ' + value, hasCondition? condition : 'none', target);
                
                return true;
            } else {
                return false;
            }
        },

        addNodeSizeRule : function(){
            afterglow.form.clearValidation("#nodeSize");
            if (afterglow.form.validators.nodeSize()){

                var rawRule = "";
                var rule = "Node Size";
                var target = $("#xSizeType").val().toLowerCase();
                var sizeType = $("input[name='xSizeRadio']:checked").val();
                var value = "";


                if( target == "all"){
                    rawRule = "size=";
                }else{
                    rawRule = "size." + target + "=";
                }


                if ( sizeType == "exp"){                    
                    value = $("#xSizeCondition").val();
                    rawRule +=  value;
                }else{

                    if(sizeType == "num"){
                        value = "$" + sizeType + "Count{$" + sizeType + "Name};";
                        rawRule += value;
                    
                    }else if(sizeType == "third"){
                        value = "$fields[2]";
                        rawRule += value;
                    }else{
                        value = "$fields[3]";
                        rawRule += value;
                    }

                }

                afterglow.form.addRuleToConfig(rawRule);
                afterglow.form.addRuleToTable(rule + ':' + value,'none', target);
                return true;
            } else {
                return false;
            }
        },

        addNodeThresholdRule : function(){
            afterglow.form.clearValidation("#nodeThreshold");
            if (afterglow.form.validators.nodeThreshold()){
                

                var raw_rule = "";
                var rule = "Node Threshold";
                var target = $("#xThresholdType").val().toLowerCase();
                var value = $("#xThresholdSize").val();
                
                if($("#xThresholdType").attr("value") == "all"){

                    raw_rule = "threshold=" + value;
                
                }else{
                
                    raw_rule = "threshold." + target + "=" + value;
                }

                afterglow.form.addRuleToConfig(raw_rule);
                afterglow.form.addRuleToTable(rule + ' : ' + value, 'none', target);
                return true;
            } else {
                return false;
            }
        },

        addNodeClusteringRule : function(){
            afterglow.form.clearValidation("#nodeClustering");
            if (afterglow.form.validators.nodeClustering()){

                var rawRule = '';
                var target = $("#xClusteringType").val().toLowerCase();
                var clusteringType = $("input[name='xClusteringRadio']:checked").val();
                var value = "";
                var rule = "Node Clustering";
                
                userHTML = "Cluster :: " + $("#xClusteringType").attr("value");
                
                if(target == "all"){
                    rawRule = "cluster=";        
                }else{
                    rawRule = "cluster." + target + "=";    
                }
                
                if (clusteringType == "ip"){
                    
                    var clusteringIPType =  $("#xClusteringIPType").val();
                
                    if(clusteringIPType == "a"){
                        value = 'regex_replace("(\\\\d\\+)\\\\.\\\\d\\+")."/8"';
                        rawRule += value;
                    }else if(clusteringIPType == "b"){
                        value = 'regex_replace("(\\\\d\\+\\\\.\\\\d\\+)\\\\.\\\\d\\+")."/16"';
                        rawRule += value;
                    }else{
                        value = 'regex_replace("(\\\\d\\+\\\\.\\\\d\\+\\\\.\\\\d\\+)\\\\.\\\\d\\+")."/24"';
                        rawRule += value;
                    }
                    
                    
                }else if(clusteringType == "exp"){
                    value = $("#xClusteringCondition").val();
                    rawRule += value;
                
                }else{
                    
                    value = $("#xClusteringPort").attr("value");
                    rawRule += '\"> ' + value + '\" if ($fields[2]>' + value + ')';
                }
                
                afterglow.form.addRuleToConfig(rawRule);
                afterglow.form.addRuleToTable(rule + ' : ' + value, 'none', target);
                return true;
            } else {
                return false;
            }
        },

        addConfigGlobalsRule : function(){
            afterglow.form.clearValidation("#configGlobals");
            if (afterglow.form.validators.configGlobals()){
                // Event handler code goes here
                return true;
            } else {
                return false;
            }
        },

        addCustomLine : function(){
            afterglow.form.clearValidation("#customLine");
            if (afterglow.form.validators.customLine()){
                var rule = "Custom";
                var rawRule = $("#xCustomCondition").val();
    
                afterglow.form.addRuleToConfig(rawRule);
                afterglow.form.addRuleToTable(rule, rawRule, 'n/a');
                
                return true;
            } else {
                return false;
            }
        }
    },

    addRuleToTable : function(rule, condition, target){
        var index = $('#alreadyAddedRules').find('tr').length + 1;
        var actions = '<p class="text-center"><a href="#" class="icon-arrow-up" title="Move rule up"></a>';
        actions += '<a href="#" class="icon-arrow-down"  title="Move rule down"></a>';
        actions += '<a href="#" class="icon-trash"  title="Remove rule"></a></p>';
        var row = '<tr>' +
                    '<td>' + index + '</td>' +
                    '<td>' + rule + '</td>' +
                    '<td>' + condition + '</td>' +
                    '<td>' + target + '</td>' +
                    '<td class="text-center">' + actions + '</td>' +
                  '</tr>';
        $('#alreadyAddedRules').first('tbody').append(row);
    },

    addRuleToConfig : function(rule){

        var configLine = document.createElement("div");
        configLine.id = "configLine" + $('#alreadyAddedHidden').children().length;
        configLine.innerHTML = rule;
        $("#alreadyAddedHidden").append(configLine);
    },

    handleAddRuleClick : function(originalHandler){
        var handleFunction  = function(){
            if (originalHandler()){
                $(this).parent().modal('hide');
            }
        }

        return handleFunction;

    },

    initModalWindows : function(){
        $('#nodeColour').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeColourRule));
        $('#nodeSize').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeSizeRule));
        $('#nodeThreshold').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeThresholdRule));
        $('#nodeClustering').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addNodeClusteringRule));
        $('#customLine').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addCustomLine));
        $('#configGlobals').find('.add-rule-button').click(afterglow.form.handleAddRuleClick(
            afterglow.form.eventHandlers.addConfigGlobalsRule));
    },

    init : function(){
        
        /** Input sources validation reset*/
        $('#inputSources').children().change(function(){
            afterglow.form.clearValidation("#inputSources,#loggly,#file,#regExInputs,#saveRegExDetails");
        });

        $('#regex').children().change(function(){
            afterglow.form.clearValidation("#regExInputs");
        });

        $('#saveRegExDetails').children().change(function(){
            afterglow.form.clearValidation("#saveRegExDetails");
        });

        afterglow.form.initModalWindows();

        $('#xRenderProcess').click(function(){
            afterglow.form.clearValidation('#renderMainForm');
            
            var isValid = true;
            for(var validator in afterglow.form.validators.onRender){
                if (afterglow.form.validators.onRender.hasOwnProperty(validator)){
                    isValid = afterglow.form.validators.onRender[validator]() && isValid;
                }
            }

            return isValid;

        });
    }
}

$(function(){
    afterglow.form.init();
});

/* Globals */



/*	Add a maxnodesize configuration line (a global setting).
 *	@Params: None.
 *	@Return: None.
 */
function addMaxNodeSize(){

    //Proceed only if not already set.
    if (!maxNodeSizeSet){
    
        var html = "Max Node Size :: " +  $("#xSizeMaxSize").attr("value");
        
        var elemID = configCount++;        
        
        appendUserConfigDiv(elemID, html);
        
        html = "maxnodesize=" + $("#xSizeMaxSize").attr("value");
        
        var elem = document.createElement("div");
        
        elem.id = "maxNodeSizeFlag";
        
        elem.style.display = "none";
        
        document.getElementById("line" + elemID).appendChild(elem);
        
        appendHiddenConfigDiv(elemID, html);
        
        //Update the flag and disable further input (until removed).
        maxNodeSizeSet = true;
        
        $("#xSizeMaxSize").prop('disabled', true);
        
        $("#xMaxNodeSizeButton").prop('disabled', true);
    
    }

}

/*	Add a sum configuration line (a global setting).
 *	@Params: None.
 *	@Return: None.
 */
function addSum(){

    var html;
    
    var elemID = configCount++;
    
    //Check for individual sum setting (determine which one has been set) and
    //proceed only if the one requested hasn't been already set.
    if($("#xSumType").attr("value") == "Source" && !sumSourceSet){
    
        html = "Sum Source :: True";
        
        appendUserConfigDiv(elemID, html);
        
        var elem = document.createElement("div");
        
        elem.id = "sumSourceFlag";
        
        elem.style.display = "none";
        
        document.getElementById("line" + elemID).appendChild(elem);
        
        html = "sum.source=1;"
        
        appendHiddenConfigDiv(elemID, html);
        
        $("#xSumOptionSource").prop('disabled', true);
        
        sumSourceSet = true;
    
    }else if($("#xSumType").attr("value") == "Event" && !sumEventSet){
    
        html = "Sum Event :: True";
        
        appendUserConfigDiv(elemID, html);
        
        var elem = document.createElement("div");
        
        elem.id = "sumEventFlag";
        
        elem.style.display = "none";
        
        document.getElementById("line" + elemID).appendChild(elem);
        
        html = "sum.event=1;"
        
        appendHiddenConfigDiv(elemID, html);
        
        $("#xSumOptionEvent").prop('disabled', true);
        
        sumEventSet = true;
    
    }else if(!sumTargetSet){
    
        html = "Sum Target :: True";
        
        appendUserConfigDiv(elemID, html);
        
        var elem = document.createElement("div");
        
        elem.id = "sumTargetFlag";
        
        elem.style.display = "none";
        
        document.getElementById("line" + elemID).appendChild(elem);
        
        html = "sum.target=1;"
        
        appendHiddenConfigDiv(elemID, html);
        
        $("#xSumOptionTarget").prop('disabled', true);
        
        sumTargetSet = true;
    
    }
    
}

/*	Read the raw configuration data from the hidden field and populate the
 * 	textbox form element supplied by the view to process and send the request.
 *	@Params: None.
 *	@Return: None.
 */
function populateProperty(){

    var value = "";
    
    //Check if the configuration tpye is manual or custom.
    if($('input[name=xConfigType]:checked').val() == "manual"){
    
        value = $("#xManualConfig").attr("value");
	
    }else if($('input[name=xConfigType]:checked').val() == "prev"){
    
    	value = $("#xPropertyConfigPopulate").val();
	
    }else{
    
        for (var i = 0; i <= configCount; i++){
        
            if ($("#configLine" + i).length > 0){ //if exists.
                value += $("#configLine" + i).text() + "\n"; 
            }
        }
        
    }
    
    document.getElementById("id_propertyConfig").value = value;
}

/*	Change the CSS style property 'display' of the parent element of 'id' to
 *	'block' (show) itself.
 *	@Params: None.
 *	@Return: None.
 */
function showParent(id){

	$("#" + id).parent().attr('style','display: block !important');

}

/*	Change the CSS style property 'display' of the parent element of 'id' to
 *	'none' (hide) itself.
 *	@Params: None.
 *	@Return: None.
 */
function hideParent(id){

	$("#" + id).parent().attr('style','display: none !important');

}

/*	Remove every validation message (everything that is present) from the page.
 *	@Params: None.
 *	@Return: None.
 */
function resetValidations(){

	var ids = new Array("dataFileE", "overrideEdgeE", "maxLinesE", "skipLinesE", "omitThresholdE", "sourceFanOutE", "eventFanOutE");

	for (var i = 0; i < ids.length; i++){
		hideParent(ids[i]);
	}
}

/*	Validate the data-file form input on the page and return the validation
 * 	status.
 *	@Params: None.
 *	@Return: true if valid, false otherwise.
 */
function validateDataFile(){

	if(!$("#id_dataFile").attr("value")){

		$("#dataFileE").html("Please choose a file.");

		showParent("dataFileE");

		return false;

	}
    
    return true;

}

/*	Validate the edge-length form input on the page and return the validation
 * 	status.
 *	@Params: None.
 *	@Return: true if valid, false otherwise.
 */
function validateEdgeLength(){

	if($("#id_overrideEdge").is(":checked")){

		var condition = /^[0-9]+(\.[0-9]{1,2})?$/;

		if(!condition.test($("#id_overrideEdgeLength").attr("value"))){

			$("#overrideEdgeE").html("Please enter a positive decimal value. Maximum of two decimal places.");
	
			showParent("overrideEdgeE");

			$('#mainSettings').show();
			
			return false;
		}

	}
	
	return true;

}

/*	Validate all the integer form inputs on the page and return the validation
 * 	status.
 *	@Params: None.
 *	@Return: true if all valid, false otherwise.
 */
function validateAdvancedIntegers(){

	var flag = true;

	var posInteger = /^[0-9]+$/;

	var intFields = new Array("skipLines", "omitThreshold", "sourceFanOut", "eventFanOut");

	if(!posInteger.test($("#id_maxLines").attr("value"))){

		$("#maxLinesE").html("Please enter a valid decimal.");

		showParent("maxLinesE");

		flag = flag = false;

	}else if(parseInt($("#id_maxLines").attr("value")) < 1 || parseInt($("#id_maxLines").attr("value")) > 999999){
	
		$("#maxLinesE").html("Please enter a value between 1 - 999999");

		showParent("maxLinesE");

		//Boolean AND.
		flag = flag && false;

	}

	for (var i = 0; i < intFields.length; i++){

		if(!posInteger.test($("#id_" + intFields[i]).attr("value"))){

			$("#" + intFields[i] +"E").html("Please enter a valid decimal.");		

			showParent(intFields[i] + "E");
	
			flag = flag && false;

		}
	}
	
	if(!flag){
		$('#advanced').show();
	}
	
	return flag;
}

/*	Validate integer inputs on the configuration panel.
 *	@Params: what - specifies which input to test; valid values are "threshold"
 		and "maxNodeSize".
 *	@Return: true if valid, false otherwise.
 */
function validateConfig(what){

	var posInteger = /^[0-9]+$/;

	hideParent(what + "E");

	if(what == "maxNodeSize"){

		if(!posInteger.test($("#xSizeMaxSize").attr("value"))){

			$("#" + what +"E").html("Please enter a valid decimal.");		

			showParent(what + "E");

			return false;
		}

	}else{

		if(!posInteger.test($("#xThresholdSize").attr("value"))){

			$("#" + what +"E").html("Please enter a valid decimal.");		

			showParent(what + "E");

			return false;
		}	
	}

	return true;
}